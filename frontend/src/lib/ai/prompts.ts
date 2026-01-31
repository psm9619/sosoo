/**
 * AI 프롬프트 정의
 * Python backend/langgraph/utils/prompts.py를 TypeScript로 포팅
 */

// ============================================
// 분석 시스템 프롬프트
// ============================================
export const ANALYSIS_SYSTEM_PROMPT = `당신은 10년 경력의 스피치 코치입니다.

## 원칙
1. 객관적 데이터를 기반으로 분석합니다 (감정 아닌 수치)
2. 실용적이고 즉시 적용 가능한 조언을 제공합니다
3. 긍정적인 톤으로 잠재력에 집중합니다
4. 가장 영향력 있는 1-2개 개선점에 집중합니다
5. 사용자 컨텍스트가 주어지면 해당 배경/경험을 반영하여 분석합니다
6. 최근 연습 패턴이 주어지면, 성장한 부분은 격려하고 반복되는 약점은 우선 개선점으로 제시합니다

## 평가 척도
- A: 훌륭함 (수정 거의 불필요)
- B+: 좋음 (사소한 수정)
- B: 적정 (일부 개선 필요)
- C+: 보통 (명확한 개선 필요)
- C: 미흡 (여러 문제)
- D: 대폭 수정 필요

## 출력 형식
반드시 아래 JSON 형식으로만 응답하세요:
{
  "scores": {
    "logic_structure": "등급",
    "filler_words": "등급",
    "speaking_pace": "등급",
    "confidence_tone": "등급",
    "content_specificity": "등급"
  },
  "suggestions": [
    {
      "priority": 1,
      "category": "카테고리",
      "suggestion": "개선 제안",
      "impact": "기대 효과"
    }
  ],
  "structure_analysis": "STAR 구조 분석 (해당시)"
}`;

// ============================================
// 개선 시스템 프롬프트
// ============================================
export const IMPROVEMENT_SYSTEM_PROMPT = `당신은 전문 스피치 라이터입니다.

## 목표
원본 메시지와 화자의 스타일을 유지하면서 전달력을 개선합니다.

## 규칙
1. 핵심 메시지를 절대 변경하지 마세요 (의도 보존)
2. 화자의 어휘와 스타일을 유지하세요
3. 분석에서 지적된 문제만 수정하세요
4. 자연스럽고 말하기 쉬운 언어를 사용하세요
5. 화자가 언급하지 않은 내용을 추가하지 마세요

## 출력
개선된 스크립트만 출력하세요. 설명이나 부연은 불필요합니다.`;

// ============================================
// 반성 (Self-Review) 시스템 프롬프트
// ============================================
export const REFLECTION_SYSTEM_PROMPT = `당신은 품질 검토자입니다.

## 검토 기준
1. 핵심 메시지가 보존되었는가?
2. 지적된 문제가 실제로 수정되었는가?
3. 화자의 스타일이 유지되었는가?
4. 말하기에 자연스러운가?

## 출력 형식
반드시 아래 JSON 형식으로만 응답하세요:
{
  "passes_review": true/false,
  "issues_found": ["문제1", "문제2"],
  "suggested_fixes": ["수정1", "수정2"],
  "final_script": "문제가 있으면 수정된 버전, 없으면 빈 문자열"
}`;

// ============================================
// 재요청 시스템 프롬프트
// ============================================
export const REFINEMENT_SYSTEM_PROMPT = `당신은 스피치 라이터입니다.
사용자의 피드백을 반영하여 스크립트를 수정합니다.

## 규칙
1. 사용자의 의도를 정확히 반영하세요
2. 원본 분석 결과를 참고하세요
3. 자연스러운 말투를 유지하세요

## 출력 형식
반드시 아래 형식으로 응답하세요:

## 변경 사항
- 변경 내용 1
- 변경 내용 2

## 수정된 스크립트
(여기에 수정된 스크립트)`;

// ============================================
// Progressive Context 타입 (메모리 시스템)
// ============================================

interface LongTermMemory {
  summary: string;
  keywords: string[];
  experiences: Array<{
    title: string;
    role: string;
    achievements: string[];
    skills?: string[];
  }>;
  strengths: string[];
  company?: string;
  position?: string;
  projectType: 'interview' | 'presentation' | 'free_speech';
}

interface ShortTermMemory {
  growthPatterns: string[];
  persistentWeaknesses: string[];
  recentFeedbackSummary: string;
  analyzedAttemptCount: number;
}

interface ProgressiveContext {
  longTerm: LongTermMemory | null;
  shortTerm: ShortTermMemory | null;
}

// ============================================
// 프롬프트 빌더
// ============================================

interface AnalysisPromptParams {
  transcript: string;
  duration: number;
  question?: string; // 현재 질문
  paceResult?: {
    wordsPerMinute: number;
    assessment: string;
    recommendation: string;
  };
  fillerResult?: {
    fillerCount: number;
    fillerPercentage: number;
    assessment: string;
    recommendation: string;
  };
  structureResult?: {
    structureScore: number;
    assessment: string;
    recommendation: string;
  };
  // Progressive Context (새로운 메모리 시스템)
  progressiveContext?: ProgressiveContext;
  // Legacy: 이전 호환성 유지
  userPatterns?: {
    recurringIssues: Record<string, number>;
    improvementTrend: string;
    sessionCount: number;
  };
}

export function buildAnalysisPrompt(params: AnalysisPromptParams): string {
  const {
    transcript,
    duration,
    question,
    paceResult,
    fillerResult,
    structureResult,
    progressiveContext,
    userPatterns,
  } = params;

  let prompt = '';

  // Progressive Context - Long-term Memory (사용자 배경)
  if (progressiveContext?.longTerm) {
    const lt = progressiveContext.longTerm;
    prompt += `## 사용자 배경 (Long-term Context)\n`;

    if (lt.company || lt.position) {
      prompt += `**지원 정보**: ${[lt.company, lt.position].filter(Boolean).join(' - ')}\n`;
    }

    if (lt.summary) {
      prompt += `**프로필 요약**: ${lt.summary}\n`;
    }

    if (lt.keywords.length > 0) {
      prompt += `**핵심 키워드**: ${lt.keywords.join(', ')}\n`;
    }

    if (lt.experiences.length > 0) {
      prompt += `**주요 경험**:\n`;
      lt.experiences.slice(0, 3).forEach((exp) => {
        prompt += `- ${exp.title} (${exp.role}): ${exp.achievements.slice(0, 2).join(', ')}\n`;
      });
    }

    if (lt.strengths.length > 0) {
      prompt += `**강점**: ${lt.strengths.join(', ')}\n`;
    }
    prompt += '\n';
  }

  // Progressive Context - Short-term Memory (최근 연습 패턴)
  if (progressiveContext?.shortTerm && progressiveContext.shortTerm.analyzedAttemptCount > 0) {
    const st = progressiveContext.shortTerm;
    prompt += `## 최근 연습 패턴 (Short-term Context, ${st.analyzedAttemptCount}회 분석)\n`;

    if (st.growthPatterns.length > 0) {
      prompt += `**성장 중인 영역** (격려 포인트): ${st.growthPatterns.join(', ')}\n`;
    }

    if (st.persistentWeaknesses.length > 0) {
      prompt += `**개선 필요 영역** (우선 피드백): ${st.persistentWeaknesses.join(', ')}\n`;
    }

    if (st.recentFeedbackSummary) {
      prompt += `**최근 핵심 피드백**: ${st.recentFeedbackSummary}\n`;
    }
    prompt += '\n';
  }

  // Legacy userPatterns 지원 (이전 버전 호환)
  if (!progressiveContext && userPatterns && userPatterns.sessionCount > 0) {
    prompt += `## 사용자 이력 (Progressive Context)\n`;
    prompt += `- 총 ${userPatterns.sessionCount}회 연습\n`;
    prompt += `- 개선 추세: ${userPatterns.improvementTrend}\n`;

    const issues = Object.entries(userPatterns.recurringIssues)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3);

    if (issues.length > 0) {
      prompt += `- 반복 이슈: ${issues.map(([k, v]) => `${k}(${v}회)`).join(', ')}\n`;
    }
    prompt += '\n';
  }

  // 현재 질문
  if (question) {
    prompt += `## 질문\n${question}\n\n`;
  }

  // 원본 발화
  prompt += `## 원본 발화\n${transcript}\n\n`;
  prompt += `## 발화 시간\n${duration}초\n\n`;

  // 도구 분석 결과
  if (paceResult) {
    prompt += `## 속도 분석 결과\n`;
    prompt += `- WPM: ${paceResult.wordsPerMinute}\n`;
    prompt += `- 평가: ${paceResult.assessment}\n`;
    prompt += `- 권장: ${paceResult.recommendation}\n\n`;
  }

  if (fillerResult) {
    prompt += `## 필러워드 분석 결과\n`;
    prompt += `- 개수: ${fillerResult.fillerCount}개\n`;
    prompt += `- 비율: ${fillerResult.fillerPercentage.toFixed(1)}%\n`;
    prompt += `- 평가: ${fillerResult.assessment}\n`;
    prompt += `- 권장: ${fillerResult.recommendation}\n\n`;
  }

  if (structureResult) {
    prompt += `## 구조 분석 결과\n`;
    prompt += `- 점수: ${structureResult.structureScore}/100\n`;
    prompt += `- 평가: ${structureResult.assessment}\n`;
    prompt += `- 권장: ${structureResult.recommendation}\n\n`;
  }

  prompt += `위 정보를 바탕으로 종합 분석을 JSON 형식으로 제공하세요.`;
  if (progressiveContext?.shortTerm?.persistentWeaknesses?.length) {
    prompt += `\n\n참고: 사용자의 지속적 약점(${progressiveContext.shortTerm.persistentWeaknesses.join(', ')})을 개선점으로 우선 반영해주세요.`;
  }

  return prompt;
}

interface ImprovementPromptParams {
  transcript: string;
  suggestions: Array<{ category: string; suggestion: string }>;
  question?: string;
  // Long-term context for better improvement
  longTermContext?: LongTermMemory | null;
}

export function buildImprovementPrompt(params: ImprovementPromptParams): string {
  const { transcript, suggestions, question, longTermContext } = params;

  let prompt = '';

  // Long-term Context (경험/배경 정보 - 개선 시 활용)
  if (longTermContext) {
    prompt += `## 사용자 배경 (참고용)\n`;

    if (longTermContext.company || longTermContext.position) {
      prompt += `**지원 정보**: ${[longTermContext.company, longTermContext.position].filter(Boolean).join(' - ')}\n`;
    }

    if (longTermContext.keywords.length > 0) {
      prompt += `**핵심 역량**: ${longTermContext.keywords.slice(0, 5).join(', ')}\n`;
    }

    if (longTermContext.experiences.length > 0) {
      prompt += `**활용 가능한 경험**:\n`;
      longTermContext.experiences.slice(0, 2).forEach((exp) => {
        prompt += `- ${exp.title}: ${exp.achievements[0] || exp.role}\n`;
      });
    }
    prompt += `\n※ 위 배경은 참고용입니다. 사용자가 직접 언급하지 않은 내용은 추가하지 마세요.\n\n`;
  }

  if (question) {
    prompt += `## 질문\n${question}\n\n`;
  }

  prompt += `## 원본 발화\n${transcript}\n\n`;

  prompt += `## 개선이 필요한 점 (우선순위순)\n`;
  suggestions.slice(0, 3).forEach((s, i) => {
    prompt += `${i + 1}. [${s.category}] ${s.suggestion}\n`;
  });

  prompt += `\n위 문제점을 개선한 스크립트를 작성하세요.`;

  return prompt;
}

interface RefinementPromptParams {
  originalTranscript: string;
  currentScript: string;
  userIntent: string;
  suggestions: Array<{ category: string; suggestion: string }>;
}

export function buildRefinementPrompt(params: RefinementPromptParams): string {
  const { originalTranscript, currentScript, userIntent, suggestions } = params;

  let prompt = `## 원본 발화\n${originalTranscript}\n\n`;
  prompt += `## 현재 개선안\n${currentScript}\n\n`;
  prompt += `## 사용자 피드백\n${userIntent}\n\n`;

  prompt += `## 원래 분석에서 지적된 문제점\n`;
  suggestions.slice(0, 3).forEach((s, i) => {
    prompt += `${i + 1}. [${s.category}] ${s.suggestion}\n`;
  });

  prompt += `\n사용자의 피드백을 반영하여 스크립트를 수정하세요.`;

  return prompt;
}
