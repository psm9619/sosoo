/**
 * 질문 생성 노드
 * 컨텍스트 분석 결과를 기반으로 맞춤형 면접/발표 질문 생성
 */

import Anthropic from '@anthropic-ai/sdk';
import type { ContextAnalysisResult } from './context';

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

export type InterviewCategory =
  | 'basic'
  | 'motivation'
  | 'competency'
  | 'technical'
  | 'situation'
  | 'culture_fit';

export interface QuestionGenerationInput {
  projectType: 'interview' | 'presentation' | 'free_speech';
  context: ContextAnalysisResult;
  company?: string;
  position?: string;
  // 카테고리별 생성할 질문 수 (기본값 사용 가능)
  questionsPerCategory?: Partial<Record<InterviewCategory, number>>;
}

export interface GeneratedQuestion {
  text: string;
  category: InterviewCategory;
  order: number;
  isAiGenerated: true;
  generationContext: string; // 어떤 컨텍스트 기반으로 생성되었는지
}

export interface QuestionGenerationResult {
  questions: GeneratedQuestion[];
  totalCount: number;
}

// ============================================
// 기본 질문 수 (카테고리별)
// ============================================

export const DEFAULT_QUESTIONS_PER_CATEGORY: Record<InterviewCategory, number> = {
  basic: 1, // 자기소개
  motivation: 2, // 지원동기
  competency: 4, // 역량
  technical: 4, // 기술
  situation: 2, // 상황대처
  culture_fit: 1, // 컬쳐핏
};

// ============================================
// 프롬프트
// ============================================

const QUESTION_GENERATION_SYSTEM_PROMPT = `당신은 채용 면접관이자 스피치 코치입니다.
사용자의 이력서/발표자료 분석 결과를 기반으로 맞춤형 면접 질문을 생성합니다.

## 질문 생성 원칙

1. **구체성**: 사용자의 실제 경험에서 질문을 도출
2. **심층성**: 단순 확인이 아닌, 사고 과정/문제 해결 능력을 평가할 수 있는 질문
3. **연관성**: 지원 회사/포지션과 관련된 질문
4. **STAR 유도**: 상황(Situation), 과제(Task), 행동(Action), 결과(Result)를 이끌어낼 수 있는 질문

## 카테고리별 질문 특성

- **basic**: 자기소개, 간단한 배경 확인
- **motivation**: 지원 동기, 회사/직무에 대한 이해
- **competency**: 핵심 역량, 성과, 팀워크 경험
- **technical**: 기술적 지식, 프로젝트 상세, 문제 해결 방법론
- **situation**: 갈등 해결, 실패 경험, 압박 상황 대처
- **culture_fit**: 가치관, 성장 목표, 조직 문화 적합성

## 출력 형식
반드시 아래 JSON 형식으로만 응답하세요:
{
  "questions": [
    {
      "text": "질문 내용",
      "category": "카테고리",
      "generationContext": "이 질문을 생성한 근거 (컨텍스트 내 어떤 정보 기반인지)"
    }
  ]
}`;

function buildQuestionGenerationPrompt(input: QuestionGenerationInput): string {
  const { context, company, position, questionsPerCategory } = input;
  const counts = { ...DEFAULT_QUESTIONS_PER_CATEGORY, ...questionsPerCategory };

  let prompt = `## 컨텍스트 분석 결과\n\n`;
  prompt += `### 요약\n${context.summary}\n\n`;
  prompt += `### 키워드\n${context.keywords.join(', ')}\n\n`;

  if (context.experiences.length > 0) {
    prompt += `### 주요 경험\n`;
    context.experiences.forEach((exp, i) => {
      prompt += `${i + 1}. **${exp.title}** (${exp.role})\n`;
      if (exp.duration) prompt += `   - 기간: ${exp.duration}\n`;
      prompt += `   - 성과: ${exp.achievements.join(', ')}\n`;
      if (exp.skills?.length) prompt += `   - 기술: ${exp.skills.join(', ')}\n`;
      prompt += '\n';
    });
  }

  if (context.strengths.length > 0) {
    prompt += `### 강점\n${context.strengths.map((s) => `- ${s}`).join('\n')}\n\n`;
  }

  if (context.potentialQuestionAreas.length > 0) {
    prompt += `### 질문 가능 영역\n${context.potentialQuestionAreas.map((a) => `- ${a}`).join('\n')}\n\n`;
  }

  if (company) {
    prompt += `## 지원 회사\n${company}\n\n`;
  }

  if (position) {
    prompt += `## 지원 포지션\n${position}\n\n`;
  }

  prompt += `## 생성할 질문 수 (카테고리별)\n`;
  prompt += `- basic (자기소개): ${counts.basic}개\n`;
  prompt += `- motivation (지원동기): ${counts.motivation}개\n`;
  prompt += `- competency (역량): ${counts.competency}개\n`;
  prompt += `- technical (기술): ${counts.technical}개\n`;
  prompt += `- situation (상황대처): ${counts.situation}개\n`;
  prompt += `- culture_fit (컬쳐핏): ${counts.culture_fit}개\n\n`;

  prompt += `위 컨텍스트를 기반으로 각 카테고리별로 지정된 수만큼 맞춤형 면접 질문을 생성해주세요.`;

  return prompt;
}

// ============================================
// 질문 생성 함수
// ============================================

export async function generateQuestions(
  input: QuestionGenerationInput
): Promise<QuestionGenerationResult> {
  // 자유 스피치는 질문 생성 불필요
  if (input.projectType === 'free_speech') {
    return { questions: [], totalCount: 0 };
  }

  const prompt = buildQuestionGenerationPrompt(input);

  const response = await getAnthropic().messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4000,
    system: QUESTION_GENERATION_SYSTEM_PROMPT,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = response.content[0].type === 'text' ? response.content[0].text : '';

  // JSON 파싱
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('질문 생성 결과를 파싱할 수 없습니다.');
  }

  try {
    const parsed = JSON.parse(jsonMatch[0]) as {
      questions: Array<{
        text: string;
        category: InterviewCategory;
        generationContext: string;
      }>;
    };

    // order 할당 및 isAiGenerated 추가
    const questions: GeneratedQuestion[] = parsed.questions.map((q, index) => ({
      text: q.text,
      category: q.category,
      order: index + 1,
      isAiGenerated: true as const,
      generationContext: q.generationContext,
    }));

    return {
      questions,
      totalCount: questions.length,
    };
  } catch {
    throw new Error('질문 생성 JSON 파싱 실패');
  }
}

// ============================================
// 발표용 질문 생성 (Q&A 예상 질문)
// ============================================

const PRESENTATION_QA_SYSTEM_PROMPT = `당신은 프레젠테이션 코치입니다.
발표 자료 분석 결과를 기반으로 청중이 할 수 있는 예상 질문을 생성합니다.

## 질문 유형
1. **명확화 질문**: 발표 내용 중 복잡하거나 모호할 수 있는 부분
2. **심층 질문**: 발표에서 언급했지만 상세히 다루지 않은 부분
3. **도전 질문**: 발표 내용의 한계나 대안에 대한 질문
4. **적용 질문**: 실제 적용 사례나 확장 가능성

## 출력 형식
{
  "questions": [
    {
      "text": "예상 질문",
      "type": "clarification|deep_dive|challenge|application",
      "context": "이 질문이 나올 수 있는 이유"
    }
  ]
}`;

export interface PresentationQuestion {
  text: string;
  type: 'clarification' | 'deep_dive' | 'challenge' | 'application';
  order: number;
  generationContext: string;
}

export async function generatePresentationQuestions(
  context: ContextAnalysisResult,
  count: number = 10
): Promise<PresentationQuestion[]> {
  const prompt = `## 발표 내용 요약
${context.summary}

## 핵심 키워드
${context.keywords.join(', ')}

## 주요 포인트
${context.potentialQuestionAreas.map((a) => `- ${a}`).join('\n')}

위 발표 내용을 바탕으로 청중이 할 수 있는 예상 질문 ${count}개를 생성해주세요.
각 유형(clarification, deep_dive, challenge, application)별로 최소 1개씩 포함해주세요.`;

  const response = await getAnthropic().messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 3000,
    system: PRESENTATION_QA_SYSTEM_PROMPT,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = response.content[0].type === 'text' ? response.content[0].text : '';

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('발표 질문 생성 결과를 파싱할 수 없습니다.');
  }

  try {
    const parsed = JSON.parse(jsonMatch[0]) as {
      questions: Array<{
        text: string;
        type: 'clarification' | 'deep_dive' | 'challenge' | 'application';
        context: string;
      }>;
    };

    return parsed.questions.map((q, index) => ({
      text: q.text,
      type: q.type,
      order: index + 1,
      generationContext: q.context,
    }));
  } catch {
    throw new Error('발표 질문 JSON 파싱 실패');
  }
}
