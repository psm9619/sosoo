'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Header, Footer } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useProjectStore } from '@/lib/stores/project-store';
import { INTERVIEW_CATEGORY_LABELS, type Question } from '@/types';

export default function ProjectHistoryPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;

  const { projects } = useProjectStore();
  const project = projects.find((p) => p.id === projectId);

  const [expandedQuestion, setExpandedQuestion] = useState<string | null>(null);

  // Format date/time
  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!project) {
    return (
      <div className="min-h-screen flex flex-col bg-cream">
        <Header />
        <main className="flex-1 pt-16 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-charcoal mb-4">프로젝트를 찾을 수 없어요</h1>
            <Button onClick={() => router.push('/my')}>마이페이지로 돌아가기</Button>
          </div>
        </main>
      </div>
    );
  }

  const isInterview = project.type === 'interview';
  const totalAttempts = project.questions.reduce((acc, q) => acc + q.attempts.length, 0);

  return (
    <div className="min-h-screen flex flex-col bg-cream">
      <Header />
      <main className="flex-1 pt-16 px-6 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Link
              href="/my"
              className="inline-flex items-center gap-1 text-sm text-gray-warm hover:text-charcoal mb-4"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M15 18l-6-6 6-6" />
              </svg>
              마이페이지
            </Link>

            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span
                    className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${
                      isInterview
                        ? 'bg-teal-light/50 text-teal-dark'
                        : project.type === 'presentation'
                        ? 'bg-coral-light/50 text-coral'
                        : 'bg-secondary text-gray-warm'
                    }`}
                  >
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
              <Link href={`/studio/${projectId}`}>
                <Button className="bg-teal hover:bg-teal-dark">연습하기</Button>
              </Link>
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
                {totalAttempts > 0
                  ? Math.round(
                      project.questions.reduce((acc, q) => {
                        const scores = q.attempts.map((a) => a.score || 0);
                        return acc + (scores.length > 0 ? Math.max(...scores) : 0);
                      }, 0) / project.questions.filter((q) => q.attempts.length > 0).length
                    ) || '-'
                  : '-'}
              </p>
              <p className="text-sm text-gray-warm">평균 최고점</p>
            </Card>
          </div>

          {/* Question History */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-charcoal">질문별 연습 기록</h2>

            {project.questions.map((question, qIndex) => {
              const isExpanded = expandedQuestion === question.id;
              const hasAttempts = question.attempts.length > 0;
              const bestScore = hasAttempts
                ? Math.max(...question.attempts.map((a) => a.score || 0))
                : null;

              return (
                <Card key={question.id} className="bg-warm-white border-none overflow-hidden">
                  {/* Question Header */}
                  <button
                    onClick={() => setExpandedQuestion(isExpanded ? null : question.id)}
                    className="w-full p-4 text-left flex items-start gap-4 hover:bg-secondary/30 transition-colors"
                  >
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        hasAttempts ? 'bg-teal text-white' : 'bg-secondary text-gray-warm'
                      }`}
                    >
                      {hasAttempts ? (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="20,6 9,17 4,12" />
                        </svg>
                      ) : (
                        <span className="font-medium">{qIndex + 1}</span>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      {question.category && (
                        <span className="inline-block px-2 py-0.5 bg-teal-light/50 text-teal-dark text-xs rounded-full mb-2">
                          {INTERVIEW_CATEGORY_LABELS[question.category]}
                        </span>
                      )}
                      <p className="text-charcoal font-medium">{question.text}</p>
                      <p className="text-sm text-gray-warm mt-1">
                        {hasAttempts ? (
                          <>
                            {question.attempts.length}회 연습 · 최고 점수 {bestScore}점
                          </>
                        ) : (
                          '아직 연습 기록이 없어요'
                        )}
                      </p>
                    </div>

                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className={`text-gray-soft transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                    >
                      <path d="M6 9l6 6 6-6" />
                    </svg>
                  </button>

                  {/* Attempts List */}
                  {isExpanded && (
                    <div className="border-t border-border">
                      {hasAttempts ? (
                        <div className="divide-y divide-border">
                          {question.attempts
                            .slice()
                            .reverse()
                            .map((attempt, aIndex) => (
                              <div key={attempt.id} className="p-4 bg-cream/50">
                                <div className="flex items-center justify-between mb-3">
                                  <div className="flex items-center gap-3">
                                    <span className="text-sm font-medium text-gray-warm">
                                      #{question.attempts.length - aIndex}
                                    </span>
                                    <span className="text-sm text-gray-soft">
                                      {formatDateTime(attempt.createdAt)}
                                    </span>
                                    <span className="text-sm text-gray-soft">
                                      {formatDuration(attempt.duration)}
                                    </span>
                                  </div>
                                  <span
                                    className={`px-3 py-1 rounded-full text-sm font-medium ${
                                      (attempt.score || 0) >= 80
                                        ? 'bg-teal-light/50 text-teal-dark'
                                        : (attempt.score || 0) >= 60
                                        ? 'bg-coral-light/50 text-coral'
                                        : 'bg-secondary text-gray-warm'
                                    }`}
                                  >
                                    {attempt.score}점
                                  </span>
                                </div>

                                <div className="grid md:grid-cols-2 gap-4">
                                  <div>
                                    <p className="text-xs text-gray-soft uppercase mb-1">원본</p>
                                    <p className="text-sm text-charcoal/70 line-clamp-3">
                                      {attempt.originalText}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-teal uppercase mb-1">개선</p>
                                    <p className="text-sm text-charcoal line-clamp-3">
                                      {attempt.improvedText}
                                    </p>
                                  </div>
                                </div>

                                <div className="flex flex-wrap gap-2 mt-3">
                                  {attempt.improvements.map((improvement) => (
                                    <span
                                      key={improvement}
                                      className="px-2 py-0.5 bg-secondary text-gray-warm text-xs rounded"
                                    >
                                      {improvement}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            ))}
                        </div>
                      ) : (
                        <div className="p-8 text-center">
                          <p className="text-gray-warm mb-4">이 질문은 아직 연습하지 않았어요.</p>
                          <Link href={`/studio/${projectId}/q/${question.id}`}>
                            <Button size="sm" className="bg-teal hover:bg-teal-dark">
                              연습 시작하기
                            </Button>
                          </Link>
                        </div>
                      )}
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
