from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.config import settings
from app.routers import stt


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events"""
    # Startup
    print("Starting up Speech-to-Text & Text-to-Speech Platform...")
    yield
    # Shutdown
    print("Shutting down...")


app = FastAPI(
    title="Speech-to-Text & Text-to-Speech Platform",
    description="API for experimenting with various STT and TTS models",
    version="0.1.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Speech-to-Text & Text-to-Speech Platform API",
        "version": "0.1.0",
        "docs": "/docs"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "stt-tts-platform"
    }


# Include routers
app.include_router(stt.router, prefix="/api/v1/stt", tags=["Speech-to-Text"])

# TODO: Include remaining routers when implemented
# app.include_router(tts.router, prefix="/api/v1/tts", tags=["Text-to-Speech"])
# app.include_router(voice.router, prefix="/api/v1/voice", tags=["Voice Cloning"])
# app.include_router(config.router, prefix="/api/v1/config", tags=["Configuration"])
