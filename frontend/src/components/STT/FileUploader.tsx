import React, { useState, useCallback } from 'react';
import { Upload, File, X, AlertCircle, CheckCircle } from 'lucide-react';

interface FileUploaderProps {
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

const FileUploader: React.FC<FileUploaderProps> = ({ onTranscriptionComplete, onError }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [provider, setProvider] = useState<string>('');
  const [language, setLanguage] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  const supportedFormats = ['mp3', 'wav', 'flac', 'm4a', 'ogg', 'webm', 'mp4'];
  const maxFileSize = 25 * 1024 * 1024; // 25 MB

  const validateFile = (file: File): string | null => {
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (!extension || !supportedFormats.includes(extension)) {
      return `Unsupported format. Allowed: ${supportedFormats.join(', ')}`;
    }
    if (file.size > maxFileSize) {
      return `File too large. Maximum size: ${maxFileSize / (1024 * 1024)} MB`;
    }
    return null;
  };

  const handleFileSelect = (file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      setSelectedFile(null);
      return;
    }
    setError('');
    setSuccess('');
    setSelectedFile(file);
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, []);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setUploadProgress(0);
    setError('');
    setSuccess('');

    try {
      const formData = new FormData();
      formData.append('audio_file', selectedFile);
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
      setSuccess('Transcription completed successfully!');
      setUploadProgress(100);
      
      if (onTranscriptionComplete) {
        onTranscriptionComplete(result);
      }

      // Reset after success
      setTimeout(() => {
        setSelectedFile(null);
        setUploadProgress(0);
        setSuccess('');
      }, 2000);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Upload failed';
      setError(errorMessage);
      if (onError) {
        onError(errorMessage);
      }
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setError('');
    setSuccess('');
    setUploadProgress(0);
  };

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-gray-900">Upload Audio File</h2>
        <p className="text-gray-600">
          Upload an audio file to transcribe. Supported formats: <span className="font-medium">{supportedFormats.join(', ')}</span>
        </p>
      </div>

      {/* Drag and Drop Area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          border-2 border-dashed rounded-xl p-8 sm:p-12 text-center transition-all duration-200
          ${isDragging 
            ? 'border-blue-500 bg-blue-50 scale-[1.02]' 
            : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
          }
          ${selectedFile ? 'bg-gray-50' : ''}
        `}
      >
        {!selectedFile ? (
          <div className="space-y-6">
            <div className="flex justify-center">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center">
                <Upload className="w-10 h-10 text-blue-600" />
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-lg font-semibold text-gray-900">Drop your audio file here</p>
              <p className="text-sm text-gray-500">or click the button below to browse</p>
            </div>
            <input
              type="file"
              accept={supportedFormats.map(f => `.${f}`).join(',')}
              onChange={handleFileInputChange}
              className="hidden"
              id="file-input"
            />
            <label
              htmlFor="file-input"
              className="inline-block px-6 py-3 bg-blue-600 text-white font-medium rounded-lg cursor-pointer hover:bg-blue-700 transition-colors shadow-sm hover:shadow-md"
            >
              Select File
            </label>
            <p className="text-xs text-gray-500 mt-4">
              Maximum file size: {maxFileSize / (1024 * 1024)} MB
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex justify-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
                <File className="w-10 h-10 text-green-600" />
              </div>
            </div>
            <div className="space-y-1">
              <p className="font-semibold text-gray-900 text-lg">{selectedFile.name}</p>
              <p className="text-sm text-gray-500">
                {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
              </p>
            </div>
            <button
              onClick={handleRemoveFile}
              disabled={isUploading}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <X className="w-4 h-4" />
              Remove File
            </button>
          </div>
        )}
      </div>

      {/* Options */}
      {selectedFile && !isUploading && (
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

      {/* Upload Button */}
      {selectedFile && (
        <button
          onClick={handleUpload}
          disabled={isUploading}
          className={`
            w-full py-4 rounded-lg font-semibold text-lg transition-all duration-200 shadow-sm
            ${isUploading 
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-blue-600 hover:bg-blue-700 text-white hover:shadow-md'
            }
          `}
        >
          {isUploading ? (
            <span className="flex items-center justify-center gap-3">
              <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
              Transcribing...
            </span>
          ) : (
            'Start Transcription'
          )}
        </button>
      )}

      {/* Progress Bar */}
      {isUploading && (
        <div className="space-y-3">
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <div
              className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-300 animate-pulse"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
          <p className="text-sm text-center text-gray-600 font-medium">
            Processing your audio file...
          </p>
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

export default FileUploader;