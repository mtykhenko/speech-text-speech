# Phase 2: Speech-to-Text Implementation - Setup Guide

This guide covers the setup and usage of Phase 2 features for the Speech-to-Text & Text-to-Speech Platform.

## What's Implemented

Phase 2 adds complete Speech-to-Text (STT) functionality with:

### Backend Features
- ✅ Base STT adapter interface for extensibility
- ✅ OpenAI Whisper API integration
- ✅ STT service layer with provider management
- ✅ RESTful API endpoints for transcription
- ✅ File upload validation and handling
- ✅ Database models for transcription storage
- ✅ Support for multiple audio formats (MP3, WAV, FLAC, M4A, OGG, WEBM, MP4)

### Frontend Features
- ✅ File upload component with drag-and-drop
- ✅ Live audio recording component
- ✅ Transcription display with segments
- ✅ Export functionality (TXT, JSON, SRT)
- ✅ Provider and language selection
- ✅ Real-time progress indicators

## Prerequisites

- Docker and Docker Compose
- Python 3.11+ (for local development)
- Node.js 18+ (for frontend development)
- OpenAI API key (for OpenAI Whisper)

## Quick Start

### 1. Environment Setup

Create a `.env` file in the project root:

```bash
# Database
POSTGRES_USER=sttuser
POSTGRES_PASSWORD=sttpassword
POSTGRES_DB=sttdb
DATABASE_URL=postgresql://sttuser:sttpassword@postgres:5432/sttdb

# OpenAI (required for OpenAI Whisper)
OPENAI_API_KEY=your_openai_api_key_here

# STT Configuration
STT_DEFAULT_PROVIDER=openai-whisper

# Storage
AUDIO_STORAGE_PATH=/app/storage/audio
```

### 2. Start Services

```bash
# Start all services
docker-compose up -d

# Check service status
docker-compose ps

# View logs
docker-compose logs -f backend
```

### 3. Run Database Migrations

```bash
# Enter backend container
docker-compose exec backend bash

# Run migrations
alembic upgrade head

# Exit container
exit
```

### 4. Install Frontend Dependencies

```bash
cd frontend
npm install
```

### 5. Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/health

## API Endpoints

### Speech-to-Text

#### Transcribe Audio File
```bash
POST /api/v1/stt/transcribe
Content-Type: multipart/form-data

Parameters:
- file: Audio file (required)
- provider: STT provider (optional, default: configured default)
- language: Language code (optional, e.g., 'en', 'es', 'fr')
- prompt: Text to guide the model (optional)
- temperature: Sampling temperature 0-1 (optional, default: 0)
- response_format: Response format (optional, default: 'verbose_json')

Example:
curl -X POST "http://localhost:8000/api/v1/stt/transcribe" \
  -F "file=@audio.mp3" \
  -F "provider=openai-whisper" \
  -F "language=en"
```

#### Get Transcription
```bash
GET /api/v1/stt/transcriptions/{id}

Example:
curl "http://localhost:8000/api/v1/stt/transcriptions/1"
```

#### List Transcriptions
```bash
GET /api/v1/stt/transcriptions?page=1&page_size=10

Example:
curl "http://localhost:8000/api/v1/stt/transcriptions?page=1&page_size=10"
```

#### Delete Transcription
```bash
DELETE /api/v1/stt/transcriptions/{id}

Example:
curl -X DELETE "http://localhost:8000/api/v1/stt/transcriptions/1"
```

#### List Providers
```bash
GET /api/v1/stt/providers

Example:
curl "http://localhost:8000/api/v1/stt/providers"
```

#### Get Provider Info
```bash
GET /api/v1/stt/providers/{provider_name}

Example:
curl "http://localhost:8000/api/v1/stt/providers/openai-whisper"
```

#### Health Check
```bash
GET /api/v1/stt/health

Example:
curl "http://localhost:8000/api/v1/stt/health"
```

## Configuration

### Adding a New STT Provider

1. Create a new adapter in `backend/app/services/adapters/`:

```python
from app.services.adapters.base import BaseSTTAdapter, TranscriptionResult

class MySTTAdapter(BaseSTTAdapter):
    async def transcribe(self, audio_file: bytes, language: Optional[str] = None, **kwargs) -> TranscriptionResult:
        # Implementation
        pass
    
    async def health_check(self) -> bool:
        # Implementation
        pass
```

2. Register the adapter in `backend/app/services/stt_service.py`:

```python
def _create_adapter(self, provider_name: str, config: Dict[str, Any]) -> Optional[BaseSTTAdapter]:
    if "my-provider" in provider_name.lower():
        return MySTTAdapter(config)
    # ... existing code
```

3. Add configuration to `.env` or `config/models.yaml`

## Supported Audio Formats

- MP3 (.mp3)
- WAV (.wav)
- FLAC (.flac)
- M4A (.m4a)
- OGG (.ogg)
- WEBM (.webm)
- MP4 (.mp4)
- MPEG (.mpeg, .mpga)

## File Size Limits

- **OpenAI Whisper**: 25 MB

## Troubleshooting

### Backend Issues

**Database connection errors:**
```bash
# Check if PostgreSQL is running
docker-compose ps postgres

# Restart database
docker-compose restart postgres

# Check logs
docker-compose logs postgres
```

**OpenAI API errors:**
- Verify your API key in `.env`
- Check API quota: https://platform.openai.com/usage

**Module import errors:**
```bash
# Reinstall dependencies
docker-compose exec backend pip install -r requirements.txt

# Or rebuild container
docker-compose up -d --build backend
```

### Frontend Issues

**Component not rendering:**
```bash
# Install dependencies
cd frontend
npm install

# Clear cache and restart
rm -rf node_modules package-lock.json
npm install
npm run dev
```

**CORS errors:**
- Check that backend is running on port 8000
- Verify CORS settings in `backend/app/main.py`

### Audio Recording Issues

**Microphone not accessible:**
- Grant browser microphone permissions
- Use HTTPS or localhost (required for MediaRecorder API)
- Check browser compatibility (Chrome, Firefox, Edge recommended)

## Development

### Backend Development

```bash
# Enter backend container
docker-compose exec backend bash

# Run tests (when implemented)
pytest

# Format code
black app/

# Type checking
mypy app/
```

### Frontend Development

```bash
cd frontend

# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Performance Tips

1. **Optimize audio files**: Convert to lower bitrate MP3 before upload to reduce processing time
2. **Monitor API usage**: Keep track of OpenAI API costs at https://platform.openai.com/usage
3. **Use appropriate language codes**: Specifying the correct language can improve accuracy

## Next Steps

Phase 3 will implement:
- Text-to-Speech functionality
- Voice cloning capabilities
- Model configuration interface
- Real-time streaming transcription

## Support

For issues or questions:
1. Check the main README.md
2. Review AGENTS.md for technical details
3. Check API documentation at http://localhost:8000/docs
4. Review Docker logs: `docker-compose logs -f`

## License

See LICENSE file in project root.
