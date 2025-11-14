# DeepFake Backend

FastAPI backend for DeepFake detection service.

## Quick Start (Local Development)

### Option 1: Using the startup script
```bash
cd backend
./run_local.sh
```

### Option 2: Manual setup
```bash
cd backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set environment variables (optional, defaults work for local dev)
export USE_CELERY=false
export DATABASE_URL="sqlite:///./deepfake.db"

# Start server
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

The backend will be available at `http://localhost:8000`

## Docker Setup

If you prefer using Docker:

```bash
cd deepfake-backend
sudo docker compose up -d --build
```

## Configuration

### Environment Variables

- `DATABASE_URL`: Database connection string (default: SQLite for local, PostgreSQL for Docker)
- `USE_CELERY`: Set to "false" to disable Celery (default: "auto")
- `REDIS_URL`: Redis connection URL (default: localhost for local, redis:6379 for Docker)
- `CELERY_BROKER_URL`: Celery broker URL
- `CELERY_RESULT_BACKEND`: Celery result backend URL

### Local Development

- Uses SQLite database (no PostgreSQL needed)
- Celery is optional (tasks run synchronously if Redis unavailable)
- All data stored in `../data/` directory

## API Endpoints

- `GET /` - Health check
- `POST /upload` - Upload image for analysis
- `GET /jobs/{job_id}` - Get job status and results
- `GET /dashboard` - Get recent jobs

## Notes

- The backend automatically detects if it's running in Docker or locally
- For local development, SQLite is used (no database setup needed)
- Celery/Redis is optional for local dev - tasks run synchronously if unavailable

