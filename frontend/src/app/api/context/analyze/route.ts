/**
 * 컨텍스트 분석 API
 * POST /api/context/analyze
 *
 * 업로드된 문서를 분석하여 요약, 키워드, 경험, 강점, 질문 영역 추출
 */

import { NextRequest, NextResponse } from 'next/server';
import { analyzeContext, extractTextFromDocument } from '@/lib/ai/nodes';
import type { ContextAnalysisInput } from '@/lib/ai/nodes';

interface AnalyzeRequest {
  // 방법 1: 직접 텍스트 전달
  documentText?: string;
  // 방법 2: 파일 URL 전달 (Storage에서 다운로드)
  fileUrl?: string;
  fileType?: string;
  // 공통
  documentType: 'resume' | 'presentation' | 'other';
  projectType: 'interview' | 'presentation' | 'free_speech';
  company?: string;
  position?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as AnalyzeRequest;

    // 입력 검증
    if (!body.documentText && !body.fileUrl) {
      return NextResponse.json(
        { error: 'documentText 또는 fileUrl이 필요합니다.' },
        { status: 400 }
      );
    }

    if (!body.documentType) {
      return NextResponse.json(
        { error: 'documentType이 필요합니다.' },
        { status: 400 }
      );
    }

    if (!body.projectType) {
      return NextResponse.json(
        { error: 'projectType이 필요합니다.' },
        { status: 400 }
      );
    }

    // 텍스트 추출 (파일 URL인 경우)
    let documentText = body.documentText;
    if (!documentText && body.fileUrl) {
      documentText = await extractTextFromDocument(
        body.fileUrl,
        body.fileType || 'text/plain'
      );
    }

    if (!documentText) {
      return NextResponse.json(
        { error: '문서 텍스트를 추출할 수 없습니다.' },
        { status: 400 }
      );
    }

    // 컨텍스트 분석 실행
    const input: ContextAnalysisInput = {
      documentText,
      documentType: body.documentType,
      projectType: body.projectType,
      company: body.company,
      position: body.position,
    };

    const result = await analyzeContext(input);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Context analysis error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '컨텍스트 분석 중 오류가 발생했습니다.',
      },
      { status: 500 }
    );
  }
}
