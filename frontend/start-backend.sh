#!/bin/bash
# Script to start the backend from the frontend directory

cd "$(dirname "$0")/../deepfake-backend/backend"

# Check if Python is available
if ! command -v python3 &> /dev/null; then
    echo "Error: python3 not found. Please install Python 3.10+"
    exit 1
fi

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
    source venv/bin/activate
    pip install --upgrade pip
    pip install -r requirements.txt
fi

# Activate virtual environment
source venv/bin/activate

# Create data directories if they don't exist
mkdir -p ../data/uploads
mkdir -p ../data/heatmaps

# Set environment variables for local development
export USE_CELERY=false
export DATABASE_URL="sqlite:///./deepfake.db"

# Run the server
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

