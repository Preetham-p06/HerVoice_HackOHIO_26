from services.api.analysis import match, decompose
from services.api.memory import ConversationMemory
import sqlite3
import threading


def test_cosine_scope_self_exclusion_threshold():
    source = dict(id="one", org="a", narrative="housing safety options", alias="One")
    same = source | {"id": "two"}
    wrong_org = source | {"id": "three", "org": "b"}
    results = match(source, [source, same, wrong_org], limit=1, threshold=0.9)
    assert [r["id"] for r in results] == ["two"]
    assert results[0]["score"] == 1
    assert match(source, [same | {"narrative": "unrelated"}], threshold=1) == []


def test_analysis_preserves_uncertainty():
    case = {"narrative": "I am unsure whether this was a threat.", "urgent": False}
    result = decompose(case)
    assert result["summary"] == case["narrative"]
    assert result["urgency"] == "No urgency selected"
    assert result["reviewFlags"] == ["Threat mentioned"]
    assert "human review" in result["method"]


def test_memory_consent_encryption_owner_and_delete():
    db = sqlite3.connect(":memory:")
    db.row_factory = sqlite3.Row
    memory = ConversationMemory(db, threading.RLock(), b"x" * 32)
    assert memory.read("owner") is None
    messages = [{"role": "you", "text": "a private thought"}]
    memory.write("owner", messages)
    assert memory.read("owner") == messages
    assert memory.read("other") is None
    assert (
        "private thought"
        not in db.execute("SELECT data FROM conversation_memory").fetchone()[0]
    )
    memory.delete("owner")
    assert memory.read("owner") is None


def test_person_description_is_used_when_supplied():
    source = dict(
        id="one",
        org="a",
        alias="one",
        narrative="housing",
        details={"personDescription": "Synthetic gray coat red bicycle"},
    )
    candidate = dict(
        id="two",
        org="a",
        alias="two",
        narrative="different financial situation",
        details=source["details"],
    )
    assert match(source, [candidate], threshold=0.99)[0]["score"] == 1


def test_semantic_match_scope_threshold_and_prepared_exclusion(monkeypatch):
    from services.api import matching
    monkeypatch.setattr(matching,"cached_embedding",lambda model,org,text:[1.,0.] if text=="same" else [0.,1.])
    source={"id":"one","org":"a","narrative":"same"}
    cases=[source,{"id":"two","org":"a","alias":"Two","narrative":"same"},{"id":"three","org":"b","alias":"Three","narrative":"same"},{"id":"four","org":"a","alias":"Four","narrative":"same","status":"prepared"}]
    results=matching.local_semantic(source,cases,limit=1,threshold=.9)
    assert [item["id"] for item in results]==["two"]
    assert results[0]["score"]==1
