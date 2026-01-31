/**
 * Supabase DB 타입 정의
 * supabase/migrations/20260131000000_initial_schema.sql 기반
 */

// ============================================
// ENUM Types
// ============================================

export type DBProjectType = 'interview' | 'presentation' | 'free_speech';
export type DBInterviewCategory = 'basic' | 'motivation' | 'competency' | 'technical' | 'situation' | 'culture_fit';
export type DBAttemptStatus = 'processing' | 'completed' | 'failed';
export type DBVoiceCloneStatus = 'processing' | 'ready' | 'failed';

// ============================================
// Database Table Types
// ============================================

/** users 테이블 */
export interface DBUser {
  id: string; // UUID, auth.users FK
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  voice_clone_consent: boolean;
  voice_clone_consent_at: string | null; // timestamptz
  identity_verified: boolean;
  identity_verified_at: string | null;
  daily_session_limit: number;
  monthly_session_limit: number;
  created_at: string;
  updated_at: string;
}

/** projects 테이블 */
export interface DBProject {
  id: string; // UUID
  user_id: string; // UUID
  type: DBProjectType;
  title: string;
  company: string | null;
  position: string | null;
  description: string | null;
  context_summary: string | null;
  context_keywords: string[] | null;
  context_experiences: DBContextExperience[] | null; // JSONB
  target_date: string | null; // date
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

/** context_experiences JSONB 구조 */
export interface DBContextExperience {
  title: string;
  role: string;
  achievements: string[];
  skills?: string[];
}

/** questions 테이블 */
export interface DBQuestion {
  id: string; // UUID
  project_id: string; // UUID
  text: string;
  category: DBInterviewCategory | null;
  order: number;
  is_ai_generated: boolean;
  generation_context: string | null;
  created_at: string;
}

/** attempts 테이블 */
export interface DBAttempt {
  id: string; // UUID
  question_id: string; // UUID
  user_id: string; // UUID
  original_text: string | null;
  duration_seconds: number | null;
  analysis: DBAnalysis | null; // JSONB
  improved_text: string | null;
  improvements: string[] | null;
  score: number | null; // 0-100
  original_audio_url: string | null;
  improved_audio_url: string | null;
  refinement_count: number;
  refinement_history: DBRefinementHistory[];
  used_voice_clone: boolean;
  status: DBAttemptStatus;
  error_message: string | null;
  moderation_flags: Record<string, unknown> | null;
  is_flagged: boolean;
  created_at: string;
  updated_at: string;
}

/** attempts.analysis JSONB 구조 */
export interface DBAnalysis {
  scores: {
    logic_structure: string;
    filler_words: string;
    speaking_pace: string;
    confidence_tone: string;
    content_specificity: string;
  };
  metrics: {
    words_per_minute: number;
    filler_count: number;
    filler_percentage: number;
    total_words: number;
  };
  suggestions: Array<{
    priority: number;
    category: string;
    suggestion: string;
    impact: string;
  }>;
  structure_analysis?: string;
  progressive_context_note?: string;
}

/** refinement_history 항목 */
export interface DBRefinementHistory {
  stage: number;
  user_intent: string;
  improved_text: string;
  created_at: string;
}

/** project_documents 테이블 */
export interface DBProjectDocument {
  id: string; // UUID
  project_id: string; // UUID
  user_id: string; // UUID
  file_name: string;
  file_type: string | null;
  file_size: number | null;
  storage_path: string;
  extracted_text: string | null;
  extracted_summary: string | null;
  extracted_keywords: string[] | null;
  document_type: string;
  created_at: string;
}

/** voice_clones 테이블 */
export interface DBVoiceClone {
  id: string; // UUID
  user_id: string; // UUID
  elevenlabs_voice_id: string | null;
  voice_name: string;
  status: DBVoiceCloneStatus;
  error_message: string | null;
  sample_audio_url: string | null;
  sample_duration_seconds: number | null;
  created_at: string;
  updated_at: string;
}

// ============================================
// View Types
// ============================================

/** projects_with_stats 뷰 */
export interface DBProjectWithStats extends DBProject {
  question_count: number;
  attempt_count: number;
  d_day: number | null;
}

/** questions_with_stats 뷰 */
export interface DBQuestionWithStats extends DBQuestion {
  attempt_count: number;
  best_score: number | null;
  latest_attempt_at: string | null;
}

/** attempts_with_scores 뷰 */
export interface DBAttemptWithScores extends DBAttempt {
  logic_structure_score: string | null;
  filler_words_score: string | null;
  speaking_pace_score: string | null;
  confidence_tone_score: string | null;
  content_specificity_score: string | null;
}

// ============================================
// Input Types (Create/Update)
// ============================================

/** 프로젝트 생성 입력 */
export interface CreateProjectInput {
  user_id: string;
  type: DBProjectType;
  title: string;
  company?: string | null;
  position?: string | null;
  description?: string | null;
  context_summary?: string | null;
  context_keywords?: string[] | null;
  context_experiences?: DBContextExperience[] | null;
  target_date?: string | null;
}

/** 프로젝트 수정 입력 */
export interface UpdateProjectInput {
  title?: string;
  company?: string | null;
  position?: string | null;
  description?: string | null;
  context_summary?: string | null;
  context_keywords?: string[] | null;
  context_experiences?: DBContextExperience[] | null;
  target_date?: string | null;
  is_archived?: boolean;
}

/** 질문 생성 입력 */
export interface CreateQuestionInput {
  project_id: string;
  text: string;
  category?: DBInterviewCategory | null;
  order: number;
  is_ai_generated?: boolean;
  generation_context?: string | null;
}

/** 시도 생성 입력 */
export interface CreateAttemptInput {
  question_id: string;
  user_id: string;
  original_text?: string | null;
  duration_seconds?: number | null;
  analysis?: DBAnalysis | null;
  improved_text?: string | null;
  improvements?: string[] | null;
  score?: number | null;
  original_audio_url?: string | null;
  improved_audio_url?: string | null;
  used_voice_clone?: boolean;
  status?: DBAttemptStatus;
}

/** 시도 수정 입력 */
export interface UpdateAttemptInput {
  original_text?: string | null;
  duration_seconds?: number | null;
  analysis?: DBAnalysis | null;
  improved_text?: string | null;
  improvements?: string[] | null;
  score?: number | null;
  original_audio_url?: string | null;
  improved_audio_url?: string | null;
  refinement_count?: number;
  refinement_history?: DBRefinementHistory[];
  status?: DBAttemptStatus;
  error_message?: string | null;
}

// ============================================
// Transform Utilities
// ============================================

import type { Project, Question, Attempt, InterviewCategory } from '@/types';

/** DB Project → Frontend Project 변환 */
export function dbProjectToProject(dbProject: DBProject, questions: Question[] = []): Project {
  return {
    id: dbProject.id,
    userId: dbProject.user_id,
    type: dbProject.type,
    title: dbProject.title,
    company: dbProject.company || undefined,
    position: dbProject.position || undefined,
    context: dbProject.description || undefined,
    contextSummary: dbProject.context_summary || undefined,
    contextKeywords: dbProject.context_keywords || undefined,
    contextExperiences: dbProject.context_experiences?.map(exp => ({
      title: exp.title,
      role: exp.role,
      achievements: exp.achievements,
    })) || undefined,
    contextStrengths: undefined, // DB에는 없는 필드
    questions,
    createdAt: dbProject.created_at,
    updatedAt: dbProject.updated_at,
  };
}

/** DB Question → Frontend Question 변환 */
export function dbQuestionToQuestion(dbQuestion: DBQuestion, attempts: Attempt[] = []): Question {
  return {
    id: dbQuestion.id,
    projectId: dbQuestion.project_id,
    category: dbQuestion.category as InterviewCategory | undefined,
    text: dbQuestion.text,
    order: dbQuestion.order,
    attempts,
    createdAt: dbQuestion.created_at,
  };
}

/** DB Attempt → Frontend Attempt 변환 */
export function dbAttemptToAttempt(dbAttempt: DBAttempt): Attempt {
  return {
    id: dbAttempt.id,
    questionId: dbAttempt.question_id,
    createdAt: dbAttempt.created_at,
    duration: dbAttempt.duration_seconds || 0,
    originalText: dbAttempt.original_text || '',
    improvedText: dbAttempt.improved_text || '',
    originalAudioUrl: dbAttempt.original_audio_url || undefined,
    improvedAudioUrl: dbAttempt.improved_audio_url || undefined,
    improvements: dbAttempt.improvements || [],
    score: dbAttempt.score || undefined,
  };
}

/** Frontend Project → DB CreateProjectInput 변환 */
export function projectToCreateInput(project: Omit<Project, 'id' | 'questions' | 'createdAt' | 'updatedAt'>): CreateProjectInput {
  return {
    user_id: project.userId,
    type: project.type,
    title: project.title,
    company: project.company || null,
    position: project.position || null,
    description: project.context || null,
    context_summary: project.contextSummary || null,
    context_keywords: project.contextKeywords || null,
    context_experiences: project.contextExperiences?.map(exp => ({
      title: exp.title,
      role: exp.role,
      achievements: exp.achievements,
    })) || null,
  };
}

/** Frontend Question → DB CreateQuestionInput 변환 */
export function questionToCreateInput(question: Omit<Question, 'id' | 'attempts' | 'createdAt'>): CreateQuestionInput {
  return {
    project_id: question.projectId,
    text: question.text,
    category: question.category as DBInterviewCategory | null || null,
    order: question.order,
    is_ai_generated: true,
  };
}
