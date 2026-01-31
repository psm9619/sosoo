/**
 * STAR 구조 분석 도구
 * Python backend/langgraph/tools/structure_analysis.py 포팅
 */

export interface StructureAnalysisResult {
  elementsFound: {
    situation: boolean;
    task: boolean;
    action: boolean;
    result: boolean;
  };
  elementScores: {
    situation: number;
    task: number;
    action: number;
    result: number;
  };
  structureScore: number;
  missingElements: string[];
  hasNumbers: boolean;
  isNaturalOrder: boolean;
  actualOrder: string[];
  assessment: 'excellent' | 'good' | 'fair' | 'needs_improvement';
  recommendation: string;
  score: string; // A-D 등급
}

// STAR 요소별 키워드 (한국어)
const STAR_KEYWORDS = {
  situation: {
    keywords: ['당시', '그때', '상황', '배경', '맥락', '있었', '했을 때', '이전에'],
    patterns: [/\d+년/, /입사/, /프로젝트/, /팀에서/, /회사에서/],
    weight: 1.0,
  },
  task: {
    keywords: ['목표', '과제', '해야', '필요', '요구', '책임', '역할', '담당'],
    patterns: [/해결해야/, /달성해야/, /맡게/, /요청/, /기대/],
    weight: 1.0,
  },
  action: {
    keywords: ['했습니다', '진행했', '수행했', '실행했', '구현했', '개발했', '분석했', '제안했'],
    patterns: [/저는.*했/, /제가.*했/, /직접/, /주도적으로/, /협업/],
    weight: 1.5, // 가중치 높음
  },
  result: {
    keywords: ['결과', '성과', '개선', '달성', '증가', '감소', '효과', '영향'],
    patterns: [/\d+%/, /\d+배/, /\d+억/, /\d+만/, /성공적/],
    weight: 1.5, // 가중치 높음
  },
};

// 요소별 점수 계산
function calculateElementScore(text: string, element: keyof typeof STAR_KEYWORDS): number {
  const { keywords, patterns } = STAR_KEYWORDS[element];
  let score = 0;

  // 키워드 매칭
  for (const keyword of keywords) {
    if (text.includes(keyword)) {
      score += 10;
    }
  }

  // 패턴 매칭
  for (const pattern of patterns) {
    if (pattern.test(text)) {
      score += 15;
    }
  }

  return Math.min(score, 100);
}

// 요소 순서 감지
function detectElementOrder(text: string): string[] {
  const positions: Array<{ element: string; position: number }> = [];

  for (const [element, { keywords }] of Object.entries(STAR_KEYWORDS)) {
    let minPos = text.length;
    for (const keyword of keywords) {
      const pos = text.indexOf(keyword);
      if (pos !== -1 && pos < minPos) {
        minPos = pos;
      }
    }
    if (minPos < text.length) {
      positions.push({ element, position: minPos });
    }
  }

  return positions
    .sort((a, b) => a.position - b.position)
    .map((p) => p.element);
}

export function analyzeStructure(transcript: string): StructureAnalysisResult {
  const text = transcript.toLowerCase();

  // 각 요소별 점수 계산
  const elementScores = {
    situation: calculateElementScore(text, 'situation'),
    task: calculateElementScore(text, 'task'),
    action: calculateElementScore(text, 'action'),
    result: calculateElementScore(text, 'result'),
  };

  // 요소 존재 여부
  const elementsFound = {
    situation: elementScores.situation >= 20,
    task: elementScores.task >= 20,
    action: elementScores.action >= 20,
    result: elementScores.result >= 20,
  };

  // 누락 요소
  const missingElements = (Object.keys(elementsFound) as Array<keyof typeof elementsFound>)
    .filter((k) => !elementsFound[k])
    .map((k) => {
      const labels: Record<string, string> = {
        situation: '상황(S)',
        task: '과제(T)',
        action: '행동(A)',
        result: '결과(R)',
      };
      return labels[k];
    });

  // 숫자 포함 여부 (Result에 중요)
  const hasNumbers = /\d+/.test(transcript);

  // 순서 분석
  const actualOrder = detectElementOrder(text);
  const idealOrder = ['situation', 'task', 'action', 'result'];
  const isNaturalOrder =
    actualOrder.length >= 3 &&
    actualOrder.every((el, i) => i === 0 || idealOrder.indexOf(el) > idealOrder.indexOf(actualOrder[i - 1]));

  // 가중치 적용한 총점 계산
  const weights = { situation: 1.0, task: 1.0, action: 1.5, result: 1.5 };
  const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);
  let structureScore =
    (Object.entries(elementScores) as Array<[keyof typeof elementScores, number]>).reduce(
      (acc, [key, score]) => acc + score * weights[key],
      0
    ) / totalWeight;

  // 보너스
  if (hasNumbers && elementsFound.result) {
    structureScore += 10;
  }
  if (isNaturalOrder) {
    structureScore += 5;
  }

  structureScore = Math.min(Math.round(structureScore), 100);

  // 평가 및 점수
  let assessment: StructureAnalysisResult['assessment'];
  let recommendation: string;
  let score: string;

  if (structureScore >= 85) {
    assessment = 'excellent';
    recommendation = 'STAR 구조가 잘 갖춰져 있습니다. 훌륭합니다!';
    score = 'A';
  } else if (structureScore >= 70) {
    assessment = 'good';
    const missing = missingElements[0];
    recommendation = missing
      ? `대체로 좋습니다. ${missing} 부분을 조금 더 보강하면 완벽합니다.`
      : '구조가 좋습니다. 결과에 구체적인 숫자를 추가하면 더 좋습니다.';
    score = 'B+';
  } else if (structureScore >= 45) {
    assessment = 'fair';
    recommendation = `${missingElements.join(', ')} 요소가 부족합니다. STAR 구조(상황→과제→행동→결과)를 의식하며 다시 정리해보세요.`;
    score = 'B';
  } else {
    assessment = 'needs_improvement';
    recommendation = `STAR 구조가 명확하지 않습니다. 상황 설명 → 맡은 과제 → 내가 한 행동 → 구체적 결과 순으로 재구성해보세요. 특히 결과는 숫자로 표현하면 설득력이 높아집니다.`;
    score = 'C';
  }

  return {
    elementsFound,
    elementScores,
    structureScore,
    missingElements,
    hasNumbers,
    isNaturalOrder,
    actualOrder,
    assessment,
    recommendation,
    score,
  };
}
