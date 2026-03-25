import { useState } from 'react';
import FileUploader from './components/STT/FileUploader';
import LiveRecorder from './components/STT/LiveRecorder';
import TranscriptionDisplay from './components/STT/TranscriptionDisplay';

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

type TabType = 'upload' | 'record';

function App() {
  const [activeTab, setActiveTab] = useState<TabType>('upload');
  const [transcription, setTranscription] = useState<TranscriptionResult | null>(null);

  const handleTranscriptionComplete = (result: TranscriptionResult) => {
    setTranscription(result);
  };

  const handleError = (error: string) => {
    console.error('Transcription error:', error);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
            Speech-to-Text & Text-to-Speech Platform
          </h1>
          <p className="text-gray-600 text-sm sm:text-base">
            Experiment with various STT and TTS models
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Status Bar */}
        <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 border border-gray-200">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3 sm:gap-4">
              <span className="text-sm font-medium text-gray-700">Backend:</span>
              <a
                href="http://localhost:8000/health"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:text-blue-700 underline font-medium transition-colors"
              >
                Health Check
              </a>
              <a
                href="http://localhost:8000/docs"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:text-blue-700 underline font-medium transition-colors"
              >
                API Docs
              </a>
            </div>
            <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-50 text-green-700 text-sm font-medium rounded-full border border-green-200">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              Phase 2: STT Active
            </span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="border-b border-gray-200 bg-gray-50">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('upload')}
                className={`
                  flex-1 px-6 py-4 text-sm sm:text-base font-medium border-b-2 transition-all duration-200
                  ${activeTab === 'upload'
                    ? 'border-blue-500 text-blue-600 bg-white'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:bg-gray-100'
                  }
                `}
              >
                📁 Upload Audio File
              </button>
              <button
                onClick={() => setActiveTab('record')}
                className={`
                  flex-1 px-6 py-4 text-sm sm:text-base font-medium border-b-2 transition-all duration-200
                  ${activeTab === 'record'
                    ? 'border-blue-500 text-blue-600 bg-white'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:bg-gray-100'
                  }
                `}
              >
                🎤 Live Recording
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6 sm:p-8">
            {activeTab === 'upload' && (
              <FileUploader
                onTranscriptionComplete={handleTranscriptionComplete}
                onError={handleError}
              />
            )}
            {activeTab === 'record' && (
              <LiveRecorder
                onTranscriptionComplete={handleTranscriptionComplete}
                onError={handleError}
              />
            )}
          </div>
        </div>

        {/* Transcription Result - More Prominent */}
        {transcription && (
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl shadow-lg border-2 border-blue-200 p-6 sm:p-8 animate-fadeIn">
            <div className="bg-white rounded-lg shadow-sm">
              <TranscriptionDisplay transcription={transcription} />
            </div>
          </div>
        )}

        {/* Coming Soon Section */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-6 sm:p-8 shadow-sm">
          <h2 className="text-xl sm:text-2xl font-bold text-blue-900 mb-4 flex items-center gap-2">
            🚀 Coming Soon
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-blue-100">
              <span className="text-2xl">🔊</span>
              <div>
                <h3 className="font-semibold text-blue-900">Text-to-Speech</h3>
                <p className="text-sm text-blue-700">Convert text to natural speech</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-blue-100">
              <span className="text-2xl">🎭</span>
              <div>
                <h3 className="font-semibold text-blue-900">Voice Cloning</h3>
                <p className="text-sm text-blue-700">Clone and customize voices</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-blue-100">
              <span className="text-2xl">⚙️</span>
              <div>
                <h3 className="font-semibold text-blue-900">Model Configuration</h3>
                <p className="text-sm text-blue-700">Switch between AI models</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-blue-100">
              <span className="text-2xl">⚡</span>
              <div>
                <h3 className="font-semibold text-blue-900">Real-time Streaming</h3>
                <p className="text-sm text-blue-700">Live transcription streaming</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 text-center">
          <p className="text-sm text-gray-600 font-medium">
            Speech-to-Text & Text-to-Speech Platform v0.1.0
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Phase 2: Speech-to-Text Implementation Complete
          </p>
        </div>
      </footer>

      {/* Add fadeIn animation */}
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out;
        }
      `}</style>
    </div>
  );
}

export default App;
