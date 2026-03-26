import React, { useState, useEffect } from 'react';
import { Upload, Download, X, Volume2 } from 'lucide-react';
import apiService, { GenerationResponse, VoiceInfo } from '../../services/api';

interface DocumentUploaderProps {
  onGenerationComplete?: (generations: GenerationResponse[]) => void;
}

const DocumentUploader: React.FC<DocumentUploaderProps> = ({ onGenerationComplete }) => {
  const [file, setFile] = useState<File | null>(null);
  const [provider, setProvider] = useState('openai-tts');
  const [voiceId, setVoiceId] = useState('');
  const [speed, setSpeed] = useState(1.0);
  const [outputFormat, setOutputFormat] = useState('mp3');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generations, setGenerations] = useState<GenerationResponse[]>([]);
  const [voices, setVoices] = useState<VoiceInfo[]>([]);
  const [providers, setProviders] = useState<string[]>([]);

  const SUPPORTED_FORMATS = ['.txt', '.pdf', '.docx', '.doc'];
  const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB

  // Load providers and voices on mount
  useEffect(() => {
    loadProviders();
  }, []);

  useEffect(() => {
    if (provider) {
      loadVoices(provider);
    }
  }, [provider]);

  const loadProviders = async () => {
    try {
      const providerList = await apiService.listTTSProviders();
      setProviders(providerList);
      if (providerList.length > 0 && !provider) {
        setProvider(providerList[0]);
      }
    } catch (err) {
      console.error('Failed to load providers:', err);
    }
  };

  const loadVoices = async (selectedProvider: string) => {
    try {
      const voiceList = await apiService.listVoices(selectedProvider);
      setVoices(voiceList);
      if (voiceList.length > 0) {
        setVoiceId(voiceList[0].id);
      }
    } catch (err) {
      console.error('Failed to load voices:', err);
      setVoices([]);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    // Validate file type
    const fileExt = '.' + selectedFile.name.split('.').pop()?.toLowerCase();
    if (!SUPPORTED_FORMATS.includes(fileExt)) {
      setError(`Unsupported file format. Supported formats: ${SUPPORTED_FORMATS.join(', ')}`);
      return;
    }

    // Validate file size
    if (selectedFile.size > MAX_FILE_SIZE) {
      setError(`File size exceeds maximum of ${MAX_FILE_SIZE / (1024 * 1024)} MB`);
      return;
    }

    setFile(selectedFile);
    setError(null);
    setGenerations([]);
  };

  const handleGenerate = async () => {
    if (!file) {
      setError('Please select a file');
      return;
    }

    setLoading(true);
    setError(null);
    setGenerations([]);

    try {
      const results = await apiService.generateSpeechFromDocument(file, {
        provider,
        voice_id: voiceId || undefined,
        output_format: outputFormat,
        speed,
      });

      setGenerations(results);
      if (onGenerationComplete) {
        onGenerationComplete(results);
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to generate speech from document');
      console.error('Generation error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = (generation: GenerationResponse) => {
    const link = document.createElement('a');
    link.href = apiService.getAudioUrl(generation.id);
    link.download = `speech_${generation.id}.${generation.format}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleRemoveFile = () => {
    setFile(null);
    setGenerations([]);
    setError(null);
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 p-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-gray-900">Document to Speech</h2>
        <p className="text-gray-600">
          Upload a document (TXT, PDF, DOCX) to convert to speech. Long documents will be automatically split into chunks.
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded">
          <p className="font-semibold">Error</p>
          <p className="text-sm">{error}</p>
        </div>
      )}

      <div className="space-y-4">
        <input
          accept=".txt,.pdf,.docx,.doc"
          style={{ display: 'none' }}
          id="document-upload"
          type="file"
          onChange={handleFileChange}
        />
        <label htmlFor="document-upload">
          <div className="flex items-center justify-center w-full px-6 py-4 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors">
            <div className="flex items-center gap-3">
              <Upload className="w-6 h-6 text-gray-600" />
              <span className="text-gray-700 font-medium">Select Document</span>
            </div>
          </div>
        </label>

        {file && (
          <div className="flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <div className="flex-1">
              <p className="font-medium text-gray-900">{file.name}</p>
              <p className="text-sm text-gray-600">{(file.size / 1024).toFixed(1)} KB</p>
            </div>
            <button
              onClick={handleRemoveFile}
              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700">Provider</label>
          <select
            value={provider}
            onChange={(e) => setProvider(e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
          >
            {providers.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700">Voice</label>
          <select
            value={voiceId}
            onChange={(e) => setVoiceId(e.target.value)}
            disabled={voices.length === 0}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white disabled:bg-gray-100"
          >
            {voices.map((voice) => (
              <option key={voice.id} value={voice.id}>{voice.name}</option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700">Format</label>
          <select
            value={outputFormat}
            onChange={(e) => setOutputFormat(e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
          >
            <option value="mp3">MP3</option>
            <option value="wav">WAV</option>
            <option value="opus">Opus</option>
            <option value="flac">FLAC</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700">Speed: {speed.toFixed(2)}x</label>
          <input
            type="range"
            min="0.25"
            max="4"
            step="0.25"
            value={speed}
            onChange={(e) => setSpeed(parseFloat(e.target.value))}
            className="w-full"
          />
        </div>
      </div>

      <button
        onClick={handleGenerate}
        disabled={loading || !file}
        className={`w-full py-4 rounded-lg font-semibold text-lg transition-all flex items-center justify-center gap-2 ${
          loading || !file
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-blue-600 hover:bg-blue-700 text-white'
        }`}
      >
        {loading ? (
          <>
            <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
            Generating...
          </>
        ) : (
          <>
            <Volume2 className="w-5 h-5" />
            Generate Speech
          </>
        )}
      </button>

      {generations.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-gray-900">Generated Audio</h3>
            {generations.length > 1 && (
              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded">
                {generations.length} chunks
              </span>
            )}
          </div>

          <div className="space-y-4">
            {generations.map((generation, index) => (
              <div
                key={generation.id}
                className="p-4 bg-gray-50 border border-gray-200 rounded-lg space-y-3"
              >
                <div className="flex justify-between items-center">
                  <p className="font-medium text-gray-900">
                    {generations.length > 1 ? `Chunk ${index + 1} of ${generations.length}` : 'Audio'}
                  </p>
                  <button
                    onClick={() => handleDownload(generation)}
                    className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </button>
                </div>

                <audio
                  controls
                  src={apiService.getAudioUrl(generation.id)}
                  className="w-full"
                />

                <p className="text-xs text-gray-600">
                  Provider: {generation.provider} | Voice: {generation.voice_id || 'default'} | Size: {(generation.size / 1024).toFixed(1)} KB
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentUploader;