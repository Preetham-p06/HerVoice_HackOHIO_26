"""Read-only X hashtag monitor. Image decoding remains the authoritative receipt check."""
import os
import re
from urllib.parse import urlparse
from datetime import timedelta
import httpx
from pymongo import ReturnDocument
from pymongo.errors import DuplicateKeyError
from .monitor import utcnow


def read_bounded(client, url, **kwargs):
    with client.stream("GET", url, **kwargs) as response:
        response.raise_for_status()
        data = bytearray()
        for chunk in response.iter_bytes():
            data.extend(chunk)
            if len(data) > 8 * 1024 * 1024:
                raise ValueError("Response exceeds 8 MB")
        return bytes(data)


def collect(database, queue, org):
    """One API page per run. Persist pagination only after every attachment is queued."""
    import json
    tag = os.getenv("X_SIGNAL_HASHTAG", "HerVoiceSignal").lstrip("#")
    if not re.fullmatch(r"[A-Za-z0-9_]{1,80}", tag):
        raise ValueError("Configure a single hashtag")
    key = f"x:{org}:{tag}"
    states = database.monitor_cursors
    states.create_index("id", unique=True)
    try:
        states.update_one({"id": key}, {"$setOnInsert": {"id": key, "leaseUntil": utcnow()}}, upsert=True)
    except DuplicateKeyError:
        pass
    state = states.find_one_and_update({"id": key, "leaseUntil": {"$lte": utcnow()}},
        {"$set": {"leaseUntil": utcnow() + timedelta(minutes=15)}}, return_document=ReturnDocument.AFTER)
    if state is None:
        return 0
    count = 0
    try:
        params = {"query": f"#{tag} has:images -is:retweet", "max_results": 10,
                  "expansions": "attachments.media_keys", "media.fields": "url,type", "tweet.fields": "attachments"}
        if state.get("since_id"):
            params["since_id"] = state["since_id"]
        if state.get("next_token"):
            params["next_token"] = state["next_token"]
        with httpx.Client(timeout=20, follow_redirects=False) as client:
            body = json.loads(read_bounded(client, "https://api.x.com/2/tweets/search/recent",
                params=params, headers={"Authorization": "Bearer " + os.environ["X_BEARER_TOKEN"]}))
            if body.get("errors"):
                raise ValueError("X returned an incomplete search result")
            media = {m["media_key"]: m for m in body.get("includes", {}).get("media", [])}
            for post in body.get("data", []):
                for media_key in post.get("attachments", {}).get("media_keys", []):
                    attachment = media.get(media_key, {})
                    if attachment.get("type") != "photo":
                        continue
                    url = attachment.get("url", "")
                    parsed = urlparse(url)
                    if parsed.scheme != "https" or parsed.hostname != "pbs.twimg.com" or parsed.username or parsed.port:
                        raise ValueError("Unexpected X media host")
                    # No bearer token is forwarded to the media host. Do not pretend JPEG conversion preserves LSBs.
                    data = read_bounded(client, url)
                    identifier = f"x:{post['id']}:{media_key}"
                    if data.startswith(b"\x89PNG\r\n\x1a\n"):
                        count += int(queue.enqueue(org, identifier, data))
                    else:
                        queue.reject(org, identifier, "Platform image is not an original PNG")
            meta = body.get("meta", {})
            newest = state.get("pending_newest") or meta.get("newest_id") or state.get("since_id")
            if meta.get("next_token"):
                update = {"next_token": meta["next_token"], "pending_newest": newest}
            else:
                update = {"since_id": newest, "next_token": None, "pending_newest": None}
            states.update_one({"id": key}, {"$set": update | {"lastSuccess": utcnow(), "lastError": None}})
        return count
    except Exception:
        states.update_one({"id": key}, {"$set": {"lastError": "X polling failed; check API access, limits, and media response"}})
        raise
    finally:
        states.update_one({"id": key}, {"$set": {"leaseUntil": utcnow()}})
