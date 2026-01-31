/**
 * Supabase 시도(Attempt) CRUD 함수
 */

import { createClient } from './client';
import type {
  DBAttempt,
  CreateAttemptInput,
  UpdateAttemptInput,
} from './types';
import type { Attempt } from '@/types';

// ============================================
// 시도 CRUD
// ============================================

/**
 * 시도 생성
 */
export async function createAttempt(data: CreateAttemptInput): Promise<Attempt> {
  const supabase = createClient();

  const { data: attempt, error } = await supabase
    .from('attempts')
    .insert({
      ...data,
      status: data.status || 'completed',
    })
    .select()
    .single();

  if (error) {
    console.error('[createAttempt] Error:', error);
    throw new Error(`시도 생성 실패: ${error.message}`);
  }

  const { dbAttemptToAttempt } = await import('./types');
  return dbAttemptToAttempt(attempt as DBAttempt);
}

/**
 * 질문의 시도 목록 조회
 */
export async function getAttemptsByQuestion(questionId: string): Promise<Attempt[]> {
  const supabase = createClient();

  const { data: attempts, error } = await supabase
    .from('attempts')
    .select('*')
    .eq('question_id', questionId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[getAttemptsByQuestion] Error:', error);
    throw new Error(`시도 목록 조회 실패: ${error.message}`);
  }

  const { dbAttemptToAttempt } = await import('./types');
  return (attempts || []).map(a => dbAttemptToAttempt(a as DBAttempt));
}

/**
 * 사용자의 최근 시도 조회 (Progressive Context용)
 */
export async function getRecentAttempts(
  userId: string,
  limit: number = 3,
  projectId?: string
): Promise<Attempt[]> {
  const supabase = createClient();

  let query = supabase
    .from('attempts')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'completed')
    .order('created_at', { ascending: false })
    .limit(limit);

  // projectId가 있으면 해당 프로젝트의 질문에 속한 시도만 조회
  if (projectId) {
    // 먼저 프로젝트의 질문 ID 조회
    const { data: questions } = await supabase
      .from('questions')
      .select('id')
      .eq('project_id', projectId);

    if (questions && questions.length > 0) {
      const questionIds = questions.map(q => q.id);
      query = query.in('question_id', questionIds);
    }
  }

  const { data: attempts, error } = await query;

  if (error) {
    console.error('[getRecentAttempts] Error:', error);
    throw new Error(`최근 시도 조회 실패: ${error.message}`);
  }

  const { dbAttemptToAttempt } = await import('./types');
  return (attempts || []).map(a => dbAttemptToAttempt(a as DBAttempt));
}

/**
 * 시도 상세 조회
 */
export async function getAttemptById(attemptId: string): Promise<Attempt | null> {
  const supabase = createClient();

  const { data: attempt, error } = await supabase
    .from('attempts')
    .select('*')
    .eq('id', attemptId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    console.error('[getAttemptById] Error:', error);
    throw new Error(`시도 조회 실패: ${error.message}`);
  }

  const { dbAttemptToAttempt } = await import('./types');
  return dbAttemptToAttempt(attempt as DBAttempt);
}

/**
 * 시도 수정
 */
export async function updateAttempt(attemptId: string, data: UpdateAttemptInput): Promise<Attempt> {
  const supabase = createClient();

  const { data: attempt, error } = await supabase
    .from('attempts')
    .update(data)
    .eq('id', attemptId)
    .select()
    .single();

  if (error) {
    console.error('[updateAttempt] Error:', error);
    throw new Error(`시도 수정 실패: ${error.message}`);
  }

  const { dbAttemptToAttempt } = await import('./types');
  return dbAttemptToAttempt(attempt as DBAttempt);
}

/**
 * 시도 삭제
 */
export async function deleteAttempt(attemptId: string): Promise<void> {
  const supabase = createClient();

  const { error } = await supabase
    .from('attempts')
    .delete()
    .eq('id', attemptId);

  if (error) {
    console.error('[deleteAttempt] Error:', error);
    throw new Error(`시도 삭제 실패: ${error.message}`);
  }
}

// ============================================
// Progressive Context 관련 함수
// ============================================

/**
 * Short-term Memory 빌드를 위한 최근 시도 분석 정보 조회
 */
export interface RecentAttemptContext {
  attemptId: string;
  createdAt: string;
  score: number | null;
  analysis: {
    scores: Record<string, string>;
    suggestions: Array<{ category: string; suggestion: string; priority: number }>;
  } | null;
}

export async function getRecentAttemptsForContext(
  userId: string,
  projectId?: string,
  limit: number = 3
): Promise<RecentAttemptContext[]> {
  const supabase = createClient();

  let query = supabase
    .from('attempts')
    .select('id, created_at, score, analysis')
    .eq('user_id', userId)
    .eq('status', 'completed')
    .not('analysis', 'is', null)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (projectId) {
    // 프로젝트의 질문 ID 조회
    const { data: questions } = await supabase
      .from('questions')
      .select('id')
      .eq('project_id', projectId);

    if (questions && questions.length > 0) {
      const questionIds = questions.map(q => q.id);
      query = query.in('question_id', questionIds);
    }
  }

  const { data: attempts, error } = await query;

  if (error) {
    console.error('[getRecentAttemptsForContext] Error:', error);
    return [];
  }

  return (attempts || []).map(a => ({
    attemptId: a.id,
    createdAt: a.created_at,
    score: a.score,
    analysis: a.analysis as RecentAttemptContext['analysis'],
  }));
}

/**
 * 사용자의 성장 패턴 분석 (Short-term Memory 빌드용)
 */
export interface GrowthPattern {
  growthPatterns: string[];        // 개선된 영역
  persistentWeaknesses: string[];  // 지속적 약점
  recentFeedbackSummary: string;   // 최근 피드백 요약
  analyzedAttemptCount: number;    // 분석된 시도 수
}

export async function analyzeGrowthPatterns(
  userId: string,
  projectId?: string,
  limit: number = 5
): Promise<GrowthPattern> {
  const attempts = await getRecentAttemptsForContext(userId, projectId, limit);

  if (attempts.length === 0) {
    return {
      growthPatterns: [],
      persistentWeaknesses: [],
      recentFeedbackSummary: '',
      analyzedAttemptCount: 0,
    };
  }

  // 카테고리별 점수 추이 분석
  const categoryScores: Record<string, string[]> = {};
  const categorySuggestions: Record<string, number> = {};

  attempts.forEach(attempt => {
    if (attempt.analysis?.scores) {
      Object.entries(attempt.analysis.scores).forEach(([category, score]) => {
        if (!categoryScores[category]) {
          categoryScores[category] = [];
        }
        categoryScores[category].push(score);
      });
    }

    if (attempt.analysis?.suggestions) {
      attempt.analysis.suggestions.forEach(s => {
        categorySuggestions[s.category] = (categorySuggestions[s.category] || 0) + 1;
      });
    }
  });

  // 성장 패턴: 최근 점수가 이전보다 좋아진 영역
  const growthPatterns: string[] = [];
  const persistentWeaknesses: string[] = [];

  const gradeToNum = (grade: string): number => {
    const gradeMap: Record<string, number> = {
      'A': 95, 'A-': 90, 'B+': 87, 'B': 83, 'B-': 80,
      'C+': 77, 'C': 73, 'C-': 70, 'D+': 67, 'D': 63, 'D-': 60, 'F': 50,
    };
    return gradeMap[grade] || 70;
  };

  Object.entries(categoryScores).forEach(([category, scores]) => {
    if (scores.length >= 2) {
      const recent = gradeToNum(scores[0]);
      const older = gradeToNum(scores[scores.length - 1]);

      if (recent > older + 5) {
        growthPatterns.push(category);
      }
    }
  });

  // 지속적 약점: 여러 번 지적된 카테고리
  Object.entries(categorySuggestions).forEach(([category, count]) => {
    if (count >= 2) {
      persistentWeaknesses.push(category);
    }
  });

  // 최근 피드백 요약
  const recentSuggestions = attempts[0]?.analysis?.suggestions || [];
  const recentFeedbackSummary = recentSuggestions
    .slice(0, 2)
    .map(s => s.suggestion)
    .join('; ');

  return {
    growthPatterns,
    persistentWeaknesses,
    recentFeedbackSummary,
    analyzedAttemptCount: attempts.length,
  };
}
