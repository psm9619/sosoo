/**
 * 필러워드 분석 도구
 * Python backend/langgraph/tools/filler_analysis.py 포팅
 */

export interface FillerAnalysisResult {
  fillerCount: number;
  fillerPercentage: number;
  totalWords: number;
  fillersByType: {
    sound: number;
    word: number;
    phrase: number;
  };
  fillersDetected: string[];
  mostCommonFillers: Array<[string, number]>;
  assessment: 'excellent' | 'acceptable' | 'excessive' | 'major_issue';
  recommendation: string;
  score: string; // A-D 등급
}

// 필러워드 패턴 (한국어)
const FILLER_PATTERNS = {
  // 소리 필러
  sounds: [
    /어+[\.…~]*/g,
    /음+[\.…~]*/g,
    /아+[\.…~]*/g,
    /에+[\.…~]*/g,
    /으+[\.…~]*/g,
  ],
  // 단어 필러
  words: [
    /\b그\b/g,
    /\b저\b/g,
    /\b뭐\b/g,
    /\b이제\b/g,
    /\b약간\b/g,
    /\b좀\b/g,
    /\b막\b/g,
    /\b진짜\b/g,
  ],
  // 구문 필러
  phrases: [
    /그러니까/g,
    /말하자면/g,
    /어떻게 보면/g,
    /솔직히/g,
    /사실/g,
    /뭐랄까/g,
    /그게/g,
    /있잖아/g,
  ],
};

export function analyzeFillers(transcript: string): FillerAnalysisResult {
  const words = transcript.trim().split(/\s+/).filter(Boolean);
  const totalWords = words.length;

  const fillersByType = { sound: 0, word: 0, phrase: 0 };
  const fillersFound: string[] = [];
  const fillerCounts: Record<string, number> = {};

  // 소리 필러 검출
  for (const pattern of FILLER_PATTERNS.sounds) {
    const matches = transcript.match(pattern) || [];
    fillersByType.sound += matches.length;
    matches.forEach((m) => {
      fillersFound.push(m);
      fillerCounts[m] = (fillerCounts[m] || 0) + 1;
    });
  }

  // 단어 필러 검출
  for (const pattern of FILLER_PATTERNS.words) {
    const matches = transcript.match(pattern) || [];
    fillersByType.word += matches.length;
    matches.forEach((m) => {
      fillersFound.push(m);
      fillerCounts[m] = (fillerCounts[m] || 0) + 1;
    });
  }

  // 구문 필러 검출
  for (const pattern of FILLER_PATTERNS.phrases) {
    const matches = transcript.match(pattern) || [];
    fillersByType.phrase += matches.length;
    matches.forEach((m) => {
      fillersFound.push(m);
      fillerCounts[m] = (fillerCounts[m] || 0) + 1;
    });
  }

  const fillerCount = fillersByType.sound + fillersByType.word + fillersByType.phrase;
  const fillerPercentage = totalWords > 0 ? (fillerCount / totalWords) * 100 : 0;

  // 가장 많이 사용된 필러
  const mostCommonFillers = Object.entries(fillerCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5) as Array<[string, number]>;

  // 평가
  let assessment: FillerAnalysisResult['assessment'];
  let recommendation: string;
  let score: string;

  if (fillerPercentage <= 2) {
    assessment = 'excellent';
    recommendation = '필러워드 사용이 매우 적습니다. 훌륭합니다!';
    score = 'A';
  } else if (fillerPercentage <= 4) {
    assessment = 'acceptable';
    recommendation = '필러워드 사용이 적절한 수준입니다. 조금 더 줄이면 더 좋습니다.';
    score = 'B+';
  } else if (fillerPercentage <= 6) {
    assessment = 'excessive';
    const common = mostCommonFillers[0]?.[0] || '음';
    recommendation = `필러워드가 다소 많습니다 (${fillerPercentage.toFixed(1)}%). 특히 "${common}"을 자주 사용하시네요. 잠시 멈추는 연습을 해보세요.`;
    score = 'C+';
  } else {
    assessment = 'major_issue';
    const common = mostCommonFillers[0]?.[0] || '음';
    recommendation = `필러워드가 많아 전달력이 떨어집니다 (${fillerPercentage.toFixed(1)}%). "${common}" 대신 잠시 멈추는 습관을 들여보세요. 녹음하고 다시 들어보는 것도 도움이 됩니다.`;
    score = 'C';
  }

  return {
    fillerCount,
    fillerPercentage,
    totalWords,
    fillersByType,
    fillersDetected: fillersFound.slice(0, 10), // 최대 10개만 반환
    mostCommonFillers,
    assessment,
    recommendation,
    score,
  };
}
