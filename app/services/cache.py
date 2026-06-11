import hashlib
import os
from app.core.config import settings


CACHE_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "tmp")


def _ensure_cache_dir():
    os.makedirs(CACHE_DIR, exist_ok=True)


def _cache_key(text: str, voice: str, style: str | None, fmt: str) -> str:
    raw = f"{text}|{voice}|{style or ''}|{fmt}"
    return hashlib.sha256(raw.encode()).hexdigest() + "." + fmt


def get_cached(text: str, voice: str, style: str | None, fmt: str) -> bytes | None:
    _ensure_cache_dir()
    key = _cache_key(text, voice, style, fmt)
    path = os.path.join(CACHE_DIR, key)
    if os.path.exists(path):
        with open(path, "rb") as f:
            return f.read()
    return None


def set_cache(text: str, voice: str, style: str | None, fmt: str, data: bytes):
    _ensure_cache_dir()
    key = _cache_key(text, voice, style, fmt)
    path = os.path.join(CACHE_DIR, key)
    with open(path, "wb") as f:
        f.write(data)


def clear_cache():
    _ensure_cache_dir()
    for f in os.listdir(CACHE_DIR):
        os.remove(os.path.join(CACHE_DIR, f))


def cache_stats() -> dict:
    _ensure_cache_dir()
    files = os.listdir(CACHE_DIR)
    total_size = sum(os.path.getsize(os.path.join(CACHE_DIR, f)) for f in files)
    return {"count": len(files), "size_bytes": total_size, "size_mb": round(total_size / 1024 / 1024, 2)}
