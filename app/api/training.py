import os
import shutil
import uuid
from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from app.schemas.training import (
    TrainingStartRequest,
    TrainingJob,
    TrainingSample,
    TrainingListResponse,
    TrainingSampleListResponse,
    TrainingStatsResponse,
    TrainingStatus,
)
from app.services.training import (
    list_samples,
    get_sample,
    add_sample,
    delete_sample,
    list_jobs,
    get_job,
    create_job,
    start_training_job,
    cancel_training_job,
    get_training_stats,
)
from app.core.config import settings

router = APIRouter(prefix="/api/v1/training", tags=["Training"])

UPLOAD_DIR = "training_data/uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.post("/samples", response_model=TrainingSample)
async def upload_sample(
    file: UploadFile = File(...),
    text: str = Form(...),
    speaker_id: str | None = Form(None),
):
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")

    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in (".wav", ".mp3", ".flac", ".ogg"):
        raise HTTPException(status_code=400, detail="Unsupported audio format")

    file_id = str(uuid.uuid4())
    file_path = os.path.join(UPLOAD_DIR, f"{file_id}{ext}")

    with open(file_path, "wb") as f:
        shutil.copyfileobj(file.file, f)

    sample = add_sample(text=text, audio_path=file_path, speaker_id=speaker_id)
    return sample


@router.get("/samples", response_model=TrainingSampleListResponse)
async def get_samples():
    samples = list_samples()
    return TrainingSampleListResponse(samples=samples, total=len(samples))


@router.get("/samples/{sample_id}", response_model=TrainingSample)
async def get_sample_detail(sample_id: str):
    sample = get_sample(sample_id)
    if not sample:
        raise HTTPException(status_code=404, detail="Sample not found")
    return sample


@router.delete("/samples/{sample_id}")
async def delete_sample_endpoint(sample_id: str):
    sample = get_sample(sample_id)
    if not sample:
        raise HTTPException(status_code=404, detail="Sample not found")

    if os.path.exists(sample.audio_path):
        os.remove(sample.audio_path)

    delete_sample(sample_id)
    return {"message": "Sample deleted"}


@router.post("/jobs", response_model=TrainingJob)
async def create_training_job(req: TrainingStartRequest):
    job = create_job(config=req.config, sample_ids=req.sample_ids or None)
    return job


@router.get("/jobs", response_model=TrainingListResponse)
async def get_training_jobs():
    jobs = list_jobs()
    return TrainingListResponse(jobs=jobs)


@router.get("/jobs/{job_id}", response_model=TrainingJob)
async def get_training_job(job_id: str):
    job = get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job


@router.post("/jobs/{job_id}/start")
async def start_job(job_id: str):
    job = get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    if job.status not in (TrainingStatus.pending, TrainingStatus.failed):
        raise HTTPException(status_code=400, detail="Job cannot be started")

    started = await start_training_job(job_id)
    if not started:
        raise HTTPException(status_code=400, detail="Job already running")
    return {"message": "Training started"}


@router.post("/jobs/{job_id}/cancel")
async def cancel_job(job_id: str):
    job = get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    cancelled = cancel_training_job(job_id)
    if not cancelled:
        raise HTTPException(status_code=400, detail="Job not running")
    return {"message": "Training cancelled"}


@router.get("/stats", response_model=TrainingStatsResponse)
async def get_stats():
    stats = get_training_stats()
    return TrainingStatsResponse(**stats)
