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
        "details": case.get("details", {}),
        "method": "Extractive demo analysis; flags require human review and do not establish facts or assess danger",
    }


def matching_text(case):
    return (
        case.get("details", {}).get("personDescription", "").strip()
        or case["narrative"]
    )


def match(source, candidates, limit=4, threshold=0.08):
    q = vector(matching_text(source))
    rows = []
    for item in candidates:
        if item["id"] == source["id"] or item["org"] != source["org"]:
            continue
        score = sum(a * b for a, b in zip(q, vector(matching_text(item))))
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


def interpret(case):
    """AI decomposition is advisory; it never changes queue priority or identity."""
    import json
    from pydantic import BaseModel, Field
    from typing import Literal
    from . import providers

    if not providers.enabled():
        return decompose(case)

    class Extracted(BaseModel):
        summary: str = Field(max_length=1200)
        nature: list[str] = Field(max_length=8)
        severity: Literal["high", "medium", "low", "unspecified"]
        reasoning: str = Field(max_length=1000)
        reviewFlags: list[str] = Field(max_length=10)

    reply = providers.generate(
        "Extract an advisory intake summary from the supplied report only. Preserve uncertainty and do not add facts, diagnoses, names or identities. Do not make dispatch or contact decisions. Severity is an unverified review suggestion, not an emergency assessment. In the outer reply JSON, text must contain a JSON string with keys summary (string), nature (array of strings), severity (high, medium, low, unspecified), reasoning (string), reviewFlags (array of strings). expression neutral, animation idle.",
        [{"role": "user", "parts": [{"text": json.dumps({k:case.get(k) for k in ["narrative","category","details","urgent"]}, ensure_ascii=False)}]}],
    )
    try:
        extracted = Extracted.model_validate_json(reply.text)
    except Exception:
        from fastapi import HTTPException
        raise HTTPException(503,"The AI intake summary could not be validated. Original report remains available.") from None
    return decompose(case) | extracted.model_dump() | {"method": providers.name()+" advisory extraction · human review required; not verified facts or identity", "generated": True}
