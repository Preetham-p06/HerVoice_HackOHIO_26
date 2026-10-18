"""Optional Gemini embeddings and MongoDB Atlas cosine search.
Index only organization-approved case narratives. Vectors are sensitive derived data.
"""

import os
import re
import math
import httpx
from fastapi import HTTPException

from .analysis import matching_text

DIMENSIONS = 768


def embedding(text):
    model = os.getenv("GEMINI_EMBEDDING_MODEL", "")
    key = os.getenv("GEMINI_API_KEY", "")
    if not key or not re.fullmatch(r"[A-Za-z0-9._-]+", model):
        raise HTTPException(503, "Configure a supported Gemini embedding model and key")
    try:
        with httpx.Client(timeout=30) as client:
            response = client.post(
                f"https://generativelanguage.googleapis.com/v1beta/models/{model}:embedContent",
                headers={"x-goog-api-key": key},
                json={
                    "model": "models/" + model,
                    "content": {"parts": [{"text": text}]},
                    "outputDimensionality": DIMENSIONS,
                },
            )
            response.raise_for_status()
            values = response.json()["embedding"]["values"]
            if len(values) != DIMENSIONS or not all(
                isinstance(v, (int, float)) and math.isfinite(v) for v in values
            ):
                raise ValueError("dimensions")
            norm = math.sqrt(sum(v * v for v in values))
            if not norm:
                raise ValueError("zero vector")
            return [v / norm for v in values]
    except Exception:
        raise HTTPException(
            503, "Embedding service unavailable; case data remains saved"
        )


def index_case(store, case):
    model = os.getenv("GEMINI_EMBEDDING_MODEL", "")
    collection = store.mongo.case_vectors
    current = collection.find_one(
        {
            "id": case["id"],
            "org": case["org"],
            "model": model,
            "version": case["version"],
        }
    )
    if current:
        return
    values = embedding(matching_text(case))
    collection.replace_one(
        {"id": case["id"], "org": case["org"]},
        {
            "id": case["id"],
            "org": case["org"],
            "model": model,
            "version": case["version"],
            "vector": values,
        },
        upsert=True,
    )


def related(store, case, limit, threshold):
    index_case(store, case)
    values = embedding(matching_text(case))
    # Atlas score=(1+cosine)/2. Convert back before applying caller threshold.
    pipeline = [
        {
            "$vectorSearch": {
                "index": os.getenv("ATLAS_CASE_VECTOR_INDEX", "case_similarity"),
                "path": "vector",
                "queryVector": values,
                "numCandidates": max(100, 20 * (limit + 1)),
                "limit": limit + 1,
                "filter": {
                    "org": case["org"],
                    "model": os.getenv("GEMINI_EMBEDDING_MODEL", ""),
                },
            }
        },
        {"$project": {"_id": 0, "id": 1, "score": {"$meta": "vectorSearchScore"}}},
    ]
    try:
        rows = list(store.mongo.case_vectors.aggregate(pipeline))
    except Exception:
        raise HTTPException(
            503,
            "Atlas vector index is unavailable; configure it and index authorized cases first",
        )
    results = []
    import json

    for row in rows:
        cosine = max(-1, min(1, 2 * row["score"] - 1))
        if row["id"] == case["id"] or cosine < threshold:
            continue
        found = store.get(row["id"])
        if not found or found["org"] != case["org"]:
            continue
        target = json.loads(found["data"])
        results.append(
            {
                "id": target["id"],
                "alias": target["alias"],
                "score": round(cosine, 4),
                "method": "Gemini embeddings · Atlas cosine similarity · not identity probability",
            }
        )
    return results[:limit]
