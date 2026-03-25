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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-900">
            Speech-to-Text & Text-to-Speech Platform
          </h1>
          <p className="text-gray-600 mt-2">
            Experiment with various STT and TTS models
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Status Bar */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">Backend:</span>
              <a
                href="http://localhost:8000/health"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:text-blue-700 underline"
              >
                Health Check
              </a>
              <a
                href="http://localhost:8000/docs"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:text-blue-700 underline"
              >
                API Docs
              </a>
            </div>
            <span className="text-sm text-green-600 font-medium">✅ Phase 2: STT Active</span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('upload')}
                className={`
                  px-6 py-4 text-sm font-medium border-b-2 transition-colors
                  ${activeTab === 'upload'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                Upload Audio File
              </button>
              <button
                onClick={() => setActiveTab('record')}
                className={`
                  px-6 py-4 text-sm font-medium border-b-2 transition-colors
                  ${activeTab === 'record'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                Live Recording
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
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

        {/* Transcription Result */}
        {transcription && (
          <div className="bg-white rounded-lg shadow-sm">
            <TranscriptionDisplay transcription={transcription} />
          </div>
        )}

        {/* Coming Soon Section */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-6">
          <h2 className="text-xl font-semibold text-blue-900 mb-3">Coming Soon</h2>
          <ul className="space-y-2 text-blue-800">
            <li className="flex items-center gap-2">
              <span className="text-blue-500">•</span>
              Text-to-Speech Module
            </li>
            <li className="flex items-center gap-2">
              <span className="text-blue-500">•</span>
              Voice Cloning Module
            </li>
            <li className="flex items-center gap-2">
              <span className="text-blue-500">•</span>
              Model Configuration Interface
            </li>
            <li className="flex items-center gap-2">
              <span className="text-blue-500">•</span>
              Real-time Streaming Transcription
            </li>
          </ul>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 py-6 text-center text-sm text-gray-600">
          <p>Speech-to-Text & Text-to-Speech Platform v0.1.0</p>
          <p className="mt-1">Phase 2: Speech-to-Text Implementation Complete</p>
        </div>
      </footer>
    </div>
  );
}

export default App;