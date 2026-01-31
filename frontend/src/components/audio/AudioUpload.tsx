'use client';

import { useState, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface AudioUploadProps {
  onFileSelected: (file: File, audioUrl: string, duration: number) => void;
  onCancel?: () => void;
  maxSizeMB?: number;
  acceptedFormats?: string[];
  isLoading?: boolean;
}

// 지원 오디오 포맷 (다양한 MIME 타입 변형 포함)
const DEFAULT_FORMATS = [
  'audio/webm',
  'audio/mp3',
  'audio/mpeg',
  'audio/wav',
  'audio/wave',
  'audio/x-wav',
  'audio/m4a',
  'audio/x-m4a',
  'audio/mp4',
  'audio/aac',
  'audio/ogg',
];

export function AudioUpload({
  onFileSelected,
  onCancel,
  maxSizeMB = 25,
  acceptedFormats = DEFAULT_FORMATS,
  isLoading = false,
}: AudioUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [duration, setDuration] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  const maxSizeBytes = maxSizeMB * 1024 * 1024;

  // 파일 유효성 검사
  const validateFile = useCallback((file: File): string | null => {
    // 파일 크기 검사
    if (file.size > maxSizeBytes) {
      return `파일 크기가 ${maxSizeMB}MB를 초과합니다.`;
    }

    // MIME 타입 검사 (파일 확장자도 fallback으로 검사)
    const isValidType = acceptedFormats.some((format) => {
      if (format.includes('*')) {
        return file.type.startsWith(format.replace('*', ''));
      }
      return file.type === format;
    });

    // MIME 타입이 없거나 인식 안 될 때 확장자로 fallback 검사
    const extension = file.name.split('.').pop()?.toLowerCase();
    const validExtensions = ['webm', 'mp3', 'wav', 'm4a', 'mp4', 'ogg', 'aac'];
    const isValidExtension = extension && validExtensions.includes(extension);

    if (!isValidType && !isValidExtension) {
      return '지원하지 않는 오디오 포맷입니다. (webm, mp3, wav, m4a 지원)';
    }

    return null;
  }, [maxSizeBytes, maxSizeMB, acceptedFormats]);

  // 파일 처리
  const handleFile = useCallback((file: File) => {
    setError(null);

    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    // 이전 URL 정리
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }

    const url = URL.createObjectURL(file);
    setSelectedFile(file);
    setAudioUrl(url);
    setDuration(null);

    // 오디오 메타데이터 로드
    const audio = new Audio(url);
    audio.addEventListener('loadedmetadata', () => {
      const audioDuration = audio.duration;
      setDuration(audioDuration);

      // 5초 미만 또는 5분 초과 검사
      if (audioDuration < 5) {
        setError('오디오 길이가 5초 미만입니다.');
        return;
      }
      if (audioDuration > 300) {
        setError('오디오 길이가 5분을 초과합니다.');
        return;
      }
    });

    audio.addEventListener('error', () => {
      setError('오디오 파일을 읽을 수 없습니다.');
    });
  }, [audioUrl, validateFile]);

  // 드래그 앤 드롭 핸들러
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFile(files[0]);
    }
  }, [handleFile]);

  // 파일 선택 핸들러
  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  }, [handleFile]);

  // 제출 핸들러
  const handleSubmit = useCallback(() => {
    if (selectedFile && audioUrl && duration && !error) {
      onFileSelected(selectedFile, audioUrl, duration);
    }
  }, [selectedFile, audioUrl, duration, error, onFileSelected]);

  // 취소 핸들러
  const handleCancel = useCallback(() => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setSelectedFile(null);
    setAudioUrl(null);
    setDuration(null);
    setError(null);
    onCancel?.();
  }, [audioUrl, onCancel]);

  // 다시 선택
  const handleReset = useCallback(() => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setSelectedFile(null);
    setAudioUrl(null);
    setDuration(null);
    setError(null);
  }, [audioUrl]);

  // 시간 포맷
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-4">
      {/* 에러 메시지 */}
      {error && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* 파일 선택 전 */}
      {!selectedFile && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`
            border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors
            ${isDragOver
              ? 'border-teal bg-teal-light/20'
              : 'border-border hover:border-teal/50 hover:bg-cream'
            }
          `}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            onChange={handleFileInput}
            className="hidden"
          />

          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-teal/10 flex items-center justify-center">
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              className="text-teal"
            >
              <path
                d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <polyline
                points="17 8 12 3 7 8"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <line
                x1="12"
                y1="3"
                x2="12"
                y2="15"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          <p className="text-charcoal font-medium mb-1">
            파일을 드래그하거나 클릭하여 선택
          </p>
          <p className="text-sm text-gray-warm">
            webm, mp3, wav, m4a (최대 {maxSizeMB}MB)
          </p>
        </div>
      )}

      {/* 파일 선택 후 프리뷰 */}
      {selectedFile && audioUrl && (
        <Card className="p-5 bg-warm-white border-none">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-teal/10 flex items-center justify-center flex-shrink-0">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                className="text-teal"
              >
                <path
                  d="M9 18V5l12-2v13"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <circle cx="6" cy="18" r="3" stroke="currentColor" strokeWidth="2" />
                <circle cx="18" cy="16" r="3" stroke="currentColor" strokeWidth="2" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-charcoal truncate">
                {selectedFile.name}
              </p>
              <div className="flex items-center gap-2 text-sm text-gray-warm mt-0.5">
                <span>{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</span>
                {duration && (
                  <>
                    <span>·</span>
                    <span>{formatDuration(duration)}</span>
                  </>
                )}
              </div>
            </div>
            <button
              onClick={handleReset}
              className="p-2 text-gray-soft hover:text-charcoal transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* 오디오 플레이어 */}
          <audio
            ref={audioRef}
            src={audioUrl}
            controls
            className="w-full mt-4"
          />

          {/* 액션 버튼 */}
          <div className="flex gap-3 mt-4">
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={isLoading}
              className="flex-1"
            >
              취소
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!duration || !!error || isLoading}
              className="flex-1 bg-teal hover:bg-teal-dark"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  업로드 중...
                </>
              ) : (
                '이 파일 사용하기'
              )}
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
