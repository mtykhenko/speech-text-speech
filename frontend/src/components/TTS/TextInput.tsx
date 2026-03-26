import React, { useState, useEffect } from 'react';
import { Volume2, Download } from 'lucide-react';
import apiService, { GenerationResponse, VoiceInfo } from '../../services/api';

interface TextInputProps {
  onGenerationComplete?: (generation: GenerationResponse) => void;
}

const TextInput: React.FC<TextInputProps> = ({ onGenerationComplete }) => {
  const [text, setText] = useState('');
  const [provider, setProvider] = useState('openai-tts');
  const [voiceId, setVoiceId] = useState('');
  const [speed, setSpeed] = useState(1.0);
  const [outputFormat, setOutputFormat] = useState('mp3');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generation, setGeneration] = useState<GenerationResponse | null>(null);
  const [voices, setVoices] = useState<VoiceInfo[]>([]);
  const [providers, setProviders] = useState<string[]>([]);

  const MAX_LENGTH = 4000;
  const characterCount = text.length;
  const isOverLimit = characterCount > MAX_LENGTH;

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

  const handleGenerate = async () => {
    if (!text.trim()) {
      setError('Please enter some text');
      return;
    }

    if (isOverLimit) {
      setError(`Text exceeds maximum length of ${MAX_LENGTH} characters`);
      return;
    }

    setLoading(true);
    setError(null);
    setGeneration(null);

    try {
      const result = await apiService.generateSpeech({
        text: text.trim(),
        provider,
        voice_id: voiceId || undefined,
        output_format: outputFormat,
        speed,
      });

      setGeneration(result);
      if (onGenerationComplete) {
        onGenerationComplete(result);
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to generate speech');
      console.error('Generation error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (generation) {
      const link = document.createElement('a');
      link.href = apiService.getAudioUrl(generation.id);
      link.download = `speech_${generation.id}.${generation.format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 p-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-gray-900">Text-to-Speech</h2>
        <p className="text-gray-600">Enter text to convert to speech</p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded">
          <p className="font-semibold">Error</p>
          <p className="text-sm">{error}</p>
        </div>
      )}

      <div className="space-y-2">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Enter text to convert to speech..."
          rows={8}
          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none ${
            isOverLimit ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        <div className="flex justify-between text-sm">
          <span className={isOverLimit ? 'text-red-600 font-semibold' : 'text-gray-600'}>
            {characterCount} / {MAX_LENGTH} characters
          </span>
          {isOverLimit && <span className="text-red-600 font-semibold">Text too long!</span>}
        </div>
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
        disabled={loading || !text.trim() || isOverLimit}
        className={`w-full py-4 rounded-lg font-semibold text-lg transition-all flex items-center justify-center gap-2 ${
          loading || !text.trim() || isOverLimit
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

      {generation && (
        <div className="p-6 bg-gray-50 border border-gray-200 rounded-lg space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Generated Audio</h3>
          
          <audio
            controls
            src={apiService.getAudioUrl(generation.id)}
            className="w-full"
          />

          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-600">
              Provider: {generation.provider} | Voice: {generation.voice_id || 'default'} | Size: {(generation.size / 1024).toFixed(1)} KB
            </p>
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              Download
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TextInput;