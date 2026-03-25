# Speech-to-Text & Text-to-Speech Platform - Technical Documentation

This document contains technical architecture, implementation details, and development guidelines for AI agents and developers working on this project.

## Backend Workload Analysis & Technology Selection

### Workload Characteristics

The backend serves as an **API orchestrator** that coordinates between the frontend, external ML services, and storage systems. The workload is predominantly IO-intensive:

#### IO-Intensive Operations (90%+ of workload)
- **File Upload/Download**: Handling large audio files (up to 100MB)
- **External API Calls**: Communication with OpenAI, Google Cloud, Azure, ElevenLabs, Ollama APIs
- **Database Operations**: CRUD operations for voice profiles, transcriptions, configurations
- **Object Storage**: Reading/writing audio files to SeaweedFS (S3-compatible storage)
- **Network Streaming**: WebSocket connections for real-time transcription
- **Document Processing**: Reading PDF, DOCX files for TTS input

#### Light Processing Operations (<10% of workload)
- **Audio Format Conversion**: Basic format conversion for API compatibility (MP3, WAV, etc.)
- **Document Parsing**: Text extraction from PDF/DOCX files
- **Data Validation**: Request/response validation and transformation

**Note**: All ML inference (STT, TTS, voice cloning) is handled by external services accessed via API. The backend does not perform local model inference, GPU operations, or scientific computing.

### Technology Decision: Python (FastAPI)

**Selected Technology**: Python 3.11+ with FastAPI framework

#### Why Python Over Node.js

**Python Advantages for This Project**:

1. **API Integration Ecosystem**
   - Mature SDKs for OpenAI, Google Cloud, Azure, ElevenLabs
   - Extensive HTTP client libraries (aiohttp, httpx) for async API calls
   - Well-established patterns for API orchestration
   - Rich ecosystem for external service integration

2. **Audio File Handling**
   - Superior audio manipulation libraries (pydub, soundfile)
   - Mature audio format conversion tools
   - Efficient handling of binary audio data
   - Simple audio metadata extraction

3. **Async IO Performance**
   - FastAPI with asyncio handles IO-bound operations efficiently
   - Excellent performance for API gateway tasks (comparable to Node.js)
   - Native async/await support for concurrent external API calls
   - Efficient handling of multiple simultaneous requests

4. **Type Safety & Developer Experience**
   - Strong typing with Python 3.11+ type hints
   - FastAPI automatic API documentation (OpenAPI/Swagger)
   - Pydantic for data validation and serialization
   - Clear error handling and debugging

5. **Document Processing**
   - Lightweight libraries for PDF (PyPDF2) and DOCX (python-docx) parsing
   - Simple text extraction for TTS input
   - Efficient handling of large documents
   - Future upgrade path: Docling for advanced document understanding (see Future Enhancements)

**Node.js Limitations for This Project**:

1. **API SDK Ecosystem**
   - Less mature SDKs for some ML service providers
   - Fewer established patterns for ML API orchestration
   - Smaller community around ML service integration

2. **Audio File Handling**
   - Fewer mature audio processing libraries
   - More complex binary audio data handling
   - Limited audio format conversion options
   - Less straightforward audio metadata extraction

3. **Document Processing**
   - Less robust PDF parsing libraries
   - More complex DOCX text extraction
   - Fewer options for document format handling

#### Performance Considerations

**For IO-Bound Operations** (90%+ of workload):
- Python with asyncio performs excellently for API orchestration
- FastAPI benchmarks show comparable throughput to Node.js/Express.js
- Efficient handling of concurrent external API calls
- Minimal CPU overhead for request routing and data transformation

**For Light Processing Operations** (<10% of workload):
- Audio format conversion handled efficiently by pydub
- Document parsing is fast enough for typical use cases
- No performance bottlenecks expected for orchestration tasks

**Architecture Simplicity**:
- Single-language stack reduces complexity
- No need for microservices or worker processes
- Straightforward deployment and debugging
- Easy to maintain and extend

### Conclusion

Python with FastAPI is the optimal choice because:
- The backend serves as an **API orchestrator** with 90%+ IO-bound operations
- FastAPI excels at handling concurrent external API calls efficiently
- Superior ecosystem for audio file handling and document processing
- Mature SDKs for all target ML service providers (OpenAI, Google, Azure, ElevenLabs, Ollama)
- Excellent type safety and automatic API documentation
- Single-language stack reduces complexity and deployment overhead
- Better long-term maintainability and feature extensibility

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Web UI (React)                       │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │   STT    │  │   TTS    │  │  Voice   │  │  Model   │   │
│  │  Module  │  │  Module  │  │ Cloning  │  │  Config  │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    API Gateway (FastAPI)                     │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Model Adapter Layer                      │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐           │  │
│  │  │ OpenAI   │  │  Google  │  │  Azure   │  ...      │  │
│  │  │ Adapter  │  │ Adapter  │  │ Adapter  │           │  │
│  │  └──────────┘  └──────────┘  └──────────┘           │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Storage Layer                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                 │
│  │  Audio   │  │  Voice   │  │  Config  │                 │
│  │  Files   │  │ Profiles │  │   DB     │                 │
│  └──────────┘  └──────────┘  └──────────┘                 │
└─────────────────────────────────────────────────────────────┘
```

## Technology Stack

### Frontend
- **Framework**: React 18+ with TypeScript
- **UI Library**: Material-UI (MUI) or Tailwind CSS + shadcn/ui
- **Audio Recording**: RecordRTC or MediaRecorder API
- **Audio Playback**: Howler.js or native HTML5 Audio
- **File Upload**: react-dropzone
- **State Management**: Zustand or React Context
- **HTTP Client**: Axios

### Backend
- **Framework**: FastAPI (Python 3.11+)
- **Dependency Management**: uv (fast Python package installer and resolver)
- **Async Support**: asyncio, aiohttp
- **File Processing**: 
  - Audio: pydub, librosa
  - Documents: python-docx, PyPDF2
- **Model Integrations**:
  - OpenAI SDK
  - Google Cloud SDK
  - Azure SDK
  - ElevenLabs SDK
  - Transformers (Hugging Face)
  - Faster-Whisper (local STT)
  - Coqui TTS (local TTS)

### Storage
- **Database**: PostgreSQL (for metadata, configs, voice profiles)
- **Object Storage**: SeaweedFS (S3-compatible, Apache 2.0) for audio files
  - **Why SeaweedFS**: Replaced MinIO due to AGPLv3 license change. SeaweedFS offers true open-source (Apache 2.0), excellent performance for large audio files, simple architecture, and full S3 API compatibility
  - **Alternatives Considered**: Zenko CloudServer (Apache 2.0), Ceph RGW (complex), Garage (AGPLv3), RustFS (not production-ready)
- **Temporary Storage**: Filesystem-based (for temporary files during processing)
  - **Note**: Redis cache moved to production considerations (unnecessary for single-user, non-production use)

### Infrastructure
- **Containerization**: Docker + Docker Compose
- **Reverse Proxy**: Nginx
- **Orchestration**: Kubernetes (optional, for production)

## Project Structure

```
speech-text-speech/
├── docker-compose.yml
├── .env.example
├── README.md
├── AGENTS.md
│
├── frontend/
│   ├── Dockerfile
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   ├── public/
│   └── src/
│       ├── components/
│       │   ├── STT/
│       │   │   ├── LiveRecorder.tsx
│       │   │   ├── FileUploader.tsx
│       │   │   └── TranscriptionDisplay.tsx
│       │   ├── TTS/
│       │   │   ├── TextInput.tsx
│       │   │   ├── DocumentUploader.tsx
│       │   │   └── AudioPlayer.tsx
│       │   ├── VoiceCloning/
│       │   │   ├── VoiceRecorder.tsx
│       │   │   ├── VoiceUploader.tsx
│       │   │   └── VoiceProfileManager.tsx
│       │   └── ModelConfig/
│       │       └── ModelSelector.tsx
│       ├── services/
│       │   └── api.ts
│       ├── hooks/
│       ├── types/
│       └── App.tsx
│
├── backend/
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── pyproject.toml
│   └── app/
│       ├── main.py
│       ├── config.py
│       ├── models/
│       │   ├── database.py
│       │   └── schemas.py
│       ├── routers/
│       │   ├── stt.py
│       │   ├── tts.py
│       │   ├── voice.py
│       │   └── config.py
│       ├── services/
│       │   ├── adapters/
│       │   │   ├── base.py
│       │   │   ├── openai_adapter.py
│       │   │   ├── google_adapter.py
│       │   │   ├── azure_adapter.py
│       │   │   ├── elevenlabs_adapter.py
│       │   │   ├── local_whisper_adapter.py
│       │   │   └── local_tts_adapter.py
│       │   ├── stt_service.py
│       │   ├── tts_service.py
│       │   └── voice_service.py
│       └── utils/
│           ├── audio_processing.py
│           └── file_handling.py
│
├── nginx/
│   ├── Dockerfile
│   └── nginx.conf
│
├── storage/
│   ├── audio/
│   ├── voices/
│   └── documents/
│
└── scripts/
    ├── setup.sh
    └── test_models.py
```

## Implementation Phases

### Phase 1: Foundation (Week 1-2)
**Goal**: Set up basic infrastructure and core functionality

- [ ] Initialize project structure
- [ ] Set up Docker Compose with all services
- [ ] Create database schema and migrations
- [ ] Implement basic FastAPI backend with health checks
- [ ] Create React frontend skeleton with routing
- [ ] Set up SeaweedFS for object storage
- [ ] Configure environment variables and secrets management

### Phase 2: Speech-to-Text (Week 2-3)
**Goal**: Implement STT functionality with multiple providers

- [ ] Implement adapter pattern for STT models
- [ ] Add OpenAI Whisper integration
- [ ] Add local Whisper.cpp integration
- [ ] Create file upload endpoint with validation
- [ ] Implement live recording in frontend
- [ ] Create transcription display component
- [ ] Add export functionality (TXT, JSON, SRT)
- [ ] Implement error handling and retry logic

### Phase 3: Text-to-Speech (Week 3-4)
**Goal**: Implement TTS functionality with multiple providers

- [ ] Implement adapter pattern for TTS models
- [ ] Add OpenAI TTS integration
- [ ] Add ElevenLabs integration
- [ ] Add local Coqui TTS integration
- [ ] Create text input component with character limits
- [ ] Implement document upload and parsing (TXT, PDF, DOCX)
- [ ] Create audio player component
- [ ] Add audio download functionality
- [ ] Implement streaming for long text generation

### Phase 4: Voice Cloning (Week 4-5)
**Goal**: Add voice cloning and profile management

- [ ] Design voice profile database schema
- [ ] Implement voice sample recording in frontend
- [ ] Create voice sample upload endpoint
- [ ] Add voice profile CRUD operations
- [ ] Integrate voice cloning with ElevenLabs
- [ ] Implement local voice cloning (if feasible)
- [ ] Create voice profile management UI
- [ ] Add voice selection to TTS workflow

### Phase 5: Model Management (Week 5-6)
**Goal**: Easy model switching and configuration

- [ ] Create model configuration schema
- [ ] Implement model registry system
- [ ] Add model configuration UI
- [ ] Create model testing utilities
- [ ] Add cost estimation for paid APIs
- [ ] Implement model performance metrics
- [ ] Add model comparison features
- [ ] Create documentation for adding new models

### Phase 6: Polish & Optimization (Week 6-7)
**Goal**: Improve UX and performance

- [ ] Add loading states and progress indicators
- [ ] Implement caching for repeated requests
- [ ] Add batch processing capabilities
- [ ] Optimize audio file handling
- [ ] Add comprehensive error messages
- [ ] Implement rate limiting
- [ ] Add usage analytics
- [ ] Create user documentation

### Phase 7: Testing & Deployment (Week 7-8)
**Goal**: Ensure reliability and ease of deployment

- [ ] Write unit tests for backend services
- [ ] Write integration tests for API endpoints
- [ ] Add frontend component tests
- [ ] Create end-to-end tests
- [ ] Set up CI/CD pipeline
- [ ] Create deployment documentation
- [ ] Add monitoring and logging
- [ ] Perform security audit

## API Endpoints

### Speech-to-Text
- `POST /api/v1/stt/transcribe` - Transcribe uploaded audio file
- `POST /api/v1/stt/transcribe-stream` - Real-time transcription (WebSocket)
- `GET /api/v1/stt/transcriptions/{id}` - Get transcription by ID
- `GET /api/v1/stt/models` - List available STT models

### Text-to-Speech
- `POST /api/v1/tts/generate` - Generate speech from text
- `POST /api/v1/tts/generate-document` - Generate speech from document
- `GET /api/v1/tts/audio/{id}` - Get generated audio file
- `GET /api/v1/tts/models` - List available TTS models

### Voice Cloning
- `POST /api/v1/voice/profiles` - Create voice profile
- `GET /api/v1/voice/profiles` - List voice profiles
- `GET /api/v1/voice/profiles/{id}` - Get voice profile
- `PUT /api/v1/voice/profiles/{id}` - Update voice profile
- `DELETE /api/v1/voice/profiles/{id}` - Delete voice profile
- `POST /api/v1/voice/profiles/{id}/samples` - Add voice sample

### Configuration
- `GET /api/v1/config/models` - Get current model configuration
- `PUT /api/v1/config/models` - Update model configuration
- `POST /api/v1/config/test-model` - Test model connection

## Model Adapter Interface

### Base Adapter Class
```python
from abc import ABC, abstractmethod
from typing import Optional, Dict, Any

class BaseSTTAdapter(ABC):
    @abstractmethod
    async def transcribe(
        self,
        audio_file: bytes,
        language: Optional[str] = None,
        **kwargs
    ) -> Dict[str, Any]:
        """
        Transcribe audio to text.
        
        Returns:
            {
                "text": str,
                "language": str,
                "confidence": float,
                "segments": List[Dict],
                "metadata": Dict
            }
        """
        pass

class BaseTTSAdapter(ABC):
    @abstractmethod
    async def generate_speech(
        self,
        text: str,
        voice_id: Optional[str] = None,
        **kwargs
    ) -> bytes:
        """
        Generate speech from text.
        
        Returns:
            Audio file bytes
        """
        pass
```

## Configuration System

### Model Configuration Format
```yaml
# config/models.yaml
stt:
  default: openai-whisper
  providers:
    openai-whisper:
      type: api
      api_key: ${OPENAI_API_KEY}
      model: whisper-1
      language: auto
    
    local-whisper:
      type: local
      model_path: ./models/whisper-large-v3
      device: cuda  # or cpu
      language: auto
    
    google-stt:
      type: api
      credentials_path: ${GOOGLE_CREDENTIALS_PATH}
      model: latest_long
      language: en-US

tts:
  default: elevenlabs
  providers:
    elevenlabs:
      type: api
      api_key: ${ELEVENLABS_API_KEY}
      model: eleven_multilingual_v2
      voice_id: default
    
    openai-tts:
      type: api
      api_key: ${OPENAI_API_KEY}
      model: tts-1-hd
      voice: alloy
    
    local-coqui:
      type: local
      model_path: ./models/tts_models--en--ljspeech--tacotron2-DDC
      vocoder_path: ./models/vocoder_models--en--ljspeech--hifigan_v2
    
    ollama-tts:
      type: local
      endpoint: http://ollama:11434
      model: xtts-v2

voice_cloning:
  default: elevenlabs
  providers:
    elevenlabs:
      type: api
      api_key: ${ELEVENLABS_API_KEY}
      min_samples: 1
      max_samples: 25
```

## Testing Strategy

### Unit Tests
- Test each adapter independently
- Mock external API calls
- Test audio processing utilities
- Test file handling functions

### Integration Tests
- Test API endpoints
- Test database operations
- Test file storage operations
- Test model switching

### End-to-End Tests
- Test complete STT workflow
- Test complete TTS workflow
- Test voice cloning workflow
- Test model configuration changes

## Success Metrics

1. **Functionality**:
   - All core features working
   - Support for at least 3 STT providers
   - Support for at least 3 TTS providers
   - Voice cloning functional

2. **Performance**:
   - STT latency < 5 seconds for 1-minute audio
   - TTS generation < 3 seconds for 100 words
   - File upload < 10 seconds for 10MB files

3. **Usability**:
   - Intuitive UI requiring no documentation
   - Clear error messages
   - Responsive design (mobile-friendly)

4. **Reliability**:
   - 99% uptime
   - Graceful error handling
   - Automatic retry for transient failures

## Production Considerations

### Security
- Use secrets management (e.g., Docker secrets, Vault)
- Enable HTTPS with SSL certificates
- Implement authentication and authorization
- Add rate limiting and DDoS protection

### Scalability
- Use Kubernetes for orchestration
- Implement horizontal pod autoscaling
- Add load balancing
- Use CDN for static assets

### Caching & Session Management (Multi-user Production)
- **Add Redis** for distributed caching and session management
- **Use cases**:
  - Session storage for multi-user authentication
  - Caching API responses to reduce external API costs
  - Rate limiting across multiple backend instances
  - Temporary file metadata for distributed systems
  - Job queue for background processing
- **Not needed for single-user development**: Filesystem-based temporary storage is sufficient
- **Configuration**: `REDIS_URL=redis://redis:6379`

### Monitoring
- Add Prometheus for metrics
- Use Grafana for dashboards
- Implement distributed tracing (Jaeger)
- Set up log aggregation (ELK stack)

### Backup
- Regular database backups
- Object storage replication
- Configuration versioning

## Future Enhancements

### Advanced Features
- Real-time translation
- Speaker diarization
- Emotion detection in speech
- Background noise removal
- Audio quality enhancement

### Advanced Document Processing (Docling Integration)
- **Upgrade from PyPDF2/python-docx to Docling** for enhanced document understanding
- **Benefits**:
  - Multi-format support (PDF, DOCX, PPTX, XLSX, HTML, images, audio)
  - Advanced PDF understanding (layout analysis, table structure, reading order)
  - AI-ready structured output (optimized for LLM consumption)
  - OCR capabilities for scanned documents
  - Unified document representation across formats
  - Export to multiple formats (Markdown, HTML, JSON)
- **Use Cases**:
  - Better text extraction from complex PDFs with tables and multi-column layouts
  - Preserve document structure for context-aware TTS
  - Extract structured data for future AI features
  - Handle scanned documents with OCR
- **Implementation Considerations**:
  - MIT license (commercial-friendly)
  - Requires Python 3.10+
  - Active development (56.5k stars, enterprise backing)
  - Some features in beta (structured extraction)
  - Test thoroughly with target document types before production use

### Collaboration
- Multi-user support
- Shared voice profiles
- Project workspaces
- Version history

### Analytics
- Usage statistics
- Cost tracking per model
- Quality metrics comparison
- A/B testing framework

### Integrations
- Webhook support
- REST API for external apps
- CLI tool
- Browser extension

## Resources & References

### Documentation
- [OpenAI Whisper API](https://platform.openai.com/docs/guides/speech-to-text)
- [OpenAI TTS API](https://platform.openai.com/docs/guides/text-to-speech)
- [ElevenLabs API](https://docs.elevenlabs.io/)
- [Google Cloud Speech](https://cloud.google.com/speech-to-text/docs)
- [Azure Speech Services](https://learn.microsoft.com/en-us/azure/cognitive-services/speech-service/)
- [Coqui TTS](https://github.com/coqui-ai/TTS)
- [Faster Whisper](https://github.com/guillaumekln/faster-whisper)

### Tools
- [FastAPI](https://fastapi.tiangolo.com/)
- [React](https://react.dev/)
- [Docker](https://docs.docker.com/)
- [SeaweedFS](https://github.com/seaweedfs/seaweedfs/wiki)
