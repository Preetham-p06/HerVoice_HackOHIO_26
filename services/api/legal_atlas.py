"""Reviewed legal chunks in Atlas. Retrieval never expands jurisdiction implicitly."""
import os
from datetime import date
from fastapi import HTTPException
from . import matching


def index_definition():
    return {"fields": [
        {"type": "vector", "path": "vector", "numDimensions": matching.DIMENSIONS, "similarity": "cosine"},
        *[{"type": "filter", "path": key} for key in
          ("jurisdiction", "stateScope", "status", "reviewUntil", "model")],
    ]}


def index_document(database, document):
    """Embed all chunks before replacing a document, retaining old data on provider failure."""
    if document.get("status") != "active" or document.get("jurisdiction") != "United States":
        raise ValueError("Only reviewed active U.S. documents are supported")
    if document.get("reviewUntil", "") < date.today().isoformat():
        raise ValueError("Document review has expired or is missing")
    model = matching.embedding_model()
    rows = []
    for chunk in document["chunks"]:
        rows.append({
            "documentId": document["id"], "chunkId": chunk["id"],
            "jurisdiction": document["jurisdiction"], "stateScope": document.get("state") or "national",
            "status": "active", "reviewUntil": document["reviewUntil"], "model": model,
            "vector": matching.embedding(chunk["text"]),
            "document": {k: v for k, v in document.items() if k != "chunks"} | {"embeddingModel": model, "dimensions": matching.DIMENSIONS},
            "chunk": {k: v for k, v in chunk.items() if k != "vector"},
        })
    if not rows:
        raise ValueError("No legal chunks to index")
    # A transaction prevents readers seeing a partially replaced document.
    with database.client.start_session() as session:
        with session.start_transaction():
            database.legal_chunks.delete_many({"documentId": document["id"]}, session=session)
            database.legal_chunks.insert_many(rows, session=session)
            database.legal_documents.replace_one({"id": document["id"]},
                {k: v for k, v in document.items() if k != "chunks"}, upsert=True, session=session)
    return len(rows)


def retrieve(database, question, jurisdiction, state=None, limit=3, threshold=0.25):
    if jurisdiction != "United States":
        return []
    query = matching.embedding(question)
    scopes = ["national"] + ([state] if state else [])
    filters = {"jurisdiction": jurisdiction, "stateScope": {"$in": scopes},
               "status": "active", "reviewUntil": {"$gte": date.today().isoformat()},
               "model": matching.embedding_model()}
    try:
        rows = database.legal_chunks.aggregate([
            {"$vectorSearch": {"index": os.getenv("ATLAS_LEGAL_VECTOR_INDEX", "legal_similarity"),
                               "path": "vector", "queryVector": query,
                               "numCandidates": max(100, limit * 20), "limit": limit, "filter": filters}},
            {"$project": {"_id": 0, "document": 1, "chunk": 1, "model": 1,
                          "score": {"$meta": "vectorSearchScore"}}},
        ])
        found = []
        for row in rows:
            indexed = row["document"]
            doc = database.legal_documents.find_one({"id": indexed["id"], "sha256": indexed["sha256"], "status": "active"})
            if not doc:
                continue
            score = max(-1, min(1, 2 * row["score"] - 1))
            # Recheck metadata after search, including stale-index results.
            if (score >= threshold and row["model"] == matching.embedding_model()
                    and doc.get("status") == "active" and doc.get("jurisdiction") == jurisdiction
                    and doc.get("state") in (None, state)
                    and doc.get("reviewUntil", "") >= date.today().isoformat()):
                found.append((score, doc, row["chunk"]))
        return found
    except Exception:
        raise HTTPException(503, "Legal vector search is unavailable. Check Atlas index readiness.") from None
