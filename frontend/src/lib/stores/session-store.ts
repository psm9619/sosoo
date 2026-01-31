import { create } from 'zustand';
import type { AnalyzeResponse, SSEProgressEvent, SSEErrorEvent } from '@/types/api';

// UI 상태 (idle → recording → processing → complete / error)
export type UIStatus = 'idle' | 'recording' | 'uploading' | 'processing' | 'complete' | 'error';

interface SessionStore {
  // UI 상태
  uiStatus: UIStatus;

  // 프로그레스 (processing 상태일 때)
  progress: SSEProgressEvent | null;

  // 분석 결과 (complete 상태일 때)
  result: AnalyzeResponse | null;

  // 에러 정보 (error 상태일 때)
  error: SSEErrorEvent | null;

  // Actions
  setUIStatus: (status: UIStatus) => void;
  setProgress: (progress: SSEProgressEvent | null) => void;
  setResult: (result: AnalyzeResponse | null) => void;
  setError: (error: SSEErrorEvent | null) => void;
  reset: () => void;
}

const initialState = {
  uiStatus: 'idle' as UIStatus,
  progress: null,
  result: null,
  error: null,
};

export const useSessionStore = create<SessionStore>((set) => ({
  ...initialState,

  setUIStatus: (uiStatus) => set({ uiStatus }),
  setProgress: (progress) => set({ progress }),
  setResult: (result) => set({ result }),
  setError: (error) => set({ error, uiStatus: 'error' }),
  reset: () => set(initialState),
}));
