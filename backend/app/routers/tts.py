"""Text-to-Speech API router."""

import logging
from typing import Optional, List
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Depends
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field

from ..services.tts_service import TTSService
from ..utils.document_processing import DocumentProcessor
from ..config import get_settings

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/tts", tags=["tts"])

# Pydantic models for request/response
class GenerateSpeechRequest(BaseModel):
    """Request model for generating speech from text."""
    text: str = Field(..., min_length=1, max_length=50000, description="Text to convert to speech")
    provider: Optional[str] = Field(None, description="TTS provider to use")
    voice_id: Optional[str] = Field(None, description="Voice identifier")
    output_format: str = Field("mp3", description="Audio output format")
    speed: Optional[float] = Field(None, ge=0.25, le=4.0, description="Speech speed (0.25-4.0)")
    model: Optional[str] = Field(None, description="Model to use (provider-specific)")


class GenerationResponse(BaseModel):
    """Response model for speech generation."""
    id: str
    audio_url: str
    text: str
    provider: str
    voice_id: Optional[str]
    format: str
    size: int
    created_at: str
    chunk_index: Optional[int] = None
    total_chunks: Optional[int] = None


class VoiceInfo(BaseModel):
    """Voice information model."""
    id: str
    name: str
    description: Optional[str] = None


class HealthCheckResponse(BaseModel):
    """Health check response model."""
    providers: dict[str, bool]


# Dependency to get TTS service
def get_tts_service() -> TTSService:
    """Get TTS service instance."""
    settings = get_settings()
    tts_config = settings.TTS_CONFIG
    return TTSService(tts_config)


@router.post("/generate", response_model=GenerationResponse)
async def generate_speech(
    request: GenerateSpeechRequest,
    tts_service: TTSService = Depends(get_tts_service)
):
    """
    Generate speech from text.
    
    Args:
        request: Speech generation request
        tts_service: TTS service instance
    
    Returns:
        Generation response with audio URL
    
    Raises:
        HTTPException: If generation fails
    """
    try:
        logger.info(f"Generating speech: provider={request.provider}, length={len(request.text)}")
        
        # Prepare kwargs
        kwargs = {}
        if request.speed is not None:
            kwargs["speed"] = request.speed
        if request.model is not None:
            kwargs["model"] = request.model
        
        # Generate speech
        result = await tts_service.generate_speech(
            text=request.text,
            provider=request.provider,
            voice_id=request.voice_id,
            output_format=request.output_format,
            **kwargs
        )
        
        return GenerationResponse(**result)
    
    except ValueError as e:
        logger.error(f"Validation error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error generating speech: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to generate speech: {str(e)}")


@router.post("/generate-document", response_model=List[GenerationResponse])
async def generate_speech_from_document(
    file: UploadFile = File(..., description="Document file (TXT, PDF, DOCX)"),
    provider: Optional[str] = Form(None, description="TTS provider to use"),
    voice_id: Optional[str] = Form(None, description="Voice identifier"),
    output_format: str = Form("mp3", description="Audio output format"),
    speed: Optional[float] = Form(None, ge=0.25, le=4.0, description="Speech speed"),
    model: Optional[str] = Form(None, description="Model to use"),
    tts_service: TTSService = Depends(get_tts_service)
):
    """
    Generate speech from a document file.
    
    Supports TXT, PDF, and DOCX files. Long documents are automatically
    split into chunks and processed separately.
    
    Args:
        file: Document file to process
        provider: TTS provider to use
        voice_id: Voice identifier
        output_format: Audio output format
        speed: Speech speed
        model: Model to use
        tts_service: TTS service instance
    
    Returns:
        List of generation responses (one per chunk if document is long)
    
    Raises:
        HTTPException: If processing fails
    """
    try:
        # Validate file format
        if not DocumentProcessor.is_supported_format(file.filename):
            raise ValueError(
                f"Unsupported file format. Supported formats: {DocumentProcessor.get_supported_formats()}"
            )
        
        logger.info(f"Processing document: {file.filename}")
        
        # Read file content
        file_content = await file.read()
        
        # Extract text from document
        text = await DocumentProcessor.extract_text(
            file_content=file_content,
            filename=file.filename
        )
        
        logger.info(f"Extracted {len(text)} characters from {file.filename}")
        
        # Prepare kwargs
        kwargs = {}
        if speed is not None:
            kwargs["speed"] = speed
        if model is not None:
            kwargs["model"] = model
        
        # Generate speech (handles chunking automatically)
        results = await tts_service.generate_speech_from_document(
            text=text,
            provider=provider,
            voice_id=voice_id,
            output_format=output_format,
            **kwargs
        )
        
        return [GenerationResponse(**result) for result in results]
    
    except ValueError as e:
        logger.error(f"Validation error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error processing document: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to process document: {str(e)}")


@router.get("/audio/{generation_id}")
async def get_audio_file(
    generation_id: str,
    tts_service: TTSService = Depends(get_tts_service)
):
    """
    Get generated audio file.
    
    Args:
        generation_id: Generation ID
        tts_service: TTS service instance
    
    Returns:
        Audio file
    
    Raises:
        HTTPException: If file not found
    """
    try:
        audio_path = await tts_service.get_audio_file(generation_id)
        
        if not audio_path:
            raise HTTPException(status_code=404, detail="Audio file not found")
        
        # Determine media type based on file extension
        media_types = {
            ".mp3": "audio/mpeg",
            ".wav": "audio/wav",
            ".ogg": "audio/ogg",
            ".flac": "audio/flac",
            ".aac": "audio/aac",
            ".opus": "audio/opus",
            ".pcm": "audio/pcm"
        }
        
        media_type = media_types.get(audio_path.suffix.lower(), "audio/mpeg")
        
        return FileResponse(
            path=audio_path,
            media_type=media_type,
            filename=f"{generation_id}{audio_path.suffix}"
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving audio file: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to retrieve audio file: {str(e)}")


@router.get("/generations/{generation_id}", response_model=GenerationResponse)
async def get_generation(
    generation_id: str,
    tts_service: TTSService = Depends(get_tts_service)
):
    """
    Get generation metadata by ID.
    
    Args:
        generation_id: Generation ID
        tts_service: TTS service instance
    
    Returns:
        Generation metadata
    
    Raises:
        HTTPException: If generation not found
    """
    try:
        generation = await tts_service.get_generation(generation_id)
        
        if not generation:
            raise HTTPException(status_code=404, detail="Generation not found")
        
        return GenerationResponse(**generation)
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving generation: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to retrieve generation: {str(e)}")


@router.get("/voices", response_model=List[VoiceInfo])
async def list_voices(
    provider: Optional[str] = None,
    tts_service: TTSService = Depends(get_tts_service)
):
    """
    List available voices for a provider.
    
    Args:
        provider: Provider name (uses default if not specified)
        tts_service: TTS service instance
    
    Returns:
        List of available voices
    
    Raises:
        HTTPException: If listing fails
    """
    try:
        voices = await tts_service.list_voices(provider)
        return [VoiceInfo(**voice) for voice in voices]
    
    except ValueError as e:
        logger.error(f"Validation error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error listing voices: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to list voices: {str(e)}")


@router.get("/providers")
async def list_providers(
    tts_service: TTSService = Depends(get_tts_service)
):
    """
    List available TTS providers.
    
    Args:
        tts_service: TTS service instance
    
    Returns:
        List of provider names
    """
    try:
        providers = tts_service.list_providers()
        return {"providers": providers}
    
    except Exception as e:
        logger.error(f"Error listing providers: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to list providers: {str(e)}")


@router.get("/health", response_model=HealthCheckResponse)
async def health_check(
    provider: Optional[str] = None,
    tts_service: TTSService = Depends(get_tts_service)
):
    """
    Check health of TTS providers.
    
    Args:
        provider: Specific provider to check (checks all if not specified)
        tts_service: TTS service instance
    
    Returns:
        Health status for each provider
    """
    try:
        results = await tts_service.health_check(provider)
        return HealthCheckResponse(providers=results)
    
    except Exception as e:
        logger.error(f"Error checking health: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to check health: {str(e)}")
