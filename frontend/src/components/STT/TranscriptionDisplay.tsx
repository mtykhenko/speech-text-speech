import React, { useState } from 'react';
import { Copy, Download, Clock, Globe, Award, ChevronDown, ChevronUp, FileText } from 'lucide-react';

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
    <div className="w-full p-6 sm:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b-2 border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
            <FileText className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Transcription Result</h2>
            <p className="text-sm text-gray-500 mt-0.5">ID: {transcription.id}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleCopy}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium bg-gray-100 hover:bg-gray-200 rounded-lg transition-all shadow-sm hover:shadow"
          >
            <Copy className="w-4 h-4" />
            {copied ? '✓ Copied!' : 'Copy Text'}
          </button>
          <div className="relative group">
            <button className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-all shadow-sm hover:shadow-md">
              <Download className="w-4 h-4" />
              Export
            </button>
            <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
              <button
                onClick={handleExportTxt}
                className="w-full px-4 py-3 text-left hover:bg-gray-50 rounded-t-lg font-medium text-sm transition-colors"
              >
                📄 Export as TXT
              </button>
              <button
                onClick={handleExportJson}
                className="w-full px-4 py-3 text-left hover:bg-gray-50 font-medium text-sm transition-colors"
              >
                📋 Export as JSON
              </button>
              <button
                onClick={handleExportSrt}
                className="w-full px-4 py-3 text-left hover:bg-gray-50 rounded-b-lg font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!transcription.segments || transcription.segments.length === 0}
              >
                🎬 Export as SRT
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Metadata Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 rounded-xl shadow-sm">
          <div className="flex items-center gap-2 text-blue-700 mb-2">
            <Globe className="w-5 h-5" />
            <span className="text-sm font-semibold">Language</span>
          </div>
          <p className="text-2xl font-bold text-blue-900">{transcription.language.toUpperCase()}</p>
        </div>
        
        {transcription.confidence !== null && transcription.confidence !== undefined && (
          <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200 rounded-xl shadow-sm">
            <div className="flex items-center gap-2 text-green-700 mb-2">
              <Award className="w-5 h-5" />
              <span className="text-sm font-semibold">Confidence</span>
            </div>
            <p className="text-2xl font-bold text-green-900">
              {(transcription.confidence * 100).toFixed(1)}%
            </p>
          </div>
        )}
        
        <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-200 rounded-xl shadow-sm">
          <div className="flex items-center gap-2 text-purple-700 mb-2">
            <Clock className="w-5 h-5" />
            <span className="text-sm font-semibold">Provider</span>
          </div>
          <p className="text-xl font-bold text-purple-900 truncate">{transcription.provider}</p>
        </div>
        
        <div className="p-4 bg-gradient-to-br from-orange-50 to-orange-100 border-2 border-orange-200 rounded-xl shadow-sm">
          <div className="flex items-center gap-2 text-orange-700 mb-2">
            <Clock className="w-5 h-5" />
            <span className="text-sm font-semibold">Model</span>
          </div>
          <p className="text-xl font-bold text-orange-900 truncate">{transcription.model}</p>
        </div>
      </div>

      {/* Transcription Text - More Prominent */}
      <div className="border-2 border-blue-200 rounded-xl p-6 sm:p-8 bg-gradient-to-br from-white to-blue-50 shadow-md">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-1 h-6 bg-blue-600 rounded-full"></div>
          <h3 className="text-xl font-bold text-gray-900">Transcription</h3>
        </div>
        <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
          <p className="text-gray-900 text-lg leading-relaxed whitespace-pre-wrap font-medium">
            {transcription.text}
          </p>
        </div>
      </div>

      {/* Segments */}
      {transcription.segments && transcription.segments.length > 0 && (
        <div className="border-2 border-gray-200 rounded-xl bg-white shadow-sm overflow-hidden">
          <button
            onClick={() => setShowSegments(!showSegments)}
            className="w-full flex items-center justify-between p-5 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-blue-600" />
              </div>
              <div className="text-left">
                <h3 className="text-lg font-bold text-gray-900">
                  Segments
                </h3>
                <p className="text-sm text-gray-500">{transcription.segments.length} segments available</p>
              </div>
            </div>
            {showSegments ? <ChevronUp className="w-6 h-6 text-gray-400" /> : <ChevronDown className="w-6 h-6 text-gray-400" />}
          </button>
          
          {showSegments && (
            <div className="border-t-2 border-gray-200 p-5 space-y-3 max-h-96 overflow-y-auto bg-gray-50">
              {transcription.segments.map((segment, index) => (
                <div key={index} className="p-4 bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-semibold text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                      {formatTime(segment.start)} → {formatTime(segment.end)}
                    </span>
                    {segment.confidence !== null && segment.confidence !== undefined && (
                      <span className="text-sm font-medium text-green-600 bg-green-50 px-3 py-1 rounded-full">
                        {(segment.confidence * 100).toFixed(1)}%
                      </span>
                    )}
                  </div>
                  <p className="text-gray-900 leading-relaxed">{segment.text}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Metadata */}
      {transcription.metadata && Object.keys(transcription.metadata).length > 0 && (
        <div className="border-2 border-gray-200 rounded-xl bg-white shadow-sm overflow-hidden">
          <button
            onClick={() => setShowMetadata(!showMetadata)}
            className="w-full flex items-center justify-between p-5 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-purple-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Technical Metadata</h3>
            </div>
            {showMetadata ? <ChevronUp className="w-6 h-6 text-gray-400" /> : <ChevronDown className="w-6 h-6 text-gray-400" />}
          </button>
          
          {showMetadata && (
            <div className="border-t-2 border-gray-200 p-5 bg-gray-50">
              <pre className="text-sm bg-white p-5 rounded-lg overflow-x-auto border border-gray-200 shadow-sm font-mono">
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