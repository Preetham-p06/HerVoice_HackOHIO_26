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
