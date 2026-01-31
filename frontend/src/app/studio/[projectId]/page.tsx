'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Header } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useProjectStore } from '@/lib/stores/project-store';
import { useAuth } from '@/lib/auth/hooks';
import { getProjectById } from '@/lib/supabase/projects';
import { INTERVIEW_CATEGORY_LABELS } from '@/types';
import type { Project } from '@/types';
import { DDayBadge, PrepChecklist } from '@/components/project';

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;

  const { projects: localProjects, setCurrentProject, updateProject } = useProjectStore();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 무한 루프 방지를 위한 ref
  const loadedProjectIdRef = useRef<string | null>(null);

  // 프로젝트 로드
  useEffect(() => {
    async function loadProject() {
      // 이미 같은 프로젝트를 로드했으면 스킵
      if (loadedProjectIdRef.current === projectId && project) {
        return;
      }

      setIsLoading(true);
      setError(null);

      // UUID 형식인지 확인 (DB 프로젝트 vs 로컬 프로젝트)
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(projectId);

      if (isUUID && isAuthenticated) {
        // UUID 형식이고 로그인 상태: DB에서 조회
        try {
          const dbProject = await getProjectById(projectId);
          if (dbProject) {
            setProject(dbProject);
            setCurrentProject(dbProject);
            loadedProjectIdRef.current = projectId;
          } else {
            setError('프로젝트를 찾을 수 없어요');
          }
        } catch (err) {
          console.error('[loadProject] DB Error:', err);
          // DB 조회 실패 시 로컬 스토어에서 fallback
          const localProject = localProjects.find(p => p.id === projectId);
          if (localProject) {
            setProject(localProject);
            setCurrentProject(localProject);
            loadedProjectIdRef.current = projectId;
          } else {
            setError('프로젝트를 찾을 수 없어요');
          }
        }
      } else {
        // 로컬 ID (proj-xxx) 또는 비로그인: 로컬 스토어에서 조회
        const localProject = localProjects.find(p => p.id === projectId);
        if (localProject) {
          setProject(localProject);
          setCurrentProject(localProject);
          loadedProjectIdRef.current = projectId;
        } else if (isUUID && !authLoading && !isAuthenticated) {
          // UUID인데 비로그인 - 로그인 필요
          router.push(`/login?next=${encodeURIComponent(`/studio/${projectId}`)}`);
          return;
        } else {
          setError('프로젝트를 찾을 수 없어요');
        }
      }

      setIsLoading(false);
    }

    if (!authLoading) {
      loadProject();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, isAuthenticated, authLoading]);

  // 로딩 상태
  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-cream">
        <Header />
        <main className="flex-1 pt-16 px-6 py-12">
          <div className="max-w-4xl mx-auto">
            {/* 스켈레톤 로딩 */}
            <div className="animate-pulse">
              <div className="h-8 bg-secondary rounded w-1/4 mb-4" />
              <div className="h-12 bg-secondary rounded w-2/3 mb-8" />
              <div className="grid grid-cols-3 gap-4 mb-8">
                {[1, 2, 3].map(i => (
                  <Card key={i} className="p-4 bg-warm-white border-none">
                    <div className="h-8 bg-secondary rounded mb-2" />
                    <div className="h-4 bg-secondary rounded w-1/2" />
                  </Card>
                ))}
              </div>
              <div className="space-y-3">
                {[1, 2, 3, 4].map(i => (
                  <Card key={i} className="p-4 bg-warm-white border-none">
                    <div className="h-6 bg-secondary rounded mb-2" />
                    <div className="h-4 bg-secondary rounded w-1/3" />
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // 에러 상태
  if (error || !project) {
    return (
      <div className="min-h-screen flex flex-col bg-cream">
        <Header />
        <main className="flex-1 pt-16 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-charcoal mb-4">{error || '프로젝트를 찾을 수 없어요'}</h1>
            <Button onClick={() => router.push('/studio')}>스튜디오로 돌아가기</Button>
          </div>
        </main>
      </div>
    );
  }

  const isInterview = project.type === 'interview';
  const totalAttempts = project.questions.reduce((acc, q) => acc + q.attempts.length, 0);
  const questionsWithAttempts = project.questions.filter((q) => q.attempts.length > 0).length;

  return (
    <div className="min-h-screen flex flex-col bg-cream">
      <Header />
      <main className="flex-1 pt-16 px-6 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Project Header */}
          <div className="mb-8">
            <Link href="/studio" className="inline-flex items-center gap-1 text-sm text-gray-warm hover:text-charcoal mb-4">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M15 18l-6-6 6-6" />
              </svg>
              스튜디오
            </Link>

            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${
                    isInterview
                      ? 'bg-teal-light/50 text-teal-dark'
                      : project.type === 'presentation'
                      ? 'bg-coral-light/50 text-coral'
                      : 'bg-secondary text-gray-warm'
                  }`}>
                    {isInterview ? '💼 면접' : project.type === 'presentation' ? '🎤 발표' : '🎙️ 자유'}
                  </span>
                  {project.targetDate && (
                    <DDayBadge targetDate={project.targetDate} size="md" />
                  )}
                </div>
                <h1 className="text-2xl md:text-3xl font-bold text-charcoal mb-2">
                  {project.title}
                </h1>
                {project.company && (
                  <p className="text-gray-warm">
                    {project.company} · {project.position}
                  </p>
                )}
              </div>

              <div className="text-right">
                <p className="text-sm text-gray-warm">진행률</p>
                <p className="text-2xl font-bold text-teal">
                  {questionsWithAttempts}/{project.questions.length}
                </p>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <Card className="p-4 bg-warm-white border-none text-center">
              <p className="text-2xl font-bold text-charcoal">{project.questions.length}</p>
              <p className="text-sm text-gray-warm">총 질문</p>
            </Card>
            <Card className="p-4 bg-warm-white border-none text-center">
              <p className="text-2xl font-bold text-teal">{totalAttempts}</p>
              <p className="text-sm text-gray-warm">총 연습</p>
            </Card>
            <Card className="p-4 bg-warm-white border-none text-center">
              <p className="text-2xl font-bold text-coral">
                {questionsWithAttempts === 0
                  ? '-'
                  : Math.round(
                      project.questions
                        .filter((q) => q.attempts.length > 0)
                        .reduce((acc, q) => {
                          const lastAttempt = q.attempts[q.attempts.length - 1];
                          return acc + (lastAttempt.score || 0);
                        }, 0) / questionsWithAttempts
                    )}
              </p>
              <p className="text-sm text-gray-warm">평균 점수</p>
            </Card>
          </div>

          {/* Prep Checklist - shown 7 days before deadline */}
          <div className="mb-8">
            <PrepChecklist
              questions={project.questions}
              targetDate={project.targetDate}
              onQuestionClick={(questionId) => router.push(`/studio/${projectId}/q/${questionId}`)}
            />
          </div>

          {/* Questions List - Grouped by Category (Interview) or Simple List (Presentation) */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-charcoal mb-4">질문 목록</h2>

            {(() => {
              // 발표 프로젝트는 카테고리 없이 단순 리스트로 표시
              const isPresentation = project.type === 'presentation';

              if (isPresentation) {
                return (
                  <div className="space-y-2">
                    {project.questions.map((question, index) => {
                      const lastAttempt = question.attempts[question.attempts.length - 1];
                      const hasAttempts = question.attempts.length > 0;

                      return (
                        <Link key={question.id} href={`/studio/${projectId}/q/${question.id}`}>
                          <Card className="p-3 bg-warm-white border-none hover:shadow-md transition-shadow cursor-pointer">
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-sm ${
                                hasAttempts
                                  ? 'bg-coral text-white'
                                  : 'bg-secondary text-gray-warm'
                              }`}>
                                {hasAttempts ? (
                                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <polyline points="20,6 9,17 4,12" />
                                  </svg>
                                ) : (
                                  <span className="font-medium">{index + 1}</span>
                                )}
                              </div>

                              <div className="flex-1 min-w-0">
                                <p className="text-charcoal font-medium text-sm line-clamp-2">
                                  {question.text}
                                </p>
                                <p className="text-xs text-gray-soft mt-0.5">
                                  {hasAttempts
                                    ? `${question.attempts.length}회 연습 · 최근 점수 ${lastAttempt.score || '-'}점`
                                    : '아직 연습하지 않음'}
                                </p>
                              </div>

                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-soft flex-shrink-0">
                                <path d="M9 18l6-6-6-6" />
                              </svg>
                            </div>
                          </Card>
                        </Link>
                      );
                    })}
                  </div>
                );
              }

              // 면접 프로젝트는 카테고리별로 그룹화
              const questionsByCategory = project.questions.reduce((acc, question) => {
                const cat = question.category || 'other';
                if (!acc[cat]) acc[cat] = [];
                acc[cat].push(question);
                return acc;
              }, {} as Record<string, typeof project.questions>);

              // 카테고리 순서 정의
              const categoryOrder = ['basic', 'motivation', 'competency', 'technical', 'situation', 'culture_fit', 'other'];
              const sortedCategories = categoryOrder.filter(cat => questionsByCategory[cat]);

              let questionIndex = 0;

              return (
                <div className="space-y-6">
                  {sortedCategories.map((category) => {
                    const questions = questionsByCategory[category];
                    const categoryLabel = category === 'other'
                      ? '기타'
                      : INTERVIEW_CATEGORY_LABELS[category as keyof typeof INTERVIEW_CATEGORY_LABELS];

                    return (
                      <div key={category}>
                        {/* Category Header */}
                        <div className="flex items-center gap-3 mb-2">
                          <span className="px-3 py-1 rounded-full text-sm font-medium bg-teal-light/50 text-teal-dark">
                            {categoryLabel}
                          </span>
                          <span className="text-sm text-gray-soft">
                            {questions.length}개 질문
                          </span>
                          <div className="flex-1 h-px bg-border" />
                        </div>

                        {/* Questions in this category */}
                        <div className="space-y-2">
                          {questions.map((question) => {
                            questionIndex++;
                            const currentIndex = questionIndex;
                            const lastAttempt = question.attempts[question.attempts.length - 1];
                            const hasAttempts = question.attempts.length > 0;

                            return (
                              <Link key={question.id} href={`/studio/${projectId}/q/${question.id}`}>
                                <Card className="p-3 bg-warm-white border-none hover:shadow-md transition-shadow cursor-pointer">
                                  <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-sm ${
                                      hasAttempts
                                        ? 'bg-teal text-white'
                                        : 'bg-secondary text-gray-warm'
                                    }`}>
                                      {hasAttempts ? (
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                          <polyline points="20,6 9,17 4,12" />
                                        </svg>
                                      ) : (
                                        <span className="font-medium">{currentIndex}</span>
                                      )}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                      <p className="text-charcoal font-medium text-sm line-clamp-2">
                                        {question.text}
                                      </p>
                                      <p className="text-xs text-gray-soft mt-0.5">
                                        {hasAttempts
                                          ? `${question.attempts.length}회 연습 · 최근 점수 ${lastAttempt.score || '-'}점`
                                          : '아직 연습하지 않음'}
                                      </p>
                                    </div>

                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-soft flex-shrink-0">
                                      <path d="M9 18l6-6-6-6" />
                                    </svg>
                                  </div>
                                </Card>
                              </Link>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>

          {/* Actions */}
          <div className="flex gap-4">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => router.push('/my/projects/' + projectId)}
            >
              연습 기록 보기
            </Button>
            <Button
              className={`flex-1 ${
                isInterview
                  ? 'bg-teal hover:bg-teal-dark'
                  : 'bg-coral hover:bg-coral/90'
              }`}
              onClick={() => {
                // Find first question without attempts, or first question
                const nextQuestion = project.questions.find((q) => q.attempts.length === 0) || project.questions[0];
                router.push(`/studio/${projectId}/q/${nextQuestion.id}`);
              }}
            >
              연습 시작하기
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
