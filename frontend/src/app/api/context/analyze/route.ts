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
import { analyzeContext, extractTextFromDocument } from '@/lib/ai/nodes';
import type { ContextAnalysisInput } from '@/lib/ai/nodes';
import * as mammoth from 'mammoth';
import { PDFParse } from 'pdf-parse';

// PDF 파일에서 텍스트 추출
async function parsePdf(buffer: Buffer): Promise<{ text: string }> {
  const pdf = new PDFParse({ data: new Uint8Array(buffer) });
  const result = await pdf.getText();
  return { text: result.text };
}

interface AnalyzeRequest {
  documentText?: string;
  fileUrl?: string;
  fileType?: string;
  documentType: 'resume' | 'presentation' | 'other';
  projectType: 'interview' | 'presentation' | 'free_speech';
  company?: string;
  position?: string;
}

// 파일에서 텍스트 추출 (브라우저에서 업로드된 파일)
async function extractTextFromFile(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // PDF 파일
  if (file.type === 'application/pdf') {
    const pdfData = await parsePdf(buffer);
    return pdfData.text;
  }

  // DOCX 파일
  if (
    file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    file.type === 'application/msword'
  ) {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  }

  // 텍스트 파일
  if (file.type === 'text/plain' || file.type === 'text/markdown') {
    return new TextDecoder().decode(buffer);
  }

  throw new Error(`${file.type} 파일 형식은 지원되지 않습니다. PDF, DOCX, 또는 텍스트 파일을 업로드해주세요.`);
}

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type') || '';

    let documentText: string | undefined;
    let documentType: 'resume' | 'presentation' | 'other' = 'other';
    let projectType: 'interview' | 'presentation' | 'free_speech' = 'interview';
    let company: string | undefined;
    let position: string | undefined;

    // FormData 방식 (파일 업로드)
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('file') as File | null;

      if (!file) {
        return NextResponse.json(
          { error: 'file이 필요합니다.' },
          { status: 400 }
        );
      }

      documentText = await extractTextFromFile(file);
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
