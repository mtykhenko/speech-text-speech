"""Text-to-Speech service for managing TTS operations."""

import logging
from typing import Optional, Dict, Any, List
from pathlib import Path
import uuid
from datetime import datetime

from ..models.database import get_db
from ..models.schemas import TTSGeneration
from ..utils.file_handling import save_audio_file, get_audio_file_path
from .adapters.base import BaseTTSAdapter
from .adapters.openai_tts_adapter import OpenAITTSAdapter
from .adapters.ollama_tts_adapter import OllamaTTSAdapter

logger = logging.getLogger(__name__)


class TTSService:
    """Service for managing Text-to-Speech operations."""
    
    def __init__(self, config: Dict[str, Any]):
        """
        Initialize TTS service with configuration.
        
        Args:
            config: Configuration dictionary containing TTS provider settings
        """
        self.config = config
        self.adapters: Dict[str, BaseTTSAdapter] = {}
        self.default_provider = config.get("default", "openai-tts")
        
        # Initialize adapters
        self._initialize_adapters()
        
        logger.info(f"TTS service initialized with default provider: {self.default_provider}")
    
    def _initialize_adapters(self):
        """Initialize TTS adapters based on configuration."""
        providers = self.config.get("providers", {})
        
        for provider_name, provider_config in providers.items():
            try:
                adapter = self._create_adapter(provider_name, provider_config)
                self.adapters[provider_name] = adapter
                logger.info(f"Initialized TTS adapter: {provider_name}")
            except Exception as e:
                logger.error(f"Failed to initialize TTS adapter {provider_name}: {str(e)}")
    
    def _create_adapter(self, provider_name: str, config: Dict[str, Any]) -> BaseTTSAdapter:
        """
        Create a TTS adapter instance.
        
        Args:
            provider_name: Name of the provider
            config: Provider configuration
        
        Returns:
            Initialized adapter instance
        
        Raises:
            ValueError: If provider is not supported
        """
        if "openai" in provider_name.lower():
            return OpenAITTSAdapter(config)
        elif "ollama" in provider_name.lower():
            return OllamaTTSAdapter(config)
        else:
            raise ValueError(f"Unsupported TTS provider: {provider_name}")
    
    def get_adapter(self, provider: Optional[str] = None) -> BaseTTSAdapter:
        """
        Get a TTS adapter by provider name.
        
        Args:
            provider: Provider name (uses default if not specified)
        
        Returns:
            TTS adapter instance
        
        Raises:
            ValueError: If provider is not found
        """
        provider_name = provider or self.default_provider
        
        if provider_name not in self.adapters:
            raise ValueError(f"TTS provider not found: {provider_name}")
        
        return self.adapters[provider_name]
    
    async def generate_speech(
        self,
        text: str,
        provider: Optional[str] = None,
        voice_id: Optional[str] = None,
        output_format: str = "mp3",
        **kwargs
    ) -> Dict[str, Any]:
        """
        Generate speech from text.
        
        Args:
            text: Text to convert to speech
            provider: TTS provider to use (uses default if not specified)
            voice_id: Voice identifier
            output_format: Audio output format
            **kwargs: Additional provider-specific parameters
        
        Returns:
            Dictionary containing:
                - id: Generation ID
                - audio_url: URL to access the audio file
                - text: Original text
                - provider: Provider used
                - voice_id: Voice used
                - duration: Audio duration (if available)
                - created_at: Timestamp
        
        Raises:
            ValueError: If parameters are invalid
            Exception: If generation fails
        """
        try:
            # Get adapter
            adapter = self.get_adapter(provider)
            provider_name = provider or self.default_provider
            
            logger.info(f"Generating speech with provider: {provider_name}")
            
            # Generate speech
            audio_bytes = await adapter.generate_speech(
                text=text,
                voice_id=voice_id,
                response_format=output_format,
                **kwargs
            )
            
            # Generate unique ID
            generation_id = str(uuid.uuid4())
            
            # Save audio file
            file_extension = output_format if output_format else "mp3"
            audio_path = await save_audio_file(
                audio_bytes,
                generation_id,
                file_extension
            )
            
            # Create database record
            db = next(get_db())
            try:
                generation = TTSGeneration(
                    id=generation_id,
                    text=text,
                    provider=provider_name,
                    voice_id=voice_id,
                    audio_path=str(audio_path),
                    audio_format=file_extension,
                    text_length=len(text),
                    audio_size=len(audio_bytes),
                    created_at=datetime.utcnow()
                )
                
                db.add(generation)
                db.commit()
                db.refresh(generation)
                
                logger.info(f"Successfully generated speech: {generation_id}")
                
                return {
                    "id": generation_id,
                    "audio_url": f"/api/v1/tts/audio/{generation_id}",
                    "text": text,
                    "provider": provider_name,
                    "voice_id": voice_id,
                    "format": file_extension,
                    "size": len(audio_bytes),
                    "created_at": generation.created_at.isoformat()
                }
            finally:
                db.close()
        
        except ValueError as e:
            logger.error(f"Validation error in TTS generation: {str(e)}")
            raise
        except Exception as e:
            logger.error(f"Error generating speech: {str(e)}")
            raise Exception(f"Failed to generate speech: {str(e)}")
    
    async def generate_speech_from_document(
        self,
        text: str,
        provider: Optional[str] = None,
        voice_id: Optional[str] = None,
        output_format: str = "mp3",
        chunk_size: Optional[int] = None,
        **kwargs
    ) -> List[Dict[str, Any]]:
        """
        Generate speech from a long document by splitting into chunks.
        
        Args:
            text: Text to convert to speech
            provider: TTS provider to use
            voice_id: Voice identifier
            output_format: Audio output format
            chunk_size: Maximum characters per chunk (uses adapter default if not specified)
            **kwargs: Additional provider-specific parameters
        
        Returns:
            List of generation results, one per chunk
        
        Raises:
            ValueError: If parameters are invalid
            Exception: If generation fails
        """
        try:
            # Get adapter to check max text length
            adapter = self.get_adapter(provider)
            max_length = chunk_size or adapter.get_max_text_length()
            
            # If text is short enough, generate directly
            if len(text) <= max_length:
                result = await self.generate_speech(
                    text=text,
                    provider=provider,
                    voice_id=voice_id,
                    output_format=output_format,
                    **kwargs
                )
                return [result]
            
            # Split text into chunks
            from ..utils.document_processing import DocumentProcessor
            chunks = DocumentProcessor.split_text_into_chunks(
                text=text,
                max_chunk_size=max_length - 100,  # Leave some margin
                overlap=200
            )
            
            logger.info(f"Generating speech for {len(chunks)} chunks")
            
            # Generate speech for each chunk
            results = []
            for i, chunk in enumerate(chunks):
                logger.info(f"Processing chunk {i+1}/{len(chunks)}")
                
                result = await self.generate_speech(
                    text=chunk,
                    provider=provider,
                    voice_id=voice_id,
                    output_format=output_format,
                    **kwargs
                )
                
                result["chunk_index"] = i
                result["total_chunks"] = len(chunks)
                results.append(result)
            
            logger.info(f"Successfully generated speech for all {len(chunks)} chunks")
            return results
        
        except Exception as e:
            logger.error(f"Error generating speech from document: {str(e)}")
            raise Exception(f"Failed to generate speech from document: {str(e)}")
    
    async def get_generation(self, generation_id: str) -> Optional[Dict[str, Any]]:
        """
        Get a TTS generation by ID.
        
        Args:
            generation_id: Generation ID
        
        Returns:
            Generation data or None if not found
        """
        db = next(get_db())
        try:
            generation = db.query(TTSGeneration).filter(
                TTSGeneration.id == generation_id
            ).first()
            
            if not generation:
                return None
            
            return {
                "id": generation.id,
                "text": generation.text,
                "provider": generation.provider,
                "voice_id": generation.voice_id,
                "audio_url": f"/api/v1/tts/audio/{generation.id}",
                "format": generation.audio_format,
                "size": generation.audio_size,
                "created_at": generation.created_at.isoformat()
            }
        finally:
            db.close()
    
    async def get_audio_file(self, generation_id: str) -> Optional[Path]:
        """
        Get the audio file path for a generation.
        
        Args:
            generation_id: Generation ID
        
        Returns:
            Path to audio file or None if not found
        """
        db = next(get_db())
        try:
            generation = db.query(TTSGeneration).filter(
                TTSGeneration.id == generation_id
            ).first()
            
            if not generation:
                return None
            
            audio_path = Path(generation.audio_path)
            if not audio_path.exists():
                logger.error(f"Audio file not found: {audio_path}")
                return None
            
            return audio_path
        finally:
            db.close()
    
    async def list_voices(self, provider: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        List available voices for a provider.
        
        Args:
            provider: Provider name (uses default if not specified)
        
        Returns:
            List of voice dictionaries
        """
        try:
            adapter = self.get_adapter(provider)
            voices = await adapter.list_voices()
            return voices
        except Exception as e:
            logger.error(f"Error listing voices: {str(e)}")
            raise Exception(f"Failed to list voices: {str(e)}")
    
    async def health_check(self, provider: Optional[str] = None) -> Dict[str, bool]:
        """
        Check health of TTS providers.
        
        Args:
            provider: Specific provider to check (checks all if not specified)
        
        Returns:
            Dictionary mapping provider names to health status
        """
        results = {}
        
        if provider:
            # Check specific provider
            try:
                adapter = self.get_adapter(provider)
                results[provider] = await adapter.health_check()
            except Exception as e:
                logger.error(f"Health check failed for {provider}: {str(e)}")
                results[provider] = False
        else:
            # Check all providers
            for provider_name, adapter in self.adapters.items():
                try:
                    results[provider_name] = await adapter.health_check()
                except Exception as e:
                    logger.error(f"Health check failed for {provider_name}: {str(e)}")
                    results[provider_name] = False
        
        return results
    
    def list_providers(self) -> List[str]:
        """
        List available TTS providers.
        
        Returns:
            List of provider names
        """
        return list(self.adapters.keys())
