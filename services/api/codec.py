"""Versioned UTF-8 AES-GCM PNG transport. LSB is transport, not encryption."""

import io, struct, hashlib, secrets
from PIL import Image, UnidentifiedImageError
from cryptography.hazmat.primitives.ciphers.aead import AESGCM

MAGIC = b"HV01"
MAX_BYTES = 8 * 1024 * 1024
Image.MAX_IMAGE_PIXELS = 4_000_000


def load(data: bytes):
    if len(data) > MAX_BYTES:
        raise ValueError("PNG exceeds 8 MB")
    try:
        im = Image.open(io.BytesIO(data))
        if im.format != "PNG":
            raise ValueError("Original PNG required")
        if im.width * im.height > 4_000_000:
            raise ValueError("Image dimensions too large")
        im.load()
        return im.convert("RGBA")
    except (UnidentifiedImageError, OSError, Image.DecompressionBombError) as e:
        raise ValueError("Invalid PNG") from e


def cover(style=0):
    im = Image.new("RGB", (640, 480))
    p = im.load()
    colors = [(160, 183, 164), (175, 180, 195), (210, 184, 153)]
    c = colors[style % 3]
    for y in range(480):
        for x in range(640):
            f = (x / 640 + y / 480) / 2
            p[x, y] = tuple(min(255, int(v + f * 30)) for v in c)
    out = io.BytesIO()
    im.save(out, format="PNG")
    return out.getvalue()


def encode(data: bytes, payload: bytes, key: bytes, org: str):
    im = load(data)
    nonce = secrets.token_bytes(12)
    body = nonce + AESGCM(key).encrypt(nonce, payload, org.encode())
    frame = MAGIC + struct.pack(">I", len(body)) + hashlib.sha256(body).digest() + body
    if len(frame) * 8 > im.width * im.height:
        raise ValueError("Message exceeds image capacity")
    pixels = list(im.get_flattened_data())
    for i in range(len(frame) * 8):
        r, g, b, a = pixels[i]
        pixels[i] = ((r & 254) | ((frame[i // 8] >> (7 - i % 8)) & 1), g, b, a)
    im.putdata(pixels)
    out = io.BytesIO()
    im.save(out, format="PNG")
    result = out.getvalue()
    if decode(result, key, org) != payload:
        raise ValueError("Verification failed")
    return result


def decode(data: bytes, key: bytes, org: str):
    im = load(data)
    pixels = list(im.get_flattened_data())

    def read(n):
        if n * 8 > len(pixels):
            raise ValueError("Truncated message")
        return bytes(
            sum((pixels[i * 8 + j][0] & 1) << (7 - j) for j in range(8))
            for i in range(n)
        )

    header = read(40)
    if header[:4] != MAGIC:
        raise ValueError("No supported HerVoice message")
    n = struct.unpack(">I", header[4:8])[0]
    if n < 28 or n > 128000:
        raise ValueError("Invalid payload length")
    body = read(40 + n)[40:]
    if hashlib.sha256(body).digest() != header[8:40]:
        raise ValueError("Image damaged or modified")
    try:
        return AESGCM(key).decrypt(body[:12], body[12:], org.encode())
    except Exception as e:
        raise ValueError(
            "Message is not authorized for this organization or is damaged"
        ) from e
