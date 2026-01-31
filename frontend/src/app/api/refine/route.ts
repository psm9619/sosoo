/**
 * /api/refine - Refinement API (SSE 스트리밍)
 *
 * POST: 스크립트 수정 요청
 * - sessionId: 세션 ID
 * - userIntent: 사용자 수정 의도
 * - stage: 1 (프리뷰) | 2 (TTS 생성)
 * - originalTranscript: 원본 발화
 * - currentScript: 현재 스크립트
 * - analysisResult: 분석 결과
 * - refinedScript?: 수정된 스크립트 (Stage 2)
 * - voiceType?: 음성 타입
 */

import { NextRequest } from 'next/server';
import { streamRefinementWorkflow } from '@/lib/ai';
import type { AnalysisResult } from '@/types/api';

// Edge Runtime for streaming
export const runtime = 'nodejs';
export const maxDuration = 120; // 2분

interface RefineRequest {
  sessionId: string;
  userIntent: string;
  stage: 1 | 2;
  originalTranscript: string;
  currentScript: string;
  analysisResult: AnalysisResult;
  refinedScript?: string;
  voiceType?: 'default_male' | 'default_female' | 'cloned';
  voiceCloneId?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as RefineRequest;

    // 필수 필드 검증
    if (!body.sessionId || !body.userIntent || !body.originalTranscript || !body.currentScript) {
      return new Response(
        JSON.stringify({
          error: {
            code: 'INVALID_REQUEST',
            message: 'sessionId, userIntent, originalTranscript, currentScript are required',
          },
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Stage 2에서는 refinedScript 필요
    if (body.stage === 2 && !body.refinedScript) {
      return new Response(
        JSON.stringify({
          error: {
            code: 'INVALID_REQUEST',
            message: 'refinedScript is required for stage 2',
          },
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // SSE 스트림 생성
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // 시작 이벤트
          controller.enqueue(
            encoder.encode(
              `event: progress\ndata: ${JSON.stringify({
                step: 'start',
                progress: 0,
                message: body.stage === 1 ? '스크립트를 수정합니다...' : '음성을 생성합니다...',
                sessionId: body.sessionId,
              })}\n\n`
            )
          );

          // 워크플로우 스트리밍 실행
          const workflow = streamRefinementWorkflow({
            sessionId: body.sessionId,
            userIntent: body.userIntent,
            stage: body.stage,
            originalTranscript: body.originalTranscript,
            currentScript: body.currentScript,
            analysisResult: body.analysisResult,
            refinedScript: body.refinedScript,
            voiceType: body.voiceType || 'default_male',
            voiceCloneId: body.voiceCloneId,
          });

          for await (const event of workflow) {
            const latestMessage = event.data.messages?.[event.data.messages.length - 1];

            if (event.event === 'progress') {
              const progressData = {
                step: latestMessage?.step || 'processing',
                progress: latestMessage?.progress || 50,
                message: latestMessage?.message || '처리 중...',
                sessionId: body.sessionId,
              };
              controller.enqueue(
                encoder.encode(`event: progress\ndata: ${JSON.stringify(progressData)}\n\n`)
              );
            } else if (event.event === 'complete') {
              // Stage에 따른 완료 데이터
              const completeData =
                body.stage === 1
                  ? {
                      sessionId: body.sessionId,
                      refinedScript: event.data.refinedScript,
                      changesSummary: event.data.changesSummary,
                    }
                  : {
                      sessionId: body.sessionId,
                      improvedAudioUrl: event.data.improvedAudioUrl,
                    };

              controller.enqueue(
                encoder.encode(`event: complete\ndata: ${JSON.stringify(completeData)}\n\n`)
              );
            } else if (event.event === 'error') {
              const errorMessage = latestMessage?.message || '수정 중 오류가 발생했습니다.';
              controller.enqueue(
                encoder.encode(
                  `event: error\ndata: ${JSON.stringify({
                    code: 'REFINEMENT_ERROR',
                    message: errorMessage,
                    sessionId: body.sessionId,
                  })}\n\n`
                )
              );
            }
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Stream error';
          controller.enqueue(
            encoder.encode(
              `event: error\ndata: ${JSON.stringify({
                code: 'STREAM_ERROR',
                message: errorMessage,
                sessionId: body.sessionId,
              })}\n\n`
            )
          );
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
        'X-Accel-Buffering': 'no',
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return new Response(
      JSON.stringify({ error: { code: 'INTERNAL_ERROR', message } }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
