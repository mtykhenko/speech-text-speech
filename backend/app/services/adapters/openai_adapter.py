"""OpenAI Whisper adapter for Speech-to-Text."""

import os
from typing import Optional, Dict, Any, List
import httpx
from openai import AsyncOpenAI

from .base import BaseSTTAdapter, TranscriptionResult, TranscriptionSegment


class OpenAIWhisperAdapter(BaseSTTAdapter):
    """Adapter for OpenAI Whisper API."""
    
    def __init__(self, config: Dict[str, Any]):
        """
        Initialize OpenAI Whisper adapter.
        
        Args:
            config: Configuration dictionary containing:
                - api_key: OpenAI API key
                - model: Model name (default: whisper-1)
                - language: Default language code
        """
        super().__init__(config)
        
        api_key = config.get("api_key") or os.getenv("OPENAI_API_KEY")
        if not api_key:
            raise ValueError("OpenAI API key is required")
        
        self.client = AsyncOpenAI(api_key=api_key)
        self.model = config.get("model", "whisper-1")
        self.default_language = config.get("language", "auto")
    
    async def transcribe(
        self,
        audio_file: bytes,
        language: Optional[str] = None,
        **kwargs
    ) -> TranscriptionResult:
        """
        Transcribe audio using OpenAI Whisper API.
        
        Args:
            audio_file: Audio file bytes
            language: Optional language code (e.g., 'en', 'es', 'fr')
            **kwargs: Additional parameters:
                - prompt: Optional text to guide the model's style
                - temperature: Sampling temperature (0-1)
                - response_format: Format of response (json, text, srt, vtt)
                - timestamp_granularities: List of timestamp granularities
        
        Returns:
            TranscriptionResult object
        
        Raises:
            Exception: If transcription fails
        """
        try:
            # Prepare parameters
            lang = language or self.default_language
            if lang == "auto":
                lang = None  # Let OpenAI auto-detect
            
            # Get additional parameters
            prompt = kwargs.get("prompt")
            temperature = kwargs.get("temperature", 0)
            response_format = kwargs.get("response_format", "verbose_json")
            timestamp_granularities = kwargs.get("timestamp_granularities", ["segment"])
            
            # Create a file-like object from bytes
            # OpenAI API expects a file with a name
            from io import BytesIO
            audio_buffer = BytesIO(audio_file)
            audio_buffer.name = "audio.mp3"  # Provide a filename
            
            # Call OpenAI API
            transcription = await self.client.audio.transcriptions.create(
                model=self.model,
                file=audio_buffer,
                language=lang,
                prompt=prompt,
                temperature=temperature,
                response_format=response_format,
                timestamp_granularities=timestamp_granularities
            )
            
            # Parse response based on format
            if response_format == "verbose_json":
                # Extract segments if available
                segments = []
                if hasattr(transcription, 'segments') and transcription.segments:
                    for seg in transcription.segments:
                        segments.append(TranscriptionSegment(
                            text=seg.get('text', ''),
                            start=seg.get('start', 0.0),
                            end=seg.get('end', 0.0),
                            confidence=seg.get('avg_logprob')  # OpenAI uses avg_logprob
                        ))
                
                return TranscriptionResult(
                    text=transcription.text,
                    language=transcription.language if hasattr(transcription, 'language') else (lang or 'unknown'),
                    confidence=None,  # OpenAI doesn't provide overall confidence
                    segments=segments,
                    metadata={
                        "model": self.model,
                        "duration": transcription.duration if hasattr(transcription, 'duration') else None,
                        "provider": "openai"
                    }
                )
            else:
                # For text, srt, vtt formats
                return TranscriptionResult(
                    text=str(transcription),
                    language=lang or 'unknown',
                    confidence=None,
                    segments=[],
                    metadata={
                        "model": self.model,
                        "provider": "openai",
                        "response_format": response_format
                    }
                )
        
        except Exception as e:
            raise Exception(f"OpenAI Whisper transcription failed: {str(e)}")
    
    async def health_check(self) -> bool:
        """
        Check if OpenAI API is accessible.
        
        Returns:
            True if healthy, False otherwise
        """
        try:
            # Try to list models to verify API key
            models = await self.client.models.list()
            return True
        except Exception as e:
            print(f"OpenAI health check failed: {str(e)}")
            return False
    
    def get_supported_formats(self) -> List[str]:
        """
        Get list of supported audio formats for OpenAI Whisper.
        
        Returns:
            List of supported file extensions
        """
        return ['mp3', 'mp4', 'mpeg', 'mpga', 'm4a', 'wav', 'webm']
    
    def get_max_file_size(self) -> int:
        """
        Get maximum file size for OpenAI Whisper.
        
        Returns:
            Maximum file size in bytes (25 MB)
        """
        return 25 * 1024 * 1024  # 25 MB
