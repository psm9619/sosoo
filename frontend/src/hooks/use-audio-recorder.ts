'use client';

import { useCallback, useRef, useEffect } from 'react';
import { useRecordingStore } from '@/lib/stores/recording-store';

interface UseAudioRecorderOptions {
  maxDuration?: number; // 최대 녹음 시간 (초), 기본 300초 (5분)
  onMaxDurationReached?: () => void;
}

// 브라우저가 지원하는 오디오 MIME 타입 감지 (Safari 호환성)
function getSupportedMimeType(): string {
  const types = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/mp4',
    'audio/ogg;codecs=opus',
    'audio/ogg',
  ];

  for (const type of types) {
    if (MediaRecorder.isTypeSupported(type)) {
      return type;
    }
  }

  return ''; // 브라우저 기본값 사용
}

export function useAudioRecorder(options: UseAudioRecorderOptions = {}) {
  const { maxDuration = 300, onMaxDurationReached } = options;

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const stopResolverRef = useRef<((blob: Blob) => void) | null>(null);

  const {
    isRecording,
    isPaused,
    duration,
    audioBlob,
    audioUrl,
    startRecording: setStartRecording,
    stopRecording: setStopRecording,
    pauseRecording: setPauseRecording,
    resumeRecording: setResumeRecording,
    setDuration,
    reset,
  } = useRecordingStore();

  // 타이머 시작
  const startTimer = useCallback(() => {
    timerRef.current = window.setInterval(() => {
      const store = useRecordingStore.getState();
      if (!store.isPaused) {
        const newDuration = store.duration + 1;
        setDuration(newDuration);

        if (newDuration >= maxDuration) {
          onMaxDurationReached?.();
        }
      }
    }, 1000);
  }, [maxDuration, onMaxDurationReached, setDuration]);

  // 타이머 정지
  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // 녹음 시작
  const start = useCallback(async () => {
    // 브라우저 지원 체크
    if (!navigator.mediaDevices?.getUserMedia) {
      throw new Error('이 브라우저는 마이크 접근을 지원하지 않습니다.');
    }
    if (typeof MediaRecorder === 'undefined') {
      throw new Error('이 브라우저는 녹음 기능을 지원하지 않습니다.');
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

      // Safari 호환성을 위한 MIME 타입 감지
      const mimeType = getSupportedMimeType();
      const mediaRecorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        // MediaRecorder가 사용한 실제 MIME 타입 사용
        const blob = new Blob(chunksRef.current, { type: mediaRecorder.mimeType || 'audio/webm' });

        // 현재 녹음 시간 가져오기
        const currentDuration = useRecordingStore.getState().duration;

        // WebM duration 메타데이터 수정 포함하여 저장
        setStopRecording(blob, currentDuration);
        stopTimer();

        // 스트림 정리
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
          streamRef.current = null;
        }

        // Promise resolver 호출 (stop()에서 대기 중인 경우)
        if (stopResolverRef.current) {
          stopResolverRef.current(blob);
          stopResolverRef.current = null;
        }
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start(1000); // 1초마다 데이터 수집
      setStartRecording();
      startTimer();
    } catch (error) {
      console.error('Failed to start recording:', error);
      throw error;
    }
  }, [setStartRecording, setStopRecording, startTimer, stopTimer]);

  // 녹음 정지 - Promise를 반환하여 blob이 준비될 때까지 대기 가능
  const stop = useCallback((): Promise<Blob | null> => {
    return new Promise((resolve) => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        stopResolverRef.current = resolve;
        mediaRecorderRef.current.stop();
      } else {
        resolve(null);
      }
    });
  }, []);

  // 녹음 일시정지
  const pause = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.pause();
      setPauseRecording();
    }
  }, [setPauseRecording]);

  // 녹음 재개
  const resume = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
      mediaRecorderRef.current.resume();
      setResumeRecording();
    }
  }, [setResumeRecording]);

  // 클린업
  useEffect(() => {
    return () => {
      stopTimer();
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [stopTimer]);

  return {
    // State
    isRecording,
    isPaused,
    duration,
    audioBlob,
    audioUrl,

    // Actions
    start,
    stop,
    pause,
    resume,
    reset,

    // Utilities
    formatDuration: (seconds: number) => {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    },
  };
}
