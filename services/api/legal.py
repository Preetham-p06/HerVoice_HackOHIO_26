"""Source registry, PDF chunking and deterministic local retrieval.
Only reviewed official sources are active; untrusted document text is never instructions.
"""

import hashlib, json, re, math, io
from pathlib import Path
from datetime import date
from urllib.parse import urlparse
from pypdf import PdfReader

REGISTRY = Path(__file__).parents[2] / "fixtures/legal-registry.json"
DIM = 128


def vector(text):
    v = [0.0] * DIM
    for word in re.findall(r"\w+", text.lower()):
        h = hashlib.sha256(word.encode()).digest()
        v[int.from_bytes(h[:2], "big") % DIM] += 1 if h[2] & 1 else -1
    norm = math.sqrt(sum(n * n for n in v)) or 1
    return [n / norm for n in v]


def registry():
    return json.loads(REGISTRY.read_text()) if REGISTRY.exists() else []


def ingest_pdf(data, metadata):
    if len(data) > 12 * 1024 * 1024 or not data.startswith(b"%PDF"):
        raise ValueError("A PDF under 12 MB is required")
    host = urlparse(metadata["url"]).hostname or ""
    if not any(
        host == h or host.endswith("." + h)
        for h in [
            "indiacode.nic.in",
            "cdnbbsr.s3waas.gov.in",
            "wcd.gov.in",
            "legislative.assam.gov.in",
            "justice.gov",
            "womenshealth.gov",
            "supremecourt.ohio.gov",
        ]
    ):
        raise ValueError("Source is not allowlisted")
    if metadata.get("jurisdiction") != "United States":
        raise ValueError("Unsupported jurisdiction")
    if metadata.get("reviewed", "") < date.today().isoformat():
        raise ValueError("New ingestion must be reviewed today")
    pages = PdfReader(io.BytesIO(data)).pages
    if len(pages) > 200:
        raise ValueError("Too many pages")
    doc = metadata | {
        "sha256": hashlib.sha256(data).hexdigest(),
        "status": "active",
        "chunks": [],
        "embeddingModel": "local-hash-v1",
        "dimensions": DIM,
    }
    for index, page in enumerate(pages):
        text = page.extract_text() or ""
        for start in range(0, len(text), 1200):
            chunk = text[start : start + 1500].strip()
            if chunk:
                doc["chunks"].append(
                    {
                        "id": f"{metadata['id']}-{index + 1}-{start}",
                        "page": index + 1,
                        "text": chunk,
                        "vector": vector(chunk),
                    }
                )
    if not doc["chunks"]:
        raise ValueError("No extractable text; OCR and review required")
    return doc


def retrieve(question, jurisdiction, documents=None, state=None):
    if jurisdiction != "United States":
        return []
    words = set(re.findall(r"\w+", question.lower())) - {
        "what",
        "are",
        "the",
        "my",
        "can",
        "i",
        "how",
        "a",
        "of",
        "is",
        "in",
        "to",
        "and",
    }
    q = vector(question)
    rows = []
    for d in documents if documents is not None else registry():
        if (
            d.get("status") != "active"
            or d.get("jurisdiction") != jurisdiction
            or (d.get("state") is not None and d.get("state") != state)
            or d.get("reviewUntil", "9999") < date.today().isoformat()
        ):
            continue
        for c in d.get("chunks", []):
            if len(c.get("vector", [])) != DIM:
                continue
            overlap = words & set(re.findall(r"\w+", c["text"].lower()))
            if not overlap:
                continue
            score = sum(a * b for a, b in zip(q, c["vector"]))
            if score > 0.03:
                rows.append((score, d, c))
    return sorted(rows, key=lambda r: -r[0])[:3]


def answer(question, jurisdiction, state=None, database=None):
    import os
    if os.getenv("LEGAL_PROVIDER", "local") == "atlas":
        from fastapi import HTTPException
        from .legal_atlas import retrieve as atlas_retrieve
        if database is None:
            raise HTTPException(503, "Atlas legal retrieval requires a configured live MongoDB database")
        found = atlas_retrieve(database, question, jurisdiction, state)
    else:
        found = retrieve(question, jurisdiction, state=state)
    if not found:
        return {
            "answer": "I cannot verify a legal answer from the current source collection. Please consult an official legal assistance directory.",
            "sources": [],
            "mode": "abstention",
        }
    sources = []
    passages = []
    for _, d, c in found:
        sources.append(
            {k: d.get(k, "") for k in ["title", "url", "jurisdiction", "reviewed"]}
            | {
                "id": c["id"],
                "section": c.get("section", "Source page"),
                "state": d.get("state"),
                "hash": d["sha256"],
                "effective": d.get("effective", "Unknown"),
            }
        )
        passages.append(
            f"{d['title']} — {c.get('section', 'Source summary')}:\n{c['text']}"
        )
    state_notice = ""
    if state and not any(d.get("state") == state for _, d, _ in found):
        state_notice = f"We do not have reviewed state-law guidance for {state}. The information below is national; use the official state/territory directory for local help.\n\n"
    return {
        "answer": state_notice
        + "Here are relevant summaries from official U.S. support resources. These explain where to find help; they do not determine your legal rights or replace advice from a qualified local professional.\n\n"
        + "\n\n".join(passages),
        "sources": sources,
        "mode": "U.S. source-backed information",
    }
