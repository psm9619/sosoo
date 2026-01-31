// ============================================
// API 타입 정의 (Backend API 스펙 기반)
// ============================================

// ============================================
// Session State (공통 응답)
// ============================================
export type SessionStatus = 'processing' | 'waiting_feedback' | 'complete' | 'error';
export type InterruptPoint = 'check_analysis' | 'check_script';
export type FeedbackType = 'analysis' | 'script';

export interface Analysis {
  reasoning: string;
  scores: Record<string, string>; // e.g., { logic_structure: "B+", filler_words: "C" }
  improvements: string[];
}

export interface CurrentState {
  transcript?: string;
  analysis?: Analysis | null;
  improved_script?: string | null;
  improvement_reasoning?: string | null;
  improved_audio_url?: string | null;
}

export interface NextActions {
  accept?: string;
  feedback?: string;
  reject?: string;
}

export interface SessionState {
  session_id: string;
  status: SessionStatus;
  interrupt_point?: InterruptPoint | null;
  current_state: CurrentState;
  refinement_count: number;
  max_refinements: number;
  next_actions?: NextActions | null;
}

// ============================================
// Request Types
// ============================================
export interface CreateSessionRequest {
  audio_url: string;
  project_id: string;
  context?: string | null;
}

export interface FeedbackRequest {
  feedback_type: FeedbackType;
  user_feedback: string; // 10-200 chars
}

// ============================================
// SSE Event Types
// ============================================
export type ProcessingStep = 'stt' | 'analysis' | 'improvement' | 'tts';

export interface SSEProgressEvent {
  step: ProcessingStep;
  progress: number; // 0-100
  message?: string;
}

export interface SSECompleteEvent extends SessionState {}

export interface SSEErrorEvent {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export type SSEEvent =
  | { event: 'progress'; data: SSEProgressEvent }
  | { event: 'complete'; data: SSECompleteEvent }
  | { event: 'error'; data: SSEErrorEvent }
  | { event: 'heartbeat'; data: Record<string, never> };

// ============================================
// Guest Session
// ============================================
export interface GuestSessionResponse {
  guest_token: string;
  expires_at: string; // ISO date
}

// ============================================
// API Error Response
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
