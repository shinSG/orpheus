"""
测试流式输入接口：WebSocket 和 POST NDJSON 两种方式。
用法:
    python test_stream_input.py ws              # WebSocket（真实 API，需有效 API Key）
    python test_stream_input.py post            # POST NDJSON（真实 API）
    python test_stream_input.py ws --mock       # WebSocket（内置 mock 服务器，无需 API Key）
    python test_stream_input.py post --mock     # POST NDJSON（内置 mock 服务器）

需要安装: pip install websockets httpx
"""
import asyncio
import json
import math
import signal
import sys
import time
import base64
import threading
import uvicorn

import websockets
import httpx

CHUNKS = [
    {"text": "你好世界，", "voice": "冰糖"},
    {"text": "今天天气真好。"},
    {"text": "我们去公园散步吧！"},
    {"text": "", "done": True},
]


def make_mock_pcm(text: str) -> bytes:
    sample_rate = 24000
    duration = min(0.3, 0.05 * len(text))
    n_samples = int(sample_rate * duration)
    freq = 440
    pcm = bytearray()
    for i in range(n_samples):
        val = int(16000 * math.sin(2 * math.pi * freq * i / sample_rate))
        pcm += val.to_bytes(2, byteorder="little", signed=True)
    return bytes(pcm)


def encode_audio(b64_data: str) -> dict:
    raw = base64.b64decode(b64_data)
    return {"bytes": len(raw), "samples": len(raw) // 2}


def start_mock_server(port: int = 8099) -> threading.Thread:
    import app.services.mimo_tts as tts_mod

    original_tts_stream = tts_mod.tts_stream
    original_tts_sync = tts_mod.tts_sync

    async def mock_tts_stream(text, voice, style=None):
        pcm = make_mock_pcm(text)
        yield pcm

    async def mock_tts_sync(text, voice, fmt, style=None):
        return make_mock_pcm(text)

    tts_mod.tts_stream = mock_tts_stream
    tts_mod.tts_sync = mock_tts_sync

    from fastapi import FastAPI
    from fastapi.middleware.cors import CORSMiddleware
    from app.api.tts import router as tts_router

    test_app = FastAPI(title="Mock TTS")
    test_app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    test_app.include_router(tts_router)

    config = uvicorn.Config(test_app, host="127.0.0.1", port=port, log_level="warning")
    server = uvicorn.Server(config)

    thread = threading.Thread(target=server.run, daemon=True)
    thread.start()

    import time as _time
    for _ in range(30):
        if server.started:
            break
        _time.sleep(0.1)

    return thread, server, (original_tts_stream, original_tts_sync), (tts_mod,)


async def test_websocket(base_url: str, mock: bool = False):
    label = "WebSocket Mock" if mock else "WebSocket"
    print(f"=== {label} 测试 ===")
    audio_chunks = 0
    total_bytes = 0
    start = time.time()
    ws_url = base_url.replace("http://", "ws://") + "/api/v1/tts/stream_input"

    async with websockets.connect(ws_url) as ws:
        async def ws_sender():
            for chunk in CHUNKS:
                await ws.send(json.dumps(chunk))
                print(f"  -> 发送: {chunk}")
                await asyncio.sleep(0.1)
            print("  -> 所有消息已发送")

        async def ws_receiver():
            nonlocal audio_chunks, total_bytes
            try:
                while True:
                    resp = await asyncio.wait_for(ws.recv(), timeout=15)
                    msg = json.loads(resp)
                    if msg.get("error"):
                        print(f"  <- 错误: {msg['error']}")
                        break
                    if msg["done"]:
                        print("  <- 收到: done")
                        break
                    stats = encode_audio(msg["audio"])
                    audio_chunks += 1
                    total_bytes += stats["bytes"]
                    print(f"  <- 收到: 音频块 {audio_chunks} ({stats['bytes']} bytes)")
            except asyncio.TimeoutError:
                print("  ! 接收超时")
            except websockets.ConnectionClosed:
                print("  <- 连接已关闭")

        send_task = asyncio.create_task(ws_sender())
        await ws_receiver()
        await send_task

    elapsed = time.time() - start
    ok = audio_chunks > 0
    status = "PASS" if ok else "FAIL"
    print(f"\n[{status}] {audio_chunks} 个音频块, {total_bytes} bytes, 耗时 {elapsed:.2f}s")
    return ok


async def test_post_ndjson(base_url: str, mock: bool = False):
    label = "POST NDJSON Mock" if mock else "POST NDJSON"
    print(f"=== {label} 测试 ===")
    audio_chunks = 0
    total_bytes = 0
    start = time.time()

    body = "\n".join(json.dumps(c) for c in CHUNKS)

    async with httpx.AsyncClient(timeout=60) as client:
        async with client.stream("POST", base_url + "/api/v1/tts/stream_input",
                                 content=body,
                                 headers={"Content-Type": "application/x-ndjson"}) as resp:
            print(f"  状态码: {resp.status_code}")
            async for line in resp.aiter_lines():
                if not line.startswith("data: "):
                    continue
                payload = json.loads(line[6:])
                if payload["done"]:
                    print("  <- 收到: done")
                    break
                stats = encode_audio(payload["audio"])
                audio_chunks += 1
                total_bytes += stats["bytes"]
                print(f"  <- 收到: 音频块 {audio_chunks} ({stats['bytes']} bytes)")

    elapsed = time.time() - start
    ok = audio_chunks > 0
    status = "PASS" if ok else "FAIL"
    print(f"\n[{status}] {audio_chunks} 个音频块, {total_bytes} bytes, 耗时 {elapsed:.2f}s")
    return ok


async def main():
    mock = "--mock" in sys.argv
    args = [a for a in sys.argv[1:] if a != "--mock"]
    mode = args[0] if args else "ws"

    if mock:
        thread, server, originals, mods = start_mock_server()
        base_url = "http://127.0.0.1:8099"
        print(f"Mock 服务器已启动: {base_url}\n")
    else:
        base_url = "http://localhost:8000"

    try:
        if mode == "ws":
            ok = await test_websocket(base_url, mock=mock)
        elif mode == "post":
            ok = await test_post_ndjson(base_url, mock=mock)
        else:
            print(f"未知模式: {mode}，用法: python test_stream_input.py [ws|post] [--mock]")
            sys.exit(1)
    finally:
        if mock:
            tts_mod = mods[0]
            tts_mod.tts_stream = originals[0]
            tts_mod.tts_sync = originals[1]
            server.should_exit = True

    sys.exit(0 if ok else 1)


if __name__ == "__main__":
    asyncio.run(main())
