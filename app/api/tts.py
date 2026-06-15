import asyncio
import base64
import json
import re
from fastapi import APIRouter, HTTPException, Request, WebSocket, WebSocketDisconnect
from fastapi.responses import StreamingResponse, Response
from app.schemas.tts import (
    TTSRequest,
    VoicePreset,
    AudioFormat,
    VOICES_INFO,
    VoiceInfo,
    VoiceListResponse,
)
from app.services.mimo_tts import tts_stream, tts_sync
from app.services.audio import pcm16_to_wav, pcm16_to_mp3
from app.services.cache import get_cached, set_cache, clear_cache, cache_stats
from app.core.config import settings

router = APIRouter(prefix="/api/v1/tts", tags=["TTS"])

SENTENCE_BOUNDARIES = re.compile(r"([。！？.!?；;，,])")


@router.get("/voices", response_model=VoiceListResponse)
async def list_voices():
    voices = [
        VoiceInfo(id=v["voice_id"], name=v["name"], lang=v["lang"], gender=v["gender"])
        for v in VOICES_INFO.values()
    ]
    return VoiceListResponse(voices=voices)


@router.post("/stream")
async def tts_stream_endpoint(req: TTSRequest):
    voice_id = VOICES_INFO[req.voice.value]["voice_id"]

    async def event_generator():
        async for pcm_chunk in tts_stream(
            text=req.text, voice=voice_id, style=req.style
        ):
            data = base64.b64encode(pcm_chunk).decode("utf-8")
            yield f"data: {json.dumps({'audio': data, 'done': False})}\n\n"
        yield f"data: {json.dumps({'audio': '', 'done': True})}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@router.post("/generate")
async def tts_generate_endpoint(req: TTSRequest):
    voice_id = VOICES_INFO[req.voice.value]["voice_id"]

    cached = get_cached(req.text, voice_id, req.style, req.format.value)
    if cached is not None:
        media_map = {"wav": "audio/wav", "mp3": "audio/mpeg", "pcm16": "audio/pcm"}
        ext_map = {"wav": "wav", "mp3": "mp3", "pcm16": "pcm"}
        return Response(
            content=cached,
            media_type=media_map[req.format.value],
            headers={
                "Content-Disposition": f"attachment; filename=output.{ext_map[req.format.value]}",
                "X-Cache": "HIT",
            },
        )

    pcm_chunks = []

    if req.format == AudioFormat.pcm16:
        async for chunk in tts_stream(text=req.text, voice=voice_id, style=req.style):
            pcm_chunks.append(chunk)
        audio_data = b"".join(pcm_chunks)
        set_cache(req.text, voice_id, req.style, req.format.value, audio_data)
        return Response(
            content=audio_data,
            media_type="audio/pcm",
            headers={"Content-Disposition": "attachment; filename=output.pcm", "X-Cache": "MISS"},
        )

    async for chunk in tts_stream(text=req.text, voice=voice_id, style=req.style):
        pcm_chunks.append(chunk)

    if req.format == AudioFormat.wav:
        audio_data = pcm16_to_wav(pcm_chunks, sample_rate=settings.SAMPLE_RATE)
        media_type = "audio/wav"
        ext = "wav"
    elif req.format == AudioFormat.mp3:
        audio_data = pcm16_to_mp3(pcm_chunks, sample_rate=settings.SAMPLE_RATE)
        media_type = "audio/mpeg"
        ext = "mp3"
    else:
        raise HTTPException(status_code=400, detail=f"Unsupported format: {req.format}")

    set_cache(req.text, voice_id, req.style, req.format.value, audio_data)
    return Response(
        content=audio_data,
        media_type=media_type,
        headers={"Content-Disposition": f"attachment; filename=output.{ext}", "X-Cache": "MISS"},
    )


@router.get("/cache/stats")
async def get_cache_stats():
    return cache_stats()


@router.delete("/cache")
async def clear_all_cache():
    clear_cache()
    return {"message": "Cache cleared"}


@router.get("/voices/{voice_id}")
async def get_voice(voice_id: str):
    for v in VOICES_INFO.values():
        if v["voice_id"] == voice_id:
            return VoiceInfo(id=v["voice_id"], name=v["name"], lang=v["lang"], gender=v["gender"])
    raise HTTPException(status_code=404, detail="Voice not found")


def _split_sentences(text: str) -> tuple[list[str], str]:
    parts = SENTENCE_BOUNDARIES.split(text)
    sentences = []
    i = 0
    while i < len(parts):
        segment = parts[i]
        if i + 1 < len(parts) and SENTENCE_BOUNDARIES.fullmatch(parts[i + 1]):
            segment += parts[i + 1]
            i += 2
        else:
            i += 1
        if segment.strip():
            sentences.append(segment)
    return sentences, ""


async def _send_audio_chunks(ws: WebSocket, voice_id: str, text: str, style: str | None):
    try:
        async for pcm_chunk in tts_stream(text=text, voice=voice_id, style=style):
            data = base64.b64encode(pcm_chunk).decode("utf-8")
            await ws.send_text(json.dumps({"audio": data, "done": False}))
    except Exception as e:
        await ws.send_text(json.dumps({"error": str(e), "text": text, "done": False}))


@router.post("/stream_input")
async def tts_stream_input_http(request: Request):
    body = await request.body()
    lines = [l.strip() for l in body.decode("utf-8").split("\n") if l.strip()]

    voice_id: str = VOICES_INFO[VoicePreset.mimo_default.value]["voice_id"]
    style: str | None = None
    buffer = ""
    pending_sentences: list[str] = []

    for line in lines:
        msg = json.loads(line)
        if msg.get("voice"):
            preset = msg["voice"]
            if preset in VOICES_INFO:
                voice_id = VOICES_INFO[preset]["voice_id"]
        if msg.get("style") is not None:
            style = msg["style"]
        text_chunk = msg.get("text", "")
        done = msg.get("done", False)
        if text_chunk:
            buffer += text_chunk
        if done:
            if buffer.strip():
                pending_sentences.append(buffer)
                buffer = ""
        else:
            sentences, remaining = _split_sentences(buffer)
            buffer = remaining
            pending_sentences.extend(sentences)

    if buffer.strip():
        pending_sentences.append(buffer)

    async def event_generator():
        for sentence in pending_sentences:
            async for pcm_chunk in tts_stream(text=sentence, voice=voice_id, style=style):
                data = base64.b64encode(pcm_chunk).decode("utf-8")
                yield f"data: {json.dumps({'audio': data, 'done': False})}\n\n"
        yield f"data: {json.dumps({'audio': '', 'done': True})}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@router.websocket("/stream_input")
async def tts_stream_input_ws(websocket: WebSocket):
    await websocket.accept()

    voice_id: str = VOICES_INFO[VoicePreset.mimo_default.value]["voice_id"]
    style: str | None = None
    buffer = ""
    segment_tasks: list[asyncio.Task] = []

    try:
        while True:
            raw = await websocket.receive_text()
            msg = json.loads(raw)

            if msg.get("voice"):
                preset = msg["voice"]
                if preset in VOICES_INFO:
                    voice_id = VOICES_INFO[preset]["voice_id"]
            if msg.get("style") is not None:
                style = msg["style"]

            done = msg.get("done", False)
            text_chunk = msg.get("text", "")

            if text_chunk:
                buffer += text_chunk

            if not done:
                sentences, remaining = _split_sentences(buffer)
                buffer = remaining
                for sentence in sentences:
                    task = asyncio.create_task(
                        _send_audio_chunks(websocket, voice_id, sentence, style)
                    )
                    segment_tasks.append(task)
            else:
                if buffer.strip():
                    task = asyncio.create_task(
                        _send_audio_chunks(websocket, voice_id, buffer, style)
                    )
                    segment_tasks.append(task)
                    buffer = ""

    except WebSocketDisconnect:
        pass
    finally:
        if segment_tasks:
            await asyncio.gather(*segment_tasks, return_exceptions=True)
        try:
            await websocket.send_text(json.dumps({"audio": "", "done": True}))
            await websocket.close()
        except Exception:
            pass
