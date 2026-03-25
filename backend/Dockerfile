FROM python:3.11-slim

WORKDIR /app

# Install system dependencies and uv
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    ffmpeg \
    libsndfile1 \
    curl \
    && rm -rf /var/lib/apt/lists/* \
    && curl -LsSf https://astral.sh/uv/install.sh | sh

# Add uv to PATH
ENV PATH="/root/.cargo/bin:${PATH}"

# Copy project files
COPY pyproject.toml .

# Sync dependencies with uv (creates virtual environment)
RUN uv sync --no-dev

# Copy application code
COPY . .

# Create necessary directories
RUN mkdir -p /app/tmp /app/storage

# Expose port
EXPOSE 8000

# Run the application using uv's virtual environment
CMD ["uv", "run", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
