#!/bin/bash
set -e

echo "Starting Speech-to-Text & Text-to-Speech Platform..."

# Wait for PostgreSQL to be ready
echo "Waiting for PostgreSQL..."
while ! nc -z postgres 5432; do
  sleep 0.1
done
echo "PostgreSQL is ready!"

# Run database migrations
echo "Running database migrations..."
cd /app
.venv/bin/alembic upgrade head

echo "Starting application..."
# Start the application
exec uv run uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
