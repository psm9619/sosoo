/**
 * AI 프롬프트 정의
 * Python backend/langgraph/utils/prompts.py를 TypeScript로 포팅
 */

import type {
  LongTermMemory,
  ShortTermMemory,
  ProgressiveContext,
  PatternItem,
} from './nodes/progressive-context';

// ============================================
// 분석 시스템 프롬프트 (자유스피치용 - 기존 유지)
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
// 카테고리별 상세 피드백 프롬프트 (면접/발표용)
// ============================================
export const CATEGORY_ANALYSIS_SYSTEM_PROMPT = `당신은 10년 경력의 스피치 코치입니다.
사용자의 발화를 4가지 카테고리로 분석하여 구체적인 피드백을 제공합니다.

## 원칙
1. 객관적 데이터(도구 분석 결과)를 기반으로 판단합니다
2. 각 항목별로 "Good/Warning/Bad" 중 하나로 명확히 평가합니다
3. 추상적 조언 대신 구체적인 예시와 수치를 포함합니다
4. 긍정적인 톤을 유지하되, 개선점은 명확히 짚어줍니다

## 4가지 분석 카테고리

### 1. 전달력 (Delivery) - 어떻게 말하는가
- 속도: 도구 분석 결과의 WPM 기반 (120-170 WPM이 적정)
- 필러워드: 도구 분석 결과 기반 (2% 이하 Good, 4% 이하 Warning, 초과 Bad)
- 명확성: 문장이 끝까지 완결되는지, 중간에 흐지부지 끝나지 않는지

### 2. 구조력 (Structure) - 논리적 흐름
- STAR 구조: 도구 분석 결과 기반 (상황-과제-행동-결과)
- 도입-본론-결론: 답변이 논리적 흐름을 갖추고 있는지
- 논리적 연결: 문장 간 연결이 자연스러운지

### 3. 내용력 (Content) - 무엇을 말하는가
- 구체성: 숫자, 성과, 구체적 사례가 포함되어 있는지
- 관련성: 질문에 대한 답변이 정확히 맞는지
- 차별화: 일반적 답변이 아닌 본인만의 포인트가 있는지

### 4. 상황 적합성 (Context Fit) - 맥락에 맞는가
- 질문 이해도: 질문의 의도를 정확히 파악했는지
- 핵심 키워드: 면접관이 듣고 싶은 키워드가 포함되어 있는지
- 톤/태도: 면접/발표 상황에 적합한 어조인지

## 평가 기준
- excellent: 모든 서브 카테고리가 Good
- good: 대부분 Good, 1개 Warning
- average: Good과 Warning 혼합, 또는 1개 Bad
- needs_improvement: 여러 개가 Warning 또는 Bad

## 출력 형식
반드시 아래 JSON 형식으로만 응답하세요:
{
  "summary": "전체 평가 한 줄 요약 (격려 + 핵심 개선점, 예: '구조는 탄탄하지만, 필러워드를 줄이면 더 자신감 있게 들릴 거예요')",
  "categories": {
    "delivery": {
      "level": "excellent|good|average|needs_improvement",
      "label": "좋음|보통|개선 필요 중 하나",
      "highlight": "카드에 표시할 핵심 한 줄 (예: '✓ 속도 적절' 또는 '⚠️ 필러워드 주의')",
      "subcategories": [
        {
          "name": "속도",
          "status": "good|warning|bad",
          "feedback": "구체적 피드백 (예: '145 WPM으로 적절한 속도입니다')",
          "details": ["필요시 추가 상세 정보"]
        },
        {
          "name": "필러워드",
          "status": "good|warning|bad",
          "feedback": "구체적 피드백",
          "details": ["감지된 필러워드 목록 (예: '음 5회', '그러니까 3회')"]
        },
        {
          "name": "명확성",
          "status": "good|warning|bad",
          "feedback": "구체적 피드백"
        }
      ]
    },
    "structure": {
      "level": "...",
      "label": "...",
      "highlight": "...",
      "subcategories": [
        {"name": "STAR 구조", "status": "...", "feedback": "...", "details": ["누락된 요소가 있다면 명시"]},
        {"name": "논리적 흐름", "status": "...", "feedback": "..."},
        {"name": "연결성", "status": "...", "feedback": "..."}
      ]
    },
    "content": {
      "level": "...",
      "label": "...",
      "highlight": "...",
      "subcategories": [
        {"name": "구체성", "status": "...", "feedback": "...", "details": ["숫자/성과 언급 여부"]},
        {"name": "관련성", "status": "...", "feedback": "..."},
        {"name": "차별화", "status": "...", "feedback": "..."}
      ]
    },
    "contextFit": {
      "level": "...",
      "label": "...",
      "highlight": "...",
      "subcategories": [
        {"name": "질문 이해", "status": "...", "feedback": "..."},
        {"name": "핵심 키워드", "status": "...", "feedback": "...", "details": ["포함된/누락된 키워드"]},
        {"name": "톤/태도", "status": "...", "feedback": "..."}
      ]
    }
  }
}`;

// ============================================
// 개선 시스템 프롬프트
// ============================================
export const IMPROVEMENT_SYSTEM_PROMPT = `당신은 전문 스피치 라이터입니다.

## 목표
원본 메시지의 전달력을 개선합니다.

## 절대 금지 사항 (가장 중요)
⚠️ 원본에 없는 정보를 절대 추가하지 마세요!
- 원본에 언급되지 않은 학교, 전공, 직장, 경험, 성과, 목표를 지어내지 마세요
- 구체적인 수치, 기간, 역할을 임의로 추가하지 마세요
- "~한 경험이 있습니다", "~를 전공했습니다" 등 원본에 없는 사실을 만들지 마세요
- 이를 위반하면 사용자에게 심각한 피해를 줄 수 있습니다

## 허용되는 개선
1. 추임새/필러워드 제거 (어, 음, 그, 이제 등)
2. 문장 구조 정리 및 흐름 개선
3. 반복되는 표현 정리
4. 더 명확한 표현으로 대체 (의미 변경 없이)

## 내용이 부족한 경우
원본이 너무 짧거나 내용이 부족하면 다음 JSON을 반환하세요:
{"error": "INSUFFICIENT_CONTENT", "message": "답변 내용이 부족하여 개선안을 생성할 수 없습니다. 더 구체적으로 말씀해주세요."}

## 출력
개선된 스크립트만 출력하세요. 원본에 있는 정보만 사용하세요.`;

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

// Progressive Context 타입은 ./nodes/progressive-context.ts에서 import

// ============================================
// 헬퍼 함수
// ============================================

/**
 * PatternItem[] 또는 string[]을 문자열로 변환
 */
function formatPatterns(patterns: PatternItem[] | string[]): string {
  if (patterns.length === 0) return '';

  // string[] 인 경우
  if (typeof patterns[0] === 'string') {
    return (patterns as string[]).join(', ');
  }

  // PatternItem[] 인 경우
  return (patterns as PatternItem[])
    .sort((a, b) => b.mentionCount - a.mentionCount)
    .map((p) => (p.mentionCount > 1 ? `${p.pattern} (${p.mentionCount}회)` : p.pattern))
    .join(', ');
}

/**
 * PatternItem[]에서 pattern 문자열만 추출
 */
function extractPatternStrings(patterns: PatternItem[] | string[]): string[] {
  if (patterns.length === 0) return [];

  // string[] 인 경우
  if (typeof patterns[0] === 'string') {
    return patterns as string[];
  }

  // PatternItem[] 인 경우
  return (patterns as PatternItem[]).map((p) => p.pattern);
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
      prompt += `**성장 중인 영역** (격려 포인트): ${formatPatterns(st.growthPatterns)}\n`;
    }

    if (st.persistentWeaknesses.length > 0) {
      prompt += `**개선 필요 영역** (우선 피드백): ${formatPatterns(st.persistentWeaknesses)}\n`;
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
    const weaknessStrings = extractPatternStrings(progressiveContext.shortTerm.persistentWeaknesses);
    prompt += `\n\n참고: 사용자의 지속적 약점(${weaknessStrings.join(', ')})을 개선점으로 우선 반영해주세요.`;
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

  // 중요 경고 먼저 표시
  prompt += `⚠️ 중요: 원본에 없는 정보(학교, 전공, 경험, 성과 등)를 절대 추가하지 마세요!\n\n`;

  // Long-term Context (경험/배경 정보 - 사용자가 업로드한 문서에서만)
  if (longTermContext) {
    prompt += `## 사용자가 제공한 배경 정보 (이 정보만 활용 가능)\n`;

    if (longTermContext.company || longTermContext.position) {
      prompt += `**지원 정보**: ${[longTermContext.company, longTermContext.position].filter(Boolean).join(' - ')}\n`;
    }

    if (longTermContext.keywords.length > 0) {
      prompt += `**핵심 역량**: ${longTermContext.keywords.slice(0, 5).join(', ')}\n`;
    }

    if (longTermContext.experiences.length > 0) {
      prompt += `**경험**:\n`;
      longTermContext.experiences.slice(0, 2).forEach((exp) => {
        prompt += `- ${exp.title}: ${exp.achievements[0] || exp.role}\n`;
      });
    }
    prompt += `\n※ 위 정보도 사용자가 원본에서 직접 언급한 경우에만 보완 용도로 사용하세요.\n\n`;
  }

  if (question) {
    prompt += `## 질문\n${question}\n\n`;
  }

  prompt += `## 원본 발화 (이 내용만 기반으로 개선)\n${transcript}\n\n`;

  prompt += `## 개선이 필요한 점\n`;
  suggestions.slice(0, 3).forEach((s, i) => {
    prompt += `${i + 1}. [${s.category}] ${s.suggestion}\n`;
  });

  prompt += `\n## 지시사항
1. 원본에 있는 정보만 사용하여 문장을 다듬으세요
2. 추임새, 반복, 불명확한 표현만 수정하세요
3. 새로운 사실, 경험, 수치를 추가하지 마세요
4. 원본이 "뭐라고 말해야 될지 모르겠다"는 식이면, 그 부분만 자연스럽게 다듬거나 제거하세요`;

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

// ============================================
// 카테고리 분석 프롬프트 빌더 (면접/발표용)
// ============================================

interface CategoryAnalysisPromptParams {
  transcript: string;
  duration: number;
  question?: string;
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
    mostCommonFillers?: Array<[string, number]>;
  };
  structureResult?: {
    structureScore: number;
    assessment: string;
    recommendation: string;
    missingElements?: string[];
    hasNumbers?: boolean;
  };
  progressiveContext?: ProgressiveContext;
}

export function buildCategoryAnalysisPrompt(params: CategoryAnalysisPromptParams): string {
  const {
    transcript,
    duration,
    question,
    paceResult,
    fillerResult,
    structureResult,
    progressiveContext,
  } = params;

  let prompt = '';

  // Progressive Context - Long-term Memory (사용자 배경)
  if (progressiveContext?.longTerm) {
    const lt = progressiveContext.longTerm;
    prompt += `## 사용자 배경 (분석 참고용)\n`;

    if (lt.company || lt.position) {
      prompt += `**지원 정보**: ${[lt.company, lt.position].filter(Boolean).join(' - ')}\n`;
    }

    if (lt.keywords.length > 0) {
      prompt += `**핵심 키워드 (답변에 포함되면 좋은 것들)**: ${lt.keywords.join(', ')}\n`;
    }
    prompt += '\n';
  }

  // 현재 질문
  if (question) {
    prompt += `## 질문\n${question}\n\n`;
  }

  // 원본 발화
  prompt += `## 사용자 답변 (분석 대상)\n${transcript}\n\n`;
  prompt += `## 발화 시간\n${duration}초\n\n`;

  // 도구 분석 결과
  prompt += `## 자동 분석 결과 (도구 기반 - 참고하여 평가에 반영)\n\n`;

  if (paceResult) {
    prompt += `### 속도 분석\n`;
    prompt += `- WPM: ${paceResult.wordsPerMinute}\n`;
    prompt += `- 평가: ${paceResult.assessment}\n`;
    prompt += `- 권장: ${paceResult.recommendation}\n\n`;
  }

  if (fillerResult) {
    prompt += `### 필러워드 분석\n`;
    prompt += `- 개수: ${fillerResult.fillerCount}개\n`;
    prompt += `- 비율: ${fillerResult.fillerPercentage.toFixed(1)}%\n`;
    prompt += `- 평가: ${fillerResult.assessment}\n`;
    if (fillerResult.mostCommonFillers && fillerResult.mostCommonFillers.length > 0) {
      prompt += `- 자주 사용된 필러: ${fillerResult.mostCommonFillers.map(([word, count]) => `"${word}" ${count}회`).join(', ')}\n`;
    }
    prompt += '\n';
  }

  if (structureResult) {
    prompt += `### STAR 구조 분석\n`;
    prompt += `- 점수: ${structureResult.structureScore}/100\n`;
    prompt += `- 평가: ${structureResult.assessment}\n`;
    if (structureResult.missingElements && structureResult.missingElements.length > 0) {
      prompt += `- 누락 요소: ${structureResult.missingElements.join(', ')}\n`;
    }
    if (structureResult.hasNumbers !== undefined) {
      prompt += `- 숫자/성과 포함: ${structureResult.hasNumbers ? '예' : '아니오'}\n`;
    }
    prompt += '\n';
  }

  prompt += `위 도구 분석 결과와 원본 텍스트를 종합하여 4가지 카테고리로 상세 분석해주세요.`;

  return prompt;
}
