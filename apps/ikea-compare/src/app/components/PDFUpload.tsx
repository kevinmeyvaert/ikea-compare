'use client';

import { useState, useRef } from 'react';

interface PDFUploadProps {
  onUploadSuccess: (analysis: any) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

export default function PDFUpload({ onUploadSuccess, isLoading, setIsLoading }: PDFUploadProps) {
  const [error, setError] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (file.type !== 'application/pdf') {
      setError('Upload een PDF-bestand');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append('pdf', file);

      const response = await fetch('/api/pdf-upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'PDF verwerken mislukt');
      }

      const analysis = await response.json();
      onUploadSuccess(analysis);
    } catch (err: any) {
      setError(err.message || 'Er is een fout opgetreden bij het verwerken van de PDF');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  return (
    <div className="w-full">
      <div className="mb-4">
        <h2 className="text-sm font-bold text-gray-900 mb-1">Winkellijst</h2>
        <p className="text-xs text-gray-700">
          Upload een PDF geëxporteerd uit de IKEA keukenplanner
        </p>
      </div>

      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          isDragging
            ? 'border-ikea-blue bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          onChange={handleFileSelect}
          className="hidden"
          disabled={isLoading}
        />

        <div className="space-y-3">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            stroke="currentColor"
            fill="none"
            viewBox="0 0 48 48"
          >
            <path
              d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
              className="text-ikea-blue hover:underline font-medium text-sm disabled:opacity-50"
            >
              {isLoading ? 'Verwerken...' : 'Upload PDF'}
            </button>
            <p className="text-xs text-gray-600 mt-1">of sleep en laat los</p>
          </div>
        </div>
      </div>

      {error && (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      )}

      <p className="mt-3 text-xs text-gray-600">
        Deze parser is ontworpen voor PDF's uit de IKEA keukenplanner. PDF moet productcodes bevatten (8 cijfers).
      </p>
    </div>
  );
}
