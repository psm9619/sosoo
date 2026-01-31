/**
 * 컨텍스트 분석 노드
 * 업로드된 문서(레주메, 발표자료)를 분석하여 요약 및 키워드 추출
 */

import Anthropic from '@anthropic-ai/sdk';

// Lazy-loaded Anthropic client
let anthropicInstance: Anthropic | null = null;

function getAnthropic(): Anthropic {
  if (!anthropicInstance) {
    anthropicInstance = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }
  return anthropicInstance;
}

// ============================================
// 타입 정의
// ============================================

export interface ContextAnalysisInput {
  documentText: string;
  documentType: 'resume' | 'presentation' | 'other';
  projectType: 'interview' | 'presentation' | 'free_speech';
  company?: string;
  position?: string;
}

export interface Experience {
  title: string;
  role: string;
  duration?: string;
  achievements: string[];
  skills?: string[];
}

export interface ContextAnalysisResult {
  summary: string;
  keywords: string[];
  experiences: Experience[];
  strengths: string[];
  potentialQuestionAreas: string[];
}

// ============================================
// 프롬프트
// ============================================

const CONTEXT_ANALYSIS_SYSTEM_PROMPT = `당신은 채용 전문가이자 스피치 코치입니다.
사용자가 업로드한 문서(레주메, 발표자료 등)를 분석하여 면접/발표 준비에 활용할 수 있는 정보를 추출합니다.

## 분석 목표
1. 문서 내용을 간결하게 요약
2. 핵심 키워드 추출 (기술, 역량, 경험 등)
3. 주요 경험/프로젝트 구조화
4. 강점 파악
5. 면접관/청중이 질문할 만한 영역 식별

## 출력 형식
반드시 아래 JSON 형식으로만 응답하세요:
{
  "summary": "3-5문장의 요약",
  "keywords": ["키워드1", "키워드2", ...],
  "experiences": [
    {
      "title": "프로젝트/경험명",
      "role": "담당 역할",
      "duration": "기간 (있을 경우)",
      "achievements": ["성과1", "성과2"],
      "skills": ["사용 기술/역량"]
    }
  ],
  "strengths": ["강점1", "강점2", ...],
  "potentialQuestionAreas": ["질문 가능 영역1", "질문 가능 영역2", ...]
}`;

function buildContextAnalysisPrompt(input: ContextAnalysisInput): string {
  let prompt = `## 문서 유형\n${input.documentType === 'resume' ? '이력서/레주메' : input.documentType === 'presentation' ? '발표 자료' : '기타 문서'}\n\n`;

  if (input.company) {
    prompt += `## 지원 회사\n${input.company}\n\n`;
  }

  if (input.position) {
    prompt += `## 지원 포지션\n${input.position}\n\n`;
  }

  prompt += `## 문서 내용\n${input.documentText}\n\n`;
  prompt += `위 문서를 분석하여 JSON 형식으로 결과를 제공하세요.`;

  return prompt;
}

// ============================================
// 컨텍스트 분석 함수
// ============================================

export async function analyzeContext(input: ContextAnalysisInput): Promise<ContextAnalysisResult> {
  const prompt = buildContextAnalysisPrompt(input);

  const response = await getAnthropic().messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2000,
    system: CONTEXT_ANALYSIS_SYSTEM_PROMPT,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = response.content[0].type === 'text' ? response.content[0].text : '';

  // JSON 파싱
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('컨텍스트 분석 결과를 파싱할 수 없습니다.');
  }

  try {
    const parsed = JSON.parse(jsonMatch[0]) as ContextAnalysisResult;
    return {
      summary: parsed.summary || '',
      keywords: parsed.keywords || [],
      experiences: parsed.experiences || [],
      strengths: parsed.strengths || [],
      potentialQuestionAreas: parsed.potentialQuestionAreas || [],
    };
  } catch {
    throw new Error('컨텍스트 분석 JSON 파싱 실패');
  }
}

// ============================================
// 문서 텍스트 추출 (간단 버전)
// ============================================
// 실제로는 PDF/DOCX 파서 필요 - 여기서는 플레이스홀더

export async function extractTextFromDocument(
  fileUrl: string,
  fileType: string
): Promise<string> {
  // TODO: 실제 구현 시 pdf-parse, mammoth 등 사용
  // 현재는 파일 URL에서 텍스트를 가져오는 것으로 가정

  const response = await fetch(fileUrl);
  if (!response.ok) {
    throw new Error(`문서 다운로드 실패: ${response.status}`);
  }

  // 텍스트 파일인 경우 직접 반환
  if (fileType === 'text/plain' || fileType === 'text/markdown') {
    return response.text();
  }

  // PDF/DOCX는 별도 처리 필요
  // 임시로 에러 반환
  throw new Error(`${fileType} 파일 형식은 아직 지원되지 않습니다. 텍스트 파일을 업로드해주세요.`);
}
