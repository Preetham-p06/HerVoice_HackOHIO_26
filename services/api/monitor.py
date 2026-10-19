"""Mongo-backed original-PNG intake with expiring claims and retryable failures."""
import hashlib
import secrets
from datetime import datetime, timedelta, timezone
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from fastapi import HTTPException
from pymongo import ReturnDocument
from pymongo.errors import DuplicateKeyError


def utcnow():
    return datetime.now(timezone.utc)


class MongoMonitor:
    def __init__(self, database, key):
        self.collection = database.monitor_feed
        self.key = key
        self.collection.create_index("id", unique=True)
        self.collection.create_index([("org", 1), ("status", 1), ("available", 1)])
        self.collection.create_index([("org", 1), ("created", -1)])

    def enqueue(self, org, source_id, png):
        if not png.startswith(b"\x89PNG\r\n\x1a\n") or len(png) > 8 * 1024 * 1024:
            raise ValueError("An original PNG under 8 MB is required")
        identifier = hashlib.sha256((org + ":" + source_id).encode()).hexdigest()
        nonce = secrets.token_bytes(12)
        sealed = nonce + AESGCM(self.key).encrypt(nonce, png, org.encode())
        try:
            self.collection.insert_one({"id": identifier, "org": org, "data": sealed,
                "status": "queued", "case_id": "", "created": utcnow(),
                "available": utcnow(), "attempts": 0})
            return True
        except DuplicateKeyError:
            return False

    def reject(self, org, source_id, reason):
        identifier = hashlib.sha256((org + ":" + source_id).encode()).hexdigest()
        try:
            self.collection.insert_one({"id": identifier, "org": org, "data": b"",
                "status": "rejected", "case_id": "", "created": utcnow(),
                "available": utcnow(), "attempts": 0, "reason": reason})
        except DuplicateKeyError:
            pass

    def scan(self, org, receive, limit=20):
        processed = 0
        for _ in range(limit):
            token = secrets.token_urlsafe(24)
            item = self.collection.find_one_and_update(
                {"org": org, "available": {"$lte": utcnow()},
                 "status": {"$in": ["queued", "processing"]}, "attempts": {"$lt": 3}},
                {"$set": {"status": "processing", "claim": token,
                          "available": utcnow() + timedelta(minutes=5)}, "$inc": {"attempts": 1}},
                sort=[("created", 1)], return_document=ReturnDocument.AFTER)
            if not item:
                break
            result = {"case_id": "", "status": "rejected", "data": b""}
            try:
                sealed = bytes(item["data"])
                png = AESGCM(self.key).decrypt(sealed[:12], sealed[12:], org.encode())
                result.update(status="verified", case_id=receive(png, org))
            except HTTPException as exc:
                if exc.status_code == 409 or exc.status_code >= 500:
                    result = {"status": "queued" if item["attempts"] < 3 else "failed",
                              "available": utcnow() + timedelta(seconds=30)}
            except ValueError:
                pass  # Invalid payload is terminal; no raw message is logged.
            except Exception:
                result = {"status": "queued" if item["attempts"] < 3 else "failed",
                          "available": utcnow() + timedelta(seconds=30)}
            if result["status"] == "failed":
                result["data"] = b""
            self.collection.update_one({"id": item["id"], "claim": token},
                                       {"$set": result, "$unset": {"claim": ""}})
            processed += 1
        # A worker can die on its final attempt. Expire its claim rather than leaving it stuck.
        self.collection.update_many({"org": org, "status": "processing", "attempts": {"$gte": 3},
                                     "available": {"$lte": utcnow()}},
                                    {"$set": {"status": "failed", "data": b""}, "$unset": {"claim": ""}})
        return processed

    def status(self, org):
        rows = self.collection.find({"org": org}, {"_id": 0, "id": 1, "status": 1,
                "case_id": 1, "created": 1, "attempts": 1, "reason": 1}).sort("created", -1).limit(30)
        return [dict(row, created=row["created"].isoformat()) for row in rows]
