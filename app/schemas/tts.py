from enum import Enum
from pydantic import BaseModel, Field


class AudioFormat(str, Enum):
    wav = "wav"
    mp3 = "mp3"
    pcm16 = "pcm16"


class VoicePreset(str, Enum):
    mimo_default = "mimo_default"
    bingtang = "冰糖"
    molie = "茉莉"
    suda = "苏打"
    baihua = "白桦"
    mia = "Mia"
    chloe = "Chloe"
    milo = "Milo"
    dean = "Dean"


VOICES_INFO: dict[str, dict] = {
    "mimo_default": {"name": "MiMo-默认", "lang": "中文", "gender": "女性", "voice_id": "mimo_default"},
    "冰糖": {"name": "冰糖", "lang": "中文", "gender": "女性", "voice_id": "冰糖"},
    "茉莉": {"name": "茉莉", "lang": "中文", "gender": "女性", "voice_id": "茉莉"},
    "苏打": {"name": "苏打", "lang": "中文", "gender": "男性", "voice_id": "苏打"},
    "白桦": {"name": "白桦", "lang": "中文", "gender": "男性", "voice_id": "白桦"},
    "Mia": {"name": "Mia", "lang": "英文", "gender": "女性", "voice_id": "Mia"},
    "Chloe": {"name": "Chloe", "lang": "英文", "gender": "女性", "voice_id": "Chloe"},
    "Milo": {"name": "Milo", "lang": "英文", "gender": "男性", "voice_id": "Milo"},
    "Dean": {"name": "Dean", "lang": "英文", "gender": "男性", "voice_id": "Dean"},
}


class TTSRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=5000, description="要合成的文本")
    voice: VoicePreset = Field(default=VoicePreset.mimo_default, description="音色选择")
    style: str | None = Field(default=None, max_length=500, description="风格指令，如 (温柔) 或自然语言描述")
    format: AudioFormat = Field(default=AudioFormat.wav, description="输出音频格式")


class VoiceInfo(BaseModel):
    id: str
    name: str
    lang: str
    gender: str


class VoiceListResponse(BaseModel):
    voices: list[VoiceInfo]
