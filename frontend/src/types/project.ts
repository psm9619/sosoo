// 프로젝트 타입
export type ProjectType = 'interview' | 'presentation' | 'free_speech';

// 면접 질문 카테고리
export type InterviewCategory =
  | 'basic' // 기본 (자기소개 등)
  | 'motivation' // 지원동기
  | 'competency' // 역량
  | 'technical' // 기술
  | 'situation' // 상황대처
  | 'culture_fit'; // 컬쳐핏

export const INTERVIEW_CATEGORY_LABELS: Record<InterviewCategory, string> = {
  basic: '기본',
  motivation: '지원동기',
  competency: '역량',
  technical: '기술',
  situation: '상황대처',
  culture_fit: '컬쳐핏',
};

// 답변 시도
export interface Attempt {
  id: string;
  questionId: string;
  createdAt: string; // ISO timestamp
  duration: number; // seconds
  originalText: string; // 원본 텍스트
  improvedText: string; // 개선된 텍스트
  originalAudioUrl?: string;
  improvedAudioUrl?: string;
  improvements: string[]; // 개선점 목록
  score?: number; // 0-100 점수 (optional)
}

// 질문
export interface Question {
  id: string;
  projectId: string;
  category?: InterviewCategory; // 면접일 경우만
  text: string; // 질문 내용
  order: number; // 순서
  attempts: Attempt[]; // 답변 시도들
  createdAt: string;
}

// 프로젝트
export interface Project {
  id: string;
  userId: string;
  type: ProjectType;
  title: string; // 프로젝트 제목 (예: "카카오 프론트엔드 면접")
  company?: string; // 회사명 (면접일 경우)
  position?: string; // 포지션 (면접일 경우)
  context?: string; // 추가 컨텍스트 (발표 자료 등)
  // AI 컨텍스트 분석 결과 (Long-term Memory)
  contextSummary?: string; // 문서 요약
  contextKeywords?: string[]; // 핵심 키워드
  contextExperiences?: {
    title: string;
    role: string;
    achievements: string[];
  }[];
  contextStrengths?: string[]; // 강점
  targetDate?: string; // 목표일 (면접/발표 예정일, YYYY-MM-DD)
  questions: Question[];
  createdAt: string;
  updatedAt: string;
}

// 프로젝트 생성 요청
export interface CreateProjectRequest {
  type: ProjectType;
  title: string;
  company?: string;
  position?: string;
  context?: string;
}

// 질문 생성 요청 (카테고리 딥다이브)
export interface GenerateQuestionsRequest {
  projectId: string;
  category?: InterviewCategory;
  count?: number; // 생성할 질문 수
}
