import React, { useState } from 'react';
import { Copy, Download, Clock, Globe, Award, ChevronDown, ChevronUp } from 'lucide-react';

interface TranscriptionDisplayProps {
  transcription: TranscriptionResult;
  onExport?: (format: 'txt' | 'json' | 'srt') => void;
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

const TranscriptionDisplay: React.FC<TranscriptionDisplayProps> = ({ transcription, onExport }) => {
  const [showSegments, setShowSegments] = useState(false);
  const [showMetadata, setShowMetadata] = useState(false);
  const [copied, setCopied] = useState(false);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 1000);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(transcription.text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleExportTxt = () => {
    const blob = new Blob([transcription.text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transcription-${transcription.id}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    if (onExport) onExport('txt');
  };

  const handleExportJson = () => {
    const data = {
      id: transcription.id,
      text: transcription.text,
      language: transcription.language,
      confidence: transcription.confidence,
      segments: transcription.segments,
      metadata: transcription.metadata,
      provider: transcription.provider,
      model: transcription.model,
      created_at: transcription.created_at
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transcription-${transcription.id}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    if (onExport) onExport('json');
  };

  const handleExportSrt = () => {
    if (!transcription.segments || transcription.segments.length === 0) {
      alert('No segments available for SRT export');
      return;
    }

    let srtContent = '';
    transcription.segments.forEach((segment, index) => {
      const startTime = formatTime(segment.start).replace('.', ',');
      const endTime = formatTime(segment.end).replace('.', ',');
      srtContent += `${index + 1}\n`;
      srtContent += `${startTime} --> ${endTime}\n`;
      srtContent += `${segment.text.trim()}\n\n`;
    });

    const blob = new Blob([srtContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transcription-${transcription.id}.srt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    if (onExport) onExport('srt');
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Transcription Result</h2>
        <div className="flex gap-2">
          <button
            onClick={handleCopy}
            className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <Copy className="w-4 h-4" />
            {copied ? 'Copied!' : 'Copy'}
          </button>
          <div className="relative group">
            <button className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-500 text-white hover:bg-blue-600 rounded-lg transition-colors">
              <Download className="w-4 h-4" />
              Export
            </button>
            <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
              <button
                onClick={handleExportTxt}
                className="w-full px-4 py-2 text-left hover:bg-gray-50 rounded-t-lg"
              >
                Export as TXT
              </button>
              <button
                onClick={handleExportJson}
                className="w-full px-4 py-2 text-left hover:bg-gray-50"
              >
                Export as JSON
              </button>
              <button
                onClick={handleExportSrt}
                className="w-full px-4 py-2 text-left hover:bg-gray-50 rounded-b-lg"
                disabled={!transcription.segments || transcription.segments.length === 0}
              >
                Export as SRT
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Metadata Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-2 text-blue-700 mb-1">
            <Globe className="w-4 h-4" />
            <span className="text-sm font-medium">Language</span>
          </div>
          <p className="text-lg font-bold text-blue-900">{transcription.language.toUpperCase()}</p>
        </div>
        
        {transcription.confidence !== null && transcription.confidence !== undefined && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2 text-green-700 mb-1">
              <Award className="w-4 h-4" />
              <span className="text-sm font-medium">Confidence</span>
            </div>
            <p className="text-lg font-bold text-green-900">
              {(transcription.confidence * 100).toFixed(1)}%
            </p>
          </div>
        )}
        
        <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
          <div className="flex items-center gap-2 text-purple-700 mb-1">
            <Clock className="w-4 h-4" />
            <span className="text-sm font-medium">Provider</span>
          </div>
          <p className="text-lg font-bold text-purple-900">{transcription.provider}</p>
        </div>
        
        <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
          <div className="flex items-center gap-2 text-orange-700 mb-1">
            <Clock className="w-4 h-4" />
            <span className="text-sm font-medium">Model</span>
          </div>
          <p className="text-lg font-bold text-orange-900">{transcription.model}</p>
        </div>
      </div>

      {/* Transcription Text */}
      <div className="border border-gray-300 rounded-lg p-6 bg-white">
        <h3 className="text-lg font-semibold mb-3">Transcription</h3>
        <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">
          {transcription.text}
        </p>
      </div>

      {/* Segments */}
      {transcription.segments && transcription.segments.length > 0 && (
        <div className="border border-gray-300 rounded-lg bg-white">
          <button
            onClick={() => setShowSegments(!showSegments)}
            className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
          >
            <h3 className="text-lg font-semibold">
              Segments ({transcription.segments.length})
            </h3>
            {showSegments ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
          
          {showSegments && (
            <div className="border-t border-gray-200 p-4 space-y-3 max-h-96 overflow-y-auto">
              {transcription.segments.map((segment, index) => (
                <div key={index} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-600">
                      {formatTime(segment.start)} → {formatTime(segment.end)}
                    </span>
                    {segment.confidence !== null && segment.confidence !== undefined && (
                      <span className="text-sm text-gray-500">
                        {(segment.confidence * 100).toFixed(1)}%
                      </span>
                    )}
                  </div>
                  <p className="text-gray-800">{segment.text}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Metadata */}
      {transcription.metadata && Object.keys(transcription.metadata).length > 0 && (
        <div className="border border-gray-300 rounded-lg bg-white">
          <button
            onClick={() => setShowMetadata(!showMetadata)}
            className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
          >
            <h3 className="text-lg font-semibold">Metadata</h3>
            {showMetadata ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
          
          {showMetadata && (
            <div className="border-t border-gray-200 p-4">
              <pre className="text-sm bg-gray-50 p-4 rounded-lg overflow-x-auto">
                {JSON.stringify(transcription.metadata, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TranscriptionDisplay;
