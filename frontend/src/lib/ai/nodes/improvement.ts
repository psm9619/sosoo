/**
 * 개선안 생성 노드
 * Claude API를 사용하여 개선된 스크립트 생성
 */

import Anthropic from '@anthropic-ai/sdk';
import type { SpeechCoachState, RefinementState } from '../state';
import { IMPROVEMENT_SYSTEM_PROMPT, REFLECTION_SYSTEM_PROMPT, REFINEMENT_SYSTEM_PROMPT, buildImprovementPrompt, buildRefinementPrompt } from '../prompts';

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

/**
 * 개선된 스크립트 생성
 * @throws Error if content is insufficient
 */
export async function generateImprovedScript(
  transcript: string,
  suggestions: Array<{ category: string; suggestion: string }>,
  question?: string
): Promise<string> {
  // 최소 단어 수 체크 (너무 짧은 답변 거부)
  const wordCount = transcript.trim().split(/\s+/).length;
  if (wordCount < 5) {
    throw new Error('INSUFFICIENT_CONTENT: 답변이 너무 짧습니다. 5단어 이상으로 말씀해주세요.');
  }

  const prompt = buildImprovementPrompt({
    transcript,
    suggestions,
    question,
  });

  const response = await getAnthropic().messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2000,
    system: IMPROVEMENT_SYSTEM_PROMPT,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = response.content[0].type === 'text' ? response.content[0].text : '';

  // AI가 에러 JSON을 반환한 경우 체크
  if (text.includes('"error"') && text.includes('INSUFFICIENT_CONTENT')) {
    const errorMatch = text.match(/"message"\s*:\s*"([^"]+)"/);
    const errorMessage = errorMatch?.[1] || '답변 내용이 부족하여 개선안을 생성할 수 없습니다.';
    throw new Error(`INSUFFICIENT_CONTENT: ${errorMessage}`);
  }

  // 앞뒤 불필요한 텍스트 제거
  return cleanScript(text);
}

/**
 * 자기 검토 (Reflection)
 */
export async function reflectOnImprovement(
  originalTranscript: string,
  improvedDraft: string,
  suggestions: Array<{ category: string; suggestion: string }>
): Promise<{ passesReview: boolean; finalScript: string; reflectionNotes: string }> {
  const prompt = `## 원본 발화
${originalTranscript}

## 개선안 초안
${improvedDraft}

## 원래 분석에서 지적된 문제점
${suggestions.slice(0, 3).map((s, i) => `${i + 1}. [${s.category}] ${s.suggestion}`).join('\n')}

위 개선안을 검토하고 JSON으로 응답하세요.`;

  const response = await getAnthropic().messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2000,
    system: REFLECTION_SYSTEM_PROMPT,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = response.content[0].type === 'text' ? response.content[0].text : '';

  // JSON 파싱
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  let parsed: Record<string, unknown> = {};

  if (jsonMatch) {
    try {
      parsed = JSON.parse(jsonMatch[0]);
    } catch {
      // 파싱 실패 시 기본값
    }
  }

  const passesReview = (parsed.passes_review as boolean) ?? true;
  const issuesFound = (parsed.issues_found as string[]) || [];
  const finalScript = passesReview ? improvedDraft : ((parsed.final_script as string) || improvedDraft);
  const reflectionNotes = issuesFound.length > 0 ? `발견된 문제: ${issuesFound.join(', ')}` : '검토 통과';

  return {
    passesReview,
    finalScript: cleanScript(finalScript),
    reflectionNotes,
  };
}

/**
 * 재요청 기반 스크립트 수정
 */
export async function generateRefinedScript(
  originalTranscript: string,
  currentScript: string,
  userIntent: string,
  suggestions: Array<{ category: string; suggestion: string }>
): Promise<{ refinedScript: string; changesSummary: string }> {
  const prompt = buildRefinementPrompt({
    originalTranscript,
    currentScript,
    userIntent,
    suggestions,
  });

  const response = await getAnthropic().messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2000,
    system: REFINEMENT_SYSTEM_PROMPT,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = response.content[0].type === 'text' ? response.content[0].text : '';

  // 변경 사항과 스크립트 추출
  const changesSummaryMatch = text.match(/## 변경 사항\n([\s\S]*?)(?=## 수정된 스크립트|$)/);
  const scriptMatch = text.match(/## 수정된 스크립트\n([\s\S]*)/);

  const changesSummary = changesSummaryMatch?.[1]?.trim() || '스크립트가 수정되었습니다.';
  const refinedScript = scriptMatch?.[1]?.trim() || text;

  return {
    refinedScript: cleanScript(refinedScript),
    changesSummary,
  };
}

/**
 * 스크립트 정제 (불필요한 마크다운, 설명 제거)
 */
function cleanScript(text: string): string {
  let script = text.trim();

  // 마크다운 코드 블록 제거
  script = script.replace(/```[\s\S]*?```/g, '');

  // "개선된 스크립트:", "수정된 버전:" 등의 레이블 제거
  script = script.replace(/^(개선된 스크립트|수정된 버전|결과)[\s:：]+/i, '');

  // 앞뒤 따옴표 제거
  script = script.replace(/^["'`]+|["'`]+$/g, '');

  return script.trim();
}

/**
 * Improvement 노드 - 상태를 업데이트
 */
export async function improvementNode(state: SpeechCoachState): Promise<Partial<SpeechCoachState>> {
  if (!state.transcript || !state.analysisResult) {
    return {
      error: { code: 'IMPROVEMENT_ERROR', message: '분석 결과가 없습니다.' },
    };
  }

  try {
    const suggestions = state.analysisResult.suggestions.map((s) => ({
      category: s.category,
      suggestion: s.suggestion,
    }));

    const improvedScriptDraft = await generateImprovedScript(
      state.transcript,
      suggestions,
      state.question
    );

    return {
      improvedScriptDraft,
      messages: [
        ...state.messages,
        { step: 'improvement', progress: 100, message: '개선안이 생성되었습니다.' },
      ],
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : '개선안 생성 중 오류가 발생했습니다.';

    return {
      error: { code: 'IMPROVEMENT_ERROR', message },
      messages: [
        ...state.messages,
        { step: 'improvement', progress: 0, message },
      ],
    };
  }
}

/**
 * Reflection 노드 - 상태를 업데이트 (Deep Mode에서만 사용)
 */
export async function reflectionNode(state: SpeechCoachState): Promise<Partial<SpeechCoachState>> {
  if (!state.transcript || !state.improvedScriptDraft || !state.analysisResult) {
    return {
      improvedScript: state.improvedScriptDraft,
      reflectionNotes: '검토 스킵됨',
    };
  }

  try {
    const suggestions = state.analysisResult.suggestions.map((s) => ({
      category: s.category,
      suggestion: s.suggestion,
    }));

    const { finalScript, reflectionNotes } = await reflectOnImprovement(
      state.transcript,
      state.improvedScriptDraft,
      suggestions
    );

    return {
      improvedScript: finalScript,
      reflectionNotes,
      messages: [
        ...state.messages,
        { step: 'reflection', progress: 100, message: '품질 검토가 완료되었습니다.' },
      ],
    };
  } catch (error) {
    // Reflection 실패 시 Draft를 그대로 사용
    return {
      improvedScript: state.improvedScriptDraft,
      reflectionNotes: '검토 중 오류 발생, 초안 사용',
    };
  }
}

/**
 * Refinement 노드 - 재요청 처리
 */
export async function refinementNode(state: RefinementState): Promise<Partial<RefinementState>> {
  try {
    const suggestions = state.analysisResult.suggestions.map((s) => ({
      category: s.category,
      suggestion: s.suggestion,
    }));

    const { refinedScript, changesSummary } = await generateRefinedScript(
      state.originalTranscript,
      state.currentScript,
      state.userIntent,
      suggestions
    );

    return {
      refinedScript,
      changesSummary,
      messages: [
        ...state.messages,
        { step: 'improvement', progress: 100, message: '수정이 완료되었습니다.' },
      ],
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : '수정 중 오류가 발생했습니다.';

    return {
      messages: [
        ...state.messages,
        { step: 'improvement', progress: 0, message },
      ],
    };
  }
}
