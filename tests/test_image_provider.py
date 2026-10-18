import base64
import io
import pytest
from PIL import Image
from fastapi import HTTPException
from services.api import providers


def test_gemini_image_normalizes_and_sends_only_prompt(monkeypatch):
    monkeypatch.setenv("GEMINI_API_KEY", "test-key")
    monkeypatch.setenv("GEMINI_IMAGE_MODEL", "test-image-model")
    raw = io.BytesIO()
    Image.new("RGB", (640, 480), "blue").save(raw, format="JPEG")
    class Response:
        status_code = 200
        def raise_for_status(self):
            pass
        def json(self):
            return {"candidates": [{"content": {"parts": [{"text": "Here"}, {"inlineData": {"mimeType": "image/jpeg", "data": base64.b64encode(raw.getvalue()).decode()}}]}}]}
    class Client:
        def __init__(self, **kwargs):
            pass
        def __enter__(self):
            return self
        def __exit__(self, *args):
            pass
        def post(self, url, headers, json):
            assert json["contents"][0]["parts"] == [{"text": "Ocean sunrise"}]
            assert json["generationConfig"]["responseModalities"] == ["TEXT", "IMAGE"]
            return Response()
    monkeypatch.setattr(providers.httpx, "Client", Client)
    data = providers.image("Ocean sunrise")
    assert Image.open(io.BytesIO(data)).format == "PNG"


def test_gemini_image_reports_quota_without_leaking_provider_body(monkeypatch):
    monkeypatch.setenv("GEMINI_API_KEY", "test-key")
    monkeypatch.setenv("GEMINI_IMAGE_MODEL", "test-image-model")
    class Response:
        status_code = 429
    class Client:
        def __init__(self, **kwargs):
            pass
        def __enter__(self):
            return self
        def __exit__(self, *args):
            pass
        def post(self, *args, **kwargs):
            return Response()
    monkeypatch.setattr(providers.httpx, "Client", Client)
    with pytest.raises(HTTPException) as err:
        providers.image("Ocean")
    assert err.value.status_code == 429
    assert "quota" in err.value.detail
    assert "test-key" not in err.value.detail
