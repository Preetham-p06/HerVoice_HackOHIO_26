import json
import pytest
from fastapi import HTTPException
from services.api import openai_provider, providers


def test_openai_responses_preserves_history_and_disables_storage(monkeypatch):
    monkeypatch.setenv("TEXT_PROVIDER", "openai")
    def request(path, body, **kwargs):
        assert path == "/responses"
        assert body["store"] is False
        assert body["input"] == [{"role":"assistant","content":"Earlier reply"},{"role":"user","content":"My words"}]
        assert body["text"]["format"]["strict"] is True
        text=json.dumps({"text":"A response","expression":"gentle","animation":"idle"})
        return {"status":"completed","output":[{"type":"message","content":[{"type":"output_text","text":text}]}]}
    monkeypatch.setattr(openai_provider,"request",request)
    result=providers.generate("system",[{"role":"model","parts":[{"text":"Earlier reply"}]},{"role":"user","parts":[{"text":"My words"}]}])
    assert result.text == "A response"


def test_openai_refusal_does_not_become_fake_success(monkeypatch):
    monkeypatch.setenv("TEXT_PROVIDER","openai")
    monkeypatch.setattr(openai_provider,"request",lambda *a,**k:{"status":"completed","output":[{"type":"message","content":[{"type":"refusal","refusal":"Refused"}]}]})
    with pytest.raises(HTTPException):
        providers.generate("system",[{"role":"user","parts":[{"text":"test"}]}])


def test_openai_billing_error_is_sanitized(monkeypatch):
    monkeypatch.setenv("OPENAI_API_KEY","private-test-secret")
    class Response:
        is_success=False
        status_code=429
        def json(self):
            return {"error":{"code":"insufficient_quota","message":"private-test-secret"}}
    class Client:
        def __init__(self,**kwargs): pass
        def __enter__(self): return self
        def __exit__(self,*args): pass
        def post(self,*args,**kwargs): return Response()
    monkeypatch.setattr(openai_provider.httpx,"Client",Client)
    with pytest.raises(HTTPException) as err:
        openai_provider.request("/responses",{})
    assert err.value.status_code==429
    assert "credits" in err.value.detail
    assert "private-test-secret" not in err.value.detail


def test_companion_speech_uses_gentle_feminine_voice(monkeypatch):
    monkeypatch.delenv("OPENAI_TTS_VOICE", raising=False)
    monkeypatch.setenv("OPENAI_TTS_MODEL", "gpt-4o-mini-tts")
    seen = {}
    def request(path, payload, **kwargs):
        seen.update(payload)
        assert path == "/audio/speech" and kwargs["binary"]
        return b"synthetic-audio"
    monkeypatch.setattr(openai_provider, "request", request)
    assert openai_provider.speech("Synthetic welcome") == b"synthetic-audio"
    assert seen["voice"] == "nova"
    assert "feminine" in seen["instructions"]
