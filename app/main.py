from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.tts import router as tts_router
from app.api.training import router as training_router

app = FastAPI(
    title="MiMo TTS Service",
    description="基于 MiMo-V2.5-TTS 的语音合成服务，支持多种音色、流式输出和多格式",
    version="1.0.0",
)

# CORS 配置
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(tts_router)
app.include_router(training_router)


@app.get("/health")
async def health():
    return {"status": "ok"}
