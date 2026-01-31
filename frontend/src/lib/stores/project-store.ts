import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Project, Question, Attempt, InterviewCategory } from '@/types';

// 카테고리별 생성할 질문 개수 (AI 질문 생성 시 참조)
export const QUESTIONS_PER_CATEGORY: Record<InterviewCategory, number> = {
  basic: 1,
  motivation: 2,
  competency: 4,
  technical: 4,
  situation: 2,
  culture_fit: 1,
};

interface ProjectStore {
  projects: Project[];
  currentProject: Project | null;
  isLoading: boolean;

  // Actions
  setProjects: (projects: Project[]) => void;
  setCurrentProject: (project: Project | null) => void;
  addProject: (project: Project) => void;
  updateProject: (projectId: string, updates: Partial<Project>) => void;
  deleteProject: (projectId: string) => void;
  setLoading: (loading: boolean) => void;

  // Question actions
  addQuestion: (projectId: string, question: Question) => void;
  addQuestions: (projectId: string, questions: Question[]) => void;
  addAttempt: (projectId: string, questionId: string, attempt: Attempt) => void;
  updateAttempt: (projectId: string, questionId: string, attemptId: string, updates: Partial<Attempt>) => void;

  // Getters
  getProjectById: (projectId: string) => Project | undefined;
  getQuestionById: (projectId: string, questionId: string) => Question | undefined;
}

export const useProjectStore = create<ProjectStore>()(
  persist(
    (set, get) => ({
      // 빈 배열로 시작 (목 데이터 제거)
      projects: [],
      currentProject: null,
      isLoading: false,

      setProjects: (projects) => set({ projects }),

      setCurrentProject: (project) => set({ currentProject: project }),

      setLoading: (isLoading) => set({ isLoading }),

      addProject: (project) =>
        set((state) => ({ projects: [...state.projects, project] })),

      updateProject: (projectId, updates) =>
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p
          ),
          currentProject:
            state.currentProject?.id === projectId
              ? { ...state.currentProject, ...updates, updatedAt: new Date().toISOString() }
              : state.currentProject,
        })),

      deleteProject: (projectId) =>
        set((state) => ({
          projects: state.projects.filter((p) => p.id !== projectId),
          currentProject: state.currentProject?.id === projectId ? null : state.currentProject,
        })),

      addQuestion: (projectId, question) =>
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId
              ? {
                  ...p,
                  questions: [...p.questions, question],
                  updatedAt: new Date().toISOString(),
                }
              : p
          ),
        })),

      addQuestions: (projectId, questions) =>
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId
              ? {
                  ...p,
                  questions: [...p.questions, ...questions],
                  updatedAt: new Date().toISOString(),
                }
              : p
          ),
        })),

      addAttempt: (projectId, questionId, attempt) =>
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId
              ? {
                  ...p,
                  questions: p.questions.map((q) =>
                    q.id === questionId
                      ? { ...q, attempts: [...q.attempts, attempt] }
                      : q
                  ),
                  updatedAt: new Date().toISOString(),
                }
              : p
          ),
        })),

      updateAttempt: (projectId, questionId, attemptId, updates) =>
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === projectId
              ? {
                  ...p,
                  questions: p.questions.map((q) =>
                    q.id === questionId
                      ? {
                          ...q,
                          attempts: q.attempts.map((a) =>
                            a.id === attemptId ? { ...a, ...updates } : a
                          ),
                        }
                      : q
                  ),
                  updatedAt: new Date().toISOString(),
                }
              : p
          ),
        })),

      getProjectById: (projectId) => get().projects.find((p) => p.id === projectId),

      getQuestionById: (projectId, questionId) => {
        const project = get().projects.find((p) => p.id === projectId);
        return project?.questions.find((q) => q.id === questionId);
      },
    }),
    {
      name: 'voiceup-projects',
      // localStorage에서 데이터 복원 시 현재 프로젝트는 제외
      partialize: (state) => ({ projects: state.projects }),
    }
  )
);
