# app/analysis.py
import uuid, os, time, json
from fastapi import APIRouter, UploadFile, File, BackgroundTasks, HTTPException
from datetime import datetime
from .db import save_job, update_job_result  # implement DB helpers
from .models_interface import run_models_on_image  # see below

router = APIRouter()

UPLOAD_DIR = os.getenv("UPLOAD_DIR", "/tmp/deepverify/uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/analyze", status_code=202)
async def analyze_image(background_tasks: BackgroundTasks, file: UploadFile = File(...), user_id: str | None = None):
    # validate content type
    if file.content_type not in ("image/png","image/jpeg","image/jpg"):
        raise HTTPException(400, "Invalid image type")

    job_id = str(uuid.uuid4())
    filename = f"{job_id}_{file.filename}"
    file_path = os.path.join(UPLOAD_DIR, filename)
    with open(file_path, "wb") as fh:
        fh.write(await file.read())

    # persist initial job
    job_record = {
        "job_id": job_id,
        "status": "queued",
        "created_at": datetime.utcnow().isoformat(),
        "image_path": file_path,
        "user_id": user_id,
    }
    save_job(job_record)

    # run in background (non-blocking)
    background_tasks.add_task(process_job, job_id, file_path)
    return {"job_id": job_id, "status": "queued"}

async def process_job(job_id: str, file_path: str):
    # run models and persist results
    try:
        results = await run_models_on_image(file_path)
        # results: list of {name,version,confidence,verdict,time_ms,heatmap_path}
        # persist each model result and consensus
        update_job_result(job_id, results)
    except Exception as e:
        update_job_result(job_id, [], error=str(e))
