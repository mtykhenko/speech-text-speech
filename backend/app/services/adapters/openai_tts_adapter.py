"""OpenAI Text-to-Speech adapter implementation."""

import logging
from typing import Optional, Dict, Any, List
from openai import AsyncOpenAI
from .base import BaseTTSAdapter

logger = logging.getLogger(__name__)


class OpenAITTSAdapter(BaseTTSAdapter):
    """OpenAI TTS adapter using OpenAI's TTS API."""
    
    # Available voices from OpenAI TTS
    AVAILABLE_VOICES = [
        {"id": "alloy", "name": "Alloy", "description": "Neutral and balanced"},
        {"id": "echo", "name": "Echo", "description": "Male voice"},
        {"id": "fable", "name": "Fable", "description": "British accent"},
        {"id": "onyx", "name": "Onyx", "description": "Deep male voice"},
        {"id": "nova", "name": "Nova", "description": "Female voice"},
        {"id": "shimmer", "name": "Shimmer", "description": "Soft female voice"},
    ]
    
    # Available models
    AVAILABLE_MODELS = ["tts-1", "tts-1-hd"]
    
    # Supported output formats
    SUPPORTED_FORMATS = ["mp3", "opus", "aac", "flac", "wav", "pcm"]
    
    def __init__(self, config: Dict[str, Any]):
        """
        Initialize OpenAI TTS adapter.
        
        Args:
            config: Configuration dictionary containing:
                - api_key: OpenAI API key
                - model: Model to use (default: tts-1-hd)
                - voice: Default voice (default: alloy)
                - speed: Speech speed 0.25-4.0 (default: 1.0)
                - response_format: Audio format (default: mp3)
        """
        super().__init__(config)
        
        api_key = config.get("api_key")
        if not api_key:
            raise ValueError("OpenAI API key is required")
        
        self.client = AsyncOpenAI(api_key=api_key)
        self.model = config.get("model", "tts-1-hd")
        self.default_voice = config.get("voice", "alloy")
        self.default_speed = config.get("speed", 1.0)
        self.default_format = config.get("response_format", "mp3")
        
        logger.info(f"Initialized OpenAI TTS adapter with model: {self.model}")
    
    async def generate_speech(
        self,
        text: str,
        voice_id: Optional[str] = None,
        **kwargs
    ) -> bytes:
        """
        Generate speech from text using OpenAI TTS.
        
        Args:
            text: Text to convert to speech
            voice_id: Voice identifier (alloy, echo, fable, onyx, nova, shimmer)
            **kwargs: Additional parameters:
                - model: Override default model
                - speed: Speech speed (0.25-4.0)
                - response_format: Audio format (mp3, opus, aac, flac, wav, pcm)
        
        Returns:
            Audio file bytes
        
        Raises:
            ValueError: If parameters are invalid
            Exception: If API call fails
        """
        try:
            # Validate text length
            if not text or not text.strip():
                raise ValueError("Text cannot be empty")
            
            max_length = self.get_max_text_length()
            if len(text) > max_length:
                raise ValueError(f"Text exceeds maximum length of {max_length} characters")
            
            # Get parameters
            voice = voice_id or self.default_voice
            model = kwargs.get("model", self.model)
            speed = kwargs.get("speed", self.default_speed)
            response_format = kwargs.get("response_format", self.default_format)
            
            # Validate voice
            valid_voices = [v["id"] for v in self.AVAILABLE_VOICES]
            if voice not in valid_voices:
                raise ValueError(f"Invalid voice: {voice}. Must be one of {valid_voices}")
            
            # Validate model
            if model not in self.AVAILABLE_MODELS:
                raise ValueError(f"Invalid model: {model}. Must be one of {self.AVAILABLE_MODELS}")
            
            # Validate speed
            if not 0.25 <= speed <= 4.0:
                raise ValueError("Speed must be between 0.25 and 4.0")
            
            # Validate format
            if response_format not in self.SUPPORTED_FORMATS:
                raise ValueError(f"Invalid format: {response_format}. Must be one of {self.SUPPORTED_FORMATS}")
            
            logger.info(f"Generating speech with OpenAI TTS: model={model}, voice={voice}, length={len(text)}")
            
            # Call OpenAI TTS API
            response = await self.client.audio.speech.create(
                model=model,
                voice=voice,
                input=text,
                speed=speed,
                response_format=response_format
            )
            
            # Read audio content
            audio_bytes = response.content
            
            logger.info(f"Successfully generated speech: {len(audio_bytes)} bytes")
            return audio_bytes
            
        except ValueError as e:
            logger.error(f"Validation error in OpenAI TTS: {str(e)}")
            raise
        except Exception as e:
            logger.error(f"Error generating speech with OpenAI TTS: {str(e)}")
            raise Exception(f"Failed to generate speech: {str(e)}")
    
    async def health_check(self) -> bool:
        """
        Check if the OpenAI TTS service is available.
        
        Returns:
            True if service is healthy, False otherwise
        """
        try:
            # Try to generate a very short audio clip
            test_text = "Test"
            await self.generate_speech(test_text, voice_id=self.default_voice)
            logger.info("OpenAI TTS health check passed")
            return True
        except Exception as e:
            logger.error(f"OpenAI TTS health check failed: {str(e)}")
            return False
    
    async def list_voices(self) -> List[Dict[str, Any]]:
        """
        List available voices for OpenAI TTS.
        
        Returns:
            List of voice dictionaries with id, name, and description
        """
        return self.AVAILABLE_VOICES.copy()
    
    def get_max_text_length(self) -> int:
        """
        Get maximum text length for OpenAI TTS.
        
        Returns:
            Maximum text length (4096 characters)
        """
        return 4096
    
    def get_supported_formats(self) -> List[str]:
        """
        Get list of supported audio formats.
        
        Returns:
            List of supported formats
        """
        return self.SUPPORTED_FORMATS.copy()
    
    def get_available_models(self) -> List[str]:
        """
        Get list of available TTS models.
        
        Returns:
            List of model identifiers
        """
        return self.AVAILABLE_MODELS.copy()
