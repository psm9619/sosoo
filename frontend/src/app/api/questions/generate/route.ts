/**
 * 질문 생성 API
 * POST /api/questions/generate
 *
 * 컨텍스트 분석 결과를 기반으로 맞춤형 질문 생성
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  generateQuestions,
  generatePresentationQuestions,
} from '@/lib/ai/nodes';
import type {
  ContextAnalysisResult,
  InterviewCategory,
} from '@/lib/ai/nodes';

interface GenerateQuestionsRequest {
  projectType: 'interview' | 'presentation' | 'free_speech';
  context: ContextAnalysisResult;
  company?: string;
  position?: string;
  // 카테고리별 질문 수 (면접용, 선택)
  questionsPerCategory?: Partial<Record<InterviewCategory, number>>;
  // 발표용 질문 수 (선택)
  presentationQuestionCount?: number;
}

export async function POST(request: NextRequest) {
  console.log('[Questions Generate API] Request received');

  try {
    const body = (await request.json()) as GenerateQuestionsRequest;
    console.log('[Questions Generate API] Body:', {
      projectType: body.projectType,
      hasContext: !!body.context,
      company: body.company,
      position: body.position,
    });

    // 입력 검증
    if (!body.projectType) {
      console.log('[Questions Generate API] Missing projectType');
      return NextResponse.json(
        { error: 'projectType이 필요합니다.' },
        { status: 400 }
      );
    }

    if (!body.context) {
      console.log('[Questions Generate API] Missing context');
      return NextResponse.json(
        { error: 'context (분석 결과)가 필요합니다.' },
        { status: 400 }
      );
    }

    // 자유 스피치는 질문 생성 불필요
    if (body.projectType === 'free_speech') {
      return NextResponse.json({
        success: true,
        data: {
          questions: [],
          totalCount: 0,
          message: '자유 스피치 프로젝트는 질문 생성이 필요하지 않습니다.',
        },
      });
    }

    // 면접 프로젝트
    if (body.projectType === 'interview') {
      console.log('[Questions Generate API] Generating interview questions...');
      const result = await generateQuestions({
        projectType: body.projectType,
        context: body.context,
        company: body.company,
        position: body.position,
        questionsPerCategory: body.questionsPerCategory,
      });

      console.log('[Questions Generate API] Generated', result.questions.length, 'questions');
      return NextResponse.json({
        success: true,
        data: result,
      });
    }

    // 발표 프로젝트
    if (body.projectType === 'presentation') {
      const count = body.presentationQuestionCount || 10;
      const questions = await generatePresentationQuestions(body.context, count);

      return NextResponse.json({
        success: true,
        data: {
          questions,
          totalCount: questions.length,
        },
      });
    }

    return NextResponse.json(
      { error: '알 수 없는 projectType입니다.' },
      { status: 400 }
    );
  } catch (error) {
    console.error('[Questions Generate API] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '질문 생성 중 오류가 발생했습니다.',
      },
      { status: 500 }
    );
  }
}
