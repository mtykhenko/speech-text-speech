FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    ffmpeg \
    libsndfile1 \
    curl \
    netcat-openbsd \
    && rm -rf /var/lib/apt/lists/*

# Install uv via pip (more reliable in Docker)
RUN pip install --no-cache-dir uv

# Copy project files
COPY pyproject.toml .

# Sync dependencies with uv (creates virtual environment)
RUN uv sync --no-dev

# Copy entrypoint script first
COPY entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

# Copy application code
COPY . .

# Create necessary directories
RUN mkdir -p /app/tmp /app/storage

# Expose port
EXPOSE 8000

# Use entrypoint script
ENTRYPOINT ["/app/entrypoint.sh"]
