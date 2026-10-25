"""Run by a trusted operator with MongoDB write access, never by public signup."""

import argparse, os
from datetime import datetime, timezone
from pymongo import MongoClient

p = argparse.ArgumentParser()
p.add_argument("--user", required=True)
p.add_argument("--organization", required=True)
p.add_argument("--role", choices=["responder", "administrator"], required=True)
p.add_argument("--assigned-by", required=True)
a = p.parse_args()
if os.getenv("APP_MODE") != "live":
    raise SystemExit(
        "Set APP_MODE=live and explicitly configure MongoDB before creating a live membership"
    )
db = MongoClient(os.environ["MONGODB_URI"])[os.environ["MONGODB_DATABASE"]]
db.memberships.update_one(
    {"user": a.user, "org": a.organization},
    {
        "$set": {
            "role": a.role,
            "active": True,
            "assignedBy": a.assigned_by,
            "updated": datetime.now(timezone.utc),
        }
    },
    upsert=True,
)
print("Server-managed membership updated. No client metadata grants staff access.")
