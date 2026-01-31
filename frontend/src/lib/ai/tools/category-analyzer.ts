/**
 * 카테고리별 스피치 분석 도구
 * Python backend/langgraph/tools/category_analyzer.py 포팅
 *
 * 4가지 카테고리로 스피치를 분석합니다:
 * 1. 전달력 (Delivery): 말 속도, 필러워드, 발음/명확성
 * 2. 구조력 (Structure): 논리적 흐름, STAR 구조, 두괄식
 * 3. 내용력 (Content): 구체성, 숫자/성과, 사례
 * 4. 설득력 (Persuasion): 자신감, 톤, 강조, 감정 전달
 */

// ============================================
// 타입 정의
// ============================================

export interface SubScores {
  [key: string]: number | string | boolean | string[] | Record<string, boolean>;
}

export interface CategoryAnalysisResult {
  score: number;
  subScores: SubScores;
  issues: string[];
  strengths: string[];
  metrics?: Record<string, number | string | string[]>;
}

export interface DeliveryResult extends CategoryAnalysisResult {
  metrics: {
    wpm: number;
    fillerCount: number;
    fillerPercentage: number;
    wordCount: number;
  };
}

export interface StructureResult extends CategoryAnalysisResult {
  starElements: Record<'situation' | 'task' | 'action' | 'result', boolean>;
}

export interface ContentResult extends CategoryAnalysisResult {
  metrics: {
    numberCount: number;
    numberMentions: string[];
  };
}

export interface PersuasionResult extends CategoryAnalysisResult {
  metrics: {
    humbleCount: number;
  };
}

export interface AllCategoryResults {
  delivery: DeliveryResult;
  structure: StructureResult;
  content: ContentResult;
  persuasion: PersuasionResult;
}

export interface CategorySummary {
  scores: Record<string, number>;
  averageScore: number;
  weakestCategory: [string, number] | null;
  strongestCategory: [string, number] | null;
  totalIssues: number;
  totalStrengths: number;
  topIssues: Array<[string, string]>;
  topStrengths: Array<[string, string]>;
}

// ============================================
// 1. 전달력 (Delivery) 분석
// ============================================

/**
 * 전달력 분석
 *
 * 측정 항목:
 * - 말 속도 (WPM): 120-170이 적정
 * - 필러워드 비율: 3% 이하가 이상적
 * - 문장 완결성: 문장이 완전히 끝나는지
 */
export function analyzeDelivery(
  transcript: string,
  durationSeconds: number
): DeliveryResult {
  const issues: string[] = [];
  const strengths: string[] = [];
  const subScores: SubScores = {};

  // --- 1. 말 속도 (WPM) ---
  const words = transcript.split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  const minutes = durationSeconds > 0 ? durationSeconds / 60 : 1;
  const wpm = Math.round(wordCount / minutes);

  let wpmScore: number;
  if (wpm >= 120 && wpm <= 170) {
    wpmScore = 100;
    strengths.push(`말 속도 적정 (${wpm} WPM)`);
  } else if ((wpm >= 100 && wpm < 120) || (wpm > 170 && wpm <= 200)) {
    wpmScore = 75;
    if (wpm < 120) {
      issues.push(`말 속도 약간 느림 (${wpm} WPM, 목표: 120-170)`);
    } else {
      issues.push(`말 속도 약간 빠름 (${wpm} WPM, 목표: 120-170)`);
    }
  } else if ((wpm >= 80 && wpm < 100) || (wpm > 200 && wpm <= 230)) {
    wpmScore = 50;
    if (wpm < 100) {
      issues.push(`말 속도 느림 (${wpm} WPM)`);
    } else {
      issues.push(`말 속도 빠름 (${wpm} WPM)`);
    }
  } else {
    wpmScore = 25;
    issues.push(`말 속도 조절 필요 (${wpm} WPM)`);
  }

  subScores['말 속도'] = wpmScore;
  subScores['wpm'] = wpm;

  // --- 2. 필러워드 비율 ---
  const fillerPatterns = [
    /\b어+\b/gi,
    /\b음+\b/gi,
    /\b그+\b/gi,
    /\b저+\b/gi,
    /\b뭐+\b/gi,
    /\b이제\b/gi,
    /\b약간\b/gi,
    /\b좀\b/gi,
    /\b그러니까\b/gi,
    /\b아니\b/gi,
    /\b근데\b/gi,
  ];

  let fillerCount = 0;
  for (const pattern of fillerPatterns) {
    const matches = transcript.match(pattern);
    if (matches) {
      fillerCount += matches.length;
    }
  }

  const fillerPercentage = wordCount > 0 ? (fillerCount / wordCount) * 100 : 0;

  let fillerScore: number;
  if (fillerPercentage <= 3) {
    fillerScore = 100;
    strengths.push(`필러워드 적음 (${fillerPercentage.toFixed(1)}%)`);
  } else if (fillerPercentage <= 5) {
    fillerScore = 75;
    issues.push(`필러워드 약간 많음 (${fillerPercentage.toFixed(1)}%, 목표: 3% 이하)`);
  } else if (fillerPercentage <= 8) {
    fillerScore = 50;
    issues.push(`필러워드 많음 (${fillerPercentage.toFixed(1)}%)`);
  } else {
    fillerScore = 25;
    issues.push(`필러워드 매우 많음 (${fillerPercentage.toFixed(1)}%)`);
  }

  subScores['필러워드'] = fillerScore;
  subScores['fillerCount'] = fillerCount;
  subScores['fillerPercentage'] = Math.round(fillerPercentage * 10) / 10;

  // --- 3. 문장 완결성 ---
  const sentences = transcript.split(/[.!?。]/);
  const completeSentences = sentences.filter((s) => s.trim().length > 10);
  const incompleteEndings = ['는', '고', '면', '서'];
  const incompleteCount = completeSentences.filter((s) =>
    incompleteEndings.some((ending) => s.trim().endsWith(ending))
  ).length;

  let sentenceScore: number;
  if (completeSentences.length > 0) {
    const incompleteRatio = incompleteCount / completeSentences.length;
    if (incompleteRatio <= 0.1) {
      sentenceScore = 100;
      strengths.push('문장 완결성 좋음');
    } else if (incompleteRatio <= 0.2) {
      sentenceScore = 75;
    } else if (incompleteRatio <= 0.3) {
      sentenceScore = 50;
      issues.push('문장이 완결되지 않는 경우가 있음');
    } else {
      sentenceScore = 25;
      issues.push('문장 완결성 부족');
    }
  } else {
    sentenceScore = 50;
  }

  subScores['문장 완결성'] = sentenceScore;

  // --- 종합 점수 계산 ---
  const totalScore = Math.round(wpmScore * 0.4 + fillerScore * 0.4 + sentenceScore * 0.2);

  return {
    score: totalScore,
    subScores,
    issues,
    strengths,
    metrics: {
      wpm,
      fillerCount,
      fillerPercentage: Math.round(fillerPercentage * 10) / 10,
      wordCount,
    },
  };
}

// ============================================
// 2. 구조력 (Structure) 분석
// ============================================

/**
 * 구조력 분석
 *
 * 측정 항목:
 * - STAR 구조 준수: Situation, Task, Action, Result
 * - 두괄식 표현: 결론을 먼저 말하는지
 * - 논리적 연결어 사용
 */
export function analyzeStructure(transcript: string): StructureResult {
  const issues: string[] = [];
  const strengths: string[] = [];
  const subScores: SubScores = {};
  const textLower = transcript.toLowerCase();

  // --- 1. STAR 구조 분석 ---
  const starElements = {
    situation: false,
    task: false,
    action: false,
    result: false,
  };

  const situationPatterns = [/당시/, /그때/, /상황/, /배경/, /처음/, /시작/, /있었는데/, /있었습니다/, /에서/];
  const taskPatterns = [/목표/, /해야/, /필요/, /과제/, /문제/, /요구/, /역할/, /담당/, /맡/];
  const actionPatterns = [/했습니다/, /진행/, /수행/, /실행/, /구현/, /개발/, /해서/, /하여/, /통해/, /적용/];
  const resultPatterns = [/결과/, /성과/, /달성/, /개선/, /향상/, /증가/, /감소/, /%/, /퍼센트/, /배/, /만큼/];

  for (const pattern of situationPatterns) {
    if (pattern.test(textLower)) {
      starElements.situation = true;
      break;
    }
  }
  for (const pattern of taskPatterns) {
    if (pattern.test(textLower)) {
      starElements.task = true;
      break;
    }
  }
  for (const pattern of actionPatterns) {
    if (pattern.test(textLower)) {
      starElements.action = true;
      break;
    }
  }
  for (const pattern of resultPatterns) {
    if (pattern.test(textLower)) {
      starElements.result = true;
      break;
    }
  }

  const starCount = Object.values(starElements).filter(Boolean).length;
  const starScore = Math.round((starCount / 4) * 100);

  const missingElements = (Object.entries(starElements) as Array<[keyof typeof starElements, boolean]>)
    .filter(([, v]) => !v)
    .map(([k]) => k.toUpperCase());

  if (missingElements.length > 0) {
    issues.push(`STAR 구조 부족: ${missingElements.join(', ')} 없음`);
  } else {
    strengths.push('STAR 구조 완벽히 갖춤');
  }

  subScores['STAR 구조'] = starScore;
  subScores['starElements'] = starElements;

  // --- 2. 두괄식 분석 ---
  const sentences = transcript.split(/[.!?。]/);
  const firstSentences = sentences.slice(0, 2).join(' ');

  const conclusionFirstPatterns = [
    /^저는/,
    /^결론/,
    /^핵심/,
    /^요약하면/,
    /^말씀드리면/,
    /입니다$/,
    /습니다$/,
    /였습니다$/,
  ];
  const isConclusionFirst = conclusionFirstPatterns.some((p) => p.test(firstSentences));

  let duguScore: number;
  if (isConclusionFirst) {
    duguScore = 100;
    strengths.push('두괄식 표현 사용');
  } else {
    duguScore = 50;
    issues.push('두괄식 표현 부족 (결론을 먼저 말하면 좋음)');
  }

  subScores['두괄식'] = duguScore;

  // --- 3. 논리적 연결어 ---
  const connectors = [
    /따라서/g,
    /그래서/g,
    /결과적으로/g,
    /그러므로/g,
    /왜냐하면/g,
    /때문에/g,
    /덕분에/g,
    /첫째/g,
    /둘째/g,
    /마지막으로/g,
    /또한/g,
    /그리고/g,
  ];
  let connectorCount = 0;
  for (const pattern of connectors) {
    const matches = textLower.match(pattern);
    if (matches) {
      connectorCount += matches.length;
    }
  }

  let connectorScore: number;
  if (connectorCount >= 3) {
    connectorScore = 100;
    strengths.push(`논리적 연결어 잘 사용 (${connectorCount}개)`);
  } else if (connectorCount >= 2) {
    connectorScore = 75;
  } else if (connectorCount >= 1) {
    connectorScore = 50;
    issues.push('논리적 연결어 부족');
  } else {
    connectorScore = 25;
    issues.push('논리적 연결어 없음');
  }

  subScores['연결어'] = connectorScore;
  subScores['connectorCount'] = connectorCount;

  const totalScore = Math.round(starScore * 0.5 + duguScore * 0.3 + connectorScore * 0.2);

  return {
    score: totalScore,
    subScores,
    issues,
    strengths,
    starElements,
  };
}

// ============================================
// 3. 내용력 (Content) 분석
// ============================================

/**
 * 내용력 분석
 *
 * 측정 항목:
 * - 구체적 숫자/성과 언급
 * - 구체적 사례/경험
 * - 기술/도구 언급
 */
export function analyzeContent(transcript: string): ContentResult {
  const issues: string[] = [];
  const strengths: string[] = [];
  const subScores: SubScores = {};

  // --- 1. 숫자/성과 언급 ---
  const numberPatterns = [
    /\d+%/g,
    /\d+퍼센트/g,
    /\d+배/g,
    /\d+만/g,
    /\d+억/g,
    /\d+명/g,
    /\d+개/g,
    /\d+건/g,
    /\d+초/g,
    /\d+분/g,
    /\d+시간/g,
    /\d+일/g,
    /\d+주/g,
    /\d+개월/g,
  ];

  const numberMentions: string[] = [];
  for (const pattern of numberPatterns) {
    const matches = transcript.match(pattern);
    if (matches) {
      numberMentions.push(...matches);
    }
  }

  const numberCount = numberMentions.length;

  let numberScore: number;
  if (numberCount >= 3) {
    numberScore = 100;
    strengths.push(`구체적 숫자 잘 사용 (${numberCount}개: ${numberMentions.slice(0, 3).join(', ')})`);
  } else if (numberCount >= 2) {
    numberScore = 75;
    strengths.push(`숫자 언급 있음 (${numberCount}개)`);
  } else if (numberCount >= 1) {
    numberScore = 50;
    issues.push(`숫자 언급 부족 (${numberCount}개, 목표: 2-3개)`);
  } else {
    numberScore = 25;
    issues.push('구체적 숫자 없음 (성과를 수치로 표현하면 좋음)');
  }

  subScores['숫자/성과'] = numberScore;
  subScores['numberCount'] = numberCount;
  subScores['numberMentions'] = numberMentions.slice(0, 5);

  // --- 2. 구체적 사례 ---
  const examplePatterns = [
    /예를 들어/gi,
    /예를 들면/gi,
    /예시로/gi,
    /실제로/gi,
    /구체적으로/gi,
    /프로젝트/gi,
    /경험/gi,
    /사례/gi,
    /A회사/gi,
    /B팀/gi,
    /당시/gi,
  ];

  let exampleCount = 0;
  for (const pattern of examplePatterns) {
    const matches = transcript.match(pattern);
    if (matches) {
      exampleCount += matches.length;
    }
  }

  let exampleScore: number;
  if (exampleCount >= 2) {
    exampleScore = 100;
    strengths.push('구체적 사례 제시');
  } else if (exampleCount >= 1) {
    exampleScore = 70;
  } else {
    exampleScore = 40;
    issues.push('구체적 사례 부족');
  }

  subScores['구체적 사례'] = exampleScore;

  // --- 3. 전문성 표현 ---
  const techPatterns = [
    /python/gi,
    /java/gi,
    /javascript/gi,
    /react/gi,
    /node/gi,
    /sql/gi,
    /database/gi,
    /api/gi,
    /서버/gi,
    /클라이언트/gi,
    /애자일/gi,
    /스크럼/gi,
    /칸반/gi,
    /CI\/CD/gi,
    /DevOps/gi,
    /git/gi,
    /docker/gi,
    /aws/gi,
    /gcp/gi,
    /azure/gi,
    /KPI/gi,
    /ROI/gi,
    /매출/gi,
    /비용/gi,
    /효율/gi,
  ];

  let techCount = 0;
  for (const pattern of techPatterns) {
    const matches = transcript.match(pattern);
    if (matches) {
      techCount += matches.length;
    }
  }

  let techScore: number;
  if (techCount >= 3) {
    techScore = 100;
    strengths.push(`전문 용어 적절히 사용 (${techCount}개)`);
  } else if (techCount >= 1) {
    techScore = 70;
  } else {
    techScore = 50;
  }

  subScores['전문성'] = techScore;

  const totalScore = Math.round(numberScore * 0.4 + exampleScore * 0.35 + techScore * 0.25);

  return {
    score: totalScore,
    subScores,
    issues,
    strengths,
    metrics: {
      numberCount,
      numberMentions: numberMentions.slice(0, 5),
    },
  };
}

// ============================================
// 4. 설득력 (Persuasion) 분석
// ============================================

/**
 * 설득력 분석
 *
 * 측정 항목:
 * - 자신감 있는 표현
 * - 불필요한 겸양/부정 표현
 * - 강조/확신 표현
 */
export function analyzePersuasion(transcript: string): PersuasionResult {
  const issues: string[] = [];
  const strengths: string[] = [];
  const subScores: SubScores = {};
  const textLower = transcript.toLowerCase();

  // --- 1. 자신감 표현 ---
  const confidentPatterns = [
    /확신/g,
    /자신있/g,
    /잘 할 수 있/g,
    /능력/g,
    /성공적/g,
    /효과적/g,
    /입증/g,
    /검증/g,
    /했습니다/g,
    /달성했/g,
    /이뤘/g,
  ];

  let confidentCount = 0;
  for (const pattern of confidentPatterns) {
    const matches = textLower.match(pattern);
    if (matches) {
      confidentCount += matches.length;
    }
  }

  let confidentScore: number;
  if (confidentCount >= 3) {
    confidentScore = 100;
    strengths.push('자신감 있는 표현');
  } else if (confidentCount >= 2) {
    confidentScore = 80;
  } else if (confidentCount >= 1) {
    confidentScore = 60;
  } else {
    confidentScore = 40;
    issues.push('자신감 있는 표현 부족');
  }

  subScores['자신감 표현'] = confidentScore;

  // --- 2. 불필요한 겸양 표현 ---
  const humblePatterns = [
    /잘 모르/g,
    /부족/g,
    /미흡/g,
    /아직/g,
    /것 같/g,
    /일 수도/g,
    /할지도/g,
    /그냥/g,
    /별로/g,
    /사실/g,
    /죄송/g,
    /실례/g,
  ];

  let humbleCount = 0;
  for (const pattern of humblePatterns) {
    const matches = textLower.match(pattern);
    if (matches) {
      humbleCount += matches.length;
    }
  }

  let humbleScore: number;
  if (humbleCount === 0) {
    humbleScore = 100;
    strengths.push('불필요한 겸양 없음');
  } else if (humbleCount <= 1) {
    humbleScore = 80;
  } else if (humbleCount <= 2) {
    humbleScore = 60;
    issues.push(`불필요한 겸양 표현 감지 (${humbleCount}회)`);
  } else {
    humbleScore = 40;
    issues.push(`겸양 표현 많음 (${humbleCount}회) - 자신감 있게!`);
  }

  subScores['겸양 표현'] = humbleScore;
  subScores['humbleCount'] = humbleCount;

  // --- 3. 강조 표현 ---
  const emphasisPatterns = [
    /특히/g,
    /가장/g,
    /핵심/g,
    /중요/g,
    /반드시/g,
    /꼭/g,
    /확실히/g,
    /분명히/g,
    /최고/g,
    /최선/g,
    /유일/g,
  ];

  let emphasisCount = 0;
  for (const pattern of emphasisPatterns) {
    const matches = textLower.match(pattern);
    if (matches) {
      emphasisCount += matches.length;
    }
  }

  let emphasisScore: number;
  if (emphasisCount >= 2) {
    emphasisScore = 100;
    strengths.push(`강조 표현 적절히 사용 (${emphasisCount}개)`);
  } else if (emphasisCount >= 1) {
    emphasisScore = 70;
  } else {
    emphasisScore = 50;
    issues.push('강조 표현 부족 (핵심을 강조하면 좋음)');
  }

  subScores['강조 표현'] = emphasisScore;

  const totalScore = Math.round(confidentScore * 0.4 + humbleScore * 0.35 + emphasisScore * 0.25);

  return {
    score: totalScore,
    subScores,
    issues,
    strengths,
    metrics: {
      humbleCount,
    },
  };
}

// ============================================
// 통합 분석 함수
// ============================================

/**
 * 4개 카테고리 모두 분석
 */
export function analyzeAllCategories(
  transcript: string,
  durationSeconds: number = 60
): AllCategoryResults {
  return {
    delivery: analyzeDelivery(transcript, durationSeconds),
    structure: analyzeStructure(transcript),
    content: analyzeContent(transcript),
    persuasion: analyzePersuasion(transcript),
  };
}

/**
 * 분석 결과 요약 생성
 */
export function getCategorySummary(results: AllCategoryResults): CategorySummary {
  const scores: Record<string, number> = {};
  const allIssues: Array<[string, string]> = [];
  const allStrengths: Array<[string, string]> = [];

  for (const [category, data] of Object.entries(results)) {
    scores[category] = data.score;
    for (const issue of data.issues) {
      allIssues.push([category, issue]);
    }
    for (const strength of data.strengths) {
      allStrengths.push([category, strength]);
    }
  }

  const scoreValues = Object.values(scores);
  const avgScore = scoreValues.length > 0 ? scoreValues.reduce((a, b) => a + b, 0) / scoreValues.length : 0;
  const sortedScores = Object.entries(scores).sort(([, a], [, b]) => a - b);

  return {
    scores,
    averageScore: Math.round(avgScore * 10) / 10,
    weakestCategory: sortedScores.length > 0 ? sortedScores[0] : null,
    strongestCategory: sortedScores.length > 0 ? sortedScores[sortedScores.length - 1] : null,
    totalIssues: allIssues.length,
    totalStrengths: allStrengths.length,
    topIssues: allIssues.slice(0, 3),
    topStrengths: allStrengths.slice(0, 3),
  };
}

// ============================================
// Claude Tools 형식 정의 (ReAct 패턴용)
// ============================================

export const CATEGORY_TOOLS_DEFINITION = [
  {
    name: 'analyze_delivery',
    description: '전달력 분석: 말 속도(WPM), 필러워드 비율, 문장 완결성을 측정합니다.',
    input_schema: {
      type: 'object' as const,
      properties: {
        transcript: { type: 'string' as const, description: '분석할 텍스트' },
        duration_seconds: { type: 'number' as const, description: '오디오 길이(초)' },
      },
      required: ['transcript', 'duration_seconds'],
    },
  },
  {
    name: 'analyze_structure',
    description: '구조력 분석: STAR 구조 준수, 두괄식 표현, 논리적 연결어를 분석합니다.',
    input_schema: {
      type: 'object' as const,
      properties: {
        transcript: { type: 'string' as const, description: '분석할 텍스트' },
      },
      required: ['transcript'],
    },
  },
  {
    name: 'analyze_content',
    description: '내용력 분석: 구체적 숫자/성과, 사례, 전문성 표현을 분석합니다.',
    input_schema: {
      type: 'object' as const,
      properties: {
        transcript: { type: 'string' as const, description: '분석할 텍스트' },
      },
      required: ['transcript'],
    },
  },
  {
    name: 'analyze_persuasion',
    description: '설득력 분석: 자신감 표현, 불필요한 겸양, 강조 표현을 분석합니다.',
    input_schema: {
      type: 'object' as const,
      properties: {
        transcript: { type: 'string' as const, description: '분석할 텍스트' },
      },
      required: ['transcript'],
    },
  },
];
