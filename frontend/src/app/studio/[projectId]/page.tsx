'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Header } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useProjectStore } from '@/lib/stores/project-store';
import { INTERVIEW_CATEGORY_LABELS } from '@/types';

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;

  const { projects, setCurrentProject } = useProjectStore();
  const project = projects.find((p) => p.id === projectId);

  useEffect(() => {
    if (project) {
      setCurrentProject(project);
    }
  }, [project, setCurrentProject]);

  if (!project) {
    return (
      <div className="min-h-screen flex flex-col bg-cream">
        <Header />
        <main className="flex-1 pt-16 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-charcoal mb-4">프로젝트를 찾을 수 없어요</h1>
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

          {/* Questions List */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-charcoal mb-4">질문 목록</h2>
            <div className="space-y-3">
              {project.questions.map((question, index) => {
                const lastAttempt = question.attempts[question.attempts.length - 1];
                const hasAttempts = question.attempts.length > 0;

                return (
                  <Link key={question.id} href={`/studio/${projectId}/q/${question.id}`}>
                    <Card className="p-4 bg-warm-white border-none hover:shadow-md transition-shadow cursor-pointer">
                      <div className="flex items-start gap-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                          hasAttempts
                            ? 'bg-teal text-white'
                            : 'bg-secondary text-gray-warm'
                        }`}>
                          {hasAttempts ? (
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <polyline points="20,6 9,17 4,12" />
                            </svg>
                          ) : (
                            <span className="font-medium">{index + 1}</span>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            {question.category && (
                              <span className="px-2 py-0.5 bg-teal-light/50 text-teal-dark text-xs rounded-full">
                                {INTERVIEW_CATEGORY_LABELS[question.category]}
                              </span>
                            )}
                          </div>
                          <p className="text-charcoal font-medium mb-1 line-clamp-2">
                            {question.text}
                          </p>
                          <p className="text-sm text-gray-warm">
                            {hasAttempts
                              ? `${question.attempts.length}회 연습 · 최근 점수 ${lastAttempt.score || '-'}점`
                              : '아직 연습하지 않음'}
                          </p>
                        </div>

                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-soft flex-shrink-0">
                          <path d="M9 18l6-6-6-6" />
                        </svg>
                      </div>
                    </Card>
                  </Link>
                );
              })}
            </div>
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
              className="flex-1 bg-teal hover:bg-teal-dark"
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
