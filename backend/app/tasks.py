# app/tasks.py
import traceback
import asyncio
import os
from .database import SessionLocal
from . import crud
from .config import CELERY_BROKER_URL, CELERY_RESULT_BACKEND, USE_CELERY
from .models_interface import run_models_on_image  # must return {"models": [...], "consensus": {...}}
from datetime import datetime

# Try to initialize Celery, fallback to None if Redis unavailable
celery = None
try:
    if USE_CELERY == "false":
        celery = None
    elif USE_CELERY == "true":
        try:
            from celery import Celery
            celery = Celery(
                "tasks",
                broker=CELERY_BROKER_URL,
                backend=CELERY_RESULT_BACKEND,
            )
            # Quick health check; may raise if Redis not reachable
            celery.control.inspect(timeout=1).active()
        except Exception as e:
            print(f"Warning: Celery/Redis not available: {e}. Using sync mode.")
            celery = None
    else:
        # auto mode: try to use Celery but don't crash
        try:
            from celery import Celery
            test_celery = Celery(
                "tasks",
                broker=CELERY_BROKER_URL,
                backend=CELERY_RESULT_BACKEND,
            )
            test_celery.control.inspect(timeout=1).active()
            celery = test_celery
        except Exception:
            celery = None
except Exception as e:
    print(f"Warning: Could not initialize Celery: {e}. Using sync mode.")
    celery = None


def _get_db():
    return SessionLocal()


def run_analysis_sync(job_id: int, file_path: str):
    """
    Synchronous worker for local dev. This:
      1. marks job 'processing'
      2. runs models via run_models_on_image (async -> run with asyncio.run)
      3. saves each model result via crud.add_model_result
      4. marks job 'completed' (or 'failed' on error)
    """
    db = _get_db()
    try:
        print(f"[tasks] Starting analysis job_id={job_id}, file={file_path}")
        # 1) mark job processing
        crud.update_job_status(job_id, "processing", db)

        # 2) run the model pipeline (models_interface returns structured results)
        try:
            results = asyncio.run(run_models_on_image(file_path, job_id)) \
                if callable(run_models_on_image) else asyncio.run(run_models_on_image(file_path))
        except TypeError:
            # fallback if run_models_on_image signature is (file_path,) not (file_path, job_id)
            results = asyncio.run(run_models_on_image(file_path))

        if not results or "models" not in results:
            raise RuntimeError("Model runner returned unexpected result")

        # 3) persist per-model results
        for m in results["models"]:
            # expect m contains keys: name, version, confidence_real, confidence_fake, label, time_ms, heatmap_path
            crud.add_model_result(
                job_id=job_id,
                model_name=m.get("name") or m.get("model_name") or "unknown",
                confidence_real=float(m.get("confidence_real", m.get("confidence", 0.0))),
                confidence_fake=float(m.get("confidence_fake", 1.0 - float(m.get("confidence", 0.0)))),
                label=m.get("label", "unknown"),
                heatmap_path=m.get("heatmap_path", "N/A"),
                db=db,
            )

        # 4) mark job completed
        crud.update_job_status(job_id, "completed", db)
        print(f"[tasks] Completed job_id={job_id}")

    except Exception as e:
        # log and mark failed
        print(f"[tasks] Error processing job_id={job_id}: {e}")
        traceback.print_exc()
        try:
            crud.update_job_status(job_id, "failed", db)
        except Exception:
            pass
    finally:
        db.close()


# Celery task wrapper (keeps same function signature). If celery is None we still define run_analysis as alias.
if celery:
    @celery.task(bind=True, name="run_analysis")
    def run_analysis(self, job_id: int, file_path: str):
        return run_analysis_sync(job_id, file_path)
else:
    def run_analysis(job_id: int, file_path: str):
        return run_analysis_sync(job_id, file_path)
