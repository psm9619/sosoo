/**
 * 말하기 속도 분석 도구
 * Python backend/langgraph/tools/pace_analysis.py 포팅
 */

export interface PaceAnalysisResult {
  wordsPerMinute: number;
  wordCount: number;
  durationSeconds: number;
  assessment: 'too_slow' | 'optimal' | 'too_fast';
  targetRange: string;
  deviation: number;
  recommendation: string;
  score: string; // A-D 등급
}

// 목표 범위: 면접/발표 컨텍스트
const TARGET_MIN = 120;
const TARGET_MAX = 170;
const OPTIMAL_MIN = 130;
const OPTIMAL_MAX = 160;

export function analyzePace(transcript: string, durationSeconds: number): PaceAnalysisResult {
  // 단어 수 계산 (한글 기준: 공백으로 분리)
  const words = transcript.trim().split(/\s+/).filter(Boolean);
  const wordCount = words.length;

  // WPM 계산
  const wordsPerMinute = Math.round((wordCount / durationSeconds) * 60);

  // 평가
  let assessment: PaceAnalysisResult['assessment'];
  let recommendation: string;
  let score: string;

  if (wordsPerMinute > 180) {
    assessment = 'too_fast';
    recommendation = `현재 ${wordsPerMinute} WPM으로 너무 빠릅니다. ${TARGET_MAX} WPM 이하로 천천히 말해보세요. 중요한 포인트에서 잠시 멈추면 청중이 내용을 소화할 시간이 생깁니다.`;
    score = wordsPerMinute > 200 ? 'D' : 'C';
  } else if (wordsPerMinute >= TARGET_MIN) {
    if (wordsPerMinute >= OPTIMAL_MIN && wordsPerMinute <= OPTIMAL_MAX) {
      assessment = 'optimal';
      recommendation = `${wordsPerMinute} WPM은 이상적인 속도입니다. 이 페이스를 유지하세요.`;
      score = 'A';
    } else {
      assessment = 'optimal';
      recommendation = `${wordsPerMinute} WPM은 적절한 범위입니다. 조금 더 ${wordsPerMinute > OPTIMAL_MAX ? '천천히' : '빠르게'} 말하면 더 좋습니다.`;
      score = 'B+';
    }
  } else {
    assessment = 'too_slow';
    recommendation = `현재 ${wordsPerMinute} WPM으로 다소 느립니다. ${TARGET_MIN} WPM 이상으로 조금 더 활기차게 말해보세요. 단, 명확한 발음은 유지하세요.`;
    score = wordsPerMinute < 100 ? 'C' : 'C+';
  }

  // 목표 범위와의 편차 계산
  let deviation = 0;
  if (wordsPerMinute < TARGET_MIN) {
    deviation = TARGET_MIN - wordsPerMinute;
  } else if (wordsPerMinute > TARGET_MAX) {
    deviation = wordsPerMinute - TARGET_MAX;
  }

  return {
    wordsPerMinute,
    wordCount,
    durationSeconds,
    assessment,
    targetRange: `${TARGET_MIN}-${TARGET_MAX} WPM`,
    deviation,
    recommendation,
    score,
  };
}
