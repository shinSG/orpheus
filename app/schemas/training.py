from enum import Enum
from pydantic import BaseModel, Field
from datetime import datetime


class TrainingStatus(str, Enum):
    pending = "pending"
    preparing = "preparing"
    training = "training"
    evaluating = "evaluating"
    completed = "completed"
    failed = "failed"


class TrainingSample(BaseModel):
    id: str = Field(..., description="样本唯一标识")
    text: str = Field(..., min_length=1, max_length=5000, description="文本内容")
    audio_path: str = Field(..., description="音频文件路径")
    duration: float = Field(..., ge=0, description="音频时长（秒）")
    speaker_id: str | None = Field(default=None, description="说话人ID")
    created_at: datetime = Field(default_factory=datetime.now)


class TrainingConfig(BaseModel):
    base_model: str = Field(default="mimo-v2.5-tts", description="基础模型名称")
    learning_rate: float = Field(default=1e-4, ge=1e-6, le=1e-1, description="学习率")
    batch_size: int = Field(default=8, ge=1, le=64, description="批大小")
    epochs: int = Field(default=10, ge=1, le=100, description="训练轮数")
    max_duration: float = Field(default=30.0, ge=1.0, le=300.0, description="最大音频时长（秒）")
    min_duration: float = Field(default=0.5, ge=0.1, le=10.0, description="最小音频时长（秒）")
    sample_rate: int = Field(default=24000, description="采样率")
    output_dir: str = Field(default="training_output", description="输出目录")


class TrainingJob(BaseModel):
    id: str = Field(..., description="训练任务ID")
    status: TrainingStatus = Field(default=TrainingStatus.pending)
    config: TrainingConfig = Field(default_factory=TrainingConfig)
    samples_count: int = Field(default=0, description="训练样本数量")
    current_epoch: int = Field(default=0, description="当前轮次")
    total_epochs: int = Field(default=0, description="总轮次")
    loss: float | None = Field(default=None, description="当前损失值")
    progress: float = Field(default=0.0, ge=0.0, le=100.0, description="进度百分比")
    created_at: datetime = Field(default_factory=datetime.now)
    started_at: datetime | None = Field(default=None)
    completed_at: datetime | None = Field(default=None)
    error_message: str | None = Field(default=None)
    output_path: str | None = Field(default=None, description="训练输出路径")


class TrainingStartRequest(BaseModel):
    config: TrainingConfig = Field(default_factory=TrainingConfig, description="训练配置")
    sample_ids: list[str] = Field(default=[], description="指定训练样本ID列表，为空则使用所有样本")


class TrainingListResponse(BaseModel):
    jobs: list[TrainingJob]


class TrainingSampleListResponse(BaseModel):
    samples: list[TrainingSample]
    total: int


class TrainingStatsResponse(BaseModel):
    total_samples: int
    total_duration: float
    total_jobs: int
    completed_jobs: int
    failed_jobs: int
    active_jobs: int
