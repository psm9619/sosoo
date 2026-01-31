/**
 * Speech Coach 메인 워크플로우
 * STT → Analysis → Improvement → (Reflection) → TTS
 */

import { StateGraph, END, Annotation } from '@langchain/langgraph';
import type { AnalysisMode, VoiceType, ModerationFlags, UserPatterns, PreviousSession } from '../state';
import type { AnalysisResult } from '@/types/api';
import { sttNode } from '../nodes/stt';
import { analysisNode } from '../nodes/analysis';
import { improvementNode, reflectionNode } from '../nodes/improvement';
import { ttsNode } from '../nodes/tts';

// Annotation 기반 상태 정의
const SpeechCoachAnnotation = Annotation.Root({
  // 세션 정보
  sessionId: Annotation<string>({ reducer: (_, b) => b, default: () => '' }),
  userId: Annotation<string | undefined>({ reducer: (a, b) => b ?? a }),
  mode: Annotation<AnalysisMode>({ reducer: (_, b) => b, default: () => 'quick' }),

  // 입력 데이터
  audioUrl: Annotation<string>({ reducer: (_, b) => b, default: () => '' }),
  audioDuration: Annotation<number | undefined>({ reducer: (a, b) => b ?? a }),
  question: Annotation<string | undefined>({ reducer: (a, b) => b ?? a }),
  projectId: Annotation<string | undefined>({ reducer: (a, b) => b ?? a }),

  // STT 결과
  transcript: Annotation<string | undefined>({ reducer: (a, b) => b ?? a }),

  // 분석 결과
  analysisResult: Annotation<AnalysisResult | undefined>({ reducer: (a, b) => b ?? a }),

  // 개선안
  improvedScriptDraft: Annotation<string | undefined>({ reducer: (a, b) => b ?? a }),
  improvedScript: Annotation<string | undefined>({ reducer: (a, b) => b ?? a }),
  reflectionNotes: Annotation<string | undefined>({ reducer: (a, b) => b ?? a }),

  // TTS 결과
  improvedAudioUrl: Annotation<string | undefined>({ reducer: (a, b) => b ?? a }),

  // Progressive Context
  previousSessions: Annotation<PreviousSession[] | undefined>({ reducer: (a, b) => b ?? a }),
  userPatterns: Annotation<UserPatterns | undefined>({ reducer: (a, b) => b ?? a }),
  contextDocuments: Annotation<string[] | undefined>({ reducer: (a, b) => b ?? a }),
  contextAnalysis: Annotation<string | undefined>({ reducer: (a, b) => b ?? a }),

  // Voice 설정
  voiceType: Annotation<VoiceType>({ reducer: (_, b) => b, default: () => 'default_male' }),
  voiceCloneId: Annotation<string | undefined>({ reducer: (a, b) => b ?? a }),

  // 모더레이션
  moderationFlags: Annotation<ModerationFlags | undefined>({ reducer: (a, b) => b ?? a }),

  // 재요청
  refinementCount: Annotation<number>({ reducer: (_, b) => b, default: () => 0 }),
  userIntent: Annotation<string | undefined>({ reducer: (a, b) => b ?? a }),

  // 메시지 (스트리밍용)
  messages: Annotation<Array<{ step: string; progress: number; message: string }>>({
    reducer: (a, b) => (b && b.length > 0 ? b : a || []),
    default: () => [],
  }),

  // 에러
  error: Annotation<{ code: string; message: string } | undefined>({ reducer: (a, b) => b ?? a }),
});

type SpeechCoachState = typeof SpeechCoachAnnotation.State;

/**
 * 조건부 라우팅: 에러 체크
 */
function routeAfterStt(state: SpeechCoachState): 'error' | 'analysis' {
  return state.error ? 'error' : 'analysis';
}

function routeAfterAnalysis(state: SpeechCoachState): 'error' | 'improvement' {
  return state.error ? 'error' : 'improvement';
}

function routeAfterImprovement(state: SpeechCoachState): 'error' | 'reflection' | 'skipReflection' {
  if (state.error) return 'error';
  return state.mode === 'deep' ? 'reflection' : 'skipReflection';
}

function routeAfterTts(state: SpeechCoachState): '__end__' | 'error' {
  return state.error ? 'error' : '__end__';
}

/**
 * 에러 노드
 */
function errorNode(state: SpeechCoachState): Partial<SpeechCoachState> {
  return {
    messages: [
      ...state.messages,
      { step: 'error', progress: 0, message: state.error?.message || '알 수 없는 오류' },
    ],
  };
}

/**
 * Skip Reflection 노드
 */
function skipReflectionNode(state: SpeechCoachState): Partial<SpeechCoachState> {
  return {
    improvedScript: state.improvedScriptDraft,
  };
}

/**
 * 메인 워크플로우 그래프 생성
 */
export function createSpeechCoachGraph() {
  const workflow = new StateGraph(SpeechCoachAnnotation)
    .addNode('stt', sttNode)
    .addNode('analysis', analysisNode)
    .addNode('improvement', improvementNode)
    .addNode('reflection', reflectionNode)
    .addNode('skipReflection', skipReflectionNode)
    .addNode('tts', ttsNode)
    .addNode('error', errorNode)
    .addEdge('__start__', 'stt')
    .addConditionalEdges('stt', routeAfterStt)
    .addConditionalEdges('analysis', routeAfterAnalysis)
    .addConditionalEdges('improvement', routeAfterImprovement)
    .addEdge('reflection', 'tts')
    .addEdge('skipReflection', 'tts')
    .addConditionalEdges('tts', routeAfterTts)
    .addEdge('error', '__end__');

  return workflow.compile();
}

// 싱글턴 인스턴스
let graphInstance: ReturnType<typeof createSpeechCoachGraph> | null = null;

export function getSpeechCoachGraph() {
  if (!graphInstance) {
    graphInstance = createSpeechCoachGraph();
  }
  return graphInstance;
}

/**
 * 워크플로우 실행
 */
export async function runSpeechCoachWorkflow(params: {
  sessionId: string;
  audioUrl: string;
  mode?: AnalysisMode;
  voiceType?: VoiceType;
  question?: string;
  projectId?: string;
  userId?: string;
  voiceCloneId?: string;
}): Promise<SpeechCoachState> {
  const graph = getSpeechCoachGraph();

  const initialState: Partial<SpeechCoachState> = {
    sessionId: params.sessionId,
    audioUrl: params.audioUrl,
    mode: params.mode || 'quick',
    voiceType: params.voiceType || 'default_male',
    question: params.question,
    projectId: params.projectId,
    userId: params.userId,
    voiceCloneId: params.voiceCloneId,
    refinementCount: 0,
    messages: [],
  };

  const result = await graph.invoke(initialState);
  return result as SpeechCoachState;
}

/**
 * 스트리밍 워크플로우 실행 (SSE용)
 */
export async function* streamSpeechCoachWorkflow(params: {
  sessionId: string;
  audioUrl: string;
  mode?: AnalysisMode;
  voiceType?: VoiceType;
  question?: string;
  projectId?: string;
  userId?: string;
  voiceCloneId?: string;
}): AsyncGenerator<{
  event: 'progress' | 'complete' | 'error';
  data: Partial<SpeechCoachState>;
}> {
  const graph = getSpeechCoachGraph();

  const initialState: Partial<SpeechCoachState> = {
    sessionId: params.sessionId,
    audioUrl: params.audioUrl,
    mode: params.mode || 'quick',
    voiceType: params.voiceType || 'default_male',
    question: params.question,
    projectId: params.projectId,
    userId: params.userId,
    voiceCloneId: params.voiceCloneId,
    refinementCount: 0,
    messages: [],
  };

  try {
    const stream = await graph.stream(initialState, {
      streamMode: 'updates',
    });

    let lastState: Partial<SpeechCoachState> = initialState;

    for await (const chunk of stream) {
      const entries = Object.entries(chunk);
      if (entries.length === 0) continue;

      const [nodeName, nodeOutput] = entries[0];
      const output = nodeOutput as Partial<SpeechCoachState>;

      lastState = { ...lastState, ...output };

      if (output.error) {
        yield { event: 'error', data: output };
        return;
      }

      yield {
        event: 'progress',
        data: { ...output, _currentNode: nodeName } as Partial<SpeechCoachState>,
      };
    }

    yield { event: 'complete', data: lastState };
  } catch (error) {
    yield {
      event: 'error',
      data: {
        error: {
          code: 'WORKFLOW_ERROR',
          message: error instanceof Error ? error.message : '워크플로우 실행 중 오류가 발생했습니다.',
        },
      },
    };
  }
}

// 타입 export
export type { SpeechCoachState };
