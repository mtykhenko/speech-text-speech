"""Base adapter interfaces for STT and TTS providers."""

from abc import ABC, abstractmethod
from typing import Optional, Dict, Any, List
from enum import Enum


class AdapterType(str, Enum):
    """Adapter type enumeration."""
    API = "api"
    LOCAL = "local"


class TranscriptionSegment:
    """Represents a segment of transcribed text."""
    
    def __init__(
        self,
        text: str,
        start: float,
        end: float,
        confidence: Optional[float] = None
    ):
        self.text = text
        self.start = start
        self.end = end
        self.confidence = confidence
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert segment to dictionary."""
        return {
            "text": self.text,
            "start": self.start,
            "end": self.end,
            "confidence": self.confidence
        }


class TranscriptionResult:
    """Represents the result of a transcription."""
    
    def __init__(
        self,
        text: str,
        language: str,
        confidence: Optional[float] = None,
        segments: Optional[List[TranscriptionSegment]] = None,
        metadata: Optional[Dict[str, Any]] = None
    ):
        self.text = text
        self.language = language
        self.confidence = confidence
        self.segments = segments or []
        self.metadata = metadata or {}
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert result to dictionary."""
        return {
            "text": self.text,
            "language": self.language,
            "confidence": self.confidence,
            "segments": [seg.to_dict() for seg in self.segments],
            "metadata": self.metadata
        }


class BaseSTTAdapter(ABC):
    """Base class for Speech-to-Text adapters."""
    
    def __init__(self, config: Dict[str, Any]):
        """
        Initialize the adapter with configuration.
        
        Args:
            config: Configuration dictionary for the adapter
        """
        self.config = config
        self.adapter_type = config.get("type", AdapterType.API)
    
    @abstractmethod
    async def transcribe(
        self,
        audio_file: bytes,
        language: Optional[str] = None,
        **kwargs
    ) -> TranscriptionResult:
        """
        Transcribe audio to text.
        
        Args:
            audio_file: Audio file bytes
            language: Optional language code (e.g., 'en', 'es', 'fr')
            **kwargs: Additional provider-specific parameters
        
        Returns:
            TranscriptionResult object containing transcription data
        
        Raises:
            Exception: If transcription fails
        """
        pass
    
    @abstractmethod
    async def health_check(self) -> bool:
        """
        Check if the adapter is healthy and can process requests.
        
        Returns:
            True if healthy, False otherwise
        """
        pass
    
    def get_supported_formats(self) -> List[str]:
        """
        Get list of supported audio formats.
        
        Returns:
            List of supported file extensions (e.g., ['mp3', 'wav', 'flac'])
        """
        return ['mp3', 'wav', 'flac', 'm4a', 'ogg', 'webm']
    
    def get_max_file_size(self) -> int:
        """
        Get maximum file size in bytes.
        
        Returns:
            Maximum file size in bytes
        """
        return 25 * 1024 * 1024  # 25 MB default


class BaseTTSAdapter(ABC):
    """Base class for Text-to-Speech adapters."""
    
    def __init__(self, config: Dict[str, Any]):
        """
        Initialize the adapter with configuration.
        
        Args:
            config: Configuration dictionary for the adapter
        """
        self.config = config
        self.adapter_type = config.get("type", AdapterType.API)
    
    @abstractmethod
    async def generate_speech(
        self,
        text: str,
        voice_id: Optional[str] = None,
        **kwargs
    ) -> bytes:
        """
        Generate speech from text.
        
        Args:
            text: Text to convert to speech
            voice_id: Optional voice identifier
            **kwargs: Additional provider-specific parameters
        
        Returns:
            Audio file bytes
        
        Raises:
            Exception: If speech generation fails
        """
        pass
    
    @abstractmethod
    async def health_check(self) -> bool:
        """
        Check if the adapter is healthy and can process requests.
        
        Returns:
            True if healthy, False otherwise
        """
        pass
    
    @abstractmethod
    async def list_voices(self) -> List[Dict[str, Any]]:
        """
        List available voices for this provider.
        
        Returns:
            List of voice dictionaries with id, name, and metadata
        """
        pass
    
    def get_max_text_length(self) -> int:
        """
        Get maximum text length in characters.
        
        Returns:
            Maximum text length
        """
        return 4096  # Default limit
