#!/bin/bash
set -e

echo "Starting SkyBook Backend..."

# Run migrations
echo "Applying database migrations via Alembic..."
alembic upgrade head || echo "Alembic upgrade note: tables already created by lifespan or in sync"

# Start Uvicorn
echo "Launching FastAPI server..."
exec uvicorn app.main:app --host 0.0.0.0 --port 8000
