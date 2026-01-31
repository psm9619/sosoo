/**
 * Progressive Context 빌드 API
 * POST /api/memory/build
 *
 * 분석 전에 호출하여 Long-term + Short-term 메모리를 구성
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  buildProgressiveContext,
  extractLongTermMemory,
  generateShortTermMemory,
} from '@/lib/ai/nodes';
import type { RecentAttempt } from '@/lib/ai/nodes';

interface BuildMemoryRequest {
  // 프로젝트 데이터 (Long-term Memory용)
  project?: {
    type: 'interview' | 'presentation' | 'free_speech';
    company?: string;
    position?: string;
    context_summary?: string;
    context_keywords?: string[];
    context_experiences?: Array<{
      title: string;
      role: string;
      achievements: string[];
      skills?: string[];
    }>;
  };

  // 최근 시도 데이터 (Short-term Memory용)
  recentAttempts?: RecentAttempt[];

  // 옵션: Short-term만 빌드 (Long-term은 캐시 사용)
  shortTermOnly?: boolean;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as BuildMemoryRequest;

    // Short-term만 빌드하는 경우
    if (body.shortTermOnly && body.recentAttempts) {
      const shortTerm = await generateShortTermMemory(body.recentAttempts);

      return NextResponse.json({
        success: true,
        data: {
          longTerm: null,
          shortTerm,
        },
      });
    }

    // Long-term만 빌드하는 경우 (동기 작업)
    if (body.project && !body.recentAttempts) {
      const longTerm = extractLongTermMemory(body.project);

      return NextResponse.json({
        success: true,
        data: {
          longTerm,
          shortTerm: null,
        },
      });
    }

    // 전체 빌드
    const progressiveContext = await buildProgressiveContext({
      project: body.project,
      recentAttempts: body.recentAttempts,
    });

    return NextResponse.json({
      success: true,
      data: progressiveContext,
    });
  } catch (error) {
    console.error('Memory build error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '메모리 빌드 중 오류가 발생했습니다.',
      },
      { status: 500 }
    );
  }
}
