import os
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    MIMO_API_KEY: str = ""
    MIMO_BASE_URL: str = "https://api.xiaomimimo.com/v1"
    TTS_MODEL: str = "mimo-v2.5-tts"
    SAMPLE_RATE: int = 24000
    HOST: str = "0.0.0.0"
    PORT: int = 8000

    model_config = {"env_prefix": "", "env_file": ".env"}


settings = Settings()
