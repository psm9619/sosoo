/**
 * 분석 노드
 * Claude API를 사용하여 스피치 분석 수행
 */

import Anthropic from '@anthropic-ai/sdk';
import type { SpeechCoachState } from '../state';
import type { ProjectType } from '@/types/project';
import type { AnalysisResult, ScoreCard, AnalysisMetrics, ImprovementSuggestion, PriorityRankingInfo, CategoryFeedback, CategoryEvaluation, SubcategoryEvaluation } from '@/types/api';
import { analyzePace } from '../tools/pace-analysis';
import { analyzeFillers } from '../tools/filler-analysis';
import { analyzeStructure } from '../tools/structure-analysis';
import { analyzeAllCategories, getCategorySummary } from '../tools/category-analyzer';
import { analyzePriority, getCategoryNameKo, getSituationLabel, isEqualWeight } from '../tools/priority-tools';
import { ANALYSIS_SYSTEM_PROMPT, CATEGORY_ANALYSIS_SYSTEM_PROMPT, buildAnalysisPrompt, buildCategoryAnalysisPrompt } from '../prompts';
import { moderateContent, isContentProcessable, getModerationWarningMessage, type ModerationResult } from './moderation';

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

// 등급 → 숫자 변환
const GRADE_MAP: Record<string, number> = {
  A: 4.0,
  'B+': 3.5,
  B: 3.0,
  'C+': 2.5,
  C: 2.0,
  D: 1.0,
};

/**
 * 분석 수행 및 결과 반환
 */
export async function analyzeContent(
  transcript: string,
  duration: number,
  userPatterns?: SpeechCoachState['userPatterns'],
  options?: {
    projectType?: ProjectType;
    question?: string;
    progressiveContext?: SpeechCoachState['progressiveContext'];
  }
): Promise<AnalysisResult> {
  // 0. 콘텐츠 모더레이션
  const moderationResult = moderateContent(transcript);

  // 처리 불가능한 콘텐츠인 경우 에러 throw
  if (!isContentProcessable(moderationResult)) {
    throw new Error('부적절한 콘텐츠가 감지되었습니다. 면접/발표에 적합한 내용으로 다시 녹음해주세요.');
  }

  // 마스킹된 텍스트 사용 (개인정보 보호)
  const processedTranscript = moderationResult.maskedText;

  // 1. 도구 실행 (병렬)
  const [paceResult, fillerResult, structureResult] = await Promise.all([
    Promise.resolve(analyzePace(processedTranscript, duration)),
    Promise.resolve(analyzeFillers(processedTranscript)),
    Promise.resolve(analyzeStructure(processedTranscript)),
  ]);

  // 1.5 자유스피치: 4가지 카테고리 분석 + 우선순위 랭킹
  let priorityRanking: PriorityRankingInfo | null = null;

  if (options?.projectType === 'free_speech') {
    const categoryResults = analyzeAllCategories(processedTranscript, duration);
    const priorityResult = analyzePriority(processedTranscript, categoryResults, {
      question: options.question,
      projectType: 'free_speech',
    });

    const situationLabelInfo = getSituationLabel(priorityResult.situation.situationType);
    const equalWeight = isEqualWeight(priorityResult.situation.situationType);

    priorityRanking = {
      situationType: priorityResult.situation.situationType,
      situationLabel: situationLabelInfo.label,
      situationDescription: priorityResult.situation.reasoning,
      isEqualWeight: equalWeight,
      focusMessage: priorityResult.focusMessage,
      weightedScores: priorityResult.weightedScores.map((s) => ({
        category: getCategoryNameKo(s.category),
        rawScore: s.rawScore,
        weight: s.weight,
        weightedScore: s.weightedScore,
        issues: s.issues,
        strengths: s.strengths,
      })),
      totalWeightedScore: priorityResult.totalWeightedScore,
      priorityFeedbackOrder: priorityResult.priorityFeedbackOrder.map(getCategoryNameKo),
    };
  }

  // 2. 프롬프트 구성 및 API 호출
  // 면접/발표는 새로운 카테고리별 피드백 시스템 사용
  const usesCategoryFeedback = options?.projectType === 'interview' || options?.projectType === 'presentation';

  let analysisResult: AnalysisResult;

  if (usesCategoryFeedback) {
    // 면접/발표: 카테고리별 상세 피드백
    const prompt = buildCategoryAnalysisPrompt({
      transcript: processedTranscript,
      duration,
      question: options?.question,
      paceResult: {
        wordsPerMinute: paceResult.wordsPerMinute,
        assessment: paceResult.assessment,
        recommendation: paceResult.recommendation,
      },
      fillerResult: {
        fillerCount: fillerResult.fillerCount,
        fillerPercentage: fillerResult.fillerPercentage,
        assessment: fillerResult.assessment,
        recommendation: fillerResult.recommendation,
        mostCommonFillers: fillerResult.mostCommonFillers,
      },
      structureResult: {
        structureScore: structureResult.structureScore,
        assessment: structureResult.assessment,
        recommendation: structureResult.recommendation,
        missingElements: structureResult.missingElements,
        hasNumbers: structureResult.hasNumbers,
      },
      progressiveContext: options?.progressiveContext,
    });

    const response = await getAnthropic().messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 3000,
      system: CATEGORY_ANALYSIS_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '';
    analysisResult = parseCategoryAnalysisResponse(text, paceResult, fillerResult, structureResult);
  } else {
    // 자유스피치: 기존 분석 시스템 유지
    const prompt = buildAnalysisPrompt({
      transcript: processedTranscript,
      duration,
      question: options?.question,
      paceResult: {
        wordsPerMinute: paceResult.wordsPerMinute,
        assessment: paceResult.assessment,
        recommendation: paceResult.recommendation,
      },
      fillerResult: {
        fillerCount: fillerResult.fillerCount,
        fillerPercentage: fillerResult.fillerPercentage,
        assessment: fillerResult.assessment,
        recommendation: fillerResult.recommendation,
      },
      structureResult: {
        structureScore: structureResult.structureScore,
        assessment: structureResult.assessment,
        recommendation: structureResult.recommendation,
      },
      progressiveContext: options?.progressiveContext,
      userPatterns: userPatterns
        ? {
            recurringIssues: userPatterns.recurringIssues,
            improvementTrend: userPatterns.improvementTrend,
            sessionCount: userPatterns.sessionCount,
          }
        : undefined,
    });

    const response = await getAnthropic().messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      system: ANALYSIS_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '';
    analysisResult = parseAnalysisResponse(text, paceResult, fillerResult, structureResult, priorityRanking);
  }

  // 5. Progressive Context 노트 추가
  if (userPatterns && userPatterns.sessionCount > 0) {
    analysisResult.progressiveContextNote = generateProgressiveNote(userPatterns, analysisResult);
  }

  // 6. 모더레이션 정보 추가
  if (moderationResult.flags.length > 0) {
    analysisResult.moderation = {
      isFlagged: moderationResult.isFlagged,
      warningMessage: getModerationWarningMessage(moderationResult),
      flagTypes: moderationResult.flags.map((f) => f.type),
    };
  }

  return analysisResult;
}

/**
 * Claude 응답에서 JSON 파싱
 */
function parseAnalysisResponse(
  text: string,
  paceResult: ReturnType<typeof analyzePace>,
  fillerResult: ReturnType<typeof analyzeFillers>,
  structureResult: ReturnType<typeof analyzeStructure>,
  priorityRanking?: PriorityRankingInfo | null
): AnalysisResult {
  // JSON 추출 시도
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  let parsed: Record<string, unknown> = {};

  if (jsonMatch) {
    try {
      parsed = JSON.parse(jsonMatch[0]);
    } catch {
      // JSON 파싱 실패 시 기본값 사용
    }
  }

  // scores 파싱
  const rawScores = parsed.scores as Record<string, string> | undefined;
  const scores: ScoreCard = {
    logicStructure: rawScores?.logic_structure || structureResult.score,
    fillerWords: rawScores?.filler_words || fillerResult.score,
    speakingPace: rawScores?.speaking_pace || paceResult.score,
    confidenceTone: rawScores?.confidence_tone || 'B',
    contentSpecificity: rawScores?.content_specificity || 'B',
  };

  // metrics (도구 결과에서 가져옴)
  const metrics: AnalysisMetrics = {
    wordsPerMinute: paceResult.wordsPerMinute,
    fillerCount: fillerResult.fillerCount,
    fillerPercentage: fillerResult.fillerPercentage,
    totalWords: fillerResult.totalWords,
    durationSeconds: paceResult.durationSeconds,
  };

  // suggestions 파싱
  const rawSuggestions = parsed.suggestions as Array<Record<string, unknown>> | undefined;
  let suggestions: ImprovementSuggestion[] = [];

  if (Array.isArray(rawSuggestions)) {
    suggestions = rawSuggestions.map((s, i) => ({
      priority: (s.priority as number) || i + 1,
      category: (s.category as string) || 'general',
      suggestion: (s.suggestion as string) || '',
      impact: (s.impact as string) || '',
    }));
  } else {
    // 기본 제안 생성
    const defaultSuggestions: ImprovementSuggestion[] = [];

    if (GRADE_MAP[paceResult.score] < 3) {
      defaultSuggestions.push({
        priority: 1,
        category: 'pace',
        suggestion: paceResult.recommendation,
        impact: '청중이 내용을 더 잘 이해할 수 있습니다.',
      });
    }

    if (GRADE_MAP[fillerResult.score] < 3) {
      defaultSuggestions.push({
        priority: 2,
        category: 'fillers',
        suggestion: fillerResult.recommendation,
        impact: '더 전문적이고 자신감 있게 들립니다.',
      });
    }

    if (GRADE_MAP[structureResult.score] < 3) {
      defaultSuggestions.push({
        priority: 3,
        category: 'structure',
        suggestion: structureResult.recommendation,
        impact: '답변이 더 논리적이고 설득력 있게 전달됩니다.',
      });
    }

    suggestions = defaultSuggestions;
  }

  // structure_analysis 파싱
  const structureAnalysis = (parsed.structure_analysis as string) || structureResult.recommendation;

  return {
    scores,
    metrics,
    suggestions,
    structureAnalysis,
    priorityRanking: priorityRanking || null,
  };
}

/**
 * 카테고리별 분석 응답 파싱 (면접/발표용)
 */
function parseCategoryAnalysisResponse(
  text: string,
  paceResult: ReturnType<typeof analyzePace>,
  fillerResult: ReturnType<typeof analyzeFillers>,
  structureResult: ReturnType<typeof analyzeStructure>
): AnalysisResult {
  // JSON 추출 시도
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  let parsed: Record<string, unknown> = {};

  if (jsonMatch) {
    try {
      parsed = JSON.parse(jsonMatch[0]);
    } catch {
      // JSON 파싱 실패 시 기본값 사용
    }
  }

  // 카테고리 피드백 파싱
  const rawCategories = parsed.categories as Record<string, unknown> | undefined;

  const categoryFeedback: CategoryFeedback = {
    summary: (parsed.summary as string) || '분석이 완료되었습니다.',
    categories: {
      delivery: parseCategoryEvaluation(rawCategories?.delivery, 'delivery', paceResult, fillerResult),
      structure: parseCategoryEvaluation(rawCategories?.structure, 'structure', paceResult, fillerResult, structureResult),
      content: parseCategoryEvaluation(rawCategories?.content, 'content', paceResult, fillerResult, structureResult),
      contextFit: parseCategoryEvaluation(rawCategories?.contextFit, 'contextFit', paceResult, fillerResult),
    },
  };

  // 기존 형식과 호환성을 위한 scores와 suggestions 생성
  const scores: ScoreCard = {
    logicStructure: structureResult.score,
    fillerWords: fillerResult.score,
    speakingPace: paceResult.score,
    confidenceTone: 'B',
    contentSpecificity: 'B',
  };

  const metrics: AnalysisMetrics = {
    wordsPerMinute: paceResult.wordsPerMinute,
    fillerCount: fillerResult.fillerCount,
    fillerPercentage: fillerResult.fillerPercentage,
    totalWords: fillerResult.totalWords,
    durationSeconds: paceResult.durationSeconds,
  };

  // 카테고리 평가에서 suggestions 추출
  const suggestions: ImprovementSuggestion[] = extractSuggestionsFromCategories(categoryFeedback);

  return {
    scores,
    metrics,
    suggestions,
    structureAnalysis: structureResult.recommendation,
    categoryFeedback,
  };
}

/**
 * 개별 카테고리 평가 파싱
 */
function parseCategoryEvaluation(
  raw: unknown,
  categoryType: string,
  paceResult: ReturnType<typeof analyzePace>,
  fillerResult: ReturnType<typeof analyzeFillers>,
  structureResult?: ReturnType<typeof analyzeStructure>
): CategoryEvaluation {
  const data = raw as Record<string, unknown> | undefined;

  // 기본값 생성 (도구 결과 기반)
  if (!data) {
    return createDefaultCategoryEvaluation(categoryType, paceResult, fillerResult, structureResult);
  }

  const level = (data.level as CategoryEvaluation['level']) || 'average';
  const label = (data.label as string) || getLabelFromLevel(level);
  const highlight = (data.highlight as string) || '';

  const rawSubcategories = data.subcategories as Array<Record<string, unknown>> | undefined;
  const subcategories: SubcategoryEvaluation[] = rawSubcategories
    ? rawSubcategories.map((sub) => ({
        name: (sub.name as string) || '',
        status: (sub.status as SubcategoryEvaluation['status']) || 'warning',
        feedback: (sub.feedback as string) || '',
        details: (sub.details as string[]) || undefined,
      }))
    : [];

  return { level, label, highlight, subcategories };
}

/**
 * 레벨에서 한글 레이블 추출
 */
function getLabelFromLevel(level: CategoryEvaluation['level']): string {
  const labels: Record<string, string> = {
    excellent: '훌륭함',
    good: '좋음',
    average: '보통',
    needs_improvement: '개선 필요',
  };
  return labels[level] || '보통';
}

/**
 * 도구 결과 기반 기본 카테고리 평가 생성
 */
function createDefaultCategoryEvaluation(
  categoryType: string,
  paceResult: ReturnType<typeof analyzePace>,
  fillerResult: ReturnType<typeof analyzeFillers>,
  structureResult?: ReturnType<typeof analyzeStructure>
): CategoryEvaluation {
  if (categoryType === 'delivery') {
    const paceStatus = paceResult.assessment === 'optimal' ? 'good' : 'warning';
    const fillerStatus = fillerResult.fillerPercentage <= 2 ? 'good' : fillerResult.fillerPercentage <= 4 ? 'warning' : 'bad';
    const level = paceStatus === 'good' && fillerStatus === 'good' ? 'good' : 'average';

    return {
      level,
      label: getLabelFromLevel(level),
      highlight: fillerStatus !== 'good' ? '⚠️ 필러워드 주의' : '✓ 전달력 양호',
      subcategories: [
        {
          name: '속도',
          status: paceStatus,
          feedback: `${paceResult.wordsPerMinute} WPM - ${paceResult.recommendation}`,
        },
        {
          name: '필러워드',
          status: fillerStatus,
          feedback: `${fillerResult.fillerCount}개 (${fillerResult.fillerPercentage.toFixed(1)}%)`,
          details: fillerResult.mostCommonFillers.slice(0, 3).map(([word, count]) => `"${word}" ${count}회`),
        },
        {
          name: '명확성',
          status: 'good',
          feedback: '문장 완결성 분석 필요',
        },
      ],
    };
  }

  if (categoryType === 'structure' && structureResult) {
    const level = structureResult.structureScore >= 70 ? 'good' : structureResult.structureScore >= 45 ? 'average' : 'needs_improvement';

    return {
      level,
      label: getLabelFromLevel(level),
      highlight: structureResult.missingElements.length === 0 ? '✓ STAR 구조 완비' : `⚠️ ${structureResult.missingElements[0]} 보완 필요`,
      subcategories: [
        {
          name: 'STAR 구조',
          status: structureResult.structureScore >= 70 ? 'good' : 'warning',
          feedback: structureResult.recommendation,
          details: structureResult.missingElements.length > 0 ? [`누락: ${structureResult.missingElements.join(', ')}`] : undefined,
        },
        {
          name: '논리적 흐름',
          status: 'good',
          feedback: '답변 흐름 분석 필요',
        },
        {
          name: '연결성',
          status: 'good',
          feedback: '문장 연결 분석 필요',
        },
      ],
    };
  }

  // 기본값
  return {
    level: 'average',
    label: '보통',
    highlight: '분석 중',
    subcategories: [],
  };
}

/**
 * 카테고리 평가에서 개선 제안 추출
 */
function extractSuggestionsFromCategories(feedback: CategoryFeedback): ImprovementSuggestion[] {
  const suggestions: ImprovementSuggestion[] = [];
  let priority = 1;

  const categoryNames: Record<string, string> = {
    delivery: '전달력',
    structure: '구조력',
    content: '내용력',
    contextFit: '상황 적합성',
  };

  for (const [key, category] of Object.entries(feedback.categories)) {
    // needs_improvement 또는 average인 카테고리에서 제안 추출
    if (category.level === 'needs_improvement' || category.level === 'average') {
      const badSubcategories = category.subcategories.filter((sub) => sub.status === 'bad' || sub.status === 'warning');

      for (const sub of badSubcategories.slice(0, 2)) {
        suggestions.push({
          priority: priority++,
          category: categoryNames[key] || key,
          suggestion: sub.feedback,
          impact: `${sub.name} 개선`,
        });
      }
    }
  }

  return suggestions.slice(0, 5); // 최대 5개
}

/**
 * Progressive Context 기반 피드백 생성
 */
function generateProgressiveNote(
  userPatterns: NonNullable<SpeechCoachState['userPatterns']>,
  currentAnalysis: AnalysisResult
): string {
  const { recurringIssues, improvementTrend, sessionCount } = userPatterns;

  let note = `${sessionCount}번째 연습입니다. `;

  if (improvementTrend === 'improving') {
    note += '지속적으로 발전하고 있습니다! ';
  } else if (improvementTrend === 'declining') {
    note += '최근 연습에서 집중이 필요해 보입니다. ';
  }

  // 반복 이슈 체크
  const topIssue = Object.entries(recurringIssues).sort(([, a], [, b]) => b - a)[0];
  if (topIssue) {
    const [category, count] = topIssue;
    if (count >= 3) {
      note += `"${category}" 관련 피드백이 ${count}회 반복되고 있습니다. 이 부분에 집중해보세요.`;
    }
  }

  return note.trim();
}

/**
 * Analysis 노드 - 상태를 업데이트
 */
export async function analysisNode(state: SpeechCoachState): Promise<Partial<SpeechCoachState>> {
  if (!state.transcript || !state.audioDuration) {
    return {
      error: { code: 'ANALYSIS_ERROR', message: 'STT 결과가 없습니다.' },
    };
  }

  try {
    const analysisResult = await analyzeContent(
      state.transcript,
      state.audioDuration,
      state.userPatterns,
      {
        projectType: state.projectType,
        question: state.question,
        progressiveContext: state.progressiveContext,
      }
    );

    return {
      analysisResult,
      messages: [
        ...state.messages,
        { step: 'analysis', progress: 100, message: '분석이 완료되었습니다.' },
      ],
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : '분석 중 오류가 발생했습니다.';

    return {
      error: { code: 'ANALYSIS_ERROR', message },
      messages: [
        ...state.messages,
        { step: 'analysis', progress: 0, message },
      ],
    };
  }
}
