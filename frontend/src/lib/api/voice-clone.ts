/**
 * Voice Clone API Client
 * ElevenLabs 음성 클론 생성 및 상태 조회
 */

import type { VoiceCloneResponse, VoiceCloneStatus } from '@/types/api';

export interface VoiceCloneConsentData {
  consentVersion: string;
  consentText: string;
  durationSeconds: number;
}

export interface CreateVoiceCloneParams {
  audioBlob: Blob;
  voiceName?: string;
  consentGiven: boolean;
  consentData?: VoiceCloneConsentData;
}

export interface VoiceCloneStatusResponse {
  voiceCloneId: string;
  voiceName: string;
  status: VoiceCloneStatus;
  sampleAudioUrl?: string | null;
  errorMessage?: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * 음성 클론 생성 요청
 */
export async function createVoiceClone(
  params: CreateVoiceCloneParams
): Promise<VoiceCloneResponse> {
  const { audioBlob, voiceName, consentGiven, consentData } = params;

  // FormData로 오디오 파일 전송
  const formData = new FormData();
  const filename = `voice-sample-${Date.now()}.webm`;
  formData.append('audio', audioBlob, filename);
  formData.append('voiceName', voiceName || '내 목소리');
  formData.append('consentGiven', String(consentGiven));

  // 동의 기록 데이터 추가 (법적 증거용)
  if (consentData) {
    formData.append('consentVersion', consentData.consentVersion);
    formData.append('consentText', consentData.consentText);
    formData.append('sampleDurationSeconds', String(consentData.durationSeconds));
  }

  const response = await fetch('/api/voice-clone', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || '음성 클론 생성에 실패했습니다.');
  }

  return response.json();
}

/**
 * 음성 클론 상태 조회
 */
export async function getVoiceCloneStatus(
  voiceCloneId: string
): Promise<VoiceCloneStatusResponse> {
  const response = await fetch(`/api/voice-clone/status?id=${voiceCloneId}`);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || '상태 조회에 실패했습니다.');
  }

  return response.json();
}

/**
 * 사용자의 음성 클론 목록 조회
 */
export async function getUserVoiceClone(): Promise<VoiceCloneStatusResponse | null> {
  const response = await fetch('/api/voice-clone/status');

  if (!response.ok) {
    if (response.status === 404) {
      return null;
    }
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || '조회에 실패했습니다.');
  }

  return response.json();
}

/**
 * 음성 클론 삭제
 */
export async function deleteVoiceClone(voiceCloneId: string): Promise<void> {
  const response = await fetch(`/api/voice-clone?id=${voiceCloneId}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || '삭제에 실패했습니다.');
  }
}

/**
 * 음성 클론 상태 폴링 (처리중일 때 주기적 조회)
 */
export function pollVoiceCloneStatus(
  voiceCloneId: string,
  callbacks: {
    onStatusChange?: (status: VoiceCloneStatus) => void;
    onReady?: (response: VoiceCloneStatusResponse) => void;
    onError?: (error: Error) => void;
  },
  intervalMs: number = 5000
): () => void {
  let isActive = true;

  const poll = async () => {
    if (!isActive) return;

    try {
      const status = await getVoiceCloneStatus(voiceCloneId);
      callbacks.onStatusChange?.(status.status);

      if (status.status === 'ready') {
        callbacks.onReady?.(status);
        isActive = false;
      } else if (status.status === 'failed') {
        callbacks.onError?.(new Error(status.errorMessage || '음성 클론 생성에 실패했습니다.'));
        isActive = false;
      } else if (status.status === 'processing') {
        setTimeout(poll, intervalMs);
      }
    } catch (error) {
      callbacks.onError?.(error instanceof Error ? error : new Error('상태 조회 실패'));
      isActive = false;
    }
  };

  poll();

  return () => {
    isActive = false;
  };
}
