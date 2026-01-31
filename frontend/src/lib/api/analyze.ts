/**
 * Speech Analysis API Client
 * SSE 스트리밍을 통한 AI 분석 API 연동
 */

import type { AnalysisResult, SSEProgressEvent } from '@/types/api';

export interface AnalyzeParams {
  audioBlob: Blob;
  question?: string;
  projectId?: string;
  mode?: 'quick' | 'deep';
  projectType?: 'interview' | 'presentation' | 'free_speech';
  userId?: string; // Progressive Context용 사용자 ID
  useVoiceClone?: boolean; // 사용자 보이스 클론 사용 여부
}

export interface AnalyzeProgress {
  step: string;
  progress: number;
  message: string;
}

export interface AnalyzeResult {
  sessionId: string;
  transcript: string;
  analysisResult: AnalysisResult;
  improvedScript: string;
  improvedAudioUrl?: string;
  priorityRanking?: AnalysisResult['priorityRanking'];
}

/**
 * 오디오 파일을 Supabase Storage에 업로드하고 URL 반환
 */
async function uploadAudio(audioBlob: Blob): Promise<string> {
  const formData = new FormData();
  const filename = `recording-${Date.now()}.webm`;
  formData.append('file', audioBlob, filename);

  // 임시로 Data URL 사용 (실제로는 Supabase Storage 사용)
  // TODO: Supabase Storage 연동
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      resolve(reader.result as string);
    };
    reader.readAsDataURL(audioBlob);
  });
}

/**
 * SSE 스트리밍으로 분석 API 호출
 */
export async function analyzeAudio(
  params: AnalyzeParams,
  callbacks: {
    onProgress?: (progress: AnalyzeProgress) => void;
    onComplete?: (result: AnalyzeResult) => void;
    onError?: (error: { code: string; message: string }) => void;
  }
): Promise<AnalyzeResult> {
  const { audioBlob, question, projectId, mode = 'quick', projectType, userId, useVoiceClone } = params;
  const { onProgress, onComplete, onError } = callbacks;

  // 오디오 업로드
  const audioUrl = await uploadAudio(audioBlob);

  return new Promise((resolve, reject) => {
    // SSE 연결
    fetch('/api/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        audioUrl,
        question,
        projectId,
        mode,
        projectType,
        userId,
        useVoiceClone,
      }),
    })
      .then(async (response) => {
        if (!response.ok) {
          const errorData = await response.json();
          const error = {
            code: errorData.error?.code || 'API_ERROR',
            message: errorData.error?.message || '분석 요청에 실패했습니다.',
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

          // SSE 이벤트 파싱
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
              // 이벤트 완성
              try {
                const data = JSON.parse(eventData);

                if (eventType === 'progress') {
                  onProgress?.({
                    step: data.step || 'processing',
                    progress: data.progress || 0,
                    message: data.message || '처리 중...',
                  });
                } else if (eventType === 'complete') {
                  const result: AnalyzeResult = {
                    sessionId: data.sessionId,
                    transcript: data.transcript,
                    analysisResult: data.analysisResult,
                    improvedScript: data.improvedScript,
                    improvedAudioUrl: data.improvedAudioUrl,
                    priorityRanking: data.analysisResult?.priorityRanking,
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
 * 분석 진행 단계별 메시지
 */
export const PROGRESS_MESSAGES: Record<string, string> = {
  start: '분석을 시작합니다...',
  stt: '음성을 텍스트로 변환하고 있어요...',
  analysis: '발화 패턴을 분석하고 있어요...',
  improvement: '개선된 스크립트를 만들고 있어요...',
  reflection: '품질을 검토하고 있어요...',
  tts: '음성을 합성하고 있어요...',
  complete: '분석이 완료되었습니다!',
};
