/**
 * 우선순위 랭킹 시스템
 * 상황별로 카테고리 가중치를 동적으로 조정합니다.
 *
 * ## 핵심 개념
 * - 면접/발표/자유스피치 등 상황에 따라 중요한 피드백이 다름
 * - 기술 면접은 '내용력'이 중요, 자유스피치는 '전달력'이 중요
 * - 가중치를 통해 상황에 맞는 피드백 우선순위 조정
 */

import type { AllCategoryResults, CategorySummary } from './category-analyzer';

// ============================================
// 타입 정의
// ============================================

/**
 * 상황 유형
 */
export type SituationType =
  | 'interview_technical'    // 기술 면접
  | 'interview_behavioral'   // 인성/행동 면접
  | 'interview_general'      // 일반 면접
  | 'presentation_pitch'     // 피치/발표
  | 'presentation_report'    // 보고/브리핑
  | 'free_speech_technical'  // 자유스피치 - 기술/전문 주제
  | 'free_speech_story'      // 자유스피치 - 스토리/경험 공유
  | 'free_speech_persuasion' // 자유스피치 - 설득/주장
  | 'free_speech_pure'       // 진짜 자유스피치 (분류 불가, 균등 가중치)
  | 'unknown';               // 분류 불가

/**
 * 상황 분석 컨텍스트
 */
export interface SituationContext {
  situationType: SituationType;
  confidence: number;           // 분류 신뢰도 (0-1)
  reasoning: string;            // 분류 근거
  detectedKeywords: string[];   // 감지된 키워드
}

/**
 * 카테고리별 가중치
 */
export interface CategoryWeight {
  category: 'delivery' | 'structure' | 'content' | 'persuasion';
  weight: number;           // 1.0 = 기본, 1.3 = 중요, 0.7 = 덜 중요
  priorityRank: number;     // 1 = 최우선
  reason: string;           // 가중치 이유
}

/**
 * 카테고리별 점수 (가중치 적용 전후)
 */
export interface WeightedCategoryScore {
  category: string;
  rawScore: number;         // 원본 점수 (0-100)
  weight: number;           // 적용된 가중치
  weightedScore: number;    // 가중치 적용 점수
  issues: string[];
  strengths: string[];
}

/**
 * 우선순위 랭킹 결과
 */
export interface PriorityRankingResult {
  situation: SituationContext;
  weights: CategoryWeight[];
  focusMessage: string;         // "이 상황에서는 OO이 가장 중요합니다"
  weightedScores: WeightedCategoryScore[];
  totalWeightedScore: number;
  priorityFeedbackOrder: string[];  // 피드백 우선순위 순서
}

// ============================================
// 상황별 기본 가중치 매트릭스
// ============================================

const DEFAULT_WEIGHTS: Record<SituationType, Record<string, number>> = {
  interview_technical: {
    delivery: 0.8,      // 전달력 - 덜 중요
    structure: 1.0,     // 구조력 - 기본
    content: 1.3,       // 내용력 - 매우 중요
    persuasion: 0.9,    // 설득력 - 약간 덜 중요
  },
  interview_behavioral: {
    delivery: 1.0,      // 전달력 - 기본
    structure: 1.2,     // 구조력 - 중요 (STAR)
    content: 1.0,       // 내용력 - 기본
    persuasion: 1.1,    // 설득력 - 약간 중요
  },
  interview_general: {
    delivery: 1.0,
    structure: 1.1,
    content: 1.1,
    persuasion: 1.0,
  },
  presentation_pitch: {
    delivery: 1.1,      // 전달력 - 약간 중요
    structure: 1.0,     // 구조력 - 기본
    content: 1.0,       // 내용력 - 기본
    persuasion: 1.3,    // 설득력 - 매우 중요
  },
  presentation_report: {
    delivery: 0.9,      // 전달력 - 덜 중요
    structure: 1.3,     // 구조력 - 매우 중요
    content: 1.2,       // 내용력 - 중요
    persuasion: 0.8,    // 설득력 - 덜 중요
  },
  // 자유스피치 - 기술/전문 주제 감지
  free_speech_technical: {
    delivery: 0.9,      // 전달력 - 약간 덜 중요
    structure: 1.0,     // 구조력 - 기본
    content: 1.3,       // 내용력 - 매우 중요
    persuasion: 0.9,    // 설득력 - 약간 덜 중요
  },
  // 자유스피치 - 스토리/경험 공유
  free_speech_story: {
    delivery: 1.1,      // 전달력 - 약간 중요
    structure: 1.2,     // 구조력 - 중요 (스토리 흐름)
    content: 1.0,       // 내용력 - 기본
    persuasion: 0.9,    // 설득력 - 약간 덜 중요
  },
  // 자유스피치 - 설득/주장
  free_speech_persuasion: {
    delivery: 1.1,      // 전달력 - 약간 중요
    structure: 1.0,     // 구조력 - 기본
    content: 1.0,       // 내용력 - 기본
    persuasion: 1.3,    // 설득력 - 매우 중요
  },
  // 진짜 자유스피치 - 균등 가중치
  free_speech_pure: {
    delivery: 1.0,
    structure: 1.0,
    content: 1.0,
    persuasion: 1.0,
  },
  unknown: {
    delivery: 1.0,
    structure: 1.0,
    content: 1.0,
    persuasion: 1.0,
  },
};

// 상황별 포커스 메시지
const FOCUS_MESSAGES: Record<SituationType, string> = {
  interview_technical: '기술 면접에서는 구체적인 내용과 경험이 가장 중요합니다.',
  interview_behavioral: '인성 면접에서는 STAR 구조와 진정성 있는 표현이 핵심입니다.',
  interview_general: '면접에서는 논리적 구조와 구체적 사례를 균형있게 전달하세요.',
  presentation_pitch: '피치에서는 설득력 있는 전달과 자신감이 가장 중요합니다.',
  presentation_report: '보고에서는 논리적 구조와 데이터 기반 내용이 핵심입니다.',
  free_speech_technical: '기술/전문 주제가 감지되어 구체적인 내용 전달을 우선합니다.',
  free_speech_story: '경험/스토리 공유가 감지되어 이야기 흐름과 구조를 우선합니다.',
  free_speech_persuasion: '의견/주장이 감지되어 설득력 있는 전달을 우선합니다.',
  free_speech_pure: '특별한 주제가 감지되지 않아 4가지 영역을 균등하게 평가합니다.',
  unknown: '전반적인 말하기 역량을 골고루 발전시키세요.',
};

// 상황 유형 한글명 + 설명
const SITUATION_LABELS: Record<SituationType, { label: string; description: string }> = {
  interview_technical: { label: '기술 면접', description: '기술, 개발, 프로젝트 관련 키워드 감지' },
  interview_behavioral: { label: '인성 면접', description: '팀워크, 갈등, 성장 관련 키워드 감지' },
  interview_general: { label: '일반 면접', description: '면접 관련 키워드 감지' },
  presentation_pitch: { label: '피치/발표', description: '비즈니스, 투자, 성장 관련 키워드 감지' },
  presentation_report: { label: '보고/브리핑', description: '보고, 데이터, 결과 관련 키워드 감지' },
  free_speech_technical: { label: '전문 주제', description: '기술, 전문 용어 관련 키워드 감지' },
  free_speech_story: { label: '경험 공유', description: '경험, 스토리, 사례 관련 키워드 감지' },
  free_speech_persuasion: { label: '의견/주장', description: '주장, 설득, 의견 관련 키워드 감지' },
  free_speech_pure: { label: '자유 주제', description: '특정 주제 미감지' },
  unknown: { label: '일반', description: '분류 불가' },
};

// ============================================
// 상황 분류 키워드
// ============================================

const SITUATION_KEYWORDS: Record<SituationType, string[]> = {
  interview_technical: [
    '기술', '개발', '구현', '알고리즘', '데이터', 'API', '서버', '코드',
    '프로젝트', '시스템', '아키텍처', '설계', '최적화', '성능', '버그',
    'python', 'java', 'javascript', 'react', 'database', 'sql',
  ],
  interview_behavioral: [
    '팀', '협업', '리더', '갈등', '어려움', '극복', '성장', '배운',
    '실패', '성공', '동료', '커뮤니케이션', '피드백', '책임',
    '상황', '대처', '문제해결',
  ],
  interview_general: [
    '면접', '지원', '회사', '직무', '자기소개', '강점', '약점',
    '경험', '역량', '목표', '비전', '포부', '입사',
  ],
  presentation_pitch: [
    '투자', '비즈니스', '시장', '고객', '솔루션', '가치', '성장',
    '매출', '수익', '사업', '스타트업', '아이디어', '혁신',
  ],
  presentation_report: [
    '보고', '결과', '분석', '데이터', '현황', '진행', '계획',
    '수치', '통계', '추이', 'KPI', '목표', '달성률',
  ],
  // 자유스피치 - 기술/전문 주제
  free_speech_technical: [
    '기술', '개발', '구현', 'API', '서버', '코드', '프로젝트', '시스템',
    '설계', '최적화', 'python', 'java', 'javascript', 'react', 'database',
    '알고리즘', '프레임워크', '배포', '클라우드', '머신러닝', 'AI',
  ],
  // 자유스피치 - 스토리/경험 공유
  free_speech_story: [
    '경험', '이야기', '당시', '그때', '처음', '시작', '끝나고',
    '느꼈', '배웠', '깨달', '여행', '추억', '기억', '만났',
    '있었는데', '했었는데', '일이 있었', '사건', '에피소드',
  ],
  // 자유스피치 - 설득/주장
  free_speech_persuasion: [
    '생각합니다', '주장', '의견', '믿습니다', '확신', '중요합니다',
    '해야 합니다', '필요합니다', '왜냐하면', '때문입니다', '따라서',
    '반대로', '동의', '제안', '추천', '강조', '핵심은',
  ],
  // 진짜 자유스피치 (키워드 없음)
  free_speech_pure: [],
  unknown: [],
};

// ============================================
// 상황 분류 함수
// ============================================

/**
 * 텍스트에서 상황 유형을 분류합니다.
 */
export function classifySituation(
  transcript: string,
  question?: string,
  projectType?: 'interview' | 'presentation' | 'free_speech'
): SituationContext {
  const textLower = (transcript + ' ' + (question || '')).toLowerCase();
  const detectedKeywords: string[] = [];
  const scores: Record<SituationType, number> = {
    interview_technical: 0,
    interview_behavioral: 0,
    interview_general: 0,
    presentation_pitch: 0,
    presentation_report: 0,
    free_speech_technical: 0,
    free_speech_story: 0,
    free_speech_persuasion: 0,
    free_speech_pure: 0,
    unknown: 0,
  };

  // 키워드 매칭으로 점수 계산
  for (const [situation, keywords] of Object.entries(SITUATION_KEYWORDS)) {
    for (const keyword of keywords) {
      if (textLower.includes(keyword.toLowerCase())) {
        scores[situation as SituationType] += 1;
        if (!detectedKeywords.includes(keyword)) {
          detectedKeywords.push(keyword);
        }
      }
    }
  }

  let situationType: SituationType = 'unknown';
  let maxScore = 0;

  // 자유스피치인 경우: 자유스피치 하위 유형 중에서만 선택
  if (projectType === 'free_speech') {
    const freeSpeechTypes: SituationType[] = [
      'free_speech_technical',
      'free_speech_story',
      'free_speech_persuasion',
    ];

    for (const type of freeSpeechTypes) {
      if (scores[type] > maxScore) {
        maxScore = scores[type];
        situationType = type;
      }
    }

    // 키워드가 2개 미만이면 순수 자유스피치로
    if (maxScore < 2) {
      situationType = 'free_speech_pure';
      maxScore = 0;
    }
  } else {
    // 면접/발표인 경우: 기존 로직
    const relevantTypes: SituationType[] = projectType === 'interview'
      ? ['interview_technical', 'interview_behavioral', 'interview_general']
      : projectType === 'presentation'
        ? ['presentation_pitch', 'presentation_report']
        : Object.keys(scores) as SituationType[];

    // projectType이 주어진 경우 기본 점수 부여
    if (projectType === 'interview') {
      scores.interview_general += 2;
    } else if (projectType === 'presentation') {
      scores.presentation_pitch += 1;
      scores.presentation_report += 1;
    }

    for (const type of relevantTypes) {
      if (scores[type] > maxScore) {
        maxScore = scores[type];
        situationType = type;
      }
    }
  }

  // 신뢰도 계산 (키워드 수 기반)
  const confidence = Math.min(detectedKeywords.length / 5, 1); // 5개 이상 = 100%

  // 점수가 0이면 unknown (단, free_speech_pure는 예외)
  if (maxScore === 0 && situationType !== 'free_speech_pure') {
    situationType = projectType === 'free_speech' ? 'free_speech_pure' : 'unknown';
  }

  // 분류 근거 생성
  const situationLabel = SITUATION_LABELS[situationType];
  let reasoning: string;
  if (situationType === 'free_speech_pure') {
    reasoning = '특정 주제 키워드가 감지되지 않음';
  } else if (detectedKeywords.length > 0) {
    reasoning = `${situationLabel.description} (${detectedKeywords.slice(0, 3).join(', ')})`;
  } else if (projectType) {
    reasoning = `프로젝트 유형 기반: ${projectType}`;
  } else {
    reasoning = '특정 상황 키워드를 감지하지 못함';
  }

  return {
    situationType,
    confidence,
    reasoning,
    detectedKeywords: detectedKeywords.slice(0, 10),
  };
}

// ============================================
// 가중치 계산 함수
// ============================================

/**
 * 상황에 맞는 카테고리별 가중치를 반환합니다.
 */
export function getPriorityWeights(situation: SituationContext): CategoryWeight[] {
  const weights = DEFAULT_WEIGHTS[situation.situationType] || DEFAULT_WEIGHTS.unknown;

  const categories: Array<'delivery' | 'structure' | 'content' | 'persuasion'> = [
    'delivery',
    'structure',
    'content',
    'persuasion',
  ];

  const categoryNames: Record<string, string> = {
    delivery: '전달력',
    structure: '구조력',
    content: '내용력',
    persuasion: '설득력',
  };

  // 가중치 순으로 정렬하여 우선순위 부여
  const sortedCategories = categories
    .map((cat) => ({ category: cat, weight: weights[cat] }))
    .sort((a, b) => b.weight - a.weight);

  return sortedCategories.map((item, index) => {
    let reason: string;
    if (item.weight >= 1.2) {
      reason = `${categoryNames[item.category]}이 이 상황에서 가장 중요합니다`;
    } else if (item.weight >= 1.0) {
      reason = `${categoryNames[item.category]}은 기본적으로 중요합니다`;
    } else {
      reason = `${categoryNames[item.category]}은 상대적으로 덜 중요합니다`;
    }

    return {
      category: item.category,
      weight: item.weight,
      priorityRank: index + 1,
      reason,
    };
  });
}

// ============================================
// 가중치 적용 점수 계산
// ============================================

/**
 * 카테고리 분석 결과에 가중치를 적용합니다.
 */
export function calculateWeightedScores(
  categoryResults: AllCategoryResults,
  weights: CategoryWeight[]
): WeightedCategoryScore[] {
  const weightMap = Object.fromEntries(weights.map((w) => [w.category, w.weight]));

  return (Object.entries(categoryResults) as Array<[keyof AllCategoryResults, AllCategoryResults[keyof AllCategoryResults]]>).map(
    ([category, result]) => {
      const weight = weightMap[category] || 1.0;
      const weightedScore = result.score * weight;

      return {
        category,
        rawScore: result.score,
        weight,
        weightedScore: Math.round(weightedScore * 10) / 10,
        issues: result.issues,
        strengths: result.strengths,
      };
    }
  );
}

/**
 * 전체 가중 점수 계산
 */
export function calculateTotalWeightedScore(weightedScores: WeightedCategoryScore[]): number {
  const totalWeight = weightedScores.reduce((sum, s) => sum + s.weight, 0);
  const totalWeightedScore = weightedScores.reduce((sum, s) => sum + s.weightedScore, 0);

  return Math.round((totalWeightedScore / totalWeight) * 10) / 10;
}

// ============================================
// 통합 우선순위 분석 함수
// ============================================

/**
 * 전체 우선순위 랭킹 분석을 수행합니다.
 */
export function analyzePriority(
  transcript: string,
  categoryResults: AllCategoryResults,
  options?: {
    question?: string;
    projectType?: 'interview' | 'presentation' | 'free_speech';
  }
): PriorityRankingResult {
  // 1. 상황 분류
  const situation = classifySituation(
    transcript,
    options?.question,
    options?.projectType
  );

  // 2. 가중치 계산
  const weights = getPriorityWeights(situation);

  // 3. 가중치 적용 점수 계산
  const weightedScores = calculateWeightedScores(categoryResults, weights);

  // 4. 전체 점수 계산
  const totalWeightedScore = calculateTotalWeightedScore(weightedScores);

  // 5. 피드백 우선순위 결정 (낮은 점수 + 높은 가중치 = 높은 우선순위)
  const priorityFeedbackOrder = weightedScores
    .map((s) => ({
      category: s.category,
      priority: (100 - s.rawScore) * s.weight, // 낮은 점수 * 높은 가중치 = 높은 우선순위
    }))
    .sort((a, b) => b.priority - a.priority)
    .map((s) => s.category);

  // 6. 포커스 메시지
  const focusMessage = FOCUS_MESSAGES[situation.situationType];

  return {
    situation,
    weights,
    focusMessage,
    weightedScores,
    totalWeightedScore,
    priorityFeedbackOrder,
  };
}

// ============================================
// 유틸리티 함수
// ============================================

/**
 * 점수를 등급으로 변환
 */
export function scoreToGrade(score: number): string {
  if (score >= 90) return 'A';
  if (score >= 80) return 'B+';
  if (score >= 70) return 'B';
  if (score >= 60) return 'C+';
  if (score >= 50) return 'C';
  return 'D';
}

/**
 * 카테고리 이름 한글 변환
 */
export function getCategoryNameKo(category: string): string {
  const names: Record<string, string> = {
    delivery: '전달력',
    structure: '구조력',
    content: '내용력',
    persuasion: '설득력',
  };
  return names[category] || category;
}

/**
 * 상황 유형 한글 변환
 */
export function getSituationTypeKo(situationType: SituationType): string {
  return SITUATION_LABELS[situationType]?.label || situationType;
}

/**
 * 상황 분류 상세 정보 반환
 */
export function getSituationLabel(situationType: SituationType): { label: string; description: string } {
  return SITUATION_LABELS[situationType] || { label: '일반', description: '분류 불가' };
}

/**
 * 균등 가중치 여부 확인
 */
export function isEqualWeight(situationType: SituationType): boolean {
  return situationType === 'free_speech_pure' || situationType === 'unknown';
}
