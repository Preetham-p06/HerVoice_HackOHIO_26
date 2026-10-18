import os, json, secrets, hashlib, sqlite3, uuid, time, threading
from pathlib import Path
from datetime import datetime, timezone
from typing import Literal
from fastapi import FastAPI, Request, Response, HTTPException, Depends, UploadFile, File
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from pydantic import BaseModel, Field, model_validator
from .codec import encode, decode, cover
from . import providers
from .store import CaseStore
from . import legal as legal_engine
import base64

MODE = os.getenv("APP_MODE", "demo")
if MODE not in ("demo", "live"):
    raise RuntimeError("APP_MODE must be demo or live")
if (
    MODE == "demo"
    and os.getenv("NODE_ENV") == "production"
    and os.getenv("ALLOW_LOCAL_DEMO") != "true"
):
    raise RuntimeError("Demo authentication is blocked in production")
DATA = Path(os.getenv("DATA_DIR", ".data"))
DATA.mkdir(exist_ok=True)
keyfile = DATA / "demo.key"
if MODE == "demo" and not keyfile.exists():
    keyfile.write_bytes(secrets.token_bytes(32))
    keyfile.chmod(0o600)
KEY = keyfile.read_bytes() if MODE == "demo" else b""
store = CaseStore(DATA, MODE)


def orgkey(org):
    if MODE == "demo":
        return KEY
    try:
        return base64.b64decode(
            json.loads(os.environ["RECIPIENT_KEYS"])[org], validate=True
        )
    except Exception:
        raise HTTPException(503, "Recipient encryption is not configured")


db = sqlite3.connect(DATA / "demo.sqlite", check_same_thread=False)
db.row_factory = sqlite3.Row
lock = threading.RLock()
db.executescript("""CREATE TABLE IF NOT EXISTS cases(id TEXT PRIMARY KEY, org TEXT, secret TEXT, idem TEXT UNIQUE, data TEXT);
CREATE TABLE IF NOT EXISTS sessions(token TEXT PRIMARY KEY, org TEXT, role TEXT, expires REAL);
CREATE TABLE IF NOT EXISTS chats(id TEXT PRIMARY KEY, token TEXT, data TEXT);
CREATE TABLE IF NOT EXISTS decisions(id TEXT PRIMARY KEY, org TEXT, data TEXT);""")


def now():
    return datetime.now(timezone.utc).isoformat()


def uid():
    return str(uuid.uuid4())


def event(kind, note="", actor="guest"):
    return dict(id=uid(), type=kind, note=note, actor=actor, time=now())


def save(c, secret="", idem=None, expected=None):
    store.save(c, secret, idem, expected)


def row(cid):
    r = store.get(cid)
    if not r:
        raise HTTPException(404, "Request not found")
    return r, json.loads(r["data"])


if MODE == "demo" and not store.all():
    for i in range(16):
        c = dict(
            id=uid(),
            org="demo-a" if i < 13 else "demo-b",
            alias=f"Example {i + 1:02}",
            original="Synthetic training request.",
            narrative=[
                "I would like to understand my housing options.",
                "I need a safe way to talk about money.",
                "I would appreciate help making a plan.",
            ][i % 3],
            category=["Housing", "Financial", "Safety planning"][i % 3],
            contact={"method": "none", "value": "", "safeTime": "", "voicemail": False},
            location=None,
            urgent=i % 5 == 0,
            status=["received", "in_review", "closed"][i % 3],
            priority="high" if i % 5 == 0 else "normal",
            assignment="",
            version=1,
            created=now(),
            updated=now(),
            delivery="received_demo",
            events=[event("received", "Synthetic demo case", "seed")],
        )
        save(c, idem=f"seed-{i}")
app = FastAPI(title="HerVoice API", version="1.0.0")
limits = {}


@app.middleware("http")
async def boundary(req: Request, call_next):
    rid = uid()
    if req.method not in ("GET", "HEAD", "OPTIONS"):
        origin = req.headers.get("origin")
        if origin and origin not in os.getenv(
            "ALLOWED_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000"
        ).split(","):
            return JSONResponse(
                {
                    "code": "origin_rejected",
                    "message": "Origin not allowed",
                    "requestId": rid,
                },
                403,
            )
        if int(req.headers.get("content-length", "0")) > 9 * 1024 * 1024:
            return JSONResponse(
                {"code": "too_large", "message": "Upload too large", "requestId": rid},
                413,
            )
    ip = req.client.host if req.client else "unknown"
    bucket = int(time.time() / 60)
    k = (ip, bucket)
    limits[k] = limits.get(k, 0) + 1
    if len(limits) > 10000:
        limits.clear()
    if limits.get(k, 0) > 180:
        return JSONResponse(
            {
                "code": "rate_limited",
                "message": "Please wait before trying again",
                "requestId": rid,
            },
            429,
        )
    req.state.rid = rid
    res = await call_next(req)
    res.headers["Cache-Control"] = "no-store"
    res.headers["X-Request-ID"] = rid
    return res


@app.exception_handler(HTTPException)
async def errors(req, e):
    return JSONResponse(
        {
            "code": f"http_{e.status_code}",
            "message": str(e.detail),
            "requestId": getattr(req.state, "rid", ""),
            "retryable": e.status_code >= 500,
        },
        e.status_code,
    )


@app.exception_handler(ValueError)
async def invalid(req, e):
    return JSONResponse(
        {
            "code": "invalid_input",
            "message": str(e),
            "requestId": getattr(req.state, "rid", ""),
            "retryable": False,
        },
        422,
    )


@app.exception_handler(RequestValidationError)
async def validation_error(req, e):
    return JSONResponse(
        {
            "code": "validation_error",
            "message": "Please check the supplied fields.",
            "requestId": getattr(req.state, "rid", ""),
            "fields": [
                {"field": ".".join(map(str, x["loc"])), "message": x["msg"]}
                for x in e.errors()
            ],
            "retryable": False,
        },
        422,
    )


@app.exception_handler(Exception)
async def unexpected_error(req, e):
    return JSONResponse(
        {
            "code": "internal_error",
            "message": "Unable to complete this operation. Please retry.",
            "requestId": getattr(req.state, "rid", ""),
            "retryable": True,
        },
        500,
    )


def staff(req: Request):
    if MODE == "live":
        import jwt

        issuer = os.environ["CLERK_ISSUER"].rstrip("/")
        token = req.cookies.get("__session", "")
        if req.headers.get("authorization", "").startswith("Bearer "):
            token = req.headers["authorization"][7:]
        if not token:
            raise HTTPException(401, "Responder sign-in required")
        try:
            jwks = jwt.PyJWKClient(issuer + "/.well-known/jwks.json", cache_keys=True)
            claims = jwt.decode(
                token,
                jwks.get_signing_key_from_jwt(token).key,
                algorithms=["RS256"],
                issuer=issuer,
                audience=os.environ["CLERK_AUDIENCE"],
                options={"require": ["exp", "iat", "sub", "iss"]},
            )
            org = claims.get("org_id") or claims.get("o", {}).get("id")
            membership = store.membership(claims["sub"], org)
            if not membership:
                raise HTTPException(403, "Active responder membership is required")
            return {"org": org, "role": membership["role"], "user": claims["sub"]}
        except HTTPException:
            raise
        except Exception:
            raise HTTPException(401, "Your session could not be verified")
    token = req.cookies.get("hv_staff", "")
    s = db.execute(
        "SELECT * FROM sessions WHERE token=? AND expires>?",
        (hashlib.sha256(token.encode()).hexdigest(), time.time()),
    ).fetchone()
    if not s:
        raise HTTPException(401, "Responder sign-in required")
    return dict(s)


def scoped(cid, s):
    r, c = row(cid)
    if c["org"] != s["org"]:
        raise HTTPException(404, "Case not found")
    return r, c


class Session(BaseModel):
    organization: Literal["demo-a", "demo-b"] = "demo-a"
    role: Literal["responder", "administrator"] = "responder"


@app.post("/v1/demo/session")
def session(body: Session, res: Response):
    if MODE != "demo":
        raise HTTPException(404, "Demo authentication is disabled")
    t = secrets.token_urlsafe(32)
    db.execute(
        "INSERT INTO sessions VALUES(?,?,?,?)",
        (
            hashlib.sha256(t.encode()).hexdigest(),
            body.organization,
            body.role,
            time.time() + 3600,
        ),
    )
    db.commit()
    res.set_cookie("hv_staff", t, httponly=True, samesite="strict", max_age=3600)
    return {"mode": MODE, "org": body.organization, "role": body.role}


@app.delete("/v1/session")
def logout(req: Request, res: Response):
    db.execute(
        "DELETE FROM sessions WHERE token=?",
        (hashlib.sha256(req.cookies.get("hv_staff", "").encode()).hexdigest(),),
    )
    db.commit()
    res.delete_cookie("hv_staff")
    return {"deleted": True}


@app.get("/v1/me")
def me(s=Depends(staff)):
    return {"org": s["org"], "role": s["role"], "mode": MODE}


@app.get("/v1/health")
def health():
    return {
        "status": "ready",
        "mode": MODE,
        "capabilities": {
            "requests": MODE,
            "codec": "working",
            "chat": "Gemini configured"
            if providers.enabled()
            else "deterministic demo"
            if MODE == "demo"
            else "unavailable",
            "legal": "source extracts"
            if legal_engine.registry()
            else "source browsing",
            "imageGeneration": "local demo covers"
            if MODE == "demo"
            else "Bedrock configured"
            if os.getenv("BEDROCK_IMAGE_MODEL")
            else "unavailable",
            "liveAuth": "Clerk verification configured"
            if MODE == "live"
            else "unavailable",
            "tts": "browser opt-in",
        },
    }


class Contact(BaseModel):
    method: Literal["none", "email", "text", "phone", "in_person"] = "none"
    value: str = Field(default="", max_length=200)
    safeTime: str = Field(default="", max_length=200)
    voicemail: bool = False

    @model_validator(mode="after")
    def valid(self):
        if self.method == "none":
            self.value = ""
            self.safeTime = ""
            self.voicemail = False
        if self.method == "email" and (
            "@" not in self.value or "." not in self.value.split("@")[-1]
        ):
            raise ValueError("Enter a valid email")
        if (
            self.method in ("phone", "text")
            and len("".join(filter(str.isdigit, self.value))) < 7
        ):
            raise ValueError("Enter a valid contact number")
        return self


class NewRequest(BaseModel):
    alias: str = Field(default="", max_length=100)
    original: str = Field(min_length=1, max_length=8000)
    narrative: str = Field(min_length=1, max_length=8000)
    category: str = Field(default="Other", max_length=100)
    contact: Contact = Field(default_factory=Contact)
    location: str | None = Field(default=None, max_length=300)
    urgent: bool = False
    channel: Literal["direct", "image"] = "direct"
    idempotencyKey: str = Field(min_length=16, max_length=100)


@app.post("/v1/requests", status_code=201)
def create(body: NewRequest, req: Request, res: Response):
    existing = store.by_idem(body.idempotencyKey)
    receipt = req.cookies.get("hv_receipt", "")
    if existing:
        if existing["secret"] != hashlib.sha256(receipt.encode()).hexdigest():
            raise HTTPException(
                409, "Submission already exists; use its original receipt session"
            )
        return {
            "id": existing["id"],
            "delivery": json.loads(existing["data"])["delivery"],
        }
    if not receipt:
        receipt = secrets.token_urlsafe(40)
    c = body.model_dump(exclude={"idempotencyKey", "channel"})
    c.update(
        id=uid(),
        org=os.getenv("DEFAULT_ORG", "demo-a"),
        status="received" if body.channel == "direct" else "prepared",
        delivery=("received_demo" if MODE == "demo" else "received")
        if body.channel == "direct"
        else "prepared_only",
        priority="high" if body.urgent else "normal",
        assignment="",
        version=1,
        created=now(),
        updated=now(),
        events=[
            event(
                "received" if body.channel == "direct" else "prepared",
                "Demo request saved; no real organization notified"
                if MODE == "demo"
                else "Request saved to recipient queue",
            )
        ],
    )
    save(c, hashlib.sha256(receipt.encode()).hexdigest(), body.idempotencyKey)
    res.set_cookie(
        "hv_receipt",
        receipt,
        httponly=True,
        samesite="strict",
        secure=MODE == "live",
        max_age=86400,
    )
    return {"id": c["id"], "delivery": c["delivery"]}


def owned(cid, req):
    r, c = row(cid)
    if not secrets.compare_digest(
        r["secret"],
        hashlib.sha256(req.cookies.get("hv_receipt", "").encode()).hexdigest(),
    ):
        raise HTTPException(404, "Request not found in this browser receipt session")
    return r, c


@app.get("/v1/requests")
def mine(req: Request):
    secret = hashlib.sha256(req.cookies.get("hv_receipt", "").encode()).hexdigest()
    return [
        dict(
            id=c["id"], status=c["status"], created=c["created"], delivery=c["delivery"]
        )
        for r in store.all(secret=secret)
        for c in [json.loads(r["data"])]
    ]


@app.get("/v1/requests/{cid}")
def receipt(cid: str, req: Request):
    _, c = owned(cid, req)
    return {
        k: c[k] for k in ["id", "status", "created", "delivery", "contact", "narrative"]
    } | {
        "events": [
            {k: e[k] for k in ["id", "type", "time"]}
            for e in c["events"]
            if e["type"]
            in ["received", "prepared", "status_changed", "intake_received"]
        ]
    }


@app.delete("/v1/requests/{cid}")
def delete(cid: str, req: Request):
    owned(cid, req)
    store.delete(cid)
    import shutil

    rows = (
        store.mongo.jobs.find({"owner": "case:" + cid})
        if MODE == "live"
        else [
            json.loads(r["data"])
            for r in db.execute("SELECT data FROM jobs WHERE owner=?", ("case:" + cid,))
        ]
    )
    for job in rows:
        job["status"] = "canceled"
        jobs.put(job)
        shutil.rmtree(jobs.directory / job["id"], ignore_errors=True)
    return {
        "deleted": True,
        "scope": "Request, contact, narrative and associated events removed from demo database. Downloaded PNG copies remain.",
    }


@app.get("/v1/requests/{cid}/image")
def image(cid: str, req: Request, style: int = 0):
    _, c = owned(cid, req)
    payload = json.dumps(
        {"version": 1, "id": c["id"], "org": c["org"], "narrative": c["narrative"]},
        ensure_ascii=False,
    ).encode()
    return Response(
        encode(cover(style), payload, orgkey(c["org"]), c["org"]),
        media_type="image/png",
        headers={"Content-Disposition": 'attachment; filename="landscape.png"'},
    )


@app.post("/v1/requests/{cid}/image")
async def uploaded_image(cid: str, req: Request, file: UploadFile = File(...)):
    _, c = owned(cid, req)
    data = await file.read(8 * 1024 * 1024 + 1)
    return Response(
        encode(
            data,
            json.dumps(
                {
                    "version": 1,
                    "id": c["id"],
                    "org": c["org"],
                    "narrative": c["narrative"],
                },
                ensure_ascii=False,
            ).encode(),
            orgkey(c["org"]),
            c["org"],
        ),
        media_type="image/png",
    )


@app.get("/v1/cases")
def cases(
    q: str = "", status: str = "", priority: str = "", page: int = 1, s=Depends(staff)
):
    allc = [json.loads(r["data"]) for r in store.all(org=s["org"])]
    allc = [
        c
        for c in allc
        if c["status"] != "prepared"
        and (not q or q.lower() in (c["alias"] + " " + c["category"]).lower())
        and (not status or c["status"] == status)
        and (not priority or c["priority"] == priority)
    ]
    allc.sort(key=lambda c: (c["priority"] != "high", c["created"]))
    page = max(1, page)
    return {
        "items": [
            {
                k: c[k]
                for k in [
                    "id",
                    "alias",
                    "category",
                    "status",
                    "priority",
                    "created",
                    "assignment",
                    "version",
                ]
            }
            for c in allc[(page - 1) * 6 : page * 6]
        ],
        "total": len(allc),
        "page": page,
        "refreshed": now(),
    }


@app.get("/v1/cases/{cid}")
def detail(cid: str, s=Depends(staff)):
    return scoped(cid, s)[1]


class Update(BaseModel):
    version: int
    status: Literal["received", "in_review", "closed"] | None = None
    assignment: str | None = Field(default=None, max_length=100)
    note: str = Field(default="", max_length=2000)
    reason: str = Field(default="", max_length=500)


@app.patch("/v1/cases/{cid}")
def update(cid: str, b: Update, s=Depends(staff)):
    with lock:
        r, c = scoped(cid, s)
        if b.version != c["version"]:
            raise HTTPException(409, "Case changed. Refresh before updating.")
        if b.status == "closed" and not b.reason.strip():
            raise HTTPException(422, "A closure reason is required")
        for k in ["status", "assignment"]:
            v = getattr(b, k)
            if v is not None and v != c[k]:
                c[k] = v
                c["events"].append(
                    event(
                        k + "_changed",
                        b.reason if k == "status" else v,
                        s.get("user", "demo responder"),
                    )
                )
        if b.note.strip():
            c["events"].append(event("note", b.note, s.get("user", "demo responder")))
        c["version"] += 1
        c["updated"] = now()
        save(c, r["secret"], r["idem"], expected=b.version)
        return c


@app.post("/v1/intake/preview")
async def intake(file: UploadFile = File(...), s=Depends(staff)):
    data = await file.read(8 * 1024 * 1024 + 1)
    payload = json.loads(decode(data, orgkey(s["org"]), s["org"]))
    if (
        payload.get("version") != 1
        or payload.get("org") != s["org"]
        or not isinstance(payload.get("narrative"), str)
    ):
        raise HTTPException(422, "Invalid message schema")
    _, c = scoped(payload.get("id", ""), s)
    if c["narrative"] != payload["narrative"]:
        raise HTTPException(422, "Message does not match request")
    token = secrets.token_urlsafe(32)
    digest = hashlib.sha256(token.encode()).hexdigest()
    proof = {
        "hash": digest,
        "case": c["id"],
        "org": s["org"],
        "expires": time.time() + 600,
    }
    if MODE == "live":
        store.mongo.intake_proofs.insert_one(proof)
    else:
        db.execute(
            "CREATE TABLE IF NOT EXISTS intake_proofs(hash TEXT PRIMARY KEY, data TEXT)"
        )
        db.execute("INSERT INTO intake_proofs VALUES(?,?)", (digest, json.dumps(proof)))
        db.commit()
    return {
        "verification": token,
        "id": c["id"],
        "narrative": payload["narrative"],
        "alreadyReceived": c["status"] != "prepared",
    }


class Intake(BaseModel):
    id: str
    verification: str = Field(min_length=32, max_length=100)


@app.post("/v1/intake/confirm")
def confirm(b: Intake, s=Depends(staff)):
    digest = hashlib.sha256(b.verification.encode()).hexdigest()
    if MODE == "live":
        proof = store.mongo.intake_proofs.find_one(
            {"hash": digest, "org": s["org"], "case": b.id}
        )
    else:
        try:
            raw = db.execute(
                "SELECT data FROM intake_proofs WHERE hash=?", (digest,)
            ).fetchone()
        except sqlite3.OperationalError:
            raw = None
        proof = json.loads(raw["data"]) if raw else None
    if (
        not proof
        or proof["org"] != s["org"]
        or proof["case"] != b.id
        or proof["expires"] < time.time()
    ):
        raise HTTPException(
            409, "Verify the original PNG again before confirming intake"
        )
    with lock:
        r, c = scoped(b.id, s)
        if c["status"] == "prepared":
            c["status"] = "received"
            c["delivery"] = "received_demo" if MODE == "demo" else "received"
            c["version"] += 1
            c["events"].append(
                event(
                    "intake_received",
                    "PNG verified and accepted",
                    s.get("user", "demo responder"),
                )
            )
            save(c, r["secret"], r["idem"], expected=c["version"] - 1)
        return {"id": c["id"], "status": c["status"]}


@app.post("/v1/cases/{cid}/related")
def related(cid: str, s=Depends(staff)):
    _, c = scoped(cid, s)
    words = set(c["narrative"].lower().split())
    result = []
    for r in store.all(org=s["org"]):
        t = json.loads(r["data"])
        if t["id"] == cid:
            continue
        other = set(t["narrative"].lower().split())
        score = len(words & other) / max(1, len(words | other))
        if score > 0:
            result.append(
                {
                    "id": t["id"],
                    "alias": t["alias"],
                    "score": round(score, 2),
                    "method": "demo lexical overlap; not identity probability",
                }
            )
    return sorted(result, key=lambda r: -r["score"])[:4]


class Decision(BaseModel):
    target: str
    decision: Literal["link", "reject"]
    reason: str = Field(min_length=1, max_length=500)


@app.post("/v1/cases/{cid}/related/decision")
def decision(cid: str, b: Decision, s=Depends(staff)):
    scoped(cid, s)
    scoped(b.target, s)
    if cid == b.target:
        raise HTTPException(422, "Cannot link a case to itself")
    d = b.model_dump() | {"source": cid, "time": now()}
    store.decision(d, s["org"])
    return d


class Text(BaseModel):
    text: str = Field(min_length=1, max_length=8000)


@app.post("/v1/drafts")
def draft(b: Text):
    if MODE == "live" and not providers.enabled():
        raise HTTPException(
            503, "Writing assistance is not configured. Continue with your own words."
        )
    if providers.enabled():
        reply = providers.generate(
            "Rewrite only the supplied facts in clear first-person language. Preserve uncertainty. Do not invent contact details, abuse, injuries, urgency or relationships. Return JSON with text, expression neutral, animation idle.",
            [{"role": "user", "parts": [{"text": b.text}]}],
        )
        return {
            "text": reply.text,
            "provider": "Gemini writing assistance — review every word before approving",
        }
    return {
        "text": b.text.strip(),
        "provider": "Demo: preserves your words exactly; live writing assistance unavailable",
    }


class Chat(BaseModel):
    text: str = Field(min_length=1, max_length=4000)
    history: list[dict] = Field(default_factory=list, max_length=20)


@app.post("/v1/support")
def support(b: Chat):
    if MODE == "live" and not providers.enabled():
        raise HTTPException(
            503,
            "Support conversation is not configured. Please explore Resources instead.",
        )
    if providers.enabled():
        reply = providers.support(b.text, b.history)
        return reply.model_dump() | {"provider": "Gemini AI companion"}
    text = "Thank you for sharing that. You can choose what feels comfortable to discuss. Would it help to talk about what you need right now, or explore a small next step?"
    if b.history:
        text = "We can take this one step at a time. Thinking about what you shared earlier, what would feel most useful for you now? You can also explore the Resources page when you choose."
    if any(w in b.text.lower() for w in ["danger", "hurt", "threat"]):
        text = "Your safety matters. If you feel in immediate danger, consider moving somewhere safer if you can and contacting local emergency services or someone you trust when it is safe. You decide what is possible. This demo cannot contact anyone or monitor your safety."
    return {
        "text": text,
        "provider": "Demo response — deterministic, not clinical care",
        "expression": "neutral",
        "animation": "idle",
    }


class Legal(BaseModel):
    question: str = Field(min_length=1, max_length=4000)
    jurisdiction: str = "India"


SOURCES = [
    {
        "id": "india-act",
        "title": "Protection of Women from Domestic Violence Act, 2005",
        "url": "https://www.indiacode.nic.in/handle/123456789/2021",
        "jurisdiction": "India",
        "section": "Official Act directory",
        "reviewed": "2026-10-18",
        "text": "Official source browsing for domestic violence protection and available remedies. Full legal text ingestion and current-law review are required before generating legal answers.",
    }
]


@app.post("/v1/legal")
def legal(b: Legal):
    result = legal_engine.answer(b.question, b.jurisdiction)
    if (
        not result["sources"]
        and b.jurisdiction == "India"
        and any(
            w in b.question.lower()
            for w in ["protect", "violence", "home", "abuse", "right", "order"]
        )
    ):
        result["sources"] = SOURCES
        result["mode"] = "source browsing — reviewed corpus unavailable"
    return result


@app.get("/v1/settings")
def settings(s=Depends(staff)):
    return {
        "org": s["org"],
        "role": s["role"],
        "mode": MODE,
        "integrations": {
            "database": "local SQLite demo"
            if MODE == "demo"
            else "MongoDB encrypted payloads",
            "imageCodec": "AES-GCM verified PNG",
            "socialMonitoring": "unavailable",
            "liveDispatch": "unavailable",
            "AI": "Gemini configured"
            if providers.enabled()
            else "deterministic demo"
            if MODE == "demo"
            else "unavailable",
            "Clerk": "verified JWT + membership"
            if MODE == "live"
            else "not configured",
            "S3": "not configured",
        },
    }


from .jobs import Jobs

jobs = Jobs(db, store, DATA)


class CoverJob(BaseModel):
    prompt: str = Field(default="", max_length=500)


@app.post("/v1/requests/{cid}/covers")
def covers_job(cid: str, b: CoverJob, req: Request):
    owned(cid, req)
    jobs.cleanup()
    return jobs.create("case:" + cid, "covers", b.prompt)


@app.get("/v1/requests/{cid}/jobs/{jid}")
def job_status(cid: str, jid: str, req: Request):
    owned(cid, req)
    return jobs.public(jobs.get(jid, "case:" + cid))


@app.delete("/v1/requests/{cid}/jobs/{jid}")
def job_cancel(cid: str, jid: str, req: Request):
    owned(cid, req)
    j = jobs.get(jid, "case:" + cid)
    jobs.cancel(j)
    return jobs.public(j)


@app.get("/v1/requests/{cid}/jobs/{jid}/results/{index}")
def job_result(cid: str, jid: str, index: int, req: Request):
    owned(cid, req)
    j = jobs.get(jid, "case:" + cid)
    data, mime = jobs.result(j, index)
    return Response(data, media_type=mime)


@app.post("/v1/requests/{cid}/jobs/{jid}/encode/{index}")
def encode_job_cover(cid: str, jid: str, index: int, req: Request):
    _, c = owned(cid, req)
    j = jobs.get(jid, "case:" + cid)
    data, mime = jobs.result(j, index)
    if mime != "image/png":
        raise HTTPException(422, "Choose an image result")
    payload = json.dumps(
        {"version": 1, "id": c["id"], "org": c["org"], "narrative": c["narrative"]},
        ensure_ascii=False,
    ).encode()
    return Response(
        encode(data, payload, orgkey(c["org"]), c["org"]), media_type="image/png"
    )


@app.post("/v1/support/session")
def support_session(res: Response):
    token = secrets.token_urlsafe(32)
    res.set_cookie(
        "hv_chat",
        token,
        httponly=True,
        samesite="strict",
        secure=MODE == "live",
        max_age=3600,
    )
    return {"memory": False, "expiresIn": 3600}


def chat_owner(req):
    token = req.cookies.get("hv_chat", "")
    if len(token) < 32:
        raise HTTPException(401, "Start a private conversation session first")
    return "chat:" + hashlib.sha256(token.encode()).hexdigest()


@app.post("/v1/support/media")
def speech_job(b: Text, req: Request):
    return jobs.create(chat_owner(req), "speech", b.text)


@app.get("/v1/support/media/{jid}")
def speech_status(jid: str, req: Request):
    return jobs.public(jobs.get(jid, chat_owner(req)))


@app.get("/v1/support/media/{jid}/results/{index}")
def speech_result(jid: str, index: int, req: Request):
    data, mime = jobs.result(jobs.get(jid, chat_owner(req)), index)
    return Response(data, media_type=mime)


@app.delete("/v1/support/media/{jid}")
def speech_cancel(jid: str, req: Request):
    j = jobs.get(jid, chat_owner(req))
    jobs.cancel(j)
    return jobs.public(j)
