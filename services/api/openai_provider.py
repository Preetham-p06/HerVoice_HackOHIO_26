"""Server-only OpenAI adapters; bounded requests, no secret-bearing errors."""
import base64
import io
import os
import httpx
from PIL import Image
from fastapi import HTTPException

BASE = "https://api.openai.com/v1"


def request(path, body, timeout=60, binary=False):
    key = os.getenv("OPENAI_API_KEY")
    if not key:
        raise HTTPException(503, "OpenAI API key is not configured.")
    try:
        with httpx.Client(timeout=timeout) as client:
            response = client.post(BASE + path, headers={"Authorization": "Bearer " + key}, json=body)
            if not response.is_success:
                error = response.json().get("error", {})
                code = error.get("code", "")
                if code in ["insufficient_quota", "billing_hard_limit_reached"]:
                    raise HTTPException(429, "OpenAI project credits or billing quota are unavailable.")
                if response.status_code == 429:
                    raise HTTPException(429, "OpenAI rate limit reached. Please retry shortly.")
                if response.status_code in [401,403]:
                    raise HTTPException(503, "OpenAI rejected the API key or model access. Check project permissions.")
                raise HTTPException(503, "OpenAI could not complete this request. Check model access and retry.")
            if binary:
                if len(response.content) > 8 * 1024 * 1024:
                    raise ValueError("audio_too_large")
                return response.content
            return response.json()
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(503, "OpenAI is temporarily unavailable. Please retry.") from None


def generate(system, contents):
    messages = [{"role": "assistant" if c.get("role") == "model" else "user", "content": "\n".join(p.get("text", "") for p in c.get("parts", []))} for c in contents]
    schema = {"type":"object","properties":{"text":{"type":"string"},"expression":{"type":"string","enum":["neutral","gentle"]},"animation":{"type":"string","enum":["idle","talking"]}},"required":["text","expression","animation"],"additionalProperties":False}
    result = request("/responses", {"model":os.getenv("OPENAI_TEXT_MODEL","gpt-4.1-mini"),"instructions":system,"input":messages,"store":False,"max_output_tokens":1500,"text":{"format":{"type":"json_schema","name":"support_reply","strict":True,"schema":schema}}})
    if result.get("status") != "completed":
        raise HTTPException(503,"OpenAI did not complete the reply. Please retry.")
    text = "".join(p.get("text","") for item in result.get("output",[]) if item.get("type")=="message" for p in item.get("content",[]) if p.get("type")=="output_text")
    return text


def image(prompt):
    result = request("/images/generations", {"model":os.getenv("OPENAI_IMAGE_MODEL","gpt-image-1.5"),"prompt":prompt,"n":1,"size":"1024x1024","quality":"low","output_format":"png"}, timeout=120)
    try:
        encoded=result["data"][0]["b64_json"]
        if len(encoded)>16*1024*1024:
            raise ValueError()
        raw=base64.b64decode(encoded,validate=True)
        with Image.open(io.BytesIO(raw)) as source:
            if source.width*source.height>4_000_000:
                raise ValueError()
            source.load()
            im=source.convert("RGB")
            output=io.BytesIO();im.save(output,format="PNG")
            return output.getvalue()
    except Exception:
        raise HTTPException(503,"OpenAI did not return a valid image. Please retry.") from None


def speech(text):
    model = os.getenv("OPENAI_TTS_MODEL", "gpt-4o-mini-tts")
    payload = {"model": model, "voice": os.getenv("OPENAI_TTS_VOICE", "nova"), "input": text, "response_format": "mp3"}
    if model.startswith("gpt-4o"):
        payload["instructions"] = "Use a warm, gentle feminine voice with a natural American accent. Speak calmly at a comfortable, unhurried pace. Be steady and respectful, without theatrical emotion or exaggerated cheerfulness."
    return request("/audio/speech", payload, binary=True)


def embedding(text, dimensions):
    return request("/embeddings", {"model":os.getenv("OPENAI_EMBEDDING_MODEL","text-embedding-3-small"),"input":text,"dimensions":dimensions})["data"][0]["embedding"]


def transcribe(data: bytes, mime: str) -> str:
    """Short consented microphone clip; no retained local audio file."""
    extensions={"audio/webm":"webm","audio/mp4":"mp4","audio/ogg":"ogg","audio/wav":"wav","audio/mpeg":"mp3"}
    key=os.getenv("OPENAI_API_KEY")
    if not key:
        raise HTTPException(503,"Voice input is not configured. You can type your message.")
    try:
        with httpx.Client(timeout=35) as client:
            response=client.post(BASE+"/audio/transcriptions",headers={"Authorization":"Bearer "+key},data={"model":os.getenv("OPENAI_TRANSCRIBE_MODEL","gpt-4o-mini-transcribe"),"response_format":"json"},files={"file":("voice-note."+extensions[mime],data,mime)})
            if not response.is_success:
                raise HTTPException(503,"Voice transcription is unavailable. Please retry or type your message.")
            text=response.json().get("text","").strip()
            if not text:
                raise HTTPException(422,"No words were detected. Try again or type your message.")
            return text[:4000]
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(503,"Voice transcription is unavailable. Please type your message.") from None
