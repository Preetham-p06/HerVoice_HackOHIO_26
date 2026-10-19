"""Adapter contracts use fakes; they do not claim a live Atlas integration test."""
from types import SimpleNamespace
from unittest.mock import MagicMock
import pytest
from fastapi import HTTPException
from services.api import legal_atlas, legal, matching
from services.api.monitor import MongoMonitor


def document(state=None):
    return {"id": "reviewed-" + (state or "national"), "status": "active", "jurisdiction": "United States",
            "state": state, "reviewUntil": "2099-01-01", "title": "Official resource",
            "url": "https://www.justice.gov/", "sha256": "version-a", "reviewed": "2026-10-19",
            "chunks": [{"id": "c1", "text": "Reviewed protection-order resources.", "page": 1}]}


def test_atlas_legal_filters_and_rank_threshold(monkeypatch):
    monkeypatch.setenv("EMBEDDING_PROVIDER", "openai")
    monkeypatch.setattr(matching, "embedding", lambda text: [1.0] + [0.0] * 767)
    db = MagicMock()
    def row(doc, score=.9):
        return {"document": doc, "chunk": doc["chunks"][0], "score": score, "model": matching.embedding_model()}
    expired = document(); expired["reviewUntil"] = "2000-01-01"; expired["id"] = "expired"
    db.legal_chunks.aggregate.return_value = [row(document()), row(document("Ohio")),
                                              row(document("Texas")), row(expired), row(document(), .55)]
    def canonical(query):
        if query["id"] == "expired":
            return expired
        return document(query["id"].removeprefix("reviewed-") if query["id"] != "reviewed-national" else None)
    db.legal_documents.find_one.side_effect = canonical
    found = legal_atlas.retrieve(db, "protection order", "United States", "Ohio")
    assert len(found) == 2
    pipeline = db.legal_chunks.aggregate.call_args.args[0]
    search = pipeline[0]["$vectorSearch"]
    assert search["filter"]["stateScope"] == {"$in": ["national", "Ohio"]}
    assert search["filter"]["model"] == matching.embedding_model()
    assert len(search["queryVector"]) == 768
    assert found[0][0] == pytest.approx(.8)
    assert legal_atlas.retrieve(db, "question", "India") == []


def test_atlas_failure_is_not_local_success(monkeypatch):
    monkeypatch.setenv("LEGAL_PROVIDER", "atlas")
    with pytest.raises(HTTPException) as err:
        legal.answer("help", "United States")
    assert err.value.status_code == 503
    monkeypatch.setattr(matching, "embedding", lambda _: [1.0] * 768)
    db = MagicMock(); db.legal_chunks.aggregate.side_effect = RuntimeError("private database details")
    with pytest.raises(HTTPException) as err:
        legal_atlas.retrieve(db, "help", "United States")
    assert "private" not in err.value.detail


def test_indexing_provider_failure_preserves_previous_document(monkeypatch):
    db = MagicMock()
    monkeypatch.setattr(matching, "embedding", MagicMock(side_effect=HTTPException(503, "unavailable")))
    with pytest.raises(HTTPException):
        legal_atlas.index_document(db, document())
    db.legal_chunks.delete_many.assert_not_called()
    monkeypatch.setattr(matching, "embedding", lambda _: [1.0] * 768)
    assert legal_atlas.index_document(db, document()) == 1
    db.client.start_session.assert_called_once()
    inserted = db.legal_chunks.insert_many.call_args.args[0][0]
    assert inserted["stateScope"] == "national"
    assert "vector" not in inserted["chunk"]
    fields = legal_atlas.index_definition()["fields"]
    assert fields[0]["similarity"] == "cosine"
    assert {f["path"] for f in fields} >= {"vector", "reviewUntil", "stateScope", "model"}


def monitor_item():
    db = MagicMock()
    monitor = MongoMonitor(db, b"a" * 32)
    monitor.enqueue("org-a", "post-1", b"\x89PNG\r\n\x1a\noriginal")
    item = db.monitor_feed.insert_one.call_args.args[0]
    item.update(attempts=1)
    db.monitor_feed.find_one_and_update.side_effect = [item, None]
    return monitor, db, item


def test_monitor_encrypted_idempotent_scoped_intake():
    monitor, db, item = monitor_item()
    assert b"original" not in item["data"]
    callback = MagicMock(return_value="case-1")
    assert monitor.scan("org-a", callback) == 1
    callback.assert_called_once_with(b"\x89PNG\r\n\x1a\noriginal", "org-a")
    claim = db.monitor_feed.find_one_and_update.call_args_list[0]
    assert claim.args[0]["org"] == "org-a"
    result = db.monitor_feed.update_one.call_args.args[1]["$set"]
    assert result == {"case_id": "case-1", "status": "verified", "data": b""}
    from pymongo.errors import DuplicateKeyError
    db.monitor_feed.insert_one.side_effect = DuplicateKeyError("duplicate")
    assert not monitor.enqueue("org-a", "post-1", b"\x89PNG\r\n\x1a\noriginal")


def test_monitor_retries_transient_failure_and_rejects_invalid_payload():
    for error, status in [(HTTPException(503, "down"), "queued"), (ValueError("bad PNG"), "rejected")]:
        monitor, db, item = monitor_item()
        monitor.scan("org-a", MagicMock(side_effect=error))
        result = db.monitor_feed.update_one.call_args.args[1]["$set"]
        assert result["status"] == status
        if status == "rejected":
            assert result["data"] == b""
        else:
            assert "data" not in result


def test_atlas_answer_preserves_source_provenance(monkeypatch):
    monkeypatch.setenv("LEGAL_PROVIDER", "atlas")
    doc = document()
    monkeypatch.setattr(legal_atlas, "retrieve", lambda *args: [(.8, doc, doc["chunks"][0])])
    result = legal.answer("orders", "United States", "Ohio", database=SimpleNamespace())
    assert result["sources"][0]["url"] == doc["url"]
    assert result["sources"][0]["hash"] == doc["sha256"]
    assert "national" in result["answer"]


def test_x_monitor_pagination_and_non_png_rejection(monkeypatch):
    import httpx
    import json
    from services.api import x_monitor
    monkeypatch.setenv("X_BEARER_TOKEN", "test-only-token")
    requests = []
    def handle(request):
        requests.append(request)
        if request.url.host == "api.x.com":
            return httpx.Response(200, json={"data": [{"id": "12", "attachments": {"media_keys": ["a", "b"]}}],
                "includes": {"media": [{"media_key": "a", "type": "photo", "url": "https://pbs.twimg.com/media/a.png"},
                                        {"media_key": "b", "type": "photo", "url": "https://pbs.twimg.com/media/b.jpg"}]},
                "meta": {"newest_id": "12", "next_token": "next-page"}})
        assert "authorization" not in request.headers
        return httpx.Response(200, content=b"\x89PNG\r\n\x1a\nfile" if request.url.path.endswith("png") else b"JPEG")
    client = httpx.Client(transport=httpx.MockTransport(handle))
    monkeypatch.setattr(x_monitor.httpx, "Client", lambda **kwargs: client)
    db = MagicMock(); queue = MagicMock()
    db.monitor_cursors.find_one_and_update.return_value = {"since_id": "10"}
    assert x_monitor.collect(db, queue, "org-a") == 1
    queue.enqueue.assert_called_once_with("org-a", "x:12:a", b"\x89PNG\r\n\x1a\nfile")
    queue.reject.assert_called_once()
    assert requests[0].url.params["since_id"] == "10"
    updates = [c.args[1].get("$set", {}) for c in db.monitor_cursors.update_one.call_args_list]
    assert any(u.get("next_token") == "next-page" and u.get("pending_newest") == "12" for u in updates)
    assert "test-only-token" not in json.dumps(updates, default=str)


def test_x_monitor_rejects_untrusted_media_hosts_without_advancing(monkeypatch):
    import httpx
    from services.api import x_monitor
    monkeypatch.setenv("X_BEARER_TOKEN", "test-only-token")
    def handle(request):
        assert request.url.host == "api.x.com"
        return httpx.Response(200, json={"data": [{"id": "12", "attachments": {"media_keys": ["a"]}}],
            "includes": {"media": [{"media_key": "a", "type": "photo", "url": "https://localhost/private"}]},
            "meta": {"newest_id": "12"}})
    client = httpx.Client(transport=httpx.MockTransport(handle))
    monkeypatch.setattr(x_monitor.httpx, "Client", lambda **kwargs: client)
    db = MagicMock(); db.monitor_cursors.find_one_and_update.return_value = {}
    with pytest.raises(ValueError, match="media host"):
        x_monitor.collect(db, MagicMock(), "org-a")
    updates = [c.args[1].get("$set", {}) for c in db.monitor_cursors.update_one.call_args_list]
    assert not any("since_id" in u for u in updates)
    assert any("lastError" in u for u in updates)
