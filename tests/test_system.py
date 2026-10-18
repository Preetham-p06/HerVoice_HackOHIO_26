import os, tempfile, uuid, io

os.environ["DATA_DIR"] = tempfile.mkdtemp(prefix="hervoice-test-")
import pytest
from fastapi.testclient import TestClient
from PIL import Image
from services.api.main import app
from services.api.codec import encode, decode, cover


@pytest.fixture
def client():
    return TestClient(app)


def request(client, channel="direct"):
    body = {
        "original": "My own words ❤️ नमस्ते",
        "narrative": "The exact approved message ❤️ नमस्ते",
        "contact": {"method": "none"},
        "channel": channel,
        "idempotencyKey": str(uuid.uuid4()),
    }
    r = client.post("/v1/requests", json=body)
    assert r.status_code == 201, r.text
    return r.json()["id"], body


def signin(c, org="demo-a"):
    assert c.post("/v1/demo/session", json={"organization": org}).status_code == 200


def test_guest_idempotency_and_ownership(client):
    cid, b = request(client)
    assert client.post("/v1/requests", json=b).json()["id"] == cid
    assert client.get("/v1/requests/" + cid).json()["narrative"] == b["narrative"]
    assert TestClient(app).get("/v1/requests/" + cid).status_code == 404
    assert TestClient(app).get("/v1/cases").status_code == 401


def test_org_boundary(client):
    cid, _ = request(client)
    signin(client, "demo-b")
    assert client.get("/v1/cases/" + cid).status_code == 404
    assert (
        client.patch(
            "/v1/cases/" + cid,
            json={"version": 1, "status": "closed", "reason": "Test"},
        ).status_code
        == 404
    )
    assert client.post("/v1/cases/" + cid + "/related", json={}).status_code == 404


def test_image_intake_exactly_once(client):
    cid, b = request(client, "image")
    png = client.get("/v1/requests/" + cid + "/image")
    assert png.status_code == 200
    assert (
        client.post(
            "/v1/intake/preview",
            files={"file": ("cover.png", png.content, "image/png")},
        ).status_code
        == 401
    )
    signin(client, "demo-b")
    assert (
        client.post(
            "/v1/intake/preview",
            files={"file": ("cover.png", png.content, "image/png")},
        ).status_code
        == 422
    )
    signin(client)
    preview = client.post(
        "/v1/intake/preview", files={"file": ("cover.png", png.content, "image/png")}
    ).json()
    assert preview["narrative"] == b["narrative"]
    assert not preview["alreadyReceived"]
    for _ in range(2):
        assert (
            client.post(
                "/v1/intake/confirm",
                json={"id": cid, "verification": preview["verification"]},
            ).status_code
            == 200
        )
    c = client.get("/v1/cases/" + cid).json()
    assert len([e for e in c["events"] if e["type"] == "intake_received"]) == 1


def test_events_concurrency_contact_validation(client):
    cid, _ = request(client)
    signin(client)
    assert (
        client.patch(
            "/v1/cases/" + cid, json={"version": 1, "status": "closed"}
        ).status_code
        == 422
    )
    r = client.patch(
        "/v1/cases/" + cid,
        json={
            "version": 1,
            "status": "in_review",
            "assignment": "Training responder",
            "note": "Synthetic note",
        },
    )
    assert r.status_code == 200
    assert len(r.json()["events"]) == 4
    assert (
        client.patch(
            "/v1/cases/" + cid, json={"version": 1, "note": "stale"}
        ).status_code
        == 409
    )
    for method, value in [("email", "invalid"), ("text", "12")]:
        assert (
            client.post(
                "/v1/requests",
                json={
                    "original": "a",
                    "narrative": "a",
                    "idempotencyKey": str(uuid.uuid4()),
                    "contact": {"method": method, "value": value},
                },
            ).status_code
            == 422
        )


def test_queue_related_and_delete(client):
    cid, _ = request(client)
    signin(client)
    r = client.get("/v1/cases?page=1")
    assert len(r.json()["items"]) <= 6
    related = client.post("/v1/cases/" + cid + "/related", json={}).json()
    assert all(x["id"] != cid for x in related)
    assert client.delete("/v1/requests/" + cid).status_code == 200
    assert client.get("/v1/requests/" + cid).status_code == 404


@pytest.mark.parametrize("text", ["ASCII", "हिंदी 日本語", "❤️ 🌿 🫶"])
def test_codec_utf8(text):
    key = b"a" * 32
    payload = text.encode()
    assert decode(encode(cover(), payload, key, "a"), key, "a") == payload


def test_codec_bounds_tamper_wrong_key_and_jpeg():
    key = b"a" * 32
    png = encode(cover(), b"test", key, "a")
    with pytest.raises(ValueError):
        decode(png, b"b" * 32, "a")
    with pytest.raises(ValueError):
        decode(png, key, "b")
    with pytest.raises(ValueError):
        encode(cover(), b"a" * 40000, key, "a")
    with pytest.raises(ValueError):
        decode(b"invalid", key, "a")
    im = Image.open(io.BytesIO(png))
    px = list(im.get_flattened_data())
    r, g, b, a = px[400]
    px[400] = (r ^ 1, g, b, a)
    im.putdata(px)
    out = io.BytesIO()
    im.save(out, format="PNG")
    with pytest.raises(ValueError):
        decode(out.getvalue(), key, "a")
    out = io.BytesIO()
    im.convert("RGB").save(out, format="JPEG")
    with pytest.raises(ValueError):
        decode(out.getvalue(), key, "a")


def test_legal_abstains_and_origin(client):
    assert (
        client.post(
            "/v1/legal", json={"question": "rights", "jurisdiction": "Mars"}
        ).json()["sources"]
        == []
    )
    assert (
        "cannot verify"
        in client.post("/v1/legal", json={"question": "unrelated astronomy"}).json()[
            "answer"
        ]
    )
    assert (
        client.post(
            "/v1/demo/session", json={}, headers={"origin": "https://evil.invalid"}
        ).status_code
        == 403
    )


def test_exact_codec_capacity_and_header():
    im = Image.new("RGBA", (32, 32), (40, 100, 130, 200))
    out = io.BytesIO()
    im.save(out, format="PNG")
    png = out.getvalue()
    key = b"a" * 32
    capacity = 32 * 32 // 8 - 68
    encoded = encode(png, b"x" * capacity, key, "a")
    assert decode(encoded, key, "a") == b"x" * capacity
    assert Image.open(io.BytesIO(encoded)).getpixel((0, 0))[3] == 200
    with pytest.raises(ValueError):
        encode(png, b"x" * (capacity + 1), key, "a")
    modified = Image.open(io.BytesIO(encoded))
    pixels = list(modified.get_flattened_data())
    r, g, b, a = pixels[0]
    pixels[0] = (r ^ 1, g, b, a)
    modified.putdata(pixels)
    out = io.BytesIO()
    modified.save(out, format="PNG")
    with pytest.raises(ValueError):
        decode(out.getvalue(), key, "a")


def test_at_rest_payload_encryption():
    from services.api.store import CaseStore

    s = object.__new__(CaseStore)
    s.mode = "live"
    s.key = b"z" * 32
    c = {
        "id": "case-id",
        "org": "org-a",
        "narrative": "sensitive synthetic text",
        "status": "received",
        "priority": "normal",
        "created": "date",
        "version": 1,
    }
    packed = s.packed(c, "hash", "idem")
    assert "sensitive" not in packed["data"]
    assert json_load(s.unpacked(packed)["data"]) == c
    packed["org"] = "org-b"
    with pytest.raises(Exception):
        s.unpacked(packed)


def json_load(v):
    import json

    return json.loads(v)


def test_live_auth_signature_and_membership(client, monkeypatch):
    import services.api.main as main
    import jwt, time
    from cryptography.hazmat.primitives.asymmetric import rsa
    from types import SimpleNamespace

    private = rsa.generate_private_key(public_exponent=65537, key_size=2048)
    monkeypatch.setattr(main, "MODE", "live")
    monkeypatch.setenv("CLERK_ISSUER", "https://issuer.invalid")
    monkeypatch.setenv("CLERK_AUDIENCE", "hervoice")

    class Keys:
        def __init__(self, *a, **kw):
            pass

        def get_signing_key_from_jwt(self, t):
            return SimpleNamespace(key=private.public_key())

    monkeypatch.setattr(jwt, "PyJWKClient", Keys)
    claims = {
        "sub": "staff-1",
        "iss": "https://issuer.invalid",
        "aud": "hervoice",
        "iat": int(time.time()),
        "exp": int(time.time()) + 60,
        "org_id": "org-a",
    }
    token = jwt.encode(claims, private, algorithm="RS256")
    client.cookies.set("__session", token)
    monkeypatch.setattr(
        main.store,
        "membership",
        lambda u, o: {"role": "responder"} if u == "staff-1" and o == "org-a" else None,
    )
    assert client.get("/v1/me").json()["org"] == "org-a"
    client.cookies.set(
        "__session", jwt.encode(claims | {"exp": 0}, private, algorithm="RS256")
    )
    assert client.get("/v1/me").status_code == 401
    client.cookies.set(
        "__session",
        jwt.encode(claims | {"org_id": "org-b"}, private, algorithm="RS256"),
    )
    assert client.get("/v1/me").status_code == 403
    assert client.post("/v1/demo/session", json={}).status_code == 404


def test_legal_retrieval_filters_and_provenance():
    from services.api.legal import retrieve, vector

    doc = {
        "id": "test",
        "jurisdiction": "United States",
        "status": "active",
        "reviewUntil": "2099-01-01",
        "chunks": [
            {
                "id": "test-1",
                "text": "Synthetic fixture: housing support options.",
                "page": 1,
                "vector": vector("Synthetic fixture: housing support options."),
            }
        ],
    }
    assert retrieve("housing support", "United States", [doc])[0][2]["id"] == "test-1"
    assert not retrieve("housing support", "Mars", [doc])
    assert not retrieve(
        "housing support", "United States", [doc | {"status": "superseded"}]
    )
    assert not retrieve(
        "housing support", "United States", [doc | {"reviewUntil": "2000-01-01"}]
    )
    assert not retrieve("unrelated astronomy", "United States", [doc])


def test_cover_job_owner_and_result(client):
    import time

    cid, _ = request(client)
    j = client.post("/v1/requests/" + cid + "/covers", json={}).json()
    assert TestClient(app).get(f"/v1/requests/{cid}/jobs/{j['id']}").status_code == 404
    for _ in range(100):
        status = client.get(f"/v1/requests/{cid}/jobs/{j['id']}").json()
        if status["status"] in ["complete", "failed"]:
            break
        time.sleep(0.02)
    assert status["status"] == "complete"
    assert len(status["results"]) == 3
    result = client.post(f"/v1/requests/{cid}/jobs/{j['id']}/encode/1")
    assert result.status_code == 200 and result.headers["content-type"] == "image/png"


def test_us_default_and_state_scope(client):
    from services.api.legal import retrieve

    response = client.post(
        "/v1/legal", json={"question": "domestic violence protection support"}
    )
    assert response.status_code == 200
    assert response.json()["sources"]
    assert all(s["jurisdiction"] == "United States" for s in response.json()["sources"])
    assert all(s.get("state") is None for s in response.json()["sources"])
    ohio = retrieve("protection order forms", "United States", state="Ohio")
    assert any(doc.get("state") == "Ohio" for _, doc, _ in ohio)
    california = client.post(
        "/v1/legal", json={"question": "protection order forms", "state": "California"}
    ).json()
    assert all(s.get("state") != "Ohio" for s in california["sources"])
    if california["sources"]:
        assert (
            "do not have reviewed state-law guidance for California"
            in california["answer"]
        )
    assert (
        client.post(
            "/v1/legal", json={"question": "protection order", "jurisdiction": "India"}
        ).json()["sources"]
        == []
    )


def test_nested_data_directory_startup(tmp_path):
    import subprocess, sys

    target = tmp_path / "new" / "nested" / "data"
    result = subprocess.run(
        [sys.executable, "-c", "import services.api.main"],
        env=dict(os.environ, APP_MODE="demo", DATA_DIR=str(target)),
        capture_output=True,
        text=True,
        timeout=15,
    )
    assert result.returncode == 0, result.stderr
    assert (target / "demo.sqlite").exists()


def test_controlled_monitor_scopes_rejects_and_receives_once(client):
    cid, _ = request(client, "image")
    png = client.get("/v1/requests/" + cid + "/image").content
    signin(client, "demo-b")
    queued = client.post(
        "/v1/monitor/feed", files={"file": ("cover.png", png, "image/png")}
    )
    assert queued.status_code == 200
    client.post("/v1/monitor/scan")
    assert client.get("/v1/monitor/feed").json()["items"][0]["status"] == "rejected"
    signin(client)
    for _ in range(2):
        assert (
            client.post(
                "/v1/monitor/feed", files={"file": ("cover.png", png, "image/png")}
            ).status_code
            == 200
        )
        assert client.post("/v1/monitor/scan").status_code == 200
    case = client.get("/v1/cases/" + cid).json()
    assert case["status"] == "received"
    assert len([e for e in case["events"] if e["type"] == "monitor_received"]) == 1
    assert (
        client.get("/v1/cases/" + cid + "/analysis").json()["summary"]
        == case["narrative"]
    )


def test_opt_in_memory_api_and_session_preservation(client):
    assert client.get("/v1/support/memory").json() == {"enabled": False, "messages": []}
    assert client.put("/v1/support/memory", json={"enabled": True}).status_code == 401
    client.post("/v1/support/session")
    assert client.put("/v1/support/memory", json={"enabled": True}).status_code == 200
    client.post("/v1/support", json={"text": "Synthetic conversation"})
    assert len(client.get("/v1/support/memory").json()["messages"]) == 2
    client.post("/v1/support/session")
    assert len(client.get("/v1/support/memory").json()["messages"]) == 2
    assert TestClient(app).get("/v1/support/memory").json()["enabled"] is False
    client.delete("/v1/support/memory")
    assert client.get("/v1/support/memory").json()["enabled"] is False


def test_optional_situation_details_are_preserved_and_scoped(client):
    details = {
        "duration": "About a month",
        "frequency": "Unsure",
        "visibleInjuries": "unsure",
        "personDescription": "Synthetic description only",
    }
    body = {
        "original": "Synthetic words",
        "narrative": "Exact approved words",
        "details": details,
        "idempotencyKey": str(uuid.uuid4()),
    }
    result = client.post("/v1/requests", json=body)
    assert result.status_code == 201
    cid = result.json()["id"]
    signin(client)
    assert client.get("/v1/cases/" + cid + "/analysis").json()["details"] == details
    signin(client, "demo-b")
    assert client.get("/v1/cases/" + cid + "/analysis").status_code == 404
    body["idempotencyKey"] = str(uuid.uuid4())
    body["details"]["visibleInjuries"] = "invented"
    assert client.post("/v1/requests", json=body).status_code == 422


def test_encouragement_does_not_promise_dispatch(client):
    result = client.post(
        "/v1/encouragement", json={"text": "Synthetic request for a quiet moment"}
    )
    assert result.status_code == 200
    assert result.json()["provider"].startswith("Original demo verse")
    assert "help is on the way" not in result.json()["text"].lower()


def test_prepared_post_requires_owner_and_submits_once(client):
    cid, _ = request(client, "image")
    assert client.get("/v1/requests/" + cid).json()["delivery"] == "prepared_only"
    assert TestClient(app).post(f"/v1/requests/{cid}/submit").status_code == 404
    assert client.post(f"/v1/requests/{cid}/submit").json()["delivery"] == "received_demo"
    assert client.post(f"/v1/requests/{cid}/submit").status_code == 200
    signin(client)
    case = client.get("/v1/cases/" + cid).json()
    assert len([e for e in case["events"] if e["type"] == "received"]) == 1
