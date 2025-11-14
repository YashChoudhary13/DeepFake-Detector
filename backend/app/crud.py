from sqlalchemy.orm import Session
from . import models
from .auth import get_password_hash


def create_user(username: str, email: str, password: str, db: Session):
    """Create a new user"""
    hashed_password = get_password_hash(password)
    user = models.User(
        username=username,
        email=email,
        hashed_password=hashed_password
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def create_job(img_id: str, filename: str, db: Session, user_id: int = None):
    job = models.Job(image_id=img_id, file_path=filename, user_id=user_id)
    db.add(job)
    db.commit()
    db.refresh(job)
    return job


def get_job(job_id: int, db: Session):
    return (
        db.query(models.Job)
        .filter(models.Job.id == job_id)
        .first()
    )


def get_recent_jobs(db: Session, user_id: int = None):
    """Get recent jobs, optionally filtered by user"""
    query = db.query(models.Job)
    if user_id:
        query = query.filter(models.Job.user_id == user_id)
    return (
        query
        .order_by(models.Job.created_at.desc())
        .limit(20)
        .all()
    )


def add_model_result(job_id, model_name, confidence_real,
                     confidence_fake, label, heatmap_path, db: Session):

    result = models.ModelResult(
        job_id=job_id,
        model_name=model_name,
        confidence_real=confidence_real,
        confidence_fake=confidence_fake,
        label=label,
        heatmap_path=heatmap_path,
    )
    db.add(result)
    db.commit()
    db.refresh(result)
    return result


def update_job_status(job_id, status, db: Session):
    job = db.query(models.Job).filter(models.Job.id == job_id).first()
    if job:
        job.status = status
        db.commit()
        db.refresh(job)
    return job
