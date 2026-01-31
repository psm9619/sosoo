'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Header, Footer } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useProjectStore } from '@/lib/stores/project-store';
import { useAuth } from '@/lib/auth/hooks';
import { getProjectById } from '@/lib/supabase/projects';
import { INTERVIEW_CATEGORY_LABELS, type Question, type Project } from '@/types';

export default function ProjectHistoryPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;

  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { projects: localProjects } = useProjectStore();

  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedQuestion, setExpandedQuestion] = useState<string | null>(null);

  // 오디오 재생 상태
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // 오디오 재생/정지 토글
  const toggleAudio = useCallback((audioUrl: string, audioId: string) => {
    // 같은 오디오를 다시 클릭하면 정지
    if (playingAudioId === audioId) {
      audioRef.current?.pause();
      audioRef.current = null;
      setPlayingAudioId(null);
      return;
    }

    // 다른 오디오가 재생 중이면 정지
    if (audioRef.current) {
      audioRef.current.pause();
    }

    // 새 오디오 재생
    const audio = new Audio(audioUrl);
    audioRef.current = audio;
    setPlayingAudioId(audioId);

    audio.play();
    audio.onended = () => {
      setPlayingAudioId(null);
      audioRef.current = null;
    };
  }, [playingAudioId]);

  // 컴포넌트 언마운트 시 오디오 정지
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // 프로젝트 데이터 로드
  useEffect(() => {
    async function loadProject() {
      setIsLoading(true);
      console.log('[ProjectHistory] Loading project:', projectId, 'isAuthenticated:', isAuthenticated);

      // 로그인 사용자: DB에서 불러오기
      if (isAuthenticated) {
        try {
          const dbProject = await getProjectById(projectId);
          console.log('[ProjectHistory] DB project loaded:', {
            found: !!dbProject,
            questionsCount: dbProject?.questions?.length || 0,
            totalAttempts: dbProject?.questions?.reduce((acc, q) => acc + (q.attempts?.length || 0), 0) || 0,
          });
          if (dbProject) {
            setProject(dbProject);
            setIsLoading(false);
            return;
          }
        } catch (error) {
          console.error('[ProjectHistory] Failed to load project from DB:', error);
        }
      }

      // 비로그인 또는 DB 조회 실패: 로컬 스토어에서 불러오기
      const localProject = localProjects.find((p) => p.id === projectId);
      console.log('[ProjectHistory] Using local project:', {
        found: !!localProject,
        questionsCount: localProject?.questions?.length || 0,
        totalAttempts: localProject?.questions?.reduce((acc, q) => acc + (q.attempts?.length || 0), 0) || 0,
      });
      setProject(localProject || null);
      setIsLoading(false);
    }

    if (!authLoading) {
      loadProject();
    }
  }, [projectId, isAuthenticated, authLoading, localProjects]);

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

  // 로딩 중
  if (isLoading || authLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-cream">
        <Header />
        <main className="flex-1 pt-16 flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-teal border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-warm">불러오는 중...</p>
          </div>
        </main>
      </div>
    );
  }

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
  const questionsWithAttempts = project.questions.filter((q) => q.attempts.length > 0).length;
  const avgScore = totalAttempts > 0
    ? Math.round(
        project.questions
          .flatMap((q) => q.attempts)
          .reduce((acc, a) => acc + (a.score || 0), 0) / totalAttempts
      )
    : 0;
  const maxScore = totalAttempts > 0
    ? Math.max(...project.questions.flatMap((q) => q.attempts).map((a) => a.score || 0))
    : 0;

  return (
    <div className="min-h-screen flex flex-col bg-cream">
      <Header />
      <main className="flex-1 pt-16 px-6 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header - Compact */}
          <div className="mb-4">
            <Link
              href="/my"
              className="inline-flex items-center gap-1 text-sm text-gray-warm hover:text-charcoal mb-2"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M15 18l-6-6 6-6" />
              </svg>
              마이페이지
            </Link>

            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                    isInterview
                      ? 'bg-teal-light/50 text-teal-dark'
                      : project.type === 'presentation'
                      ? 'bg-coral-light/50 text-coral'
                      : 'bg-secondary text-gray-warm'
                  }`}
                >
                  {isInterview ? '면접' : project.type === 'presentation' ? '발표' : '자유'}
                </span>
                <h1 className="text-xl font-bold text-charcoal">
                  {project.title}
                </h1>
                {project.company && (
                  <span className="text-sm text-gray-warm">
                    {project.company} · {project.position}
                  </span>
                )}
              </div>
              <Link href={`/studio/${projectId}`}>
                <Button size="sm" className="bg-teal hover:bg-teal-dark">연습하기</Button>
              </Link>
            </div>
          </div>

          {/* Compact Stats Bar */}
          <Card className="p-3 bg-warm-white border-none mb-4">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <span className="text-gray-warm">연습</span>
                  <span className="font-semibold text-charcoal">{totalAttempts}회</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-warm">진행률</span>
                  <span className="font-semibold text-teal">{questionsWithAttempts}/{project.questions.length}</span>
                </div>
                {totalAttempts > 0 && (
                  <>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-warm">평균</span>
                      <span className="font-semibold text-charcoal">{avgScore}점</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-warm">최고</span>
                      <span className="font-semibold text-coral">{maxScore}점</span>
                    </div>
                  </>
                )}
              </div>
              {/* 진행률 바 */}
              <div className="flex items-center gap-2">
                <div className="w-20 h-1.5 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-teal rounded-full"
                    style={{ width: `${(questionsWithAttempts / project.questions.length) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </Card>

          {/* Question History - Compact */}
          <div className="space-y-2">
            <h2 className="text-sm font-semibold text-charcoal mb-2">질문별 연습 기록</h2>

            {project.questions.map((question, qIndex) => {
              const isExpanded = expandedQuestion === question.id;
              const hasAttempts = question.attempts.length > 0;
              const bestScore = hasAttempts
                ? Math.max(...question.attempts.map((a) => a.score || 0))
                : null;

              return (
                <Card key={question.id} className="bg-warm-white border-none overflow-hidden">
                  {/* Question Header - Compact */}
                  <button
                    onClick={() => setExpandedQuestion(isExpanded ? null : question.id)}
                    className="w-full p-3 text-left flex items-center gap-3 hover:bg-secondary/30 transition-colors"
                  >
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-sm ${
                        hasAttempts ? 'bg-teal text-white' : 'bg-secondary text-gray-warm'
                      }`}
                    >
                      {hasAttempts ? (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="20,6 9,17 4,12" />
                        </svg>
                      ) : (
                        <span className="font-medium">{qIndex + 1}</span>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        {question.category && (
                          <span className="px-1.5 py-0.5 bg-teal-light/50 text-teal-dark text-xs rounded">
                            {INTERVIEW_CATEGORY_LABELS[question.category]}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-charcoal font-medium line-clamp-2">{question.text}</p>
                      <p className="text-xs text-gray-soft mt-0.5">
                        {hasAttempts ? (
                          <>
                            {question.attempts.length}회 연습 · 최고 {bestScore}점
                          </>
                        ) : (
                          '아직 연습 기록이 없어요'
                        )}
                      </p>
                    </div>

                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className={`text-gray-soft flex-shrink-0 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                    >
                      <path d="M6 9l6 6 6-6" />
                    </svg>
                  </button>

                  {/* Attempts List - Compact */}
                  {isExpanded && (
                    <div className="border-t border-border">
                      {hasAttempts ? (
                        <div className="divide-y divide-border">
                          {question.attempts
                            .slice()
                            .reverse()
                            .map((attempt, aIndex) => (
                              <div key={attempt.id} className="p-3 bg-cream/50">
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center gap-2 text-xs">
                                    <span className="font-medium text-gray-warm">
                                      #{question.attempts.length - aIndex}
                                    </span>
                                    <span className="text-gray-soft">
                                      {formatDateTime(attempt.createdAt)}
                                    </span>
                                    <span className="text-gray-soft">
                                      {formatDuration(attempt.duration)}
                                    </span>
                                  </div>
                                  <span
                                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${
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

                                <div className="grid md:grid-cols-2 gap-3">
                                  <div>
                                    <div className="flex items-center gap-1.5 mb-1">
                                      <p className="text-xs text-gray-soft">원본</p>
                                      {attempt.originalAudioUrl && (
                                        <button
                                          onClick={() => toggleAudio(attempt.originalAudioUrl!, `original-${attempt.id}`)}
                                          className={`p-1 rounded-full transition-colors ${
                                            playingAudioId === `original-${attempt.id}`
                                              ? 'bg-gray-warm text-white'
                                              : 'hover:bg-secondary text-gray-warm'
                                          }`}
                                          title={playingAudioId === `original-${attempt.id}` ? '정지' : '원본 듣기'}
                                        >
                                          {playingAudioId === `original-${attempt.id}` ? (
                                            <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                                              <rect x="6" y="5" width="4" height="14" rx="1" />
                                              <rect x="14" y="5" width="4" height="14" rx="1" />
                                            </svg>
                                          ) : (
                                            <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                                              <path d="M8 5v14l11-7z" />
                                            </svg>
                                          )}
                                        </button>
                                      )}
                                    </div>
                                    <p className="text-xs text-charcoal/70 line-clamp-2">
                                      {attempt.originalText}
                                    </p>
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-1.5 mb-1">
                                      <p className="text-xs text-teal">개선</p>
                                      {attempt.improvedAudioUrl && (
                                        <button
                                          onClick={() => toggleAudio(attempt.improvedAudioUrl!, `improved-${attempt.id}`)}
                                          className={`p-1.5 rounded-full transition-colors ${
                                            playingAudioId === `improved-${attempt.id}`
                                              ? 'bg-teal text-white'
                                              : 'hover:bg-teal-light/50 text-teal'
                                          }`}
                                          title={playingAudioId === `improved-${attempt.id}` ? '정지' : '개선 버전 듣기'}
                                        >
                                          {playingAudioId === `improved-${attempt.id}` ? (
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                                              <rect x="6" y="5" width="4" height="14" rx="1" />
                                              <rect x="14" y="5" width="4" height="14" rx="1" />
                                            </svg>
                                          ) : (
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                                              <path d="M8 5v14l11-7z" />
                                            </svg>
                                          )}
                                        </button>
                                      )}
                                    </div>
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
