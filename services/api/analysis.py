"""Deterministic, auditable demo analysis. Scores are never identity probabilities."""

import re
from .legal import vector


def decompose(case):
    text = case["narrative"]
    sentences = [s.strip() for s in re.split(r"(?<=[.!?])\s+|\n+", text) if s.strip()]
    terms = {
        "threat": "Threat mentioned",
        "weapon": "Weapon mentioned",
        "injur": "Injury mentioned",
        "child": "Child mentioned",
    }
    flags = [label for term, label in terms.items() if term in text.lower()]
    return {
        "summary": text[:600],
        "statements": sentences[:20],
        "category": case.get("category", "Unspecified"),
        "location": case.get("location") or "Not supplied",
        "contactPreference": case.get("contact", {}).get("method", "none"),
        "urgency": "Requested urgent support"
        if case.get("urgent")
        else "No urgency selected",
        "reviewFlags": flags,
        "method": "Extractive demo analysis; flags require human review and do not establish facts or assess danger",
    }


def match(source, candidates, limit=4, threshold=0.08):
    q = vector(source["narrative"])
    rows = []
    for item in candidates:
        if item["id"] == source["id"] or item["org"] != source["org"]:
            continue
        score = sum(a * b for a, b in zip(q, vector(item["narrative"])))
        if score >= threshold:
            rows.append(
                {
                    "id": item["id"],
                    "alias": item["alias"],
                    "score": round(score, 4),
                    "method": "Cosine similarity · local hash embeddings · not identity probability",
                }
            )
    return sorted(rows, key=lambda r: (-r["score"], r["id"]))[:limit]
