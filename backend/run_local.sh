#!/bin/bash
# Local development startup script for DeepFake backend

cd "$(dirname "$0")"

echo "Starting DeepFake Backend (Local Development Mode)"
echo "=================================================="
echo ""

# Check if Python is available
if ! command -v python3 &> /dev/null; then
    echo "Error: python3 not found. Please install Python 3.10+"
    exit 1
fi

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "Activating virtual environment..."
source venv/bin/activate

# Install dependencies
echo "Installing dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

# Create data directory if it doesn't exist
mkdir -p ../data/uploads
mkdir -p ../data/heatmaps

# Set environment variables for local development
export USE_CELERY=false  # Disable Celery for local dev (no Redis needed)
export DATABASE_URL="sqlite:///./deepfake.db"

echo ""
echo "Starting FastAPI server on http://localhost:8000"
echo "Press Ctrl+C to stop"
echo ""

# Run the server
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

