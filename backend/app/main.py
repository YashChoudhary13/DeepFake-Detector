# app/main.py
from fastapi import (
    FastAPI,
    UploadFile,
    File,
    Depends,
    BackgroundTasks,
    HTTPException,
)
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from datetime import timedelta
import os
import uuid
from dotenv import load_dotenv

load_dotenv()

from .database import engine
from .models import Base, User
from . import crud
from .dependencies import get_db
from .tasks import run_analysis, run_analysis_sync, celery

# ---- LOCAL JWT AUTH (the good one) ----
from .auth import (
    authenticate_user,
    create_access_token,
    get_current_active_user,
    get_user_by_username,
    get_user_by_email,
    ACCESS_TOKEN_EXPIRE_MINUTES,
)
from .schemas_auth import UserCreate, UserResponse, Token, LoginRequest

from .support import router as support_router
from .payments import router as payments_router


# -------------------------------------
# INIT
# -------------------------------------
Base.metadata.create_all(bind=engine)
app = FastAPI(title="DeepVerify API")


# -------------------------------------
# CORS
# -------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # adjust in production
    allow_methods=["*"],
    allow_headers=["*"],
    allow_credentials=True,
)


# -------------------------------------
# FILE SETUP
# -------------------------------------
backend_dir = os.path.dirname(os.path.dirname(__file__))

UPLOAD_DIR = os.path.abspath(os.path.join(backend_dir, "..", "data", "uploads"))
os.makedirs(UPLOAD_DIR, exist_ok=True)

HEATMAP_DIR = os.path.abspath(os.path.join(backend_dir, "..", "data", "heatmaps"))
os.makedirs(HEATMAP_DIR, exist_ok=True)


@app.get("/")
def root():
    return {"message": "DeepVerify backend running"}


# =================================================================
# AUTHENTICATION — LOCAL FASTAPI JWT SYSTEM (CORRECT + CLEAN)
# =================================================================

@app.post("/api/auth/register", response_model=UserResponse)
def register(user_data: UserCreate, db: Session = Depends(get_db)):
    if get_user_by_username(db, user_data.username):
        raise HTTPException(status_code=400, detail="Username already registered")

    if get_user_by_email(db, user_data.email):
        raise HTTPException(status_code=400, detail="Email already registered")

    user = crud.create_user(
        username=user_data.username,
        email=user_data.email,
        password=user_data.password,
        db=db,
    )
    return user


@app.post("/api/auth/login", response_model=Token)
def login(login_data: LoginRequest, db: Session = Depends(get_db)):
    user = authenticate_user(db, login_data.username, login_data.password)
    if not user:
        raise HTTPException(status_code=401, detail="Incorrect username or password")

    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)

    access_token = create_access_token(
        data={"sub": user.username},
        expires_delta=access_token_expires,
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": UserResponse(
            id=user.id,
            username=user.username,
            email=user.email,
            is_active=user.is_active,
            created_at=user.created_at,
        ),
    }


@app.get("/api/auth/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_active_user)):
    return current_user


# =================================================================
# UPLOAD — MUST BE LOGGED IN
# =================================================================

@app.post("/api/upload")
@app.post("/upload")
async def upload_image(
    file: UploadFile = File(...),
    background_tasks: BackgroundTasks = BackgroundTasks(),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    try:
        filename = file.filename or "upload"
        ext = os.path.splitext(filename)[1] or ".jpg"

        image_id = uuid.uuid4().hex
        save_path = os.path.join(UPLOAD_DIR, f"{image_id}{ext}")

        content = await file.read()
        with open(save_path, "wb") as f:
            f.write(content)

        job = crud.create_job(
            img_id=image_id,
            filename=save_path,
            db=db,
            user_id=current_user.id,
        )

        # Prefer Celery if available
        if celery:
            try:
                run_analysis.delay(job.id, save_path)
            except Exception:
                background_tasks.add_task(run_analysis_sync, job.id, save_path)
        else:
            background_tasks.add_task(run_analysis_sync, job.id, save_path)

        return {"jobId": job.id}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload error: {str(e)}")


# =================================================================
# JOB TRANSFORM
# =================================================================

def transform_job_for_frontend(job):
    consensus = None

    if job.results:
        labels = [r.label for r in job.results]
        fake_count = labels.count("fake")
        real_count = labels.count("real")

        if fake_count > real_count:
            decision = "FAKE"
            avg_conf = sum(r.confidence_fake for r in job.results) / len(job.results)
        elif real_count > fake_count:
            decision = "REAL"
            avg_conf = sum(r.confidence_real for r in job.results) / len(job.results)
        else:
            decision = "UNCERTAIN"
            avg_conf = 0.5

        consensus = {
            "decision": decision,
            "score": avg_conf,
            "explanation": [
                f"{len(job.results)} model(s) analyzed",
                f"Majority vote: {decision.lower()}",
            ],
        }
    else:
        consensus = {
            "decision": "PENDING",
            "score": 0.0,
            "explanation": ["Analysis in progress..."],
        }

    models = []
    if job.results:
        for result in job.results:
            score = (
                result.confidence_fake
                if result.label == "fake"
                else result.confidence_real
            )

            heatmap_url = None
            if result.heatmap_path and os.path.exists(result.heatmap_path):
                fname = os.path.basename(result.heatmap_path)
                heatmap_url = f"http://localhost:8000/api/heatmaps/{fname}"

            img_url = None
            if job.file_path and os.path.exists(job.file_path):
                fname = os.path.basename(job.file_path)
                img_url = f"http://localhost:8000/api/uploads/{fname}"

            models.append(
                {
                    "model_name": result.model_name,
                    "version": "1.0",
                    "score": score,
                    "heatmap_url": heatmap_url,
                    "image_url": img_url,
                    "labels": {
                        "confidence_real": result.confidence_real,
                        "confidence_fake": result.confidence_fake,
                        "label": result.label,
                    },
                }
            )

    image = None
    if job.file_path and os.path.exists(job.file_path):
        fname = os.path.basename(job.file_path)
        image = {"thumbnail_url": f"http://localhost:8000/api/uploads/{fname}"}

    return {
        "job_id": job.id,
        "id": job.id,
        "image_id": getattr(job, "image_id", None),
        "file_path": job.file_path,
        "status": job.status,
        "created_at": job.created_at.isoformat(),
        "models": models,
        "consensus": consensus,
        "image": image,
    }


# =================================================================
# GET JOB
# =================================================================

@app.get("/api/jobs/{job_id}")
@app.get("/jobs/{job_id}")
def get_job(job_id: int, db: Session = Depends(get_db)):
    job = crud.get_job(job_id, db)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return transform_job_for_frontend(job)


# =================================================================
# DASHBOARD (AUTH REQUIRED)
# =================================================================

@app.get("/api/dashboard")
@app.get("/dashboard")
def dashboard(current_user: User = Depends(get_current_active_user), db: Session = Depends(get_db)):
    jobs = crud.get_recent_jobs(db, user_id=current_user.id)
    return [transform_job_for_frontend(job) for job in jobs]


# =================================================================
# FILE SERVING
# =================================================================

@app.get("/api/uploads/{filename}")
def get_uploaded_file(filename: str):
    file_path = os.path.join(UPLOAD_DIR, filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(file_path)


@app.get("/api/heatmaps/{filename}")
def get_heatmap_file(filename: str):
    file_path = os.path.join(HEATMAP_DIR, filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Heatmap not found")
    return FileResponse(file_path)


app.include_router(support_router)
app.include_router(payments_router)
