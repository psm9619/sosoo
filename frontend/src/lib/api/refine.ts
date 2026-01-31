/**
 * Refinement API Client
 * SSE 스트리밍을 통한 스크립트 수정 API
 */

import type { AnalysisResult } from '@/types/api';

export interface RefineParams {
  sessionId: string;
  userIntent: string;
  stage: 1 | 2;
  originalTranscript: string;
  currentScript: string;
  analysisResult: AnalysisResult;
  refinedScript?: string; // Stage 2 필수
  voiceType?: 'default_male' | 'default_female' | 'cloned';
  voiceCloneId?: string;
}

export interface RefinePreviewResult {
  sessionId: string;
  refinedScript: string;
  changesSummary: string;
}

export interface RefineFinalResult {
  sessionId: string;
  improvedAudioUrl: string;
}

export interface RefineProgress {
  step: string;
  progress: number;
  message: string;
}

/**
 * Stage 1: 스크립트 프리뷰 (TTS 없음)
 */
export async function refinePreview(
  params: Omit<RefineParams, 'stage' | 'refinedScript'>,
  callbacks: {
    onProgress?: (progress: RefineProgress) => void;
    onComplete?: (result: RefinePreviewResult) => void;
    onError?: (error: { code: string; message: string }) => void;
  }
): Promise<RefinePreviewResult> {
  return refineInternal(
    { ...params, stage: 1 },
    {
      onProgress: callbacks.onProgress,
      onComplete: callbacks.onComplete as ((result: RefinePreviewResult | RefineFinalResult) => void) | undefined,
      onError: callbacks.onError,
    }
  ) as Promise<RefinePreviewResult>;
}

/**
 * Stage 2: 최종 생성 (TTS 포함)
 */
export async function refineFinal(
  params: Omit<RefineParams, 'stage'> & { refinedScript: string },
  callbacks: {
    onProgress?: (progress: RefineProgress) => void;
    onComplete?: (result: RefineFinalResult) => void;
    onError?: (error: { code: string; message: string }) => void;
  }
): Promise<RefineFinalResult> {
  return refineInternal(
    { ...params, stage: 2 },
    {
      onProgress: callbacks.onProgress,
      onComplete: callbacks.onComplete as ((result: RefinePreviewResult | RefineFinalResult) => void) | undefined,
      onError: callbacks.onError,
    }
  ) as Promise<RefineFinalResult>;
}

/**
 * 내부 SSE 처리 함수
 */
async function refineInternal(
  params: RefineParams,
  callbacks: {
    onProgress?: (progress: RefineProgress) => void;
    onComplete?: (result: RefinePreviewResult | RefineFinalResult) => void;
    onError?: (error: { code: string; message: string }) => void;
  }
): Promise<RefinePreviewResult | RefineFinalResult> {
  const { onProgress, onComplete, onError } = callbacks;

  return new Promise((resolve, reject) => {
    fetch('/api/refine', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    })
      .then(async (response) => {
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          const error = {
            code: errorData.error?.code || 'API_ERROR',
            message: errorData.error?.message || '수정 요청에 실패했습니다.',
          };
          onError?.(error);
          reject(new Error(error.message));
          return;
        }

        const reader = response.body?.getReader();
        if (!reader) {
          const error = { code: 'STREAM_ERROR', message: '스트림을 읽을 수 없습니다.' };
          onError?.(error);
          reject(new Error(error.message));
          return;
        }

        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          let eventType = '';
          let eventData = '';

          for (const line of lines) {
            if (line.startsWith('event:')) {
              eventType = line.slice(6).trim();
            } else if (line.startsWith('data:')) {
              eventData = line.slice(5).trim();
            } else if (line === '' && eventType && eventData) {
              try {
                const data = JSON.parse(eventData);

                if (eventType === 'progress') {
                  onProgress?.({
                    step: data.step || 'processing',
                    progress: data.progress || 0,
                    message: data.message || '처리 중...',
                  });
                } else if (eventType === 'complete') {
                  const result = params.stage === 1
                    ? {
                        sessionId: data.sessionId,
                        refinedScript: data.refinedScript,
                        changesSummary: data.changesSummary,
                      }
                    : {
                        sessionId: data.sessionId,
                        improvedAudioUrl: data.improvedAudioUrl,
                      };
                  onComplete?.(result);
                  resolve(result);
                } else if (eventType === 'error') {
                  const error = {
                    code: data.code || 'UNKNOWN_ERROR',
                    message: data.message || '알 수 없는 오류가 발생했습니다.',
                  };
                  onError?.(error);
                  reject(new Error(error.message));
                }
              } catch {
                // JSON 파싱 실패 무시
              }

              eventType = '';
              eventData = '';
            }
          }
        }
      })
      .catch((err) => {
        const error = {
          code: 'NETWORK_ERROR',
          message: err.message || '네트워크 오류가 발생했습니다.',
        };
        onError?.(error);
        reject(new Error(error.message));
      });
  });
}

/**
 * 진행 단계별 메시지
 */
export const REFINE_PROGRESS_MESSAGES: Record<string, string> = {
  start: '수정을 시작합니다...',
  improvement: '스크립트를 수정하고 있어요...',
  tts: '음성을 합성하고 있어요...',
  complete: '수정이 완료되었습니다!',
};
