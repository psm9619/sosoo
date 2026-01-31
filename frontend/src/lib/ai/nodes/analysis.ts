/**
 * 분석 노드
 * Claude API를 사용하여 스피치 분석 수행
 */

import Anthropic from '@anthropic-ai/sdk';
import type { SpeechCoachState } from '../state';
import type { ProjectType } from '@/types/project';
import type { AnalysisResult, ScoreCard, AnalysisMetrics, ImprovementSuggestion, PriorityRankingInfo } from '@/types/api';
import { analyzePace } from '../tools/pace-analysis';
import { analyzeFillers } from '../tools/filler-analysis';
import { analyzeStructure } from '../tools/structure-analysis';
import { analyzeAllCategories, getCategorySummary } from '../tools/category-analyzer';
import { analyzePriority, getCategoryNameKo, getSituationLabel, isEqualWeight } from '../tools/priority-tools';
import { ANALYSIS_SYSTEM_PROMPT, buildAnalysisPrompt } from '../prompts';

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
  // 1. 도구 실행 (병렬)
  const [paceResult, fillerResult, structureResult] = await Promise.all([
    Promise.resolve(analyzePace(transcript, duration)),
    Promise.resolve(analyzeFillers(transcript)),
    Promise.resolve(analyzeStructure(transcript)),
  ]);

  // 1.5 자유스피치: 4가지 카테고리 분석 + 우선순위 랭킹
  let priorityRanking: PriorityRankingInfo | null = null;

  if (options?.projectType === 'free_speech') {
    const categoryResults = analyzeAllCategories(transcript, duration);
    const priorityResult = analyzePriority(transcript, categoryResults, {
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

  // 2. 프롬프트 구성
  const prompt = buildAnalysisPrompt({
    transcript,
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
    // Progressive Context (새로운 메모리 시스템)
    progressiveContext: options?.progressiveContext,
    // Legacy userPatterns (이전 버전 호환)
    userPatterns: userPatterns
      ? {
          recurringIssues: userPatterns.recurringIssues,
          improvementTrend: userPatterns.improvementTrend,
          sessionCount: userPatterns.sessionCount,
        }
      : undefined,
  });

  // 3. Claude API 호출
  const response = await getAnthropic().messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2000,
    system: ANALYSIS_SYSTEM_PROMPT,
    messages: [{ role: 'user', content: prompt }],
  });

  // 4. 응답 파싱
  const text = response.content[0].type === 'text' ? response.content[0].text : '';
  const analysisResult = parseAnalysisResponse(text, paceResult, fillerResult, structureResult, priorityRanking);

  // 5. Progressive Context 노트 추가
  if (userPatterns && userPatterns.sessionCount > 0) {
    analysisResult.progressiveContextNote = generateProgressiveNote(userPatterns, analysisResult);
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
