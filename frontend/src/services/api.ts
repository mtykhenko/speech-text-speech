import axios, { AxiosInstance } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

class ApiService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  // ============================================================================
  // Speech-to-Text (STT) Methods
  // ============================================================================

  /**
   * Transcribe an audio file
   */
  async transcribeAudio(
    file: File,
    provider?: string,
    language?: string
  ): Promise<TranscriptionResponse> {
    const formData = new FormData();
    formData.append('file', file);
    if (provider) formData.append('provider', provider);
    if (language) formData.append('language', language);

    const response = await this.client.post<TranscriptionResponse>(
      '/api/v1/stt/transcribe',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    return response.data;
  }

  /**
   * Get transcription by ID
   */
  async getTranscription(id: string): Promise<TranscriptionResponse> {
    const response = await this.client.get<TranscriptionResponse>(
      `/api/v1/stt/transcriptions/${id}`
    );
    return response.data;
  }

  /**
   * List available STT models
   */
  async listSTTModels(): Promise<string[]> {
    const response = await this.client.get<{ models: string[] }>(
      '/api/v1/stt/models'
    );
    return response.data.models;
  }

  // ============================================================================
  // Text-to-Speech (TTS) Methods
  // ============================================================================

  /**
   * Generate speech from text
   */
  async generateSpeech(request: GenerateSpeechRequest): Promise<GenerationResponse> {
    const response = await this.client.post<GenerationResponse>(
      '/api/v1/tts/generate',
      request
    );
    return response.data;
  }

  /**
   * Generate speech from a document file
   */
  async generateSpeechFromDocument(
    file: File,
    options: {
      provider?: string;
      voice_id?: string;
      output_format?: string;
      speed?: number;
      model?: string;
    } = {}
  ): Promise<GenerationResponse[]> {
    const formData = new FormData();
    formData.append('file', file);
    
    if (options.provider) formData.append('provider', options.provider);
    if (options.voice_id) formData.append('voice_id', options.voice_id);
    if (options.output_format) formData.append('output_format', options.output_format);
    if (options.speed !== undefined) formData.append('speed', options.speed.toString());
    if (options.model) formData.append('model', options.model);

    const response = await this.client.post<GenerationResponse[]>(
      '/api/v1/tts/generate-document',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    return response.data;
  }

  /**
   * Get audio file URL
   */
  getAudioUrl(generationId: string): string {
    return `${API_BASE_URL}/api/v1/tts/audio/${generationId}`;
  }

  /**
   * Get generation metadata by ID
   */
  async getGeneration(id: string): Promise<GenerationResponse> {
    const response = await this.client.get<GenerationResponse>(
      `/api/v1/tts/generations/${id}`
    );
    return response.data;
  }

  /**
   * List available voices for a provider
   */
  async listVoices(provider?: string): Promise<VoiceInfo[]> {
    const params = provider ? { provider } : {};
    const response = await this.client.get<VoiceInfo[]>(
      '/api/v1/tts/voices',
      { params }
    );
    return response.data;
  }

  /**
   * List available TTS providers
   */
  async listTTSProviders(): Promise<string[]> {
    const response = await this.client.get<{ providers: string[] }>(
      '/api/v1/tts/providers'
    );
    return response.data.providers;
  }

  /**
   * Check health of TTS providers
   */
  async checkTTSHealth(provider?: string): Promise<Record<string, boolean>> {
    const params = provider ? { provider } : {};
    const response = await this.client.get<{ providers: Record<string, boolean> }>(
      '/api/v1/tts/health',
      { params }
    );
    return response.data.providers;
  }

  // ============================================================================
  // General Methods
  // ============================================================================

  /**
   * Health check
   */
  async healthCheck(): Promise<{ status: string; service: string }> {
    const response = await this.client.get('/health');
    return response.data;
  }
}

// ============================================================================
// Type Definitions
// ============================================================================

export interface TranscriptionResponse {
  id: string;
  text: string;
  language?: string;
  confidence?: number;
  provider: string;
  model: string;
  segments?: TranscriptionSegment[];
  created_at: string;
}

export interface TranscriptionSegment {
  text: string;
  start: number;
  end: number;
  confidence?: number;
}

export interface GenerateSpeechRequest {
  text: string;
  provider?: string;
  voice_id?: string;
  output_format?: string;
  speed?: number;
  model?: string;
}

export interface GenerationResponse {
  id: string;
  audio_url: string;
  text: string;
  provider: string;
  voice_id?: string;
  format: string;
  size: number;
  created_at: string;
  chunk_index?: number;
  total_chunks?: number;
}

export interface VoiceInfo {
  id: string;
  name: string;
  description?: string;
}

// Export singleton instance
export const apiService = new ApiService();
export default apiService;
