import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, AlertCircle, CheckCircle } from 'lucide-react';

interface LiveRecorderProps {
  onTranscriptionComplete?: (result: TranscriptionResult) => void;
  onError?: (error: string) => void;
}

interface TranscriptionResult {
  id: number;
  text: string;
  language: string;
  confidence?: number;
  segments: Array<{
    text: string;
    start: number;
    end: number;
    confidence?: number;
  }>;
  metadata: Record<string, any>;
  provider: string;
  model: string;
  audio_file_path: string;
  created_at: string;
}

const LiveRecorder: React.FC<LiveRecorderProps> = ({ onTranscriptionComplete, onError }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [provider, setProvider] = useState<string>('');
  const [language, setLanguage] = useState<string>('');

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      setError('');
      setSuccess('');
      audioChunksRef.current = [];

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach(track => track.stop());
        await processRecording();
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to access microphone';
      setError(errorMessage);
      if (onError) {
        onError(errorMessage);
      }
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const processRecording = async () => {
    setIsProcessing(true);
    setError('');

    try {
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      
      // Convert to a format the backend can handle
      const formData = new FormData();
      formData.append('file', audioBlob, 'recording.webm');
      if (provider) formData.append('provider', provider);
      if (language) formData.append('language', language);
      formData.append('response_format', 'verbose_json');

      const response = await fetch('http://localhost:8000/api/v1/stt/transcribe', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Transcription failed');
      }

      const result: TranscriptionResult = await response.json();
      setSuccess('Recording transcribed successfully!');
      
      if (onTranscriptionComplete) {
        onTranscriptionComplete(result);
      }

      // Reset after success
      setTimeout(() => {
        setSuccess('');
        setRecordingTime(0);
      }, 2000);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Processing failed';
      setError(errorMessage);
      if (onError) {
        onError(errorMessage);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-6 space-y-4">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">Live Recording</h2>
        <p className="text-gray-600">
          Record audio directly from your microphone and transcribe it in real-time.
        </p>
      </div>

      {/* Recording Area */}
      <div className="border-2 border-gray-300 rounded-lg p-8 text-center space-y-6">
        {/* Recording Button */}
        <div className="flex justify-center">
          {!isRecording ? (
            <button
              onClick={startRecording}
              disabled={isProcessing}
              className={`
                w-24 h-24 rounded-full flex items-center justify-center transition-all
                ${isProcessing 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-red-500 hover:bg-red-600 hover:scale-110'
                }
              `}
            >
              <Mic className="w-12 h-12 text-white" />
            </button>
          ) : (
            <button
              onClick={stopRecording}
              className="w-24 h-24 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center animate-pulse transition-all hover:scale-110"
            >
              <Square className="w-12 h-12 text-white" />
            </button>
          )}
        </div>

        {/* Recording Status */}
        {isRecording && (
          <div className="space-y-2">
            <div className="flex items-center justify-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
              <span className="text-lg font-medium">Recording...</span>
            </div>
            <p className="text-3xl font-mono font-bold text-gray-700">
              {formatTime(recordingTime)}
            </p>
          </div>
        )}

        {isProcessing && (
          <div className="space-y-2">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-lg font-medium">Processing recording...</p>
          </div>
        )}

        {!isRecording && !isProcessing && (
          <p className="text-gray-500">
            Click the microphone to start recording
          </p>
        )}
      </div>

      {/* Options */}
      {!isRecording && !isProcessing && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Provider (Optional)</label>
            <select
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Default (OpenAI Whisper)</option>
              <option value="openai-whisper">OpenAI Whisper</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Language (Optional)</label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Auto-detect</option>
              <option value="en">English</option>
              <option value="es">Spanish</option>
              <option value="fr">French</option>
              <option value="de">German</option>
              <option value="it">Italian</option>
              <option value="pt">Portuguese</option>
              <option value="ru">Russian</option>
              <option value="ja">Japanese</option>
              <option value="zh">Chinese</option>
            </select>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
          <CheckCircle className="w-5 h-5 flex-shrink-0" />
          <p>{success}</p>
        </div>
      )}
    </div>
  );
};

export default LiveRecorder;
