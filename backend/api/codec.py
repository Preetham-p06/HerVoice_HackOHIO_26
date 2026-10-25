"""Versioned UTF-8 AES-GCM PNG transport. LSB is transport, not encryption."""

import io, struct, hashlib, secrets
from PIL import Image, ImageDraw, UnidentifiedImageError
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
    draw = ImageDraw.Draw(im)
    if style % 3 == 0:
        # Original procedural botanical illustration; no external image assets.
        for x, y, scale in [(175, 220, 1), (340, 155, 1.2), (475, 260, 0.8)]:
            draw.line((x, y, x - 20, 480), fill="#466950", width=6)
            draw.ellipse((x - 65, y + 70, x, y + 100), fill="#698b65")
            for dx, dy in [(0, -36), (34, -12), (22, 26), (-22, 26), (-34, -12)]:
                r = int(29 * scale)
                draw.ellipse(
                    (x + dx - r, y + dy - r, x + dx + r, y + dy + r), fill="#f4d8c7"
                )
            draw.ellipse((x - 17, y - 17, x + 17, y + 17), fill="#bc8c43")
    elif style % 3 == 1:
        draw.ellipse((435, 65, 525, 155), fill="#f6e3ae")
        draw.polygon([(0, 350), (170, 145), (340, 350)], fill="#728c9e")
        draw.polygon([(190, 370), (410, 170), (640, 365)], fill="#496b80")
        draw.polygon(
            [(0, 365), (220, 295), (460, 370), (640, 320), (640, 480), (0, 480)],
            fill="#628d7e",
        )
        draw.polygon([(280, 350), (350, 350), (500, 480), (100, 480)], fill="#a9ccd1")
    else:
        draw.ellipse((120, 85, 520, 425), fill="#eee9dc", outline="#ad9983", width=5)
        draw.ellipse((160, 120, 480, 390), fill="#ede0bd")
        for x, y in [
            (225, 200),
            (320, 170),
            (390, 240),
            (290, 290),
            (220, 310),
            (360, 335),
        ]:
            draw.ellipse((x - 33, y - 25, x + 33, y + 25), fill="#749464")
            draw.ellipse((x - 18, y - 18, x + 12, y + 15), fill="#bf5f49")
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
