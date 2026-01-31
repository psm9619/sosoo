import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { VoiceCloneStatus } from '@/types/api';

interface VoiceCloneState {
  voiceCloneId: string | null;
  voiceName: string | null;
  status: VoiceCloneStatus | null;
  consentGiven: boolean;
  consentGivenAt: string | null;
  sampleAudioUrl: string | null;
  hasSeenOnboarding: boolean;
}

interface UserStore {
  // Voice Clone 상태
  voiceClone: VoiceCloneState;

  // Voice Clone Actions
  setVoiceCloneConsent: (consent: boolean) => void;
  setVoiceCloneStatus: (status: VoiceCloneStatus) => void;
  setVoiceCloneId: (id: string, name?: string) => void;
  setSampleAudioUrl: (url: string) => void;
  setHasSeenOnboarding: (seen: boolean) => void;
  clearVoiceClone: () => void;

  // 전체 상태 설정 (API 응답으로부터)
  setVoiceCloneFromResponse: (data: {
    voiceCloneId: string;
    voiceName: string;
    status: VoiceCloneStatus;
    sampleAudioUrl?: string | null;
  }) => void;
}

const initialVoiceCloneState: VoiceCloneState = {
  voiceCloneId: null,
  voiceName: null,
  status: null,
  consentGiven: false,
  consentGivenAt: null,
  sampleAudioUrl: null,
  hasSeenOnboarding: false,
};

export const useUserStore = create<UserStore>()(
  persist(
    (set) => ({
      voiceClone: initialVoiceCloneState,

      setVoiceCloneConsent: (consent) =>
        set((state) => ({
          voiceClone: {
            ...state.voiceClone,
            consentGiven: consent,
            consentGivenAt: consent ? new Date().toISOString() : null,
          },
        })),

      setVoiceCloneStatus: (status) =>
        set((state) => ({
          voiceClone: {
            ...state.voiceClone,
            status,
          },
        })),

      setVoiceCloneId: (id, name) =>
        set((state) => ({
          voiceClone: {
            ...state.voiceClone,
            voiceCloneId: id,
            voiceName: name || state.voiceClone.voiceName,
          },
        })),

      setSampleAudioUrl: (url) =>
        set((state) => ({
          voiceClone: {
            ...state.voiceClone,
            sampleAudioUrl: url,
          },
        })),

      setHasSeenOnboarding: (seen) =>
        set((state) => ({
          voiceClone: {
            ...state.voiceClone,
            hasSeenOnboarding: seen,
          },
        })),

      clearVoiceClone: () =>
        set({
          voiceClone: {
            ...initialVoiceCloneState,
            hasSeenOnboarding: true, // 온보딩은 본 것으로 유지
          },
        }),

      setVoiceCloneFromResponse: (data) =>
        set((state) => ({
          voiceClone: {
            ...state.voiceClone,
            voiceCloneId: data.voiceCloneId,
            voiceName: data.voiceName,
            status: data.status,
            sampleAudioUrl: data.sampleAudioUrl || state.voiceClone.sampleAudioUrl,
          },
        })),
    }),
    {
      name: 'voiceup-user-store',
      partialize: (state) => ({
        voiceClone: {
          voiceCloneId: state.voiceClone.voiceCloneId,
          voiceName: state.voiceClone.voiceName,
          status: state.voiceClone.status,
          consentGiven: state.voiceClone.consentGiven,
          consentGivenAt: state.voiceClone.consentGivenAt,
          hasSeenOnboarding: state.voiceClone.hasSeenOnboarding,
          // sampleAudioUrl은 저장하지 않음 (대용량)
        },
      }),
    }
  )
);
