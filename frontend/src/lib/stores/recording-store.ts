import { create } from 'zustand';
import fixWebmDuration from 'fix-webm-duration';

interface RecordingStore {
  // 녹음 상태
  isRecording: boolean;
  isPaused: boolean;

  // 녹음 시간 (초)
  duration: number;

  // 오디오 데이터
  audioBlob: Blob | null;
  audioUrl: string | null;

  // Actions
  startRecording: () => void;
  stopRecording: (blob: Blob, duration: number) => void;
  pauseRecording: () => void;
  resumeRecording: () => void;
  setDuration: (duration: number) => void;
  reset: () => void;
}

const initialState = {
  isRecording: false,
  isPaused: false,
  duration: 0,
  audioBlob: null,
  audioUrl: null,
};

export const useRecordingStore = create<RecordingStore>((set, get) => ({
  ...initialState,

  startRecording: () => set({ isRecording: true, isPaused: false, duration: 0 }),

  stopRecording: async (blob, duration) => {
    // WebM duration 메타데이터 수정
    const durationMs = duration * 1000;
    let fixedBlob = blob;

    try {
      // webm 포맷인 경우에만 duration fix 적용
      if (blob.type.includes('webm')) {
        fixedBlob = await fixWebmDuration(blob, durationMs);
      }
    } catch (err) {
      console.warn('Failed to fix webm duration:', err);
      // 실패해도 원본 blob 사용
    }

    const url = URL.createObjectURL(fixedBlob);
    set({ isRecording: false, isPaused: false, audioBlob: fixedBlob, audioUrl: url });
  },

  pauseRecording: () => set({ isPaused: true }),

  resumeRecording: () => set({ isPaused: false }),

  setDuration: (duration) => set({ duration }),

  reset: () => {
    const { audioUrl } = get();
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    set(initialState);
  },
}));
