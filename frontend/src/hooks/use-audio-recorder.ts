'use client';

import { useCallback, useRef, useEffect } from 'react';
import { useRecordingStore } from '@/lib/stores/recording-store';

interface UseAudioRecorderOptions {
  maxDuration?: number; // 최대 녹음 시간 (초), 기본 300초 (5분)
  onMaxDurationReached?: () => void;
}

export function useAudioRecorder(options: UseAudioRecorderOptions = {}) {
  const { maxDuration = 300, onMaxDurationReached } = options;

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);

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

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus',
      });

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setStopRecording(blob);
        stopTimer();

        // 스트림 정리
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
          streamRef.current = null;
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

  // 녹음 정지
  const stop = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
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
