"""Canonical case repository. Demo SQLite; live MongoDB with encrypted payloads."""

import os, json, base64, secrets, sqlite3, threading
from pathlib import Path
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from fastapi import HTTPException


class CaseStore:
    def __init__(self, directory: Path, mode: str):
        self.mode = mode
        self.lock = threading.RLock()
        if mode == "live":
            from pymongo import MongoClient

            required = [
                "MONGODB_URI",
                "MONGODB_DATABASE",
                "DATA_ENCRYPTION_KEY",
                "RECIPIENT_KEYS",
                "CLERK_ISSUER",
                "CLERK_AUDIENCE",
                "ALLOWED_ORIGINS",
                "DEFAULT_ORG",
            ]
            missing = [k for k in required if not os.getenv(k)]
            if missing:
                raise RuntimeError("Missing live settings: " + ", ".join(missing))
            self.key = base64.b64decode(
                os.environ["DATA_ENCRYPTION_KEY"], validate=True
            )
            if len(self.key) != 32:
                raise RuntimeError(
                    "DATA_ENCRYPTION_KEY must be base64 encoding of 32 bytes"
                )
            keys = json.loads(os.environ["RECIPIENT_KEYS"])
            if os.environ["DEFAULT_ORG"] not in keys:
                raise RuntimeError("Default organization requires a recipient key")
            for v in keys.values():
                if len(base64.b64decode(v, validate=True)) != 32:
                    raise RuntimeError("Recipient keys must be 32 bytes")
            self.mongo = MongoClient(
                os.environ["MONGODB_URI"], serverSelectionTimeoutMS=5000
            )[os.environ["MONGODB_DATABASE"]]
            self.mongo.command("ping")
            self.cases = self.mongo.cases
            self.cases.create_index("id", unique=True)
            self.cases.create_index("idem", unique=True)
            self.cases.create_index(
                [("org", 1), ("status", 1), ("priority", 1), ("created", -1)]
            )
            self.cases.create_index([("org", 1), ("severity", 1), ("created", -1)])
            self.cases.create_index("secret")
            self.mongo.memberships.create_index([("user", 1), ("org", 1)], unique=True)
        else:
            self.db = sqlite3.connect(
                directory / "demo.sqlite", check_same_thread=False
            )
            self.db.row_factory = sqlite3.Row
            self.db.execute(
                "CREATE TABLE IF NOT EXISTS cases(id TEXT PRIMARY KEY, org TEXT, secret TEXT, idem TEXT UNIQUE, data TEXT)"
            )
            self.db.commit()

    def packed(self, c, secret, idem):
        text = json.dumps(c, ensure_ascii=False)
        if self.mode == "live":
            nonce = secrets.token_bytes(12)
            text = base64.b64encode(
                nonce
                + AESGCM(self.key).encrypt(
                    nonce, text.encode(), (c["org"] + c["id"]).encode()
                )
            ).decode()
        return dict(
            id=c["id"],
            org=c["org"],
            secret=secret,
            idem=idem,
            data=text,
            status=c["status"],
            priority=c["priority"],
            severity=c.get("severity", "unreviewed"),
            created=c["created"],
            version=c["version"],
        )

    def unpacked(self, r):
        if r is None:
            return None
        r = dict(r)
        r.pop("_id", None)
        if self.mode == "live":
            b = base64.b64decode(r["data"])
            r["data"] = (
                AESGCM(self.key)
                .decrypt(b[:12], b[12:], (r["org"] + r["id"]).encode())
                .decode()
            )
        return r

    def get(self, id):
        return self.unpacked(
            self.cases.find_one({"id": id})
            if self.mode == "live"
            else self.db.execute("SELECT * FROM cases WHERE id=?", (id,)).fetchone()
        )

    def by_idem(self, idem):
        return self.unpacked(
            self.cases.find_one({"idem": idem})
            if self.mode == "live"
            else self.db.execute("SELECT * FROM cases WHERE idem=?", (idem,)).fetchone()
        )

    def all(self, org=None, secret=None):
        if self.mode == "live":
            query = {}
            if org is not None:
                query["org"] = org
            if secret is not None:
                query["secret"] = secret
            return [self.unpacked(r) for r in self.cases.find(query).limit(5000)]
        sql = "SELECT * FROM cases"
        where = []
        args = []
        if org is not None:
            where.append("org=?")
            args.append(org)
        if secret is not None:
            where.append("secret=?")
            args.append(secret)
        if where:
            sql += " WHERE " + " AND ".join(where)
        return [dict(r) for r in self.db.execute(sql, args)]

    def save(self, c, secret="", idem=None, expected=None):
        packed = self.packed(c, secret, idem)
        with self.lock:
            if self.mode == "live":
                from pymongo.errors import DuplicateKeyError

                try:
                    if expected is not None:
                        result = self.cases.replace_one(
                            {"id": c["id"], "org": c["org"], "version": expected},
                            packed,
                        )
                        if result.matched_count != 1:
                            raise HTTPException(
                                409, "Case changed. Refresh before updating."
                            )
                    else:
                        self.cases.insert_one(packed)
                except DuplicateKeyError:
                    raise HTTPException(
                        409,
                        "Submission already exists; check your receipt session before retrying",
                    )
            else:
                if expected is not None:
                    old = self.get(c["id"])
                    if old is None or json.loads(old["data"])["version"] != expected:
                        raise HTTPException(
                            409, "Case changed. Refresh before updating."
                        )
                self.db.execute(
                    "INSERT OR REPLACE INTO cases VALUES(?,?,?,?,?)",
                    tuple(packed[k] for k in ["id", "org", "secret", "idem", "data"]),
                )
                self.db.commit()

    def delete(self, id):
        if self.mode == "live":
            self.mongo.case_vectors.delete_many({"id": id})
            self.cases.delete_one({"id": id})
            self.mongo.decisions.delete_many({"$or": [{"source": id}, {"target": id}]})
        else:
            self.db.execute("DELETE FROM cases WHERE id=?", (id,))
            self.db.commit()

    def membership(self, user, org):
        return self.mongo.memberships.find_one(
            {
                "user": user,
                "org": org,
                "active": True,
                "role": {"$in": ["responder", "administrator"]},
            }
        )

    def decision(self, d, org):
        if self.mode == "live":
            self.mongo.decisions.insert_one(d | {"org": org})
        else:
            self.db.execute(
                "INSERT INTO decisions VALUES(?,?,?)",
                (secrets.token_hex(16), org, json.dumps(d)),
            )
            self.db.commit()
