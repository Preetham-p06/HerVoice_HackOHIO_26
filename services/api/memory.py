"""Opt-in encrypted conversation retention, bound to a private cookie, expiring in 24h."""

import base64
import json
import secrets
import time
from cryptography.hazmat.primitives.ciphers.aead import AESGCM


class ConversationMemory:
    def __init__(self, db, lock, key, mongo=None):
        self.db, self.lock, self.key, self.mongo = db, lock, key, mongo
        db.execute(
            "CREATE TABLE IF NOT EXISTS conversation_memory(owner TEXT PRIMARY KEY, expires REAL, data TEXT)"
        )
        db.commit()
        if mongo is not None:
            mongo.conversation_memory.create_index("owner", unique=True)

    def read(self, owner):
        return self.snapshot(owner)[0]

    def snapshot(self, owner):
        """Return an encrypted-record token so late replies cannot restore deleted memory."""
        with self.lock:
            r = (
                self.mongo.conversation_memory.find_one({"owner": owner})
                if self.mongo is not None
                else self.db.execute(
                    "SELECT * FROM conversation_memory WHERE owner=?", (owner,)
                ).fetchone()
            )
            if not r:
                return None, None
            if r["expires"] < time.time():
                self.delete(owner)
                return None, None
            raw = base64.b64decode(r["data"])
            return json.loads(
                AESGCM(self.key).decrypt(raw[:12], raw[12:], owner.encode())
            ), r["data"]

    def write(self, owner, messages, expected_token=None):
        nonce = secrets.token_bytes(12)
        data = base64.b64encode(
            nonce
            + AESGCM(self.key).encrypt(
                nonce, json.dumps(messages[-20:]).encode(), owner.encode()
            )
        ).decode()
        record = {"owner": owner, "expires": time.time() + 86400, "data": data}
        with self.lock:
            if self.mongo is not None:
                condition = {"owner": owner}
                if expected_token is not None:
                    condition["data"] = expected_token
                result = self.mongo.conversation_memory.replace_one(
                    condition, record, upsert=expected_token is None
                )
                return bool(result.matched_count or result.upserted_id)
            elif expected_token is not None:
                result = self.db.execute(
                    "UPDATE conversation_memory SET expires=?, data=? WHERE owner=? AND data=?",
                    (record["expires"], data, owner, expected_token),
                )
                self.db.commit()
                return bool(result.rowcount)
            else:
                self.db.execute(
                    "INSERT OR REPLACE INTO conversation_memory VALUES(?,?,?)",
                    tuple(record.values()),
                )
                self.db.commit()

    def delete(self, owner):
        with self.lock:
            if self.mongo is not None:
                self.mongo.conversation_memory.delete_one({"owner": owner})
            else:
                self.db.execute(
                    "DELETE FROM conversation_memory WHERE owner=?", (owner,)
                )
                self.db.commit()

    def purge_expired(self):
        with self.lock:
            if self.mongo is not None:
                self.mongo.conversation_memory.delete_many(
                    {"expires": {"$lt": time.time()}}
                )
            else:
                self.db.execute(
                    "DELETE FROM conversation_memory WHERE expires < ?", (time.time(),)
                )
                self.db.commit()
