/**
 * 컨텍스트 분석 API
 * POST /api/context/analyze
 *
 * 업로드된 문서를 분석하여 요약, 키워드, 경험, 강점, 질문 영역 추출
 *
 * 지원 방식:
 * 1. JSON body: { documentText, documentType, projectType, ... }
 * 2. FormData: file + metadata
 */

import { NextRequest, NextResponse } from 'next/server';
import { analyzeContext, extractTextFromDocument, extractTextFromFile } from '@/lib/ai/nodes';
import type { ContextAnalysisInput } from '@/lib/ai/nodes';

interface AnalyzeRequest {
  documentText?: string;
  fileUrl?: string;
  fileType?: string;
  documentType: 'resume' | 'presentation' | 'other';
  projectType: 'interview' | 'presentation' | 'free_speech';
  company?: string;
  position?: string;
}

export async function POST(request: NextRequest) {
  console.log('[Context Analyze API] Request received');

  try {
    const contentType = request.headers.get('content-type') || '';
    console.log('[Context Analyze API] Content-Type:', contentType);

    let documentText: string | undefined;
    let documentType: 'resume' | 'presentation' | 'other' = 'other';
    let projectType: 'interview' | 'presentation' | 'free_speech' = 'interview';
    let company: string | undefined;
    let position: string | undefined;

    // FormData 방식 (파일 업로드)
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('file') as File | null;

      console.log('[Context Analyze API] FormData received, file:', file?.name, file?.size, file?.type);

      if (!file) {
        console.log('[Context Analyze API] No file in FormData');
        return NextResponse.json(
          { error: 'file이 필요합니다.' },
          { status: 400 }
        );
      }

      console.log('[Context Analyze API] Extracting text from file...');
      documentText = await extractTextFromFile(file);
      console.log('[Context Analyze API] Text extracted, length:', documentText.length);
      documentType = (formData.get('documentType') as string || 'other') as typeof documentType;
      projectType = (formData.get('projectType') as string || 'interview') as typeof projectType;
      company = formData.get('company') as string | undefined;
      position = formData.get('position') as string | undefined;
    }
    // JSON 방식
    else {
      const body = (await request.json()) as AnalyzeRequest;

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
      documentText = body.documentText;
      if (!documentText && body.fileUrl) {
        documentText = await extractTextFromDocument(
          body.fileUrl,
          body.fileType || 'text/plain'
        );
      }

      documentType = body.documentType;
      projectType = body.projectType;
      company = body.company;
      position = body.position;
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
      documentType,
      projectType,
      company,
      position,
    };

    console.log('[Context Analyze API] Starting AI analysis...');
    const result = await analyzeContext(input);
    console.log('[Context Analyze API] Analysis complete:', result.summary?.substring(0, 100));

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('[Context Analyze API] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '컨텍스트 분석 중 오류가 발생했습니다.',
      },
      { status: 500 }
    );
  }
}
