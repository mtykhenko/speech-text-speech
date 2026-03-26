"""Ollama Text-to-Speech adapter implementation."""

import logging
from typing import Optional, Dict, Any, List
import aiohttp
from .base import BaseTTSAdapter

logger = logging.getLogger(__name__)


class OllamaTTSAdapter(BaseTTSAdapter):
    """Ollama TTS adapter using Ollama's external API."""
    
    def __init__(self, config: Dict[str, Any]):
        """
        Initialize Ollama TTS adapter.
        
        Args:
            config: Configuration dictionary containing:
                - endpoint: Ollama API endpoint URL
                - model: Model to use (e.g., xtts-v2)
                - timeout: Request timeout in seconds (default: 300)
                - voice: Default voice identifier (optional)
        """
        super().__init__(config)
        
        endpoint = config.get("endpoint")
        if not endpoint:
            raise ValueError("Ollama endpoint is required")
        
        self.endpoint = endpoint.rstrip("/")
        self.model = config.get("model", "xtts-v2")
        self.timeout = config.get("timeout", 300)  # 5 minutes default
        self.default_voice = config.get("voice")
        
        logger.info(f"Initialized Ollama TTS adapter with endpoint: {self.endpoint}, model: {self.model}")
    
    async def generate_speech(
        self,
        text: str,
        voice_id: Optional[str] = None,
        **kwargs
    ) -> bytes:
        """
        Generate speech from text using Ollama TTS.
        
        Args:
            text: Text to convert to speech
            voice_id: Voice identifier (model-specific)
            **kwargs: Additional parameters:
                - language: Language code (e.g., 'en', 'es')
                - speed: Speech speed multiplier
                - temperature: Sampling temperature for generation
        
        Returns:
            Audio file bytes
        
        Raises:
            ValueError: If parameters are invalid
            Exception: If API call fails
        """
        try:
            # Validate text
            if not text or not text.strip():
                raise ValueError("Text cannot be empty")
            
            max_length = self.get_max_text_length()
            if len(text) > max_length:
                raise ValueError(f"Text exceeds maximum length of {max_length} characters")
            
            # Prepare request payload
            payload = {
                "model": self.model,
                "prompt": text,
            }
            
            # Add optional parameters
            if voice_id or self.default_voice:
                payload["voice"] = voice_id or self.default_voice
            
            if "language" in kwargs:
                payload["language"] = kwargs["language"]
            
            if "speed" in kwargs:
                payload["speed"] = kwargs["speed"]
            
            if "temperature" in kwargs:
                payload["temperature"] = kwargs["temperature"]
            
            logger.info(f"Generating speech with Ollama TTS: model={self.model}, length={len(text)}")
            
            # Make API request
            url = f"{self.endpoint}/api/generate"
            
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    url,
                    json=payload,
                    timeout=aiohttp.ClientTimeout(total=self.timeout)
                ) as response:
                    if response.status != 200:
                        error_text = await response.text()
                        raise Exception(f"Ollama API error (status {response.status}): {error_text}")
                    
                    # Read audio content
                    audio_bytes = await response.read()
                    
                    if not audio_bytes:
                        raise Exception("Received empty audio response from Ollama")
                    
                    logger.info(f"Successfully generated speech: {len(audio_bytes)} bytes")
                    return audio_bytes
        
        except ValueError as e:
            logger.error(f"Validation error in Ollama TTS: {str(e)}")
            raise
        except aiohttp.ClientError as e:
            logger.error(f"Network error in Ollama TTS: {str(e)}")
            raise Exception(f"Failed to connect to Ollama service: {str(e)}")
        except Exception as e:
            logger.error(f"Error generating speech with Ollama TTS: {str(e)}")
            raise Exception(f"Failed to generate speech: {str(e)}")
    
    async def health_check(self) -> bool:
        """
        Check if the Ollama TTS service is available.
        
        Returns:
            True if service is healthy, False otherwise
        """
        try:
            # Check if Ollama API is reachable
            url = f"{self.endpoint}/api/tags"
            
            async with aiohttp.ClientSession() as session:
                async with session.get(
                    url,
                    timeout=aiohttp.ClientTimeout(total=10)
                ) as response:
                    if response.status == 200:
                        data = await response.json()
                        # Check if our model is available
                        models = data.get("models", [])
                        model_names = [m.get("name", "") for m in models]
                        
                        if self.model in model_names:
                            logger.info(f"Ollama TTS health check passed: model {self.model} is available")
                            return True
                        else:
                            logger.warning(f"Ollama TTS model {self.model} not found in available models: {model_names}")
                            return False
                    else:
                        logger.error(f"Ollama API returned status {response.status}")
                        return False
        
        except Exception as e:
            logger.error(f"Ollama TTS health check failed: {str(e)}")
            return False
    
    async def list_voices(self) -> List[Dict[str, Any]]:
        """
        List available voices for Ollama TTS.
        
        Note: Voice availability depends on the specific model.
        This returns a generic list. Check model documentation for actual voices.
        
        Returns:
            List of voice dictionaries
        """
        try:
            # Try to get model info from Ollama
            url = f"{self.endpoint}/api/show"
            payload = {"name": self.model}
            
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    url,
                    json=payload,
                    timeout=aiohttp.ClientTimeout(total=10)
                ) as response:
                    if response.status == 200:
                        data = await response.json()
                        # Extract voice information if available in model info
                        # This is model-specific and may not be available
                        logger.info(f"Retrieved model info for {self.model}")
                        
                        # Return generic voice list as fallback
                        return [
                            {
                                "id": "default",
                                "name": "Default Voice",
                                "description": f"Default voice for {self.model}"
                            }
                        ]
        except Exception as e:
            logger.warning(f"Could not retrieve voice list from Ollama: {str(e)}")
        
        # Return generic voice list
        return [
            {
                "id": "default",
                "name": "Default Voice",
                "description": f"Default voice for {self.model}"
            }
        ]
    
    def get_max_text_length(self) -> int:
        """
        Get maximum text length for Ollama TTS.
        
        Returns:
            Maximum text length (model-dependent, using conservative default)
        """
        # This is model-dependent. Using a conservative default.
        # Can be overridden in config
        return self.config.get("max_text_length", 8192)
    
    async def get_available_models(self) -> List[str]:
        """
        Get list of available TTS models from Ollama.
        
        Returns:
            List of model names
        """
        try:
            url = f"{self.endpoint}/api/tags"
            
            async with aiohttp.ClientSession() as session:
                async with session.get(
                    url,
                    timeout=aiohttp.ClientTimeout(total=10)
                ) as response:
                    if response.status == 200:
                        data = await response.json()
                        models = data.get("models", [])
                        model_names = [m.get("name", "") for m in models if m.get("name")]
                        logger.info(f"Retrieved {len(model_names)} models from Ollama")
                        return model_names
                    else:
                        logger.error(f"Failed to get models from Ollama: status {response.status}")
                        return []
        except Exception as e:
            logger.error(f"Error getting available models from Ollama: {str(e)}")
            return []
