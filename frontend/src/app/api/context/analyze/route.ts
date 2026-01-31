/**
 * 컨텍스트 분석 API
 * POST /api/context/analyze
 *
 * 업로드된 문서를 분석하여 요약, 키워드, 경험, 강점, 질문 영역 추출
 *
 * PDF: Claude API에 직접 전달 (pdf-parse 불필요)
 * DOCX: mammoth로 텍스트 추출 (동적 import)
 *
 * 지원 방식:
 * 1. FormData: file + metadata (권장)
 * 2. JSON body: { documentText, documentType, projectType, ... }
 */

import { NextRequest, NextResponse } from 'next/server';
import { analyzeContext, extractDocumentData } from '@/lib/ai/nodes';
import type { ContextAnalysisInput } from '@/lib/ai/nodes';

interface AnalyzeRequest {
  documentText?: string;
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

    let input: ContextAnalysisInput;

    // FormData 방식 (파일 업로드) - 권장
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

      const documentType = (formData.get('documentType') as string || 'other') as 'resume' | 'presentation' | 'other';
      const projectType = (formData.get('projectType') as string || 'interview') as 'interview' | 'presentation' | 'free_speech';
      const company = formData.get('company') as string | undefined;
      const position = formData.get('position') as string | undefined;

      // 파일에서 문서 데이터 추출
      // - PDF: base64 (Claude API에 직접 전달)
      // - DOCX: text (mammoth로 추출)
      console.log('[Context Analyze API] Extracting document data...');
      const documentData = await extractDocumentData(file);
      console.log('[Context Analyze API] Document data extracted:', {
        hasPdfBase64: !!documentData.pdfBase64,
        hasText: !!documentData.text,
      });

      input = {
        documentText: documentData.text,
        pdfBase64: documentData.pdfBase64,
        documentType,
        projectType,
        company,
        position,
      };
    }
    // JSON 방식 (텍스트 직접 전달)
    else {
      const body = (await request.json()) as AnalyzeRequest;

      if (!body.documentText) {
        return NextResponse.json(
          { error: 'documentText가 필요합니다.' },
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

      input = {
        documentText: body.documentText,
        documentType: body.documentType,
        projectType: body.projectType,
        company: body.company,
        position: body.position,
      };
    }

    // 컨텍스트 분석 실행
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
