// ============================================
// API 타입 정의 (Backend Schema 기반)
// ============================================
// 이 파일은 backend/api/schemas/*.py와 동기화되어야 합니다.
// snake_case → camelCase 변환은 lib/api/transform.ts에서 처리됩니다.

// ============================================
// 공통 응답 래퍼
// ============================================
export interface APIError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: APIError;
}

// ============================================
// 분석 관련 타입
// ============================================

/** 스피치 분석 점수표 (A/B+/B/C+/C/D 등급) */
export interface ScoreCard {
  logicStructure: string;
  fillerWords: string;
  speakingPace: string;
  confidenceTone: string;
  contentSpecificity: string;
}

/** 객관적 측정 지표 */
export interface AnalysisMetrics {
  wordsPerMinute: number;
  fillerCount: number;
  fillerPercentage: number;
  totalWords: number;
  durationSeconds: number;
}

/** 개선 제안 항목 */
export interface ImprovementSuggestion {
  priority: number;
  category: string;
  suggestion: string;
  impact: string;
}

/** AI 분석 결과 전체 */
export interface AnalysisResult {
  scores: ScoreCard;
  metrics: AnalysisMetrics;
  suggestions: ImprovementSuggestion[];
  structureAnalysis?: string | null;
  progressiveContextNote?: string | null;
}

// ============================================
// Request Types
// ============================================

export type AnalysisMode = 'quick' | 'deep';
export type VoiceType = 'default_male' | 'default_female' | 'cloned';

/** 스피치 분석 요청 */
export interface AnalyzeRequest {
  audioUrl: string;
  projectId?: string | null;
  mode?: AnalysisMode;
  voiceType?: VoiceType;
  question?: string | null;
}

/** 재요청 단계 (1=프리뷰, 2=최종) */
export type RefineStage = 1 | 2;

/** 개선안 재생성 요청 */
export interface RefineRequest {
  sessionId: string;
  userIntent: string; // 10-200자
  stage?: RefineStage;
}

/** Voice Cloning 요청 */
export interface VoiceCloneRequest {
  sampleAudioUrls: string[];
  voiceName?: string;
  consentGiven: boolean;
}

/** 프로젝트 생성 요청 */
export type ProjectSegment = 'regular' | 'urgent';

export interface ProjectCreateRequest {
  name: string;
  segment?: ProjectSegment;
  targetDate?: string | null; // ISO date
  description?: string | null;
}

/** 컨텍스트 문서 업로드 요청 */
export interface ContextUploadRequest {
  projectId: string;
  documentUrls: string[];
  documentTypes?: string[];
}

// ============================================
// Response Types
// ============================================

/** 분석 API 최종 응답 */
export interface AnalyzeResponse {
  sessionId: string;
  transcript: string;
  analysis: AnalysisResult;
  improvedScript: string;
  improvedAudioUrl: string;
  originalAudioUrl: string;
  refinementCount: number;
  canRefine: boolean;
}

/** 재요청 1단계: 방향 프리뷰 응답 */
export interface RefinePreviewResponse {
  sessionId: string;
  previewScript: string;
  changesSummary: string;
  stage: 1;
}

/** 재요청 2단계: 최종 생성 응답 */
export interface RefineFinalResponse {
  sessionId: string;
  improvedScript: string;
  improvedAudioUrl: string;
  stage: 2;
  canRefine: false;
}

export type RefineResponse = RefinePreviewResponse | RefineFinalResponse;

/** Voice Cloning 완료 응답 */
export type VoiceCloneStatus = 'processing' | 'ready' | 'failed';

export interface VoiceCloneResponse {
  voiceCloneId: string;
  voiceName: string;
  status: VoiceCloneStatus;
  estimatedReadyTime?: string | null;
}

// ============================================
// 프로젝트 & 세션 응답
// ============================================

/** 프로젝트 정보 응답 */
export interface ProjectResponse {
  projectId: string;
  name: string;
  segment: ProjectSegment;
  targetDate?: string | null;
  dDay?: number | null;
  sessionCount: number;
  createdAt: string;
}

/** 세션 요약 정보 */
export interface SessionSummary {
  sessionId: string;
  question?: string | null;
  overallScore: string;
  createdAt: string;
}

/** 세션 히스토리 응답 */
export interface SessionHistoryResponse {
  projectId: string;
  sessions: SessionSummary[];
  totalCount: number;
  growthSummary?: string | null;
}

// ============================================
// SSE Event Types
// ============================================

export type ProcessingStep = 'stt' | 'analysis' | 'improvement' | 'reflection' | 'tts';

export interface SSEProgressEvent {
  step: ProcessingStep;
  progress: number; // 0-100
  message?: string;
}

export interface SSECompleteEvent extends AnalyzeResponse {}

export interface SSEErrorEvent {
  code: string;
  message: string;
}

export type SSEEvent =
  | { event: 'progress'; data: SSEProgressEvent }
  | { event: 'complete'; data: SSECompleteEvent }
  | { event: 'error'; data: SSEErrorEvent }
  | { event: 'heartbeat'; data: Record<string, never> };

// ============================================
// Health Check
// ============================================

export type HealthStatus = 'healthy' | 'degraded' | 'unhealthy';

export interface HealthResponse {
  status: HealthStatus;
  version: string;
  timestamp: string;
  services: Record<string, boolean>;
}

// ============================================
// Guest Session (Legacy - 추후 제거 예정)
// ============================================

export interface GuestSessionResponse {
  guestToken: string;
  expiresAt: string;
}
