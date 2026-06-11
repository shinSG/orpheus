from fastapi import FastAPI
from app.api.tts import router as tts_router

app = FastAPI(
    title="MiMo TTS Service",
    description="基于 MiMo-V2.5-TTS 的语音合成服务，支持多种音色、流式输出和多格式",
    version="1.0.0",
)

app.include_router(tts_router)


@app.get("/health")
async def health():
    return {"status": "ok"}
