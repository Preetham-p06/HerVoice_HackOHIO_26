"""Permitted feed connector protocol. No scraping, posting, or social-login credentials.
Operator-configured HTTPS endpoint returns {items:[{id,hashtag,pngBase64}]}.
Only unchanged PNG files carrying #HerVoiceSignal are eligible.
"""

import base64
import json
import os
from urllib.parse import urlparse
import httpx


def configured():
    return bool(
        os.getenv("SOCIAL_FEED_URL")
        and os.getenv("SOCIAL_FEED_TOKEN")
        and os.getenv("SOCIAL_FEED_ORG")
    )


def poll():
    url = os.environ["SOCIAL_FEED_URL"]
    parsed = urlparse(url)
    if (
        parsed.scheme != "https"
        or not parsed.hostname
        or parsed.username
        or parsed.password
    ):
        raise ValueError("Connector requires a fixed HTTPS feed endpoint")
    with httpx.Client(timeout=20, follow_redirects=False) as client:
        with client.stream(
            "GET",
            url,
            headers={"Authorization": "Bearer " + os.environ["SOCIAL_FEED_TOKEN"]},
        ) as response:
            response.raise_for_status()
            body = bytearray()
            for chunk in response.iter_bytes():
                body.extend(chunk)
                if len(body) > 12 * 1024 * 1024:
                    raise ValueError("Feed exceeds size limit")
    items = json.loads(body).get("items", [])
    result = []
    for item in items[:20]:
        if item.get("hashtag") != "#HerVoiceSignal" or not isinstance(
            item.get("id"), str
        ):
            continue
        data = base64.b64decode(item.get("pngBase64", ""), validate=True)
        if len(data) <= 8 * 1024 * 1024:
            result.append((item["id"][:200], data))
    return os.environ["SOCIAL_FEED_ORG"], result
