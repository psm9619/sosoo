import { create } from 'zustand';

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
  stopRecording: (blob: Blob) => void;
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

  stopRecording: (blob) => {
    const url = URL.createObjectURL(blob);
    set({ isRecording: false, isPaused: false, audioBlob: blob, audioUrl: url });
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
