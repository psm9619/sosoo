/**
 * AI 모듈 메인 엔트리포인트
 * LangGraph 기반 Speech Coach 파이프라인
 */

// State
export type {
  AnalysisMode,
  VoiceType,
  ModerationFlags,
  UserPatterns,
  PreviousSession,
  SpeechCoachState,
  RefinementState,
} from './state';
export { createInitialState } from './state';

// Workflows
export {
  runSpeechCoachWorkflow,
  streamSpeechCoachWorkflow,
  runRefinementWorkflow,
  streamRefinementWorkflow,
} from './workflows';

// Nodes (for direct usage if needed)
export {
  speechToText,
  analyzeContent,
  generateImprovedScript,
  generateRefinedScript,
  textToSpeech,
  uploadAudioToStorage,
} from './nodes';

// Context & Question Generation
export {
  analyzeContext,
  extractTextFromDocument,
  generateQuestions,
  generatePresentationQuestions,
  DEFAULT_QUESTIONS_PER_CATEGORY,
} from './nodes';
export type {
  ContextAnalysisInput,
  ContextAnalysisResult,
  Experience,
  InterviewCategory,
  QuestionGenerationInput,
  GeneratedQuestion,
  QuestionGenerationResult,
  PresentationQuestion,
} from './nodes';

// Progressive Context (Memory System)
export {
  generateShortTermMemory,
  extractLongTermMemory,
  formatProgressiveContext,
  buildProgressiveContext,
} from './nodes';
export type {
  LongTermMemory,
  ShortTermMemory,
  RecentAttempt,
  ProgressiveContext,
} from './nodes';

// Tools
export { analyzePace } from './tools/pace-analysis';
export { analyzeFillers } from './tools/filler-analysis';
export { analyzeStructure } from './tools/structure-analysis';
