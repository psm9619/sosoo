/**
 * /api/analyze - Speech Coach 분석 API (SSE 스트리밍)
 *
 * POST: 오디오 분석 시작
 * - audioUrl: 분석할 오디오 URL
 * - projectId?: 프로젝트 ID
 * - mode?: 'quick' | 'deep'
 * - voiceType?: 음성 타입
 * - question?: 질문 컨텍스트
 */

import { NextRequest } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { streamSpeechCoachWorkflow } from '@/lib/ai';
import type { AnalyzeRequest } from '@/types/api';

// Edge Runtime for streaming
export const runtime = 'nodejs';
export const maxDuration = 300; // 5분

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as AnalyzeRequest;

    // 필수 필드 검증
    if (!body.audioUrl) {
      return new Response(
        JSON.stringify({ error: { code: 'INVALID_REQUEST', message: 'audioUrl is required' } }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const sessionId = uuidv4();

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
                message: '분석을 시작합니다...',
                sessionId,
              })}\n\n`
            )
          );

          // 워크플로우 스트리밍 실행
          const workflow = streamSpeechCoachWorkflow({
            sessionId,
            audioUrl: body.audioUrl,
            mode: body.mode || 'quick',
            voiceType: body.voiceType || 'default_male',
            question: body.question || undefined,
            projectId: body.projectId || undefined,
          });

          for await (const event of workflow) {
            // 최신 메시지 추출
            const latestMessage = event.data.messages?.[event.data.messages.length - 1];

            if (event.event === 'progress') {
              const progressData = {
                step: latestMessage?.step || 'processing',
                progress: latestMessage?.progress || 50,
                message: latestMessage?.message || '처리 중...',
                sessionId,
              };
              controller.enqueue(
                encoder.encode(`event: progress\ndata: ${JSON.stringify(progressData)}\n\n`)
              );
            } else if (event.event === 'complete') {
              // 완료 이벤트: 전체 결과 반환
              const completeData = {
                sessionId,
                transcript: event.data.transcript,
                analysisResult: event.data.analysisResult,
                improvedScript: event.data.improvedScript,
                improvedAudioUrl: event.data.improvedAudioUrl,
              };
              controller.enqueue(
                encoder.encode(`event: complete\ndata: ${JSON.stringify(completeData)}\n\n`)
              );
            } else if (event.event === 'error') {
              const errorData = {
                code: event.data.error?.code || 'UNKNOWN_ERROR',
                message: event.data.error?.message || '알 수 없는 오류가 발생했습니다.',
                sessionId,
              };
              controller.enqueue(
                encoder.encode(`event: error\ndata: ${JSON.stringify(errorData)}\n\n`)
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
                sessionId,
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
        'X-Accel-Buffering': 'no', // Disable nginx buffering
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
