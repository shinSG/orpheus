import base64
import io
import struct
from openai import AsyncOpenAI
from app.core.config import settings


client = AsyncOpenAI(
    api_key=settings.MIMO_API_KEY,
    base_url=settings.MIMO_BASE_URL,
)


async def tts_stream(text: str, voice: str, style: str | None = None):
    messages = []
    if style:
        messages.append({"role": "user", "content": style})
    messages.append({"role": "assistant", "content": text})

    stream = await client.chat.completions.create(
        model=settings.TTS_MODEL,
        messages=messages,
        audio={"format": "pcm16", "voice": voice},
        stream=True,
    )

    async for chunk in stream:
        if not chunk.choices:
            continue
        delta = chunk.choices[0].delta
        audio = getattr(delta, "audio", None)
        if audio is not None and isinstance(audio, dict):
            pcm_bytes = base64.b64decode(audio["data"])
            yield pcm_bytes


async def tts_sync(text: str, voice: str, fmt: str, style: str | None = None) -> bytes:
    messages = []
    if style:
        messages.append({"role": "user", "content": style})
    messages.append({"role": "assistant", "content": text})

    completion = await client.chat.completions.create(
        model=settings.TTS_MODEL,
        messages=messages,
        audio={"format": fmt, "voice": voice},
    )

    message = completion.choices[0].message
    return base64.b64decode(message.audio.data)
