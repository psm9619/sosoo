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

/** 우선순위 랭킹 - 카테고리별 점수 */
export interface CategoryScoreResult {
  category: string;
  rawScore: number;
  weight: number;
  weightedScore: number;
  issues: string[];
  strengths: string[];
}

/** 우선순위 랭킹 결과 (자유스피치용) */
export interface PriorityRankingInfo {
  situationType: string;
  situationLabel: string;           // 한글 레이블 (예: "전문 주제", "경험 공유")
  situationDescription: string;     // 분류 근거 설명
  isEqualWeight: boolean;           // 균등 가중치 여부
  focusMessage: string;
  weightedScores: CategoryScoreResult[];
  totalWeightedScore: number;
  priorityFeedbackOrder: string[];
}

/** 모더레이션 결과 */
export interface ModerationInfo {
  isFlagged: boolean;
  warningMessage: string | null;
  flagTypes: string[];
}

/** AI 분석 결과 전체 */
export interface AnalysisResult {
  scores: ScoreCard;
  metrics: AnalysisMetrics;
  suggestions: ImprovementSuggestion[];
  structureAnalysis?: string | null;
  progressiveContextNote?: string | null;
  priorityRanking?: PriorityRankingInfo | null;
  moderation?: ModerationInfo | null;
  // 새로운 카테고리별 상세 피드백 (면접/발표용)
  categoryFeedback?: CategoryFeedback | null;
}

// ============================================
// 카테고리별 상세 피드백 (면접/발표 전용)
// ============================================

/** 서브 카테고리 평가 */
export interface SubcategoryEvaluation {
  name: string;           // 예: "속도", "필러워드"
  status: 'good' | 'warning' | 'bad';
  feedback: string;       // 예: "140 WPM, 권장 범위 내"
  details?: string[];     // 예: ["음 5회", "아니 그러니까 3회"]
}

/** 메인 카테고리 평가 */
export interface CategoryEvaluation {
  level: 'excellent' | 'good' | 'average' | 'needs_improvement';
  label: string;          // 한글 레이블 (예: "좋음", "보통")
  highlight: string;      // 카드에 표시할 핵심 포인트
  subcategories: SubcategoryEvaluation[];
}

/** 카테고리별 상세 피드백 (4개 카테고리) */
export interface CategoryFeedback {
  // 한 줄 평가
  summary: string;

  // 메인 카테고리별 평가
  categories: {
    delivery: CategoryEvaluation;     // 전달력
    structure: CategoryEvaluation;    // 구조력
    content: CategoryEvaluation;      // 내용력
    contextFit: CategoryEvaluation;   // 상황 적합성
  };
}

// ============================================
// Request Types
// ============================================

import type { ProjectType } from './project';

export type AnalysisMode = 'quick' | 'deep';
export type VoiceType = 'default_male' | 'default_female' | 'cloned';

// ProjectType은 project.ts에서 정의됨 - 여기서 재export
export type { ProjectType };

/** 스피치 분석 요청 */
export interface AnalyzeRequest {
  audioUrl: string;
  projectId?: string | null;
  mode?: AnalysisMode;
  voiceType?: VoiceType;
  useVoiceClone?: boolean; // 사용자 보이스 클론 사용 여부
  question?: string | null;
  projectType?: ProjectType;
  userId?: string | null; // Progressive Context용 사용자 ID
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
