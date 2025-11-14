import os
from dotenv import load_dotenv

load_dotenv()

# Detect if running in Docker or locally
IS_DOCKER = os.path.exists("/.dockerenv") or os.getenv("DOCKER_ENV") == "1"

# DATABASE
# Priority: Environment variable > Docker default > SQLite local
# For Railway: Set DATABASE_URL environment variable (PostgreSQL)
# For Local: Uses SQLite by default (no setup needed)
DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    # Auto-detect: Docker or Local
    if IS_DOCKER:
        # Docker default (PostgreSQL)
        DATABASE_URL = "postgresql+psycopg2://postgres:postgres@db:5432/deepfake"
    else:
        # Local development (SQLite - no setup needed)
        DATABASE_URL = "sqlite:///./deepfake.db"

# REDIS / CELERY
# For local dev, try localhost Redis, fallback to None (sync mode)
if IS_DOCKER:
    REDIS_URL = os.getenv("REDIS_URL", "redis://redis:6379/0")
    CELERY_BROKER_URL = os.getenv("CELERY_BROKER_URL", "redis://redis:6379/0")
    CELERY_RESULT_BACKEND = os.getenv("CELERY_RESULT_BACKEND", "redis://redis:6379/1")
else:
    REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    CELERY_BROKER_URL = os.getenv("CELERY_BROKER_URL", "redis://localhost:6379/0")
    CELERY_RESULT_BACKEND = os.getenv("CELERY_RESULT_BACKEND", "redis://localhost:6379/1")

# Check if Redis is available (for local dev)
# Default to "false" for local development (no Redis needed)
USE_CELERY = os.getenv("USE_CELERY", "false")  # auto, true, false
