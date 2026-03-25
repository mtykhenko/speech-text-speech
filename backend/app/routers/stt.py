"""Speech-to-Text API router."""

import os
import uuid
from typing import Optional, List
from pathlib import Path
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Depends, Query
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from app.models.database import get_db
from app.models.schemas import Transcription
from app.models.pydantic_schemas import (
    TranscriptionRequest,
    TranscriptionResponse,
    TranscriptionResultSchema,
    TranscriptionSegmentSchema,
    TranscriptionListResponse,
    ProvidersListResponse,
    ProviderInfo,
    HealthCheckResponse,
    ErrorResponse
)
from app.services.stt_service import get_stt_service
from app.utils.file_handling import validate_audio_file, save_uploaded_file


router = APIRouter()


@router.post(
    "/transcribe",
    response_model=TranscriptionResponse,
    responses={
        400: {"model": ErrorResponse},
        500: {"model": ErrorResponse}
    }
)
async def transcribe_audio(
    file: UploadFile = File(..., description="Audio file to transcribe"),
    provider: Optional[str] = Form(None, description="STT provider to use"),
    language: Optional[str] = Form(None, description="Language code (e.g., 'en', 'es')"),
    prompt: Optional[str] = Form(None, description="Optional text to guide the model"),
    temperature: Optional[float] = Form(0.0, description="Sampling temperature (0-1)"),
    response_format: Optional[str] = Form("verbose_json", description="Response format"),
    db: Session = Depends(get_db)
):
    """
    Transcribe an uploaded audio file to text.
    
    Supports multiple audio formats: MP3, WAV, FLAC, M4A, OGG, WEBM, etc.
    """
    try:
        # Get STT service
        stt_service = get_stt_service()
        
        # Get provider info for validation
        try:
            provider_info = stt_service.get_provider_info(provider) if provider else None
            if provider_info:
                max_size = provider_info["max_file_size"]
                supported_formats = provider_info["supported_formats"]
            else:
                # Use default provider
                default_provider = stt_service.default_provider
                provider_info = stt_service.get_provider_info(default_provider)
                max_size = provider_info["max_file_size"]
                supported_formats = provider_info["supported_formats"]
                provider = default_provider
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))
        
        # Validate file
        validation_error = validate_audio_file(
            file,
            max_size=max_size,
            allowed_formats=supported_formats
        )
        if validation_error:
            raise HTTPException(status_code=400, detail=validation_error)
        
        # Read file content
        audio_content = await file.read()
        
        # Save uploaded file
        storage_path = Path(os.getenv("AUDIO_STORAGE_PATH", "./storage/audio"))
        storage_path.mkdir(parents=True, exist_ok=True)
        
        file_id = str(uuid.uuid4())
        file_extension = Path(file.filename).suffix or ".audio"
        saved_path = storage_path / f"{file_id}{file_extension}"
        
        with open(saved_path, "wb") as f:
            f.write(audio_content)
        
        # Transcribe
        result = await stt_service.transcribe(
            audio_file=audio_content,
            provider=provider,
            language=language,
            prompt=prompt,
            temperature=temperature,
            response_format=response_format
        )
        
        # Save to database
        transcription = Transcription(
            audio_file_path=str(saved_path),
            text=result.text,
            language=result.language,
            confidence=str(result.confidence) if result.confidence else None,
            provider=provider or stt_service.default_provider,
            model=result.metadata.get("model", "unknown")
        )
        db.add(transcription)
        db.commit()
        db.refresh(transcription)
        
        # Build response
        segments = [
            TranscriptionSegmentSchema(
                text=seg.text,
                start=seg.start,
                end=seg.end,
                confidence=seg.confidence
            )
            for seg in result.segments
        ]
        
        return TranscriptionResponse(
            id=transcription.id,
            text=result.text,
            language=result.language,
            confidence=result.confidence,
            segments=segments,
            metadata=result.metadata,
            provider=transcription.provider,
            model=transcription.model,
            audio_file_path=transcription.audio_file_path,
            created_at=transcription.created_at
        )
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Transcription failed: {str(e)}")


@router.get(
    "/transcriptions/{transcription_id}",
    response_model=TranscriptionResponse,
    responses={404: {"model": ErrorResponse}}
)
async def get_transcription(
    transcription_id: int,
    db: Session = Depends(get_db)
):
    """
    Get a transcription by ID.
    """
    transcription = db.query(Transcription).filter(Transcription.id == transcription_id).first()
    
    if not transcription:
        raise HTTPException(status_code=404, detail="Transcription not found")
    
    return TranscriptionResponse(
        id=transcription.id,
        text=transcription.text,
        language=transcription.language or "unknown",
        confidence=float(transcription.confidence) if transcription.confidence else None,
        segments=[],
        metadata={},
        provider=transcription.provider,
        model=transcription.model,
        audio_file_path=transcription.audio_file_path,
        created_at=transcription.created_at
    )


@router.get(
    "/transcriptions",
    response_model=TranscriptionListResponse
)
async def list_transcriptions(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(10, ge=1, le=100, description="Items per page"),
    db: Session = Depends(get_db)
):
    """
    List all transcriptions with pagination.
    """
    offset = (page - 1) * page_size
    
    total = db.query(Transcription).count()
    transcriptions = db.query(Transcription)\
        .order_by(Transcription.created_at.desc())\
        .offset(offset)\
        .limit(page_size)\
        .all()
    
    items = [
        TranscriptionResponse(
            id=t.id,
            text=t.text,
            language=t.language or "unknown",
            confidence=float(t.confidence) if t.confidence else None,
            segments=[],
            metadata={},
            provider=t.provider,
            model=t.model,
            audio_file_path=t.audio_file_path,
            created_at=t.created_at
        )
        for t in transcriptions
    ]
    
    return TranscriptionListResponse(
        transcriptions=items,
        total=total,
        page=page,
        page_size=page_size
    )


@router.delete(
    "/transcriptions/{transcription_id}",
    responses={404: {"model": ErrorResponse}}
)
async def delete_transcription(
    transcription_id: int,
    db: Session = Depends(get_db)
):
    """
    Delete a transcription by ID.
    """
    transcription = db.query(Transcription).filter(Transcription.id == transcription_id).first()
    
    if not transcription:
        raise HTTPException(status_code=404, detail="Transcription not found")
    
    # Delete audio file if it exists
    audio_path = Path(transcription.audio_file_path)
    if audio_path.exists():
        audio_path.unlink()
    
    db.delete(transcription)
    db.commit()
    
    return {"message": "Transcription deleted successfully"}


@router.get(
    "/providers",
    response_model=ProvidersListResponse
)
async def list_providers():
    """
    List all available STT providers.
    """
    stt_service = get_stt_service()
    providers_info = stt_service.list_providers()
    
    providers = [
        ProviderInfo(
            name=p["name"],
            type=p["type"],
            is_default=p["is_default"],
            supported_formats=p["supported_formats"],
            max_file_size=p["max_file_size"]
        )
        for p in providers_info
    ]
    
    return ProvidersListResponse(
        providers=providers,
        default_provider=stt_service.default_provider
    )


@router.get(
    "/providers/{provider_name}",
    response_model=ProviderInfo,
    responses={404: {"model": ErrorResponse}}
)
async def get_provider_info(provider_name: str):
    """
    Get information about a specific STT provider.
    """
    try:
        stt_service = get_stt_service()
        info = stt_service.get_provider_info(provider_name)
        
        return ProviderInfo(
            name=info["name"],
            type=info["type"],
            is_default=info["is_default"],
            supported_formats=info["supported_formats"],
            max_file_size=info["max_file_size"]
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get(
    "/health",
    response_model=HealthCheckResponse
)
async def health_check(provider: Optional[str] = Query(None, description="Check specific provider")):
    """
    Check health of STT providers.
    """
    stt_service = get_stt_service()
    health_status = await stt_service.health_check(provider)
    
    overall_status = "healthy" if any(health_status.values()) else "unhealthy"
    
    return HealthCheckResponse(
        status=overall_status,
        providers=health_status
    )
