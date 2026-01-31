/**
 * /api/analyze - Speech Coach 분석 API (SSE 스트리밍)
 *
 * POST: 오디오 분석 시작
 * - audioUrl: 분석할 오디오 URL
 * - projectId?: 프로젝트 ID
 * - mode?: 'quick' | 'deep'
 * - voiceType?: 음성 타입
 * - question?: 질문 컨텍스트
 * - userId?: 사용자 ID (Progressive Context용)
 */

import { NextRequest } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { streamSpeechCoachWorkflow } from '@/lib/ai';
import { extractLongTermMemory } from '@/lib/ai/nodes/progressive-context';
import type { ProgressiveContext } from '@/lib/ai/nodes/progressive-context';
import type { AnalyzeRequest } from '@/types/api';
import { getProjectById } from '@/lib/supabase/projects';
import { analyzeGrowthPatterns } from '@/lib/supabase/attempts';

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

    // Progressive Context 빌드 (로그인 유저 + 프로젝트가 있는 경우)
    let progressiveContext: ProgressiveContext | undefined;

    if (body.userId && body.projectId) {
      try {
        // 1. 프로젝트 정보 로드 (Long-term Memory)
        const project = await getProjectById(body.projectId);

        // 2. 성장 패턴 분석 (Short-term Memory)
        const growthPatterns = await analyzeGrowthPatterns(body.userId, body.projectId, 5);

        // 3. Progressive Context 빌드
        if (project || growthPatterns.analyzedAttemptCount > 0) {
          // Long-term Memory 추출
          const longTermMemory = project
            ? extractLongTermMemory({
                type: project.type,
                company: project.company || undefined,
                position: project.position || undefined,
                context_summary: project.contextSummary || undefined,
                context_keywords: project.contextKeywords || undefined,
                context_experiences: project.contextExperiences || undefined,
              })
            : null;

          // Short-term Memory 생성 (성장 패턴에서)
          const shortTermMemory = growthPatterns.analyzedAttemptCount > 0
            ? {
                growthPatterns: growthPatterns.growthPatterns.map((p) => ({
                  pattern: p,
                  mentionCount: 1,
                  lastMentioned: new Date().toISOString(),
                  expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                })),
                persistentWeaknesses: growthPatterns.persistentWeaknesses.map((p) => ({
                  pattern: p,
                  mentionCount: 2, // 최소 2회 이상 반복되어야 약점으로 표시됨
                  lastMentioned: new Date().toISOString(),
                  expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                })),
                recentFeedbackSummary: growthPatterns.recentFeedbackSummary,
                analyzedAttemptCount: growthPatterns.analyzedAttemptCount,
                updatedAt: new Date().toISOString(),
              }
            : null;

          progressiveContext = {
            longTerm: longTermMemory,
            shortTerm: shortTermMemory,
          };

          console.log('[analyze] Progressive Context built:', {
            hasLongTerm: !!progressiveContext.longTerm,
            hasShortTerm: !!progressiveContext.shortTerm,
            analyzedAttemptCount: growthPatterns.analyzedAttemptCount,
          });
        }
      } catch (error) {
        // Progressive Context 빌드 실패해도 분석은 계속 진행
        console.error('[analyze] Failed to build Progressive Context:', error);
      }
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
            projectType: body.projectType || undefined,
            userId: body.userId || undefined,
            progressiveContext,
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
