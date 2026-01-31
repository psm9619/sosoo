import { create } from 'zustand';
import type { SessionState, SSEProgressEvent } from '@/types/api';

// UI 상태 (idle → recording → processing → complete / error)
export type UIStatus = 'idle' | 'recording' | 'uploading' | 'processing' | 'complete' | 'error';

interface SessionStore {
  // UI 상태
  uiStatus: UIStatus;

  // 프로그레스 (processing 상태일 때)
  progress: SSEProgressEvent | null;

  // 세션 결과 (complete 상태일 때)
  session: SessionState | null;

  // 에러 정보 (error 상태일 때)
  error: { code: string; message: string } | null;

  // Actions
  setUIStatus: (status: UIStatus) => void;
  setProgress: (progress: SSEProgressEvent | null) => void;
  setSession: (session: SessionState | null) => void;
  setError: (error: { code: string; message: string } | null) => void;
  reset: () => void;
}

const initialState = {
  uiStatus: 'idle' as UIStatus,
  progress: null,
  session: null,
  error: null,
};

export const useSessionStore = create<SessionStore>((set) => ({
  ...initialState,

  setUIStatus: (uiStatus) => set({ uiStatus }),
  setProgress: (progress) => set({ progress }),
  setSession: (session) => set({ session }),
  setError: (error) => set({ error, uiStatus: 'error' }),
  reset: () => set(initialState),
}));
