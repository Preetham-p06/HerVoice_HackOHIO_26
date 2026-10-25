"""Scoped, durable enhancement jobs. No request depends on a successful enhancement."""

import json, secrets, time, threading, os, base64, tempfile, subprocess, shutil
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
from .codec import cover, load
from . import providers
from .storage import AssetStorage
from fastapi import HTTPException

POOL = ThreadPoolExecutor(max_workers=2)


class Jobs:
    def __init__(self, db, store, directory):
        self.db = db
        self.store = store
        self.directory = directory / "jobs"
        self.directory.mkdir(exist_ok=True)
        db.execute(
            "CREATE TABLE IF NOT EXISTS jobs(id TEXT PRIMARY KEY, owner TEXT, data TEXT)"
        )
        db.commit()
        self.lock = threading.Lock()
        self.assets = AssetStorage(self.directory, store.mode)

    def put(self, j):
        with self.lock:
            if self.store.mode == "live":
                self.store.mongo.jobs.replace_one({"id": j["id"]}, j, upsert=True)
            else:
                self.db.execute(
                    "INSERT OR REPLACE INTO jobs VALUES(?,?,?)",
                    (j["id"], j["owner"], json.dumps(j)),
                )
                self.db.commit()

    def get(self, id, owner):
        if self.store.mode == "live":
            j = self.store.mongo.jobs.find_one({"id": id, "owner": owner})
            j.pop("_id", None) if j else None
        else:
            row = self.db.execute(
                "SELECT data FROM jobs WHERE id=? AND owner=?", (id, owner)
            ).fetchone()
            j = json.loads(row["data"]) if row else None
        if not j:
            raise HTTPException(404, "Job not found")
        if j["expires"] < time.time():
            raise HTTPException(404, "Job expired")
        return j

    def public(self, j):
        return {
            k: j.get(k)
            for k in [
                "id",
                "type",
                "status",
                "progress",
                "attempts",
                "error",
                "expires",
                "results",
            ]
        }

    def create(self, owner, kind, prompt=""):
        j = {
            "id": secrets.token_hex(20),
            "owner": owner,
            "type": kind,
            "status": "queued",
            "progress": 0,
            "attempts": 0,
            "error": None,
            "expires": time.time() + 3600,
            "results": [],
        }
        self.put(j)
        POOL.submit(self.run, j, prompt)
        return self.public(j)

    def cancel(self, j):
        j["status"] = "canceled"
        self.put(j)

    def run(self, j, prompt):
        try:
            j["status"] = "running"
            j["attempts"] = 1
            self.put(j)
            with tempfile.TemporaryDirectory(prefix="hervoice-job-") as tmp:
                outputs = []
                if j["type"] == "covers":
                    for i in range(3):
                        if self.get(j["id"], j["owner"])["status"] == "canceled":
                            return
                        if os.getenv("IMAGE_PROVIDER") in ["gemini", "openai"]:
                            data = providers.image(prompt)
                        elif self.store.mode == "demo":
                            data = cover(i)
                        else:
                            import boto3
                            from botocore.config import Config

                            model = os.getenv("BEDROCK_IMAGE_MODEL")
                            if not model:
                                raise ValueError("image_provider_unavailable")
                            # Amazon Nova Canvas native request contract; configurable model ID.
                            response = boto3.client(
                                "bedrock-runtime",
                                config=Config(
                                    connect_timeout=5,
                                    read_timeout=35,
                                    retries={"max_attempts": 1},
                                ),
                            ).invoke_model(
                                modelId=model,
                                body=json.dumps(
                                    {
                                        "taskType": "TEXT_IMAGE",
                                        "textToImageParams": {
                                            "text": prompt
                                            or "A quiet landscape, no people, no text"
                                        },
                                        "imageGenerationConfig": {
                                            "numberOfImages": 1,
                                            "height": 512,
                                            "width": 512,
                                            "cfgScale": 6.5,
                                            "seed": secrets.randbelow(100000),
                                        },
                                    }
                                ),
                                contentType="application/json",
                                accept="application/json",
                            )
                            data = base64.b64decode(
                                json.loads(response["body"].read())["images"][0]
                            )
                            im = load(data)
                            import io

                            out = io.BytesIO()
                            im.save(out, format="PNG")
                            data = out.getvalue()
                        outputs.append(data)
                        j["progress"] = int((i + 1) / 3 * 90)
                        self.put(j)
                elif j["type"] == "speech":
                    data = providers.speech(prompt)
                    audio = Path(tmp) / "speech.mp3"
                    audio.write_bytes(data)
                    cues = []
                    ffmpeg = shutil.which("ffmpeg")
                    rhubarb = os.getenv("RHUBARB_PATH")
                    if ffmpeg and rhubarb:
                        wav = Path(tmp) / "speech.wav"
                        cuepath = Path(tmp) / "cues.json"
                        subprocess.run(
                            [ffmpeg, "-y", "-i", str(audio), str(wav)],
                            check=True,
                            capture_output=True,
                            timeout=30,
                        )
                        subprocess.run(
                            [rhubarb, "-f", "json", "-o", str(cuepath), str(wav)],
                            check=True,
                            capture_output=True,
                            timeout=30,
                        )
                        raw = json.loads(cuepath.read_text())
                        cues = [
                            c
                            for c in raw.get("mouthCues", [])
                            if c.get("value") in list("ABCDEFGHX")
                        ]
                    outputs = [
                        data,
                        json.dumps(
                            {
                                "mouthCues": cues,
                                "alignment": "rhubarb" if cues else "unavailable",
                            }
                        ).encode(),
                    ]
                else:
                    raise ValueError("unsupported_job")
                if self.get(j["id"], j["owner"])["status"] == "canceled":
                    return
                target = self.directory / j["id"]
                target.mkdir(exist_ok=True)
                for i, data in enumerate(outputs):
                    self.assets.put(j["id"], i, data)
                    j["results"].append(
                        {
                            "index": i,
                            "mime": "image/png"
                            if j["type"] == "covers"
                            else "audio/mpeg"
                            if i == 0
                            else "application/json",
                        }
                    )
                j["status"] = "complete"
                j["progress"] = 100
                self.put(j)
        except Exception as exc:
            j["status"] = "failed"
            j["error"] = "image_quota_exceeded" if isinstance(exc, HTTPException) and exc.status_code == 429 else "enhancement_unavailable"
            self.put(j)

    def result(self, j, index):
        if j["status"] != "complete":
            raise HTTPException(409, "Job is not complete")
        if index < 0 or index >= len(j["results"]):
            raise HTTPException(404, "Result not found")
        try:
            data = self.assets.get(j["id"], index)
        except Exception:
            raise HTTPException(404, "Job result is unavailable")
        return data, j["results"][index]["mime"]

    def cleanup(self):
        for directory in self.directory.iterdir():
            if directory.is_dir() and directory.stat().st_mtime < time.time() - 3600:
                shutil.rmtree(directory)
