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
      formData.append('audio_file', audioBlob, 'recording.webm');
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
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-gray-900">Live Recording</h2>
        <p className="text-gray-600">
          Record audio directly from your microphone and transcribe it in real-time.
        </p>
      </div>

      {/* Recording Area */}
      <div className="border-2 border-gray-300 rounded-xl p-8 sm:p-12 text-center space-y-8 bg-gradient-to-br from-gray-50 to-white">
        {/* Recording Button */}
        <div className="flex justify-center">
          {!isRecording ? (
            <button
              onClick={startRecording}
              disabled={isProcessing}
              className={`
                w-28 h-28 rounded-full flex items-center justify-center transition-all duration-200 shadow-lg
                ${isProcessing 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 hover:scale-110 hover:shadow-xl'
                }
              `}
            >
              <Mic className="w-14 h-14 text-white" />
            </button>
          ) : (
            <button
              onClick={stopRecording}
              className="w-28 h-28 rounded-full bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 flex items-center justify-center animate-pulse transition-all duration-200 hover:scale-110 shadow-xl"
            >
              <Square className="w-14 h-14 text-white fill-white" />
            </button>
          )}
        </div>

        {/* Recording Status */}
        {isRecording && (
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-3">
              <div className="w-4 h-4 bg-red-500 rounded-full animate-pulse shadow-lg" />
              <span className="text-xl font-semibold text-gray-900">Recording...</span>
            </div>
            <div className="inline-block px-6 py-3 bg-red-50 border-2 border-red-200 rounded-full">
              <p className="text-4xl font-mono font-bold text-red-600">
                {formatTime(recordingTime)}
              </p>
            </div>
            <p className="text-sm text-gray-500">Click the stop button when finished</p>
          </div>
        )}

        {isProcessing && (
          <div className="space-y-4">
            <div className="flex justify-center">
              <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
            <p className="text-xl font-semibold text-gray-900">Processing recording...</p>
            <p className="text-sm text-gray-500">This may take a few moments</p>
          </div>
        )}

        {!isRecording && !isProcessing && (
          <div className="space-y-3">
            <p className="text-lg text-gray-600 font-medium">
              Click the microphone to start recording
            </p>
            <p className="text-sm text-gray-500">
              Make sure your microphone is connected and permissions are granted
            </p>
          </div>
        )}
      </div>

      {/* Options */}
      {!isRecording && !isProcessing && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">
              Provider <span className="text-gray-400 font-normal">(Optional)</span>
            </label>
            <select
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white"
            >
              <option value="">Default (OpenAI Whisper)</option>
              <option value="openai-whisper">OpenAI Whisper</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">
              Language <span className="text-gray-400 font-normal">(Optional)</span>
            </label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white"
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
        <div className="flex items-start gap-3 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg text-red-700 shadow-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Error</p>
            <p className="text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="flex items-start gap-3 p-4 bg-green-50 border-l-4 border-green-500 rounded-lg text-green-700 shadow-sm animate-fadeIn">
          <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Success!</p>
            <p className="text-sm">{success}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveRecorder;