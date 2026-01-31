/**
 * LangGraph 상태 정의
 * Python backend/langgraph/state.py를 TypeScript로 포팅
 */

import type { AnalysisResult } from '@/types/api';
import type {
  LongTermMemory,
  ShortTermMemory,
  ProgressiveContext,
} from './nodes/progressive-context';

// Re-export Progressive Context types for convenience
export type { LongTermMemory, ShortTermMemory, ProgressiveContext };

// ============================================
// 분석 모드
// ============================================
export type AnalysisMode = 'quick' | 'deep';
export type VoiceType = 'default_male' | 'default_female' | 'cloned';

// ============================================
// 모더레이션 플래그
// ============================================
export interface ModerationFlags {
  profanityDetected?: number;
  piiMasked?: string[];
  threatLevel?: 'none' | 'moderate' | 'severe';
}

// ============================================
// Progressive Context (사용자 히스토리) - Legacy
// ============================================
export interface UserPatterns {
  recurringIssues: Record<string, number>; // { "pace": 3, "fillers": 2 }
  improvementTrend: 'improving' | 'stable' | 'declining' | 'unknown';
  sessionCount: number;
  lastSessionDate?: string;
}

export interface PreviousSession {
  sessionId: string;
  overallScore: string;
  suggestions: string[];
  createdAt: string;
}

// ============================================
// 메인 상태: SpeechCoachState
// ============================================
export interface SpeechCoachState {
  // 세션 정보
  sessionId: string;
  userId?: string;
  mode: AnalysisMode;

  // 입력 데이터
  audioUrl: string;
  audioDuration?: number;
  question?: string;
  projectId?: string;

  // STT 결과
  transcript?: string;

  // 분석 결과
  analysisResult?: AnalysisResult;

  // 개선안
  improvedScriptDraft?: string;
  improvedScript?: string;
  reflectionNotes?: string;

  // TTS 결과
  improvedAudioUrl?: string;

  // Progressive Context (새로운 메모리 시스템)
  progressiveContext?: ProgressiveContext;

  // Legacy Progressive Context (이전 버전 호환)
  previousSessions?: PreviousSession[];
  userPatterns?: UserPatterns;
  contextDocuments?: string[];
  contextAnalysis?: string;

  // Voice 설정
  voiceType: VoiceType;
  voiceCloneId?: string;

  // 모더레이션
  moderationFlags?: ModerationFlags;

  // 재요청
  refinementCount: number;
  userIntent?: string;

  // 메시지 (스트리밍용)
  messages: Array<{
    step: string;
    progress: number;
    message: string;
  }>;

  // 에러
  error?: {
    code: string;
    message: string;
  };
}

// ============================================
// 초기 상태 생성
// ============================================
export function createInitialState(params: {
  sessionId: string;
  audioUrl: string;
  mode?: AnalysisMode;
  voiceType?: VoiceType;
  question?: string;
  projectId?: string;
  userId?: string;
  voiceCloneId?: string;
  progressiveContext?: ProgressiveContext;
}): SpeechCoachState {
  return {
    sessionId: params.sessionId,
    audioUrl: params.audioUrl,
    mode: params.mode || 'quick',
    voiceType: params.voiceType || 'default_male',
    question: params.question,
    projectId: params.projectId,
    userId: params.userId,
    voiceCloneId: params.voiceCloneId,
    progressiveContext: params.progressiveContext,
    refinementCount: 0,
    messages: [],
  };
}

// ============================================
// 재요청 상태
// ============================================
export interface RefinementState {
  sessionId: string;
  userIntent: string;
  stage: 1 | 2; // 1=프리뷰, 2=최종

  // 원본 데이터 (수정 대상)
  originalTranscript: string;
  currentScript: string;
  analysisResult: AnalysisResult;

  // 결과
  refinedScript?: string;
  changesSummary?: string;
  improvedAudioUrl?: string;

  // Voice 설정
  voiceType: VoiceType;
  voiceCloneId?: string;

  // 메시지
  messages: Array<{
    step: string;
    progress: number;
    message: string;
  }>;
}
