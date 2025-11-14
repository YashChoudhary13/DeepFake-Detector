from .database import SessionLocal
from . import crud
from .config import CELERY_BROKER_URL, CELERY_RESULT_BACKEND, USE_CELERY
import time

# Try to initialize Celery, fallback to None if Redis unavailable
celery = None
try:
    if USE_CELERY == "false":
        # Explicitly disabled, skip Celery
        celery = None
    elif USE_CELERY == "true":
        # Explicitly enabled, try to connect
        try:
            from celery import Celery
            celery = Celery(
                "tasks",
                broker=CELERY_BROKER_URL,
                backend=CELERY_RESULT_BACKEND,
            )
            # Test connection
            celery.control.inspect(timeout=1).active()
        except Exception as e:
            print(f"Warning: Celery/Redis not available: {e}. Using sync mode.")
            celery = None
    else:
        # Auto mode: try to use Celery if available, but don't fail if not
        try:
            from celery import Celery
            # Try to create Celery instance and test connection
            test_celery = Celery(
                "tasks",
                broker=CELERY_BROKER_URL,
                backend=CELERY_RESULT_BACKEND,
            )
            # Test if Redis is actually available
            test_celery.control.inspect(timeout=1).active()
            celery = test_celery
        except Exception:
            # Redis not available, use sync mode
            celery = None
except Exception as e:
    print(f"Warning: Could not initialize Celery: {e}. Using sync mode.")
    celery = None


def run_analysis_sync(job_id: int, file_path: str):
    """Synchronous version of run_analysis (for local dev without Redis)"""
    db = SessionLocal()
    try:
        # Update job status → processing
        crud.update_job_status(job_id, "processing", db)

        # Simulate heavy ML processing
        time.sleep(5)

        # Mock result
        crud.add_model_result(
            job_id=job_id,
            model_name="DummyModel",
            confidence_real=0.12,
            confidence_fake=0.88,
            label="fake",
            heatmap_path="N/A",
            db=db
        )

        crud.update_job_status(job_id, "completed", db)
    finally:
        db.close()


if celery:
    @celery.task
    def run_analysis(job_id: int, file_path: str):
        run_analysis_sync(job_id, file_path)
else:
    # No Celery available, use sync function directly
    def run_analysis(job_id: int, file_path: str):
        run_analysis_sync(job_id, file_path)
