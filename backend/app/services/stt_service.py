"""Speech-to-Text service layer."""

import os
from typing import Optional, Dict, Any, List
from pathlib import Path
import yaml

from app.services.adapters.base import BaseSTTAdapter, TranscriptionResult
from app.services.adapters.openai_adapter import OpenAIWhisperAdapter


class STTService:
    """Service for managing Speech-to-Text operations."""
    
    def __init__(self, config_path: Optional[str] = None):
        """
        Initialize STT service.
        
        Args:
            config_path: Optional path to configuration file
        """
        self.adapters: Dict[str, BaseSTTAdapter] = {}
        self.default_provider: Optional[str] = None
        self.config = self._load_config(config_path)
        self._initialize_adapters()
    
    def _load_config(self, config_path: Optional[str] = None) -> Dict[str, Any]:
        """
        Load configuration from file or environment.
        
        Args:
            config_path: Optional path to configuration file
        
        Returns:
            Configuration dictionary
        """
        if config_path and Path(config_path).exists():
            with open(config_path, 'r') as f:
                return yaml.safe_load(f)
        
        # Default configuration
        return {
            "stt": {
                "default": os.getenv("STT_DEFAULT_PROVIDER", "openai-whisper"),
                "providers": {
                    "openai-whisper": {
                        "type": "api",
                        "api_key": os.getenv("OPENAI_API_KEY"),
                        "model": "whisper-1",
                        "language": "auto"
                    }
                }
            }
        }
    
    def _initialize_adapters(self):
        """Initialize all configured STT adapters."""
        stt_config = self.config.get("stt", {})
        self.default_provider = stt_config.get("default")
        providers = stt_config.get("providers", {})
        
        for provider_name, provider_config in providers.items():
            try:
                adapter = self._create_adapter(provider_name, provider_config)
                if adapter:
                    self.adapters[provider_name] = adapter
                    print(f"Initialized STT adapter: {provider_name}")
            except Exception as e:
                print(f"Failed to initialize STT adapter {provider_name}: {str(e)}")
    
    def _create_adapter(
        self,
        provider_name: str,
        config: Dict[str, Any]
    ) -> Optional[BaseSTTAdapter]:
        """
        Create an adapter instance based on provider name.
        
        Args:
            provider_name: Name of the provider
            config: Provider configuration
        
        Returns:
            Adapter instance or None if creation fails
        """
        if "openai" in provider_name.lower() or "whisper" in provider_name.lower():
            return OpenAIWhisperAdapter(config)
        else:
            print(f"Unknown STT provider: {provider_name}")
            return None
    
    def get_adapter(self, provider: Optional[str] = None) -> BaseSTTAdapter:
        """
        Get an adapter by provider name.
        
        Args:
            provider: Provider name (uses default if None)
        
        Returns:
            STT adapter instance
        
        Raises:
            ValueError: If provider not found
        """
        provider_name = provider or self.default_provider
        
        if not provider_name:
            raise ValueError("No STT provider specified and no default configured")
        
        if provider_name not in self.adapters:
            raise ValueError(f"STT provider not found: {provider_name}")
        
        return self.adapters[provider_name]
    
    async def transcribe(
        self,
        audio_file: bytes,
        provider: Optional[str] = None,
        language: Optional[str] = None,
        **kwargs
    ) -> TranscriptionResult:
        """
        Transcribe audio file to text.
        
        Args:
            audio_file: Audio file bytes
            provider: Optional provider name (uses default if None)
            language: Optional language code
            **kwargs: Additional provider-specific parameters
        
        Returns:
            TranscriptionResult object
        
        Raises:
            Exception: If transcription fails
        """
        adapter = self.get_adapter(provider)
        return await adapter.transcribe(audio_file, language, **kwargs)
    
    async def health_check(self, provider: Optional[str] = None) -> Dict[str, bool]:
        """
        Check health of one or all adapters.
        
        Args:
            provider: Optional provider name (checks all if None)
        
        Returns:
            Dictionary mapping provider names to health status
        """
        if provider:
            adapter = self.get_adapter(provider)
            return {provider: await adapter.health_check()}
        
        # Check all adapters
        results = {}
        for provider_name, adapter in self.adapters.items():
            try:
                results[provider_name] = await adapter.health_check()
            except Exception as e:
                print(f"Health check failed for {provider_name}: {str(e)}")
                results[provider_name] = False
        
        return results
    
    def list_providers(self) -> List[Dict[str, Any]]:
        """
        List all available STT providers.
        
        Returns:
            List of provider information dictionaries
        """
        providers = []
        for provider_name, adapter in self.adapters.items():
            providers.append({
                "name": provider_name,
                "type": adapter.adapter_type,
                "is_default": provider_name == self.default_provider,
                "supported_formats": adapter.get_supported_formats(),
                "max_file_size": adapter.get_max_file_size()
            })
        return providers
    
    def get_provider_info(self, provider: str) -> Dict[str, Any]:
        """
        Get information about a specific provider.
        
        Args:
            provider: Provider name
        
        Returns:
            Provider information dictionary
        
        Raises:
            ValueError: If provider not found
        """
        adapter = self.get_adapter(provider)
        return {
            "name": provider,
            "type": adapter.adapter_type,
            "is_default": provider == self.default_provider,
            "supported_formats": adapter.get_supported_formats(),
            "max_file_size": adapter.get_max_file_size()
        }


# Global service instance
_stt_service: Optional[STTService] = None


def get_stt_service() -> STTService:
    """
    Get or create the global STT service instance.
    
    Returns:
        STTService instance
    """
    global _stt_service
    if _stt_service is None:
        _stt_service = STTService()
    return _stt_service
