/**
 * Refinement 워크플로우
 * 사용자 피드백 기반 스크립트 수정
 * Stage 1: 텍스트만 수정 (프리뷰)
 * Stage 2: TTS 재생성
 */

import { StateGraph, END, Annotation } from '@langchain/langgraph';
import type { VoiceType } from '../state';
import type { AnalysisResult } from '@/types/api';
import { refinementNode } from '../nodes/improvement';
import { refinementTtsNode } from '../nodes/tts';

// Annotation 기반 상태 정의
const RefinementAnnotation = Annotation.Root({
  sessionId: Annotation<string>({ reducer: (_, b) => b, default: () => '' }),
  userIntent: Annotation<string>({ reducer: (_, b) => b, default: () => '' }),
  stage: Annotation<1 | 2>({ reducer: (_, b) => b, default: () => 1 }),

  // 원본 데이터
  originalTranscript: Annotation<string>({ reducer: (_, b) => b, default: () => '' }),
  currentScript: Annotation<string>({ reducer: (_, b) => b, default: () => '' }),
  analysisResult: Annotation<AnalysisResult>({
    reducer: (_, b) => b,
    default: () => ({
      scores: {
        logicStructure: 'B',
        fillerWords: 'B',
        speakingPace: 'B',
        confidenceTone: 'B',
        contentSpecificity: 'B',
      },
      metrics: {
        wordsPerMinute: 0,
        fillerCount: 0,
        fillerPercentage: 0,
        totalWords: 0,
        durationSeconds: 0,
      },
      suggestions: [],
    }),
  }),

  // 결과
  refinedScript: Annotation<string | undefined>({ reducer: (a, b) => b ?? a }),
  changesSummary: Annotation<string | undefined>({ reducer: (a, b) => b ?? a }),
  improvedAudioUrl: Annotation<string | undefined>({ reducer: (a, b) => b ?? a }),

  // Voice 설정
  voiceType: Annotation<VoiceType>({ reducer: (_, b) => b, default: () => 'default_male' }),
  voiceCloneId: Annotation<string | undefined>({ reducer: (a, b) => b ?? a }),

  // 메시지
  messages: Annotation<Array<{ step: string; progress: number; message: string }>>({
    reducer: (a, b) => (b && b.length > 0 ? b : a || []),
    default: () => [],
  }),
});

type RefinementState = typeof RefinementAnnotation.State;

/**
 * 조건부 라우팅: Stage 체크
 */
function checkStage(state: RefinementState): 'refinement' | 'tts' {
  return state.stage === 1 ? 'refinement' : 'tts';
}

/**
 * 라우터 노드
 */
function routerNode(state: RefinementState): Partial<RefinementState> {
  return {
    messages: [
      ...state.messages,
      {
        step: 'start',
        progress: 0,
        message: state.stage === 1 ? '스크립트를 수정합니다...' : '음성을 생성합니다...',
      },
    ],
  };
}

/**
 * Stage 1 완료 노드
 */
function stage1CompleteNode(state: RefinementState): Partial<RefinementState> {
  return {
    messages: [
      ...state.messages,
      { step: 'complete', progress: 100, message: '스크립트 수정이 완료되었습니다. 확인 후 음성을 생성해주세요.' },
    ],
  };
}

/**
 * Refinement 워크플로우 그래프 생성
 */
export function createRefinementGraph() {
  const workflow = new StateGraph(RefinementAnnotation)
    .addNode('router', routerNode)
    .addNode('refinement', refinementNode)
    .addNode('stage1Complete', stage1CompleteNode)
    .addNode('tts', refinementTtsNode)
    .addEdge('__start__', 'router')
    .addConditionalEdges('router', checkStage)
    .addEdge('refinement', 'stage1Complete')
    .addEdge('stage1Complete', '__end__')
    .addEdge('tts', '__end__');

  return workflow.compile();
}

// 싱글턴 인스턴스
let refinementGraphInstance: ReturnType<typeof createRefinementGraph> | null = null;

export function getRefinementGraph() {
  if (!refinementGraphInstance) {
    refinementGraphInstance = createRefinementGraph();
  }
  return refinementGraphInstance;
}

/**
 * Refinement 워크플로우 실행
 */
export async function runRefinementWorkflow(params: {
  sessionId: string;
  userIntent: string;
  stage: 1 | 2;
  originalTranscript: string;
  currentScript: string;
  analysisResult: AnalysisResult;
  refinedScript?: string;
  voiceType?: VoiceType;
  voiceCloneId?: string;
}): Promise<RefinementState> {
  const graph = getRefinementGraph();

  const initialState: Partial<RefinementState> = {
    sessionId: params.sessionId,
    userIntent: params.userIntent,
    stage: params.stage,
    originalTranscript: params.originalTranscript,
    currentScript: params.currentScript,
    analysisResult: params.analysisResult,
    refinedScript: params.refinedScript,
    voiceType: params.voiceType || 'default_male',
    voiceCloneId: params.voiceCloneId,
    messages: [],
  };

  const result = await graph.invoke(initialState);
  return result as RefinementState;
}

/**
 * 스트리밍 Refinement 워크플로우 (SSE용)
 */
export async function* streamRefinementWorkflow(params: {
  sessionId: string;
  userIntent: string;
  stage: 1 | 2;
  originalTranscript: string;
  currentScript: string;
  analysisResult: AnalysisResult;
  refinedScript?: string;
  voiceType?: VoiceType;
  voiceCloneId?: string;
}): AsyncGenerator<{
  event: 'progress' | 'complete' | 'error';
  data: Partial<RefinementState>;
}> {
  const graph = getRefinementGraph();

  const initialState: Partial<RefinementState> = {
    sessionId: params.sessionId,
    userIntent: params.userIntent,
    stage: params.stage,
    originalTranscript: params.originalTranscript,
    currentScript: params.currentScript,
    analysisResult: params.analysisResult,
    refinedScript: params.refinedScript,
    voiceType: params.voiceType || 'default_male',
    voiceCloneId: params.voiceCloneId,
    messages: [],
  };

  try {
    const stream = await graph.stream(initialState, {
      streamMode: 'updates',
    });

    let lastState: Partial<RefinementState> = initialState;

    for await (const chunk of stream) {
      const entries = Object.entries(chunk);
      if (entries.length === 0) continue;

      const [nodeName, nodeOutput] = entries[0];
      const output = nodeOutput as Partial<RefinementState>;

      lastState = { ...lastState, ...output };

      yield {
        event: 'progress',
        data: { ...output, _currentNode: nodeName } as Partial<RefinementState>,
      };
    }

    yield { event: 'complete', data: lastState };
  } catch (error) {
    yield {
      event: 'error',
      data: {
        messages: [
          {
            step: 'error',
            progress: 0,
            message: error instanceof Error ? error.message : '수정 중 오류가 발생했습니다.',
          },
        ],
      },
    };
  }
}

// 타입 export
export type { RefinementState };
