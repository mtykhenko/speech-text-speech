# Speech-to-Text & Text-to-Speech Platform

A containerized web application for experimenting with various speech-to-text (STT) and text-to-speech (TTS) models, including voice cloning capabilities.

## Features

### 🎤 Speech-to-Text (STT)
- **Live Recording**: Record audio directly in your browser with real-time transcription
- **File Upload**: Support for MP3, WAV, M4A, FLAC audio formats
- **Multiple Providers**: OpenAI Whisper, Google Cloud, Azure, local Whisper.cpp
- **Export Options**: Download transcriptions as TXT, JSON, or SRT subtitle files

### 🔊 Text-to-Speech (TTS)
- **Text Input**: Convert any text to natural-sounding speech
- **Document Upload**: Process TXT, PDF, and DOCX files
- **Multiple Voices**: Choose from various voice models and providers
- **Multiple Providers**: OpenAI TTS, ElevenLabs, Azure, local Coqui TTS, Ollama

### 🎭 Voice Cloning
- **Voice Samples**: Record or upload voice samples
- **Profile Management**: Save and manage multiple voice profiles
- **Custom Voices**: Use your cloned voices for TTS generation
- **ElevenLabs Integration**: Professional voice cloning capabilities

### ⚙️ Model Management
- **Easy Switching**: Change between different AI providers on the fly
- **Configuration**: Simple YAML-based model configuration

## Quick Start

### Prerequisites
- Docker and Docker Compose
- API keys for desired providers (OpenAI, ElevenLabs, Google Cloud, Azure)

### Installation

1. **Clone the repository**
```bash
git clone <repo-url>
cd speech-text-speech
```

2. **Set up environment variables**
```bash
cp .env.example .env
nano .env  # Edit with your API keys
```

3. **Start the application**
```bash
docker-compose up -d
```

4. **Access the application**
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Documentation: http://localhost:8000/docs

## Configuration

### Environment Variables

Create a `.env` file with your API credentials:

```bash
# API Keys
OPENAI_API_KEY=sk-...
ELEVENLABS_API_KEY=...
GOOGLE_CREDENTIALS_PATH=/path/to/credentials.json
AZURE_SPEECH_KEY=...
AZURE_SPEECH_REGION=...

# Storage (SeaweedFS S3-compatible)
S3_ENDPOINT=http://seaweedfs:8333
S3_ACCESS_KEY=any_access_key
S3_SECRET_KEY=any_secret_key

# Database
DATABASE_URL=postgresql://user:pass@postgres:5432/stt_tts

# Application
DEBUG=false
LOG_LEVEL=info
MAX_FILE_SIZE=100MB
```

### Model Configuration

Edit `config/models.yaml` to configure available models:

```yaml
stt:
  default: openai-whisper
  providers:
    openai-whisper:
      type: api
      api_key: ${OPENAI_API_KEY}
      model: whisper-1

tts:
  default: elevenlabs
  providers:
    elevenlabs:
      type: api
      api_key: ${ELEVENLABS_API_KEY}
      model: eleven_multilingual_v2
```

## Architecture

The platform consists of:
- **Frontend**: React 18+ with TypeScript
- **Backend**: FastAPI (Python 3.11+) with uv for dependency management, serving as an API orchestrator
- **Database**: PostgreSQL for metadata and configurations
- **Storage**: SeaweedFS (S3-compatible) for audio files
- **Reverse Proxy**: Nginx

All ML inference is handled by external services via API - no local GPU required.

## Docker Services

The application runs the following services:

| Service | Port | Description |
|---------|------|-------------|
| Frontend | 3000 | React web interface |
| Backend | 8000 | FastAPI REST API |
| Nginx | 80 | Reverse proxy |
| PostgreSQL | 5432 | Database (internal) |
| SeaweedFS | 9333, 8333, 8080, 18080 | Object storage |
| Ollama (optional) | 11434 | Local TTS models |

## Usage

### Speech-to-Text

1. Navigate to the STT module
2. Choose to record live or upload an audio file
3. Select your preferred STT provider
4. Click "Transcribe"
5. View and export the transcription

### Text-to-Speech

1. Navigate to the TTS module
2. Enter text or upload a document (TXT, PDF, DOCX)
3. Select voice and provider
4. Click "Generate Speech"
5. Listen to or download the audio

### Voice Cloning

1. Navigate to Voice Cloning
2. Record or upload voice samples (1-25 samples recommended)
3. Create a voice profile
4. Use your cloned voice in TTS generation

## Development

### Project Structure

```
speech-text-speech/
├── frontend/          # React TypeScript application
├── backend/           # FastAPI Python application
├── nginx/             # Nginx configuration
├── storage/           # Local storage directories
├── scripts/           # Utility scripts
└── docker-compose.yml # Service orchestration
```

### Running in Development Mode

```bash
# Start with live reload
docker-compose -f docker-compose.dev.yml up

# View logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Run tests
docker-compose exec backend pytest
docker-compose exec frontend npm test
```

## Supported Providers

### Speech-to-Text
- ✅ OpenAI Whisper API
- ✅ Google Cloud Speech-to-Text
- ✅ Azure Speech Services
- ✅ Local Whisper.cpp

### Text-to-Speech
- ✅ OpenAI TTS API
- ✅ ElevenLabs
- ✅ Azure Speech Services
- ✅ Local Coqui TTS
- ✅ Ollama (local)

### Voice Cloning
- ✅ ElevenLabs Voice Cloning

## Troubleshooting

### Common Issues

**Services won't start**
```bash
# Check service status
docker-compose ps

# View logs
docker-compose logs

# Restart services
docker-compose restart
```

**API key errors**
- Verify your `.env` file has correct API keys
- Check API key permissions and quotas
- Ensure environment variables are loaded: `docker-compose config`

**Audio upload fails**
- Check file size (default max: 100MB)
- Verify supported format (MP3, WAV, M4A, FLAC)
- Check SeaweedFS is running: `docker-compose ps seaweedfs`

**Database connection errors**
```bash
# Reset database
docker-compose down -v
docker-compose up -d
```

## Performance

Expected performance for typical use cases:
- STT: < 5 seconds for 1-minute audio
- TTS: < 3 seconds for 100 words
- File upload: < 10 seconds for 10MB files

## Production Deployment

For production use, consider implementing:

### Security
- Use HTTPS with SSL certificates
- Implement authentication and authorization
- Use secrets management (Docker secrets, Vault)
- Enable rate limiting and DDoS protection
- Regular security audits

### Scalability & Monitoring
- Use Kubernetes for orchestration
- Implement horizontal pod autoscaling
- Add load balancing
- Use CDN for static assets
- Add Prometheus for metrics
- Use Grafana for dashboards
- Implement distributed tracing (Jaeger)
- Set up log aggregation (ELK stack)

### Caching & Session Management
- **Add Redis** for distributed caching and session management in multi-user environments
- Use cases: session storage, API response caching, rate limiting, job queues
- Configuration: `REDIS_URL=redis://redis:6379`

### Data Management
- Regular database backups
- Object storage replication
- Configuration versioning

## Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Resources

- [Technical Documentation](AGENTS.md) - For developers and AI agents
- [OpenAI API Documentation](https://platform.openai.com/docs)
- [ElevenLabs API Documentation](https://docs.elevenlabs.io/)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [React Documentation](https://react.dev/)

## Support

For issues and questions:
- Open an issue on GitHub
- Check existing issues for solutions
- Review the [Technical Documentation](AGENTS.md)

## Roadmap

Future enhancements to explore:
- Real-time translation
- Speaker diarization
- Emotion detection in speech
- Background noise removal
- Audio quality enhancement
- Multi-user support with collaboration features
- Advanced document processing (Docling integration)
- Cost tracking dashboard
- Model performance comparison tools
- Additional provider integrations (Hugging Face, Google Cloud TTS)
- Local voice cloning capabilities
- CLI tool and browser extension