/**
 * Progressive Context (메모리 시스템)
 *
 * 두 가지 메모리 타입:
 * 1. Long-term Memory: 프로젝트 컨텍스트 (문서 분석 결과) - 새 문서 추가 시만 갱신
 * 2. Short-term Memory: 최근 3개 시도의 패턴 분석 - 매 세션마다 갱신
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

/**
 * Long-term Memory: 프로젝트 컨텍스트
 * - projects 테이블의 context_* 필드에서 가져옴
 * - 새 문서 업로드 시에만 갱신
 * - STM에서 5회 이상 반복된 패턴은 confirmed로 승격
 */
export interface LongTermMemory {
  // 문서 분석 결과
  summary: string;
  keywords: string[];
  experiences: Array<{
    title: string;
    role: string;
    achievements: string[];
    skills?: string[];
  }>;
  strengths: string[];

  // STM에서 승격된 확정 패턴 (5회 이상 반복)
  confirmedStrengths: string[];
  confirmedWeaknesses: string[];

  // 메타 정보
  company?: string;
  position?: string;
  projectType: 'interview' | 'presentation' | 'free_speech';
}

/**
 * 최근 시도 데이터 (DB에서 가져온 raw data)
 */
export interface RecentAttempt {
  id: string;
  questionText: string;
  originalText: string;
  improvedText?: string;
  analysis?: {
    scores?: {
      logic_structure?: string;
      filler_words?: string;
      speaking_pace?: string;
      confidence_tone?: string;
      content_specificity?: string;
    };
    suggestions?: Array<{
      priority: number;
      category: string;
      suggestion: string;
    }>;
  };
  score?: number;
  createdAt: string;
}

/**
 * 패턴 항목 (mentionCount 추적용)
 */
export interface PatternItem {
  pattern: string;
  mentionCount: number;
  lastMentioned: string; // ISO timestamp
  expiresAt: string; // TTL - ISO timestamp (기본 7일)
}

/**
 * Short-term Memory: 최근 시도 패턴 분석
 * - 최근 3개 시도에서 추출
 * - 매 세션마다 갱신
 * - TTL 기반 만료 (기본 7일)
 * - 5회 이상 반복 시 LTM으로 승격
 */
export interface ShortTermMemory {
  // 성장 패턴 (유의미한 개선 영역) - mentionCount 추적
  growthPatterns: PatternItem[];

  // 지속적 약점 (반복되는 문제점) - mentionCount 추적
  persistentWeaknesses: PatternItem[];

  // 최근 피드백 요약 (가장 중요한 개선점)
  recentFeedbackSummary: string;

  // 분석 기반 시도 수
  analyzedAttemptCount: number;

  // 마지막 갱신 시간
  updatedAt: string;
}

// STM→LTM 승격 임계값
export const PROMOTION_THRESHOLD = 5;

// STM TTL (7일)
export const STM_TTL_DAYS = 7;

/**
 * 통합 메모리 (분석 프롬프트에 주입)
 */
export interface ProgressiveContext {
  longTerm: LongTermMemory | null;
  shortTerm: ShortTermMemory | null;
}

// ============================================
// Short-term Memory 생성 프롬프트
// ============================================

const SHORT_TERM_ANALYSIS_PROMPT = `당신은 스피치 코치입니다.
사용자의 최근 연습 기록과 기존 패턴 데이터를 분석하여 성장 패턴과 약점을 파악합니다.

## 분석 관점
1. **성장 패턴**: 최근 연습에서 유의미하게 개선된 영역
   - 점수가 상승한 카테고리
   - 피드백이 긍정적으로 변화한 부분
   - 이전 피드백을 반영한 흔적

2. **지속적 약점**: 여러 연습에서 반복되는 문제점
   - 계속 낮은 점수를 받는 카테고리
   - 반복적으로 지적되는 피드백
   - 개선되지 않는 패턴

3. **최근 피드백 요약**: 가장 최근 연습의 핵심 개선점 1줄

## 기존 패턴과의 매칭
기존 패턴이 제공된 경우, 새로 발견된 패턴이 기존 패턴과 유사한지 확인하세요.
유사한 패턴이 있다면 동일한 표현을 사용해주세요 (mentionCount 증가를 위해).

## 출력 형식
반드시 아래 JSON 형식으로만 응답하세요:
{
  "growthPatterns": ["성장 패턴 1", "성장 패턴 2"],
  "persistentWeaknesses": ["약점 1", "약점 2"],
  "recentFeedbackSummary": "가장 최근 핵심 피드백 1줄"
}

참고:
- 데이터가 부족하면 빈 배열 반환
- 최대 3개씩만 추출 (가장 중요한 것만)
- 한국어로 간결하게 작성
- 기존 패턴과 유사하면 동일한 문구 사용`;

// ============================================
// Short-term Memory 생성 함수
// ============================================

/**
 * TTL이 만료된 패턴 필터링
 */
function filterExpiredPatterns(patterns: PatternItem[]): PatternItem[] {
  const now = new Date().toISOString();
  return patterns.filter((p) => p.expiresAt > now);
}

/**
 * 새 패턴을 기존 패턴과 병합 (mentionCount 증가)
 */
function mergePatterns(
  existingPatterns: PatternItem[],
  newPatternStrings: string[]
): PatternItem[] {
  const now = new Date();
  const ttl = new Date(now.getTime() + STM_TTL_DAYS * 24 * 60 * 60 * 1000);
  const nowStr = now.toISOString();
  const ttlStr = ttl.toISOString();

  // 먼저 만료된 패턴 제거
  const validPatterns = filterExpiredPatterns(existingPatterns);

  // 기존 패턴을 맵으로 변환
  const patternMap = new Map<string, PatternItem>();
  validPatterns.forEach((p) => patternMap.set(p.pattern, p));

  // 새 패턴 병합
  newPatternStrings.forEach((patternStr) => {
    const existing = patternMap.get(patternStr);
    if (existing) {
      // 기존 패턴: mentionCount 증가, TTL 갱신
      patternMap.set(patternStr, {
        ...existing,
        mentionCount: existing.mentionCount + 1,
        lastMentioned: nowStr,
        expiresAt: ttlStr,
      });
    } else {
      // 새 패턴: 초기화
      patternMap.set(patternStr, {
        pattern: patternStr,
        mentionCount: 1,
        lastMentioned: nowStr,
        expiresAt: ttlStr,
      });
    }
  });

  return Array.from(patternMap.values());
}

/**
 * STM에서 LTM으로 승격할 패턴 추출 (5회 이상)
 */
export function extractPatternsForPromotion(stm: ShortTermMemory): {
  strengths: string[];
  weaknesses: string[];
} {
  const strengths = stm.growthPatterns
    .filter((p) => p.mentionCount >= PROMOTION_THRESHOLD)
    .map((p) => p.pattern);

  const weaknesses = stm.persistentWeaknesses
    .filter((p) => p.mentionCount >= PROMOTION_THRESHOLD)
    .map((p) => p.pattern);

  return { strengths, weaknesses };
}

/**
 * 최근 시도들을 분석하여 Short-term Memory 생성
 * @param recentAttempts 최근 3개 시도 (최신순)
 * @param existingStm 기존 STM (패턴 병합용)
 */
export async function generateShortTermMemory(
  recentAttempts: RecentAttempt[],
  existingStm?: ShortTermMemory | null
): Promise<ShortTermMemory> {
  const now = new Date().toISOString();

  // 시도가 없으면 빈 메모리 반환
  if (!recentAttempts || recentAttempts.length === 0) {
    return {
      growthPatterns: existingStm ? filterExpiredPatterns(existingStm.growthPatterns) : [],
      persistentWeaknesses: existingStm
        ? filterExpiredPatterns(existingStm.persistentWeaknesses)
        : [],
      recentFeedbackSummary: '',
      analyzedAttemptCount: 0,
      updatedAt: now,
    };
  }

  // 기존 패턴 문자열 추출 (AI가 일관된 표현 사용하도록)
  const existingGrowthStrings =
    existingStm?.growthPatterns.map((p) => p.pattern).join(', ') || '';
  const existingWeaknessStrings =
    existingStm?.persistentWeaknesses.map((p) => p.pattern).join(', ') || '';

  // 시도 데이터를 프롬프트용 텍스트로 변환
  const attemptsText = recentAttempts
    .map((attempt, index) => {
      let text = `### 연습 ${index + 1} (${attempt.createdAt})\n`;
      text += `**질문**: ${attempt.questionText}\n`;
      text += `**답변**: ${attempt.originalText}\n`;

      if (attempt.analysis?.scores) {
        text += `**점수**:\n`;
        const scores = attempt.analysis.scores;
        if (scores.logic_structure) text += `- 논리 구조: ${scores.logic_structure}\n`;
        if (scores.filler_words) text += `- 필러워드: ${scores.filler_words}\n`;
        if (scores.speaking_pace) text += `- 말하기 속도: ${scores.speaking_pace}\n`;
        if (scores.confidence_tone) text += `- 자신감: ${scores.confidence_tone}\n`;
        if (scores.content_specificity) text += `- 내용 구체성: ${scores.content_specificity}\n`;
      }

      if (attempt.analysis?.suggestions?.length) {
        text += `**피드백**:\n`;
        attempt.analysis.suggestions.slice(0, 3).forEach((s) => {
          text += `- [${s.category}] ${s.suggestion}\n`;
        });
      }

      if (attempt.improvedText) {
        text += `**개선된 답변**: ${attempt.improvedText.slice(0, 200)}...\n`;
      }

      return text;
    })
    .join('\n---\n\n');

  // 기존 패턴 컨텍스트 추가
  let contextNote = '';
  if (existingGrowthStrings || existingWeaknessStrings) {
    contextNote = `\n\n## 기존 패턴 (유사한 패턴은 동일 표현 사용)\n`;
    if (existingGrowthStrings) {
      contextNote += `- 기존 성장 패턴: ${existingGrowthStrings}\n`;
    }
    if (existingWeaknessStrings) {
      contextNote += `- 기존 약점 패턴: ${existingWeaknessStrings}\n`;
    }
  }

  const response = await getAnthropic().messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1000,
    system: SHORT_TERM_ANALYSIS_PROMPT,
    messages: [
      {
        role: 'user',
        content: `다음 ${recentAttempts.length}개의 최근 연습 기록을 분석해주세요:\n\n${attemptsText}${contextNote}`,
      },
    ],
  });

  const text = response.content[0].type === 'text' ? response.content[0].text : '';

  // JSON 파싱
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    return {
      growthPatterns: existingStm ? filterExpiredPatterns(existingStm.growthPatterns) : [],
      persistentWeaknesses: existingStm
        ? filterExpiredPatterns(existingStm.persistentWeaknesses)
        : [],
      recentFeedbackSummary: '',
      analyzedAttemptCount: recentAttempts.length,
      updatedAt: now,
    };
  }

  try {
    const parsed = JSON.parse(jsonMatch[0]) as {
      growthPatterns?: string[];
      persistentWeaknesses?: string[];
      recentFeedbackSummary?: string;
    };

    // 기존 패턴과 병합
    const mergedGrowth = mergePatterns(
      existingStm?.growthPatterns || [],
      parsed.growthPatterns || []
    );

    const mergedWeaknesses = mergePatterns(
      existingStm?.persistentWeaknesses || [],
      parsed.persistentWeaknesses || []
    );

    return {
      growthPatterns: mergedGrowth,
      persistentWeaknesses: mergedWeaknesses,
      recentFeedbackSummary: parsed.recentFeedbackSummary || '',
      analyzedAttemptCount: recentAttempts.length,
      updatedAt: now,
    };
  } catch {
    return {
      growthPatterns: existingStm ? filterExpiredPatterns(existingStm.growthPatterns) : [],
      persistentWeaknesses: existingStm
        ? filterExpiredPatterns(existingStm.persistentWeaknesses)
        : [],
      recentFeedbackSummary: '',
      analyzedAttemptCount: recentAttempts.length,
      updatedAt: now,
    };
  }
}

// ============================================
// Long-term Memory 변환 함수
// ============================================

/**
 * 프로젝트 데이터에서 Long-term Memory 추출
 * @param project 프로젝트 데이터 (DB에서 가져온)
 */
export function extractLongTermMemory(project: {
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
  // STM에서 승격된 확정 패턴 (DB에 저장)
  confirmed_strengths?: string[];
  confirmed_weaknesses?: string[];
}): LongTermMemory | null {
  // 컨텍스트가 없으면 null 반환
  if (!project.context_summary && !project.context_keywords?.length) {
    return null;
  }

  return {
    summary: project.context_summary || '',
    keywords: project.context_keywords || [],
    experiences: project.context_experiences || [],
    strengths: [], // 컨텍스트 분석 시 추출된 강점 (필요시 추가)
    confirmedStrengths: project.confirmed_strengths || [],
    confirmedWeaknesses: project.confirmed_weaknesses || [],
    company: project.company,
    position: project.position,
    projectType: project.type,
  };
}

// ============================================
// 통합 컨텍스트 생성
// ============================================

/**
 * PatternItem을 읽기 쉬운 문자열로 변환
 */
function formatPatternWithCount(patterns: PatternItem[]): string {
  return patterns
    .sort((a, b) => b.mentionCount - a.mentionCount) // 높은 순으로 정렬
    .map((p) => (p.mentionCount > 1 ? `${p.pattern} (${p.mentionCount}회)` : p.pattern))
    .join(', ');
}

/**
 * Long-term + Short-term 메모리를 결합하여 분석 프롬프트용 텍스트 생성
 */
export function formatProgressiveContext(context: ProgressiveContext): string {
  const parts: string[] = [];

  // Long-term Memory 포맷
  if (context.longTerm) {
    parts.push('## 사용자 배경 (Long-term Context)');

    if (context.longTerm.company || context.longTerm.position) {
      parts.push(
        `**지원 정보**: ${[context.longTerm.company, context.longTerm.position].filter(Boolean).join(' - ')}`
      );
    }

    if (context.longTerm.summary) {
      parts.push(`**프로필 요약**: ${context.longTerm.summary}`);
    }

    if (context.longTerm.keywords.length > 0) {
      parts.push(`**핵심 키워드**: ${context.longTerm.keywords.join(', ')}`);
    }

    if (context.longTerm.experiences.length > 0) {
      parts.push('**주요 경험**:');
      context.longTerm.experiences.slice(0, 3).forEach((exp) => {
        parts.push(`- ${exp.title} (${exp.role}): ${exp.achievements.slice(0, 2).join(', ')}`);
      });
    }

    if (context.longTerm.strengths.length > 0) {
      parts.push(`**강점**: ${context.longTerm.strengths.join(', ')}`);
    }

    // 확정된 패턴 (STM에서 5회 이상 반복되어 승격됨)
    if (context.longTerm.confirmedStrengths.length > 0) {
      parts.push(`**확정된 강점** (일관되게 잘하는 영역): ${context.longTerm.confirmedStrengths.join(', ')}`);
    }

    if (context.longTerm.confirmedWeaknesses.length > 0) {
      parts.push(`**확정된 개선점** (집중 개선 필요): ${context.longTerm.confirmedWeaknesses.join(', ')}`);
    }
  }

  // Short-term Memory 포맷
  if (context.shortTerm && context.shortTerm.analyzedAttemptCount > 0) {
    parts.push('');
    parts.push('## 최근 연습 패턴 (Short-term Context)');

    if (context.shortTerm.growthPatterns.length > 0) {
      parts.push(`**성장 중인 영역**: ${formatPatternWithCount(context.shortTerm.growthPatterns)}`);
    }

    if (context.shortTerm.persistentWeaknesses.length > 0) {
      parts.push(`**개선 필요 영역**: ${formatPatternWithCount(context.shortTerm.persistentWeaknesses)}`);
    }

    if (context.shortTerm.recentFeedbackSummary) {
      parts.push(`**최근 핵심 피드백**: ${context.shortTerm.recentFeedbackSummary}`);
    }
  }

  return parts.join('\n');
}

// ============================================
// 전체 Progressive Context 빌드
// ============================================

/**
 * STM→LTM 승격 결과
 */
export interface PromotionResult {
  promoted: boolean;
  newConfirmedStrengths: string[];
  newConfirmedWeaknesses: string[];
}

/**
 * 프로젝트 + 최근 시도 데이터로 전체 Progressive Context 생성
 * STM에서 5회 이상 반복된 패턴은 LTM으로 승격
 */
export async function buildProgressiveContext(params: {
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
    confirmed_strengths?: string[];
    confirmed_weaknesses?: string[];
  };
  recentAttempts?: RecentAttempt[];
  existingStm?: ShortTermMemory | null;
}): Promise<{
  context: ProgressiveContext;
  promotion: PromotionResult;
}> {
  const { project, recentAttempts, existingStm } = params;

  // Long-term Memory 추출
  const longTerm = project ? extractLongTermMemory(project) : null;

  // Short-term Memory 생성 (비동기, 기존 STM과 병합)
  const shortTerm =
    recentAttempts && recentAttempts.length > 0
      ? await generateShortTermMemory(recentAttempts, existingStm)
      : existingStm || null;

  // STM→LTM 승격 체크
  const promotionResult: PromotionResult = {
    promoted: false,
    newConfirmedStrengths: [],
    newConfirmedWeaknesses: [],
  };

  if (shortTerm) {
    const { strengths, weaknesses } = extractPatternsForPromotion(shortTerm);

    // 기존 confirmed에 없는 새 패턴만 승격
    const existingConfirmedStrengths = new Set(longTerm?.confirmedStrengths || []);
    const existingConfirmedWeaknesses = new Set(longTerm?.confirmedWeaknesses || []);

    promotionResult.newConfirmedStrengths = strengths.filter(
      (s) => !existingConfirmedStrengths.has(s)
    );
    promotionResult.newConfirmedWeaknesses = weaknesses.filter(
      (w) => !existingConfirmedWeaknesses.has(w)
    );

    if (
      promotionResult.newConfirmedStrengths.length > 0 ||
      promotionResult.newConfirmedWeaknesses.length > 0
    ) {
      promotionResult.promoted = true;

      // LTM에 승격된 패턴 추가
      if (longTerm) {
        longTerm.confirmedStrengths = [
          ...longTerm.confirmedStrengths,
          ...promotionResult.newConfirmedStrengths,
        ];
        longTerm.confirmedWeaknesses = [
          ...longTerm.confirmedWeaknesses,
          ...promotionResult.newConfirmedWeaknesses,
        ];
      }
    }
  }

  return {
    context: { longTerm, shortTerm },
    promotion: promotionResult,
  };
}
