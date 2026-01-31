'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  CONSENT_SAMPLE_TEXT,
  CONSENT_VERSION,
  MIN_RECORDING_DURATION,
  MAX_RECORDING_DURATION,
} from '@/lib/constants/voice-clone-consent';

// 동의 데이터 타입 (API로 전달)
export interface VoiceCloneConsentData {
  consentVersion: string;
  consentText: string;
  durationSeconds: number;
}

interface VoiceCloneRecorderProps {
  onRecordingComplete: (audioBlob: Blob, durationSeconds: number, consentData: VoiceCloneConsentData) => void;
  onCancel: () => void;
  isUploading?: boolean;
}

// 녹음 상태
type RecordingState = 'idle' | 'recording' | 'preview';

// MIME 타입 감지
function getSupportedMimeType(): string {
  const types = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/mp4',
    'audio/ogg;codecs=opus',
    'audio/ogg',
  ];
  for (const type of types) {
    if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(type)) {
      return type;
    }
  }
  return '';
}

export function VoiceCloneRecorder({
  onRecordingComplete,
  onCancel,
  isUploading = false,
}: VoiceCloneRecorderProps) {
  const [state, setState] = useState<RecordingState>('idle');
  const [duration, setDuration] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // 최소/최대 녹음 시간 (상수에서 가져옴)
  const MIN_DURATION = MIN_RECORDING_DURATION;
  const MAX_DURATION = MAX_RECORDING_DURATION;

  // 30초 알림 표시 여부
  const [showMinDurationNotice, setShowMinDurationNotice] = useState(false);

  // 타이머 시작
  const startTimer = useCallback(() => {
    timerRef.current = window.setInterval(() => {
      setDuration((prev) => {
        const next = prev + 1;
        // 30초 도달 시 알림 표시
        if (next === MIN_DURATION && !showMinDurationNotice) {
          setShowMinDurationNotice(true);
        }
        if (next >= MAX_DURATION) {
          // 최대 시간 도달 시 자동 정지
          stopRecording();
        }
        return next;
      });
    }, 1000);
  }, [showMinDurationNotice]);

  // 타이머 정지
  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // 녹음 시작
  const startRecording = async () => {
    setError(null);

    if (!navigator.mediaDevices?.getUserMedia) {
      setError('이 브라우저는 마이크 접근을 지원하지 않습니다.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        },
      });

      streamRef.current = stream;
      chunksRef.current = [];

      const mimeType = getSupportedMimeType();
      const mediaRecorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mediaRecorder.mimeType || 'audio/webm' });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        setState('preview');

        // 스트림 정리
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
          streamRef.current = null;
        }
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start(1000);
      setState('recording');
      setDuration(0);
      startTimer();
    } catch (err) {
      console.error('Failed to start recording:', err);
      setError('마이크에 접근할 수 없습니다. 브라우저 설정을 확인해 주세요.');
    }
  };

  // 녹음 정지
  const stopRecording = useCallback(() => {
    stopTimer();
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  }, [stopTimer]);

  // 다시 녹음
  const resetRecording = () => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setAudioBlob(null);
    setAudioUrl(null);
    setDuration(0);
    setState('idle');
    setError(null);
    setShowMinDurationNotice(false);
  };

  // 제출
  const handleSubmit = () => {
    if (audioBlob && duration >= MIN_DURATION) {
      const consentData: VoiceCloneConsentData = {
        consentVersion: CONSENT_VERSION,
        consentText: CONSENT_SAMPLE_TEXT,
        durationSeconds: duration,
      };
      onRecordingComplete(audioBlob, duration, consentData);
    }
  };

  // 시간 포맷
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // 클린업
  useEffect(() => {
    return () => {
      stopTimer();
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [stopTimer, audioUrl]);

  return (
    <div className="space-y-2">
      {/* 에러 메시지 */}
      {error && (
        <div className="p-2 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs">
          {error}
        </div>
      )}

      {/* 샘플 텍스트 */}
      <div className="bg-cream rounded-xl p-4">
        <p className="text-sm text-charcoal whitespace-pre-line leading-relaxed max-h-[360px] overflow-y-auto">
          {CONSENT_SAMPLE_TEXT}
        </p>
      </div>

      {/* 녹음 UI - 컴팩트 */}
      <div className="bg-warm-white rounded-xl p-3 border border-border">
        {/* 상태별 UI */}
        {state === 'idle' && (
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={startRecording}
              className="w-12 h-12 rounded-full bg-teal hover:bg-teal-dark flex items-center justify-center transition-colors group"
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                className="text-white"
              >
                <path
                  d="M12 2C10.9 2 10 2.9 10 4V12C10 13.1 10.9 14 12 14C13.1 14 14 13.1 14 12V4C14 2.9 13.1 2 12 2Z"
                  fill="currentColor"
                />
                <path
                  d="M17 12C17 14.76 14.76 17 12 17C9.24 17 7 14.76 7 12H5C5 15.53 7.61 18.43 11 18.92V22H13V18.92C16.39 18.43 19 15.53 19 12H17Z"
                  fill="currentColor"
                />
              </svg>
            </button>
            <p className="text-xs text-gray-warm">
              클릭하여 녹음 시작 · {MIN_DURATION}초~{MAX_DURATION / 60}분
            </p>
          </div>
        )}

        {state === 'recording' && (
          <div className="flex items-center gap-4">
            {/* 녹음 중 애니메이션 + 정지 버튼 */}
            <button
              onClick={stopRecording}
              disabled={duration < MIN_DURATION}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                duration < MIN_DURATION
                  ? 'bg-red-400 cursor-not-allowed'
                  : 'bg-red-500 hover:bg-red-600 animate-pulse'
              }`}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                <rect x="6" y="6" width="12" height="12" rx="2" />
              </svg>
            </button>

            <div className="flex-1">
              {/* 타이머 + 상태 */}
              <div className="flex items-center gap-2">
                <p className="text-xl font-mono font-bold text-charcoal">
                  {formatDuration(duration)}
                </p>
                <span className="text-xs text-gray-warm">
                  {duration < MIN_DURATION
                    ? `${MIN_DURATION - duration}초 더`
                    : showMinDurationNotice ? '✓ 완료 가능' : '녹음 중'}
                </span>
              </div>
              {/* 프로그레스 바 */}
              <div className="w-full h-1 bg-secondary rounded-full overflow-hidden mt-1">
                <div
                  className="h-full bg-red-500 transition-all duration-1000"
                  style={{ width: `${Math.min((duration / MAX_DURATION) * 100, 100)}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {state === 'preview' && audioUrl && (
          <div className="flex items-center gap-3">
            {/* 오디오 플레이어 */}
            <audio
              ref={audioRef}
              src={audioUrl}
              controls
              className="flex-1 h-10"
            />
            <span className="text-xs text-gray-warm whitespace-nowrap">
              {formatDuration(duration)}
            </span>
            <div className="flex gap-1.5">
              <Button
                variant="outline"
                size="sm"
                onClick={resetRecording}
                disabled={isUploading}
                className="px-2 h-8"
              >
                다시
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isUploading}
                size="sm"
                className="bg-teal hover:bg-teal-dark px-3 h-8"
              >
                {isUploading ? (
                  <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                ) : (
                  '확인'
                )}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* 취소 버튼 - 최소 여백 */}
      {state === 'idle' && (
        <button
          onClick={onCancel}
          className="w-full text-center text-xs text-gray-soft hover:text-gray-warm"
        >
          나중에 하기
        </button>
      )}
    </div>
  );
}
