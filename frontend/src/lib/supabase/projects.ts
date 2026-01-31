/**
 * Supabase 프로젝트/질문 CRUD 함수
 */

import { createClient } from './client';
import type {
  DBProject,
  DBQuestion,
  CreateProjectInput,
  UpdateProjectInput,
  CreateQuestionInput,
  dbProjectToProject,
  dbQuestionToQuestion,
} from './types';
import type { Project, Question } from '@/types';

// ============================================
// 프로젝트 CRUD
// ============================================

/**
 * 프로젝트 생성
 */
export async function createProject(data: CreateProjectInput): Promise<Project> {
  const supabase = createClient();

  const { data: project, error } = await supabase
    .from('projects')
    .insert(data)
    .select()
    .single();

  if (error) {
    console.error('[createProject] Error:', error);
    throw new Error(`프로젝트 생성 실패: ${error.message}`);
  }

  // DB 타입을 프론트엔드 타입으로 변환
  const { dbProjectToProject } = await import('./types');
  return dbProjectToProject(project as DBProject);
}

/**
 * 사용자의 프로젝트 목록 조회
 */
export async function getProjects(userId: string): Promise<Project[]> {
  const supabase = createClient();

  console.log('[getProjects] Fetching projects for user:', userId);

  // 프로젝트 목록 조회
  const { data: projects, error: projectsError } = await supabase
    .from('projects')
    .select('*')
    .eq('user_id', userId)
    .eq('is_archived', false)
    .order('updated_at', { ascending: false });

  if (projectsError) {
    console.error('[getProjects] Error:', projectsError);
    throw new Error(`프로젝트 목록 조회 실패: ${projectsError.message}`);
  }

  if (!projects || projects.length === 0) {
    console.log('[getProjects] No projects found');
    return [];
  }

  console.log('[getProjects] Found', projects.length, 'projects');

  // 각 프로젝트의 질문과 시도 개수 조회
  const projectIds = projects.map(p => p.id);

  const { data: questions, error: questionsError } = await supabase
    .from('questions')
    .select('id, project_id')
    .in('project_id', projectIds);

  if (questionsError) {
    console.error('[getProjects] Questions error:', questionsError);
  }

  console.log('[getProjects] Found', questions?.length || 0, 'questions');

  // 질문 ID 목록
  const questionIds = questions?.map(q => q.id) || [];

  // 시도 개수 조회 (question_id별로)
  const { data: attempts, error: attemptsError } = await supabase
    .from('attempts')
    .select('id, question_id')
    .in('question_id', questionIds);

  if (attemptsError) {
    console.error('[getProjects] Attempts error:', attemptsError);
  }

  console.log('[getProjects] Found', attempts?.length || 0, 'attempts');

  // 질문별 시도 수 계산
  const attemptCountByQuestion: Record<string, number> = {};
  attempts?.forEach(a => {
    attemptCountByQuestion[a.question_id] = (attemptCountByQuestion[a.question_id] || 0) + 1;
  });

  // 프로젝트별 질문 그룹화
  const questionsByProject: Record<string, Array<{ id: string; project_id: string }>> = {};
  questions?.forEach(q => {
    if (!questionsByProject[q.project_id]) {
      questionsByProject[q.project_id] = [];
    }
    questionsByProject[q.project_id].push(q);
  });

  // 변환
  const { dbProjectToProject } = await import('./types');
  return projects.map(p => {
    const project = dbProjectToProject(p as DBProject);
    const projectQuestions = questionsByProject[p.id] || [];

    // 각 질문에 대해 실제 시도 수를 반영한 placeholder 생성
    project.questions = projectQuestions.map((q, i) => {
      const attemptCount = attemptCountByQuestion[q.id] || 0;
      return {
        id: q.id, // 실제 질문 ID 사용
        projectId: p.id,
        text: '',
        order: i + 1,
        // 시도 수만큼 placeholder 생성 (실제 데이터는 상세 조회에서)
        attempts: Array(attemptCount).fill(null).map((_, j) => ({
          id: `placeholder-${j}`,
          questionId: q.id,
          createdAt: '',
          duration: 0,
          originalText: '',
          improvedText: '',
          improvements: [],
        })),
        createdAt: '',
      };
    });

    const totalAttempts = project.questions.reduce((acc, q) => acc + q.attempts.length, 0);
    const questionsWithAttempts = project.questions.filter(q => q.attempts.length > 0).length;
    console.log('[getProjects] Project', p.title, ':', project.questions.length, 'questions,', totalAttempts, 'attempts,', questionsWithAttempts, 'with attempts');

    return project;
  });
}

/**
 * 프로젝트 상세 조회 (질문 + 시도 포함)
 */
export async function getProjectById(projectId: string): Promise<Project | null> {
  const supabase = createClient();

  console.log('[getProjectById] Fetching project:', projectId);

  // 프로젝트 조회
  const { data: project, error: projectError } = await supabase
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .single();

  if (projectError) {
    if (projectError.code === 'PGRST116') {
      console.log('[getProjectById] Project not found');
      return null; // Not found
    }
    console.error('[getProjectById] Error:', projectError);
    throw new Error(`프로젝트 조회 실패: ${projectError.message}`);
  }

  console.log('[getProjectById] Project found:', project.id, project.title);

  // 질문 조회
  const { data: questions, error: questionsError } = await supabase
    .from('questions')
    .select('*')
    .eq('project_id', projectId)
    .order('order', { ascending: true });

  if (questionsError) {
    console.error('[getProjectById] Questions error:', questionsError);
    throw new Error(`질문 조회 실패: ${questionsError.message}`);
  }

  console.log('[getProjectById] Questions found:', questions?.length || 0);

  // 시도 조회
  const questionIds = questions?.map(q => q.id) || [];
  let attempts: unknown[] = [];

  if (questionIds.length > 0) {
    console.log('[getProjectById] Fetching attempts for questions:', questionIds.length);
    const { data: attemptData, error: attemptsError } = await supabase
      .from('attempts')
      .select('*')
      .in('question_id', questionIds)
      .order('created_at', { ascending: true });

    if (attemptsError) {
      console.error('[getProjectById] Attempts error:', attemptsError);
    }
    attempts = attemptData || [];
    console.log('[getProjectById] Attempts found:', attempts.length);
  }

  // 변환
  const { dbProjectToProject, dbQuestionToQuestion, dbAttemptToAttempt } = await import('./types');

  // 질문별 시도 그룹화
  const attemptsByQuestion: Record<string, unknown[]> = {};
  attempts.forEach((a: unknown) => {
    const attempt = a as { question_id: string };
    if (!attemptsByQuestion[attempt.question_id]) {
      attemptsByQuestion[attempt.question_id] = [];
    }
    attemptsByQuestion[attempt.question_id].push(a);
  });

  // Question 변환
  const convertedQuestions: Question[] = (questions || []).map(q => {
    const questionAttempts = (attemptsByQuestion[q.id] || []).map(a => dbAttemptToAttempt(a as Parameters<typeof dbAttemptToAttempt>[0]));
    return dbQuestionToQuestion(q as DBQuestion, questionAttempts);
  });

  return dbProjectToProject(project as DBProject, convertedQuestions);
}

/**
 * 프로젝트 수정
 */
export async function updateProject(projectId: string, data: UpdateProjectInput): Promise<Project> {
  const supabase = createClient();

  const { data: project, error } = await supabase
    .from('projects')
    .update(data)
    .eq('id', projectId)
    .select()
    .single();

  if (error) {
    console.error('[updateProject] Error:', error);
    throw new Error(`프로젝트 수정 실패: ${error.message}`);
  }

  const { dbProjectToProject } = await import('./types');
  return dbProjectToProject(project as DBProject);
}

/**
 * 프로젝트 삭제 (soft delete - 아카이브)
 */
export async function deleteProject(projectId: string): Promise<void> {
  const supabase = createClient();

  const { error } = await supabase
    .from('projects')
    .update({ is_archived: true })
    .eq('id', projectId);

  if (error) {
    console.error('[deleteProject] Error:', error);
    throw new Error(`프로젝트 삭제 실패: ${error.message}`);
  }
}

/**
 * 프로젝트 영구 삭제
 */
export async function hardDeleteProject(projectId: string): Promise<void> {
  const supabase = createClient();

  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', projectId);

  if (error) {
    console.error('[hardDeleteProject] Error:', error);
    throw new Error(`프로젝트 영구 삭제 실패: ${error.message}`);
  }
}

// ============================================
// 질문 CRUD
// ============================================

/**
 * 질문 생성 (단일)
 */
export async function createQuestion(data: CreateQuestionInput): Promise<Question> {
  const supabase = createClient();

  const { data: question, error } = await supabase
    .from('questions')
    .insert(data)
    .select()
    .single();

  if (error) {
    console.error('[createQuestion] Error:', error);
    throw new Error(`질문 생성 실패: ${error.message}`);
  }

  const { dbQuestionToQuestion } = await import('./types');
  return dbQuestionToQuestion(question as DBQuestion);
}

/**
 * 질문 일괄 생성
 */
export async function createQuestions(projectId: string, questionsInput: Omit<CreateQuestionInput, 'project_id'>[]): Promise<Question[]> {
  const supabase = createClient();

  const data = questionsInput.map((q, index) => ({
    ...q,
    project_id: projectId,
    order: q.order ?? index + 1,
  }));

  const { data: questions, error } = await supabase
    .from('questions')
    .insert(data)
    .select();

  if (error) {
    console.error('[createQuestions] Error:', error);
    throw new Error(`질문 일괄 생성 실패: ${error.message}`);
  }

  const { dbQuestionToQuestion } = await import('./types');
  return (questions || []).map(q => dbQuestionToQuestion(q as DBQuestion));
}

/**
 * 프로젝트의 질문 목록 조회
 */
export async function getQuestionsByProject(projectId: string): Promise<Question[]> {
  const supabase = createClient();

  const { data: questions, error } = await supabase
    .from('questions')
    .select('*')
    .eq('project_id', projectId)
    .order('order', { ascending: true });

  if (error) {
    console.error('[getQuestionsByProject] Error:', error);
    throw new Error(`질문 목록 조회 실패: ${error.message}`);
  }

  const { dbQuestionToQuestion } = await import('./types');
  return (questions || []).map(q => dbQuestionToQuestion(q as DBQuestion));
}

/**
 * 질문 상세 조회 (시도 포함)
 */
export async function getQuestionById(questionId: string): Promise<Question | null> {
  const supabase = createClient();

  const { data: question, error: questionError } = await supabase
    .from('questions')
    .select('*')
    .eq('id', questionId)
    .single();

  if (questionError) {
    if (questionError.code === 'PGRST116') {
      return null;
    }
    console.error('[getQuestionById] Error:', questionError);
    throw new Error(`질문 조회 실패: ${questionError.message}`);
  }

  // 시도 조회
  const { data: attempts, error: attemptsError } = await supabase
    .from('attempts')
    .select('*')
    .eq('question_id', questionId)
    .order('created_at', { ascending: true });

  if (attemptsError) {
    console.error('[getQuestionById] Attempts error:', attemptsError);
  }

  const { dbQuestionToQuestion, dbAttemptToAttempt } = await import('./types');
  const convertedAttempts = (attempts || []).map(a => dbAttemptToAttempt(a as Parameters<typeof dbAttemptToAttempt>[0]));

  return dbQuestionToQuestion(question as DBQuestion, convertedAttempts);
}

/**
 * 질문 삭제
 */
export async function deleteQuestion(questionId: string): Promise<void> {
  const supabase = createClient();

  const { error } = await supabase
    .from('questions')
    .delete()
    .eq('id', questionId);

  if (error) {
    console.error('[deleteQuestion] Error:', error);
    throw new Error(`질문 삭제 실패: ${error.message}`);
  }
}
