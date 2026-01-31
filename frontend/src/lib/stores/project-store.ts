import { create } from 'zustand';
import type { Project, Question, Attempt, ProjectType, InterviewCategory } from '@/types';

// Mock 질문 데이터 (실제로는 AI가 레주메 기반으로 생성)
const INTERVIEW_QUESTIONS: Record<InterviewCategory, string[]> = {
  basic: [
    '간단하게 자기소개 부탁드립니다.',
    '본인의 강점과 약점에 대해 말씀해주세요.',
  ],
  motivation: [
    '왜 저희 회사에 지원하셨나요?',
    '이 직무를 선택한 이유가 무엇인가요?',
    '우리 회사에서 이루고 싶은 목표가 있다면 무엇인가요?',
  ],
  competency: [
    '가장 성공적으로 완수한 프로젝트에 대해 말씀해주세요.',
    '팀에서 갈등이 있었던 경험과 어떻게 해결했는지 알려주세요.',
    '본인이 주도적으로 문제를 발견하고 해결한 경험이 있나요?',
    '협업 과정에서 의견 충돌이 있었을 때 어떻게 조율하셨나요?',
    '실패했던 경험과 그로부터 배운 점을 말씀해주세요.',
    '가장 도전적이었던 업무와 그 결과를 설명해주세요.',
  ],
  technical: [
    '최근에 학습한 기술이나 도구가 있다면 소개해주세요.',
    '기술적으로 가장 어려웠던 문제와 해결 방법을 설명해주세요.',
    '데이터 분석 시 주로 사용하는 도구와 방법론은 무엇인가요?',
    '복잡한 데이터를 비전문가에게 설명했던 경험을 말씀해주세요.',
    '업무 효율화를 위해 자동화하거나 개선한 프로세스가 있나요?',
    '의사결정에 데이터를 활용한 구체적인 사례를 들어주세요.',
  ],
  situation: [
    '급하게 마감해야 하는 상황에서 어떻게 대처하시나요?',
    '예상치 못한 문제가 발생했을 때 어떻게 처리하시나요?',
    '여러 업무가 동시에 주어졌을 때 우선순위를 어떻게 정하시나요?',
  ],
  culture_fit: [
    '어떤 업무 환경에서 가장 효율적으로 일하시나요?',
    '5년 후 본인의 모습을 어떻게 그리고 계신가요?',
  ],
};

// 카테고리별 생성할 질문 개수
const QUESTIONS_PER_CATEGORY: Record<InterviewCategory, number> = {
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

  // Actions
  setProjects: (projects: Project[]) => void;
  setCurrentProject: (project: Project | null) => void;
  addProject: (project: Project) => void;
  updateProject: (projectId: string, updates: Partial<Project>) => void;
  deleteProject: (projectId: string) => void;

  // Question actions
  addAttempt: (projectId: string, questionId: string, attempt: Attempt) => void;

  // Helper to generate questions
  generateInterviewQuestions: (projectId: string) => Question[];
}

// Mock 프로젝트 데이터
const mockProjects: Project[] = [
  {
    id: 'proj-1',
    userId: 'user-1',
    type: 'interview',
    title: '패스트캠퍼스 비즈니스 애널리스트 면접',
    company: '패스트캠퍼스',
    position: '비즈니스 애널리스트',
    questions: [
      {
        id: 'q-1',
        projectId: 'proj-1',
        category: 'basic',
        text: '간단하게 자기소개 부탁드립니다.',
        order: 1,
        createdAt: '2025-01-30T10:00:00Z',
        attempts: [
          {
            id: 'att-1',
            questionId: 'q-1',
            createdAt: '2025-01-30T10:30:00Z',
            duration: 45,
            originalText: '안녕하세요, 저는 그, 3년차 비즈니스 애널리스트이고요...',
            improvedText: '안녕하세요, 3년차 비즈니스 애널리스트입니다. 데이터 기반 의사결정 지원과 프로세스 개선에 집중해왔습니다...',
            improvements: ['추임새 제거', '문장 구조화'],
            score: 75,
          },
          {
            id: 'att-2',
            questionId: 'q-1',
            createdAt: '2025-01-30T14:00:00Z',
            duration: 38,
            originalText: '안녕하세요, 3년차 비즈니스 애널리스트입니다...',
            improvedText: '안녕하세요, 3년차 비즈니스 애널리스트입니다. 에듀테크 도메인에서 사용자 여정 분석과 전환율 최적화를 전문으로 합니다...',
            improvements: ['전문성 강조', '도메인 경험 부각'],
            score: 85,
          },
        ],
      },
      {
        id: 'q-2',
        projectId: 'proj-1',
        category: 'motivation',
        text: '왜 패스트캠퍼스에 지원하셨나요?',
        order: 2,
        createdAt: '2025-01-30T10:00:00Z',
        attempts: [],
      },
      {
        id: 'q-3',
        projectId: 'proj-1',
        category: 'technical',
        text: '비즈니스 분석 프로젝트에서 사용한 방법론과 도구를 설명해주세요.',
        order: 3,
        createdAt: '2025-01-30T10:00:00Z',
        attempts: [
          {
            id: 'att-3',
            questionId: 'q-3',
            createdAt: '2025-01-31T09:00:00Z',
            duration: 52,
            originalText: '최근에 그 SQL이랑 태블로를 많이 쓰고 있는데요...',
            improvedText: 'SQL과 Tableau를 주력으로 사용하며, 경영진 대시보드 구축과 KPI 분석 자동화 경험이 있습니다...',
            improvements: ['구체적 도구명 언급', '경험 깊이 표현'],
            score: 80,
          },
        ],
      },
    ],
    createdAt: '2025-01-30T09:00:00Z',
    updatedAt: '2025-01-31T09:00:00Z',
  },
  {
    id: 'proj-2',
    userId: 'user-1',
    type: 'presentation',
    title: '팀 회고 발표',
    context: '2024년 4분기 프로젝트 회고 발표, 성과와 개선점 공유',
    questions: [
      {
        id: 'q-4',
        projectId: 'proj-2',
        text: '이번 분기 가장 큰 성과는 무엇인가요?',
        order: 1,
        createdAt: '2025-01-28T10:00:00Z',
        attempts: [],
      },
      {
        id: 'q-5',
        projectId: 'proj-2',
        text: '겪었던 주요 장애물과 극복 방법을 설명해주세요.',
        order: 2,
        createdAt: '2025-01-28T10:00:00Z',
        attempts: [],
      },
    ],
    createdAt: '2025-01-28T09:00:00Z',
    updatedAt: '2025-01-28T09:00:00Z',
  },
];

export const useProjectStore = create<ProjectStore>((set, get) => ({
  projects: mockProjects,
  currentProject: null,

  setProjects: (projects) => set({ projects }),

  setCurrentProject: (project) => set({ currentProject: project }),

  addProject: (project) =>
    set((state) => ({ projects: [...state.projects, project] })),

  updateProject: (projectId, updates) =>
    set((state) => ({
      projects: state.projects.map((p) =>
        p.id === projectId ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p
      ),
    })),

  deleteProject: (projectId) =>
    set((state) => ({
      projects: state.projects.filter((p) => p.id !== projectId),
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

  generateInterviewQuestions: (projectId) => {
    const questions: Question[] = [];
    let order = 1;

    // 카테고리 순서 (면접 흐름에 맞게)
    const categories: InterviewCategory[] = ['basic', 'motivation', 'competency', 'technical', 'situation', 'culture_fit'];

    categories.forEach((category) => {
      const categoryQuestions = [...INTERVIEW_QUESTIONS[category]];
      const count = QUESTIONS_PER_CATEGORY[category];

      // 셔플 후 count개 선택
      const shuffled = categoryQuestions.sort(() => Math.random() - 0.5);
      const selected = shuffled.slice(0, Math.min(count, shuffled.length));

      selected.forEach((questionText) => {
        questions.push({
          id: `q-${Date.now()}-${order}`,
          projectId,
          category,
          text: questionText,
          order,
          attempts: [],
          createdAt: new Date().toISOString(),
        });
        order++;
      });
    });

    return questions;
  },
}));
