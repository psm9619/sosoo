'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Header, Footer } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useProjectStore } from '@/lib/stores/project-store';
import { useUserStore } from '@/lib/stores/user-store';
import { useAuth } from '@/lib/auth';
import { getProjects, deleteProject as deleteProjectFromDB } from '@/lib/supabase/projects';
import { VoiceCloneOnboarding, VoiceCloneStatus, VoiceCloneRecorder } from '@/components/voice-clone';
import { getUserVoiceClone, deleteVoiceClone, createVoiceClone, pollVoiceCloneStatus } from '@/lib/api/voice-clone';
import type { Project } from '@/types';

type TabType = 'projects' | 'settings';

// 관리자 이메일 목록
const ADMIN_EMAILS = [
  process.env.NEXT_PUBLIC_ADMIN_EMAIL,
  'soominp17@gmail.com',
].filter(Boolean);

function MyPageContent() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab') as TabType | null;
  const [activeTab, setActiveTab] = useState<TabType>(tabParam === 'settings' ? 'settings' : 'projects');
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [voiceCloneError, setVoiceCloneError] = useState<string | null>(null);

  const { projects: localProjects, deleteProject } = useProjectStore();
  const { voiceClone, setVoiceCloneFromResponse, clearVoiceClone, setVoiceCloneStatus } = useUserStore();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  // 관리자 여부 확인
  const isAdmin = user?.email && ADMIN_EMAILS.includes(user.email);

  // 프로젝트 목록 (DB 또는 로컬)
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(true);

  // 프로젝트 목록 로드
  useEffect(() => {
    async function loadProjects() {
      setIsLoadingProjects(true);

      if (isAuthenticated && user) {
        try {
          console.log('[MyPage] Fetching projects from DB for user:', user.id);
          const dbProjects = await getProjects(user.id);
          console.log('[MyPage] DB projects loaded:', dbProjects.length, 'projects');

          // DB 프로젝트의 attempts 카운트 확인을 위해 상세 정보 필요
          // getProjects는 간단한 통계만 반환하므로, DB 프로젝트 사용
          if (dbProjects.length > 0) {
            setProjects(dbProjects);
            setIsLoadingProjects(false);
            return;
          }
        } catch (error) {
          console.error('[MyPage] Failed to load projects from DB:', error);
        }
      }

      // 비로그인 또는 DB 조회 실패: 로컬 스토어 사용
      console.log('[MyPage] Using local projects:', localProjects.length);
      setProjects(localProjects);
      setIsLoadingProjects(false);
    }

    if (!authLoading) {
      loadProjects();
    }
  }, [isAuthenticated, authLoading, user, localProjects]);

  // URL 파라미터로부터 탭 동기화
  useEffect(() => {
    if (tabParam === 'settings') {
      setActiveTab('settings');
    }
  }, [tabParam]);

  // 로그인한 사용자의 음성 클론 상태 조회
  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchVoiceClone = async () => {
      try {
        const data = await getUserVoiceClone();
        if (data) {
          setVoiceCloneFromResponse({
            voiceCloneId: data.voiceCloneId,
            voiceName: data.voiceName,
            status: data.status,
            sampleAudioUrl: data.sampleAudioUrl,
          });

          // 처리 중이면 폴링 시작
          if (data.status === 'processing') {
            pollVoiceCloneStatus(data.voiceCloneId, {
              onStatusChange: setVoiceCloneStatus,
              onReady: (response) => {
                setVoiceCloneFromResponse({
                  voiceCloneId: response.voiceCloneId,
                  voiceName: response.voiceName,
                  status: 'ready',
                  sampleAudioUrl: response.sampleAudioUrl,
                });
              },
              onError: (err) => {
                setVoiceCloneError(err.message);
              },
            });
          }
        }
      } catch (err) {
        // 404는 무시 (음성 클론 없음)
        console.error('Failed to fetch voice clone:', err);
      }
    };

    fetchVoiceClone();
  }, [isAuthenticated, setVoiceCloneFromResponse, setVoiceCloneStatus]);

  // 음성 클론 삭제
  const handleDeleteVoiceClone = useCallback(async () => {
    if (!voiceClone.voiceCloneId) return;
    if (!confirm('정말 음성 클론을 삭제하시겠어요?\n삭제 후 다시 녹음해야 합니다.')) return;

    setIsDeleting(true);
    try {
      await deleteVoiceClone(voiceClone.voiceCloneId);
      clearVoiceClone();
    } catch (err) {
      setVoiceCloneError(err instanceof Error ? err.message : '삭제에 실패했습니다.');
    } finally {
      setIsDeleting(false);
    }
  }, [voiceClone.voiceCloneId, clearVoiceClone]);

  // 새 녹음 제출
  const handleRecordingComplete = useCallback(async (audioBlob: Blob, durationSeconds: number) => {
    setIsUploading(true);
    setVoiceCloneError(null);

    try {
      const response = await createVoiceClone({
        audioBlob,
        voiceName: '내 목소리',
        consentGiven: true,
      });

      setVoiceCloneFromResponse({
        voiceCloneId: response.voiceCloneId,
        voiceName: response.voiceName,
        status: response.status,
      });

      setIsRecording(false);

      // 처리 중이면 폴링 시작
      if (response.status === 'processing') {
        pollVoiceCloneStatus(response.voiceCloneId, {
          onStatusChange: setVoiceCloneStatus,
          onReady: (data) => {
            setVoiceCloneFromResponse({
              voiceCloneId: data.voiceCloneId,
              voiceName: data.voiceName,
              status: 'ready',
              sampleAudioUrl: data.sampleAudioUrl,
            });
          },
          onError: (err) => {
            setVoiceCloneError(err.message);
          },
        });
      }
    } catch (err) {
      setVoiceCloneError(err instanceof Error ? err.message : '업로드에 실패했습니다.');
    } finally {
      setIsUploading(false);
    }
  }, [setVoiceCloneFromResponse, setVoiceCloneStatus]);

  // 프로젝트 삭제 핸들러
  const handleDeleteProject = useCallback(async (projectId: string) => {
    if (!confirm('정말 삭제하시겠어요?')) return;

    if (isAuthenticated && user) {
      // DB에서 삭제 (soft delete)
      try {
        await deleteProjectFromDB(projectId);
        // UI 상태 업데이트
        setProjects((prev) => prev.filter((p) => p.id !== projectId));
      } catch (error) {
        console.error('[MyPage] Failed to delete project:', error);
        alert('삭제에 실패했습니다. 다시 시도해주세요.');
      }
    } else {
      // 로컬 스토어에서 삭제
      deleteProject(projectId);
      setProjects((prev) => prev.filter((p) => p.id !== projectId));
    }
  }, [isAuthenticated, user, deleteProject]);

  // Format date to Korean style
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(date);
  };

  return (
    <div className="min-h-screen flex flex-col bg-cream">
      <Header />
      <main className="flex-1 pt-16">
        {/* Profile Header */}
        <section className="py-12 px-6 bg-warm-white border-b border-border">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-teal to-teal-dark flex items-center justify-center text-white text-2xl font-bold">
                {user?.email?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-charcoal">
                  {user?.user_metadata?.full_name || user?.email?.split('@')[0] || '사용자'}님
                </h1>
                <p className="text-gray-warm">{user?.email || 'user@example.com'}</p>
              </div>
            </div>
            {isAdmin && (
              <Link href="/admin">
                <Button variant="outline" className="gap-2">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 4.5v15m7.5-7.5h-15" />
                    <circle cx="12" cy="12" r="10" />
                  </svg>
                  관리자 대시보드
                </Button>
              </Link>
            )}
          </div>
        </section>

        {/* Tabs */}
        <section className="border-b border-border bg-warm-white">
          <div className="max-w-4xl mx-auto px-6">
            <div className="flex gap-8">
              <button
                onClick={() => setActiveTab('projects')}
                className={`py-4 border-b-2 font-medium transition-colors ${
                  activeTab === 'projects'
                    ? 'border-teal text-teal'
                    : 'border-transparent text-gray-warm hover:text-charcoal'
                }`}
              >
                내 프로젝트
              </button>
              <button
                onClick={() => setActiveTab('settings')}
                className={`py-4 border-b-2 font-medium transition-colors ${
                  activeTab === 'settings'
                    ? 'border-teal text-teal'
                    : 'border-transparent text-gray-warm hover:text-charcoal'
                }`}
              >
                설정
              </button>
            </div>
          </div>
        </section>

        {/* Content */}
        <section className="py-8 px-6">
          <div className="max-w-4xl mx-auto">
            {activeTab === 'projects' && (
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-charcoal">
                    총 {projects.length}개의 프로젝트
                  </h2>
                  <Link href="/studio/new?type=interview">
                    <Button className="bg-teal hover:bg-teal-dark">
                      새 프로젝트
                    </Button>
                  </Link>
                </div>

                {/* Projects List */}
                {projects.length > 0 ? (
                  <div className="space-y-4">
                    {projects.map((project) => {
                      const totalAttempts = project.questions.reduce(
                        (acc, q) => acc + q.attempts.length,
                        0
                      );
                      const questionsWithAttempts = project.questions.filter(
                        (q) => q.attempts.length > 0
                      ).length;
                      const isInterview = project.type === 'interview';

                      return (
                        <Card
                          key={project.id}
                          className="p-6 bg-warm-white border-none hover:shadow-md transition-shadow"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex items-start gap-4">
                              <div
                                className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                                  isInterview
                                    ? 'bg-teal-light/50'
                                    : project.type === 'presentation'
                                    ? 'bg-coral-light/50'
                                    : 'bg-secondary'
                                }`}
                              >
                                <span className="text-xl">
                                  {isInterview
                                    ? '💼'
                                    : project.type === 'presentation'
                                    ? '🎤'
                                    : '🎙️'}
                                </span>
                              </div>
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <h3 className="font-semibold text-charcoal">
                                    {project.title}
                                  </h3>
                                  <span
                                    className={`px-2 py-0.5 text-xs rounded-full ${
                                      isInterview
                                        ? 'bg-teal-light/50 text-teal-dark'
                                        : project.type === 'presentation'
                                        ? 'bg-coral-light/50 text-coral'
                                        : 'bg-secondary text-gray-warm'
                                    }`}
                                  >
                                    {isInterview
                                      ? '면접'
                                      : project.type === 'presentation'
                                      ? '발표'
                                      : '자유'}
                                  </span>
                                </div>
                                {project.company && (
                                  <p className="text-sm text-gray-warm mb-2">
                                    {project.company} · {project.position}
                                  </p>
                                )}
                                <div className="flex items-center gap-4 text-sm text-gray-warm">
                                  <span>질문 {project.questions.length}개</span>
                                  <span>·</span>
                                  <span>연습 {totalAttempts}회</span>
                                  <span>·</span>
                                  <span>
                                    진행률 {questionsWithAttempts}/{project.questions.length}
                                  </span>
                                </div>
                                <p className="text-xs text-gray-soft mt-2">
                                  {formatDate(project.updatedAt)} 업데이트
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Link href={`/my/projects/${project.id}`}>
                                <Button variant="outline" size="sm">
                                  기록 보기
                                </Button>
                              </Link>
                              <Link href={`/studio/${project.id}`}>
                                <Button
                                  size="sm"
                                  className="bg-teal hover:bg-teal-dark"
                                >
                                  연습하기
                                </Button>
                              </Link>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-gray-soft hover:text-destructive"
                                onClick={() => handleDeleteProject(project.id)}
                              >
                                <svg
                                  width="16"
                                  height="16"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                >
                                  <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                                </svg>
                              </Button>
                            </div>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                ) : (
                  <Card className="p-12 bg-warm-white border-none text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-secondary flex items-center justify-center">
                      <svg
                        width="32"
                        height="32"
                        viewBox="0 0 24 24"
                        fill="none"
                        className="text-gray-soft"
                      >
                        <path
                          d="M12 2C10.9 2 10 2.9 10 4V12C10 13.1 10.9 14 12 14C13.1 14 14 13.1 14 12V4C14 2.9 13.1 2 12 2Z"
                          stroke="currentColor"
                          strokeWidth="2"
                        />
                        <path
                          d="M17 12C17 14.76 14.76 17 12 17C9.24 17 7 14.76 7 12H5C5 15.53 7.61 18.43 11 18.92V22H13V18.92C16.39 18.43 19 15.53 19 12H17Z"
                          stroke="currentColor"
                          strokeWidth="2"
                        />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-charcoal mb-2">
                      아직 프로젝트가 없어요
                    </h3>
                    <p className="text-gray-warm mb-6">
                      첫 번째 발화 코칭을 시작해보세요!
                    </p>
                    <Link href="/studio">
                      <Button className="bg-coral hover:bg-coral/90">시작하기</Button>
                    </Link>
                  </Card>
                )}
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="space-y-6">
                {/* Voice Clone Settings */}
                <Card className="p-6 bg-warm-white border-none">
                  <h3 className="font-semibold text-charcoal mb-4">나의 목소리</h3>

                  {/* 에러 메시지 */}
                  {voiceCloneError && (
                    <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                      {voiceCloneError}
                    </div>
                  )}

                  {/* 녹음 UI */}
                  {isRecording ? (
                    <VoiceCloneRecorder
                      onRecordingComplete={handleRecordingComplete}
                      onCancel={() => setIsRecording(false)}
                      isUploading={isUploading}
                    />
                  ) : voiceClone.status ? (
                    // 상태 표시
                    <div className="space-y-4">
                      <VoiceCloneStatus
                        status={voiceClone.status}
                        voiceName={voiceClone.voiceName || '내 목소리'}
                        onRetry={() => setIsRecording(true)}
                        onDelete={handleDeleteVoiceClone}
                        isDeleting={isDeleting}
                      />
                      {voiceClone.status === 'ready' && (
                        <Button
                          variant="outline"
                          onClick={() => setIsRecording(true)}
                          className="mt-2"
                        >
                          새로 녹음하기
                        </Button>
                      )}
                    </div>
                  ) : (
                    // 등록 안내
                    <div className="bg-cream rounded-xl p-6 text-center">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-teal/10 flex items-center justify-center">
                        <svg
                          width="32"
                          height="32"
                          viewBox="0 0 24 24"
                          fill="none"
                          className="text-teal"
                        >
                          <path
                            d="M12 2C10.9 2 10 2.9 10 4V12C10 13.1 10.9 14 12 14C13.1 14 14 13.1 14 12V4C14 2.9 13.1 2 12 2Z"
                            fill="currentColor"
                          />
                          <path
                            d="M17 12C17 14.76 14.76 17 12 17C9.24 17 7 14.76 7 12H5C5 15.53 7.61 18.43 11 18.92V22H13V18.92C16.39 18.43 19 15.53 19 12H17Z"
                            fill="currentColor"
                          />
                        </svg>
                      </div>
                      <h4 className="font-semibold text-charcoal mb-2">
                        나의 목소리로 듣기
                      </h4>
                      <p className="text-sm text-gray-warm mb-4">
                        AI가 개선한 스피치를 나의 목소리로 들을 수 있어요.
                        <br />
                        30초-1분 분량의 샘플만 녹음하면 됩니다.
                      </p>
                      <Button
                        onClick={() => setIsOnboardingOpen(true)}
                        className="bg-teal hover:bg-teal-dark"
                      >
                        음성 등록하기
                      </Button>
                    </div>
                  )}
                </Card>

                {/* Profile Settings */}
                <Card className="p-6 bg-warm-white border-none">
                  <h3 className="font-semibold text-charcoal mb-4">프로필</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-charcoal mb-2">
                        이름
                      </label>
                      <input
                        type="text"
                        defaultValue={user?.user_metadata?.full_name || user?.email?.split('@')[0] || '사용자'}
                        className="w-full max-w-sm px-4 py-3 rounded-xl border border-border bg-cream focus:outline-none focus:ring-2 focus:ring-teal"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-charcoal mb-2">
                        이메일
                      </label>
                      <input
                        type="email"
                        defaultValue={user?.email || 'user@example.com'}
                        disabled
                        className="w-full max-w-sm px-4 py-3 rounded-xl border border-border bg-secondary text-gray-warm"
                      />
                    </div>
                  </div>
                </Card>

                {/* Data Settings */}
                <Card className="p-6 bg-warm-white border-none">
                  <h3 className="font-semibold text-charcoal mb-4">데이터 설정</h3>
                  <div className="space-y-4">
                    <div className="p-4 bg-teal-light/30 rounded-xl border border-teal/20">
                      <div className="flex items-center gap-2 mb-2">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-teal">
                          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                        </svg>
                        <p className="font-medium text-charcoal">보이스 클로닝 보안</p>
                      </div>
                      <p className="text-sm text-gray-warm">
                        내 음성 데이터는 AI 학습에 사용되지 않으며, 암호화되어 안전하게 보관됩니다.
                      </p>
                    </div>

                    <div className="p-4 bg-cream rounded-xl">
                      <p className="font-medium text-charcoal mb-2">데이터 보관 정책</p>
                      <ul className="text-sm text-gray-warm space-y-1">
                        <li>• 프로젝트 데이터는 삭제 전까지 영구 보관됩니다.</li>
                        <li>• 언제든지 개별 프로젝트를 삭제할 수 있습니다.</li>
                        <li>• 계정 삭제 시 모든 데이터가 삭제됩니다.</li>
                      </ul>
                      <Link
                        href="/data-policy"
                        className="text-sm text-teal hover:text-teal-dark mt-2 inline-block"
                      >
                        자세한 정책 보기 →
                      </Link>
                    </div>
                  </div>
                </Card>

                {/* Danger Zone */}
                <Card className="p-6 bg-warm-white border-none">
                  <h3 className="font-semibold text-destructive mb-4">위험 구역</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-destructive/5 rounded-xl border border-destructive/20">
                      <div>
                        <p className="font-medium text-charcoal">계정 삭제</p>
                        <p className="text-sm text-gray-warm">
                          모든 데이터가 영구적으로 삭제됩니다.
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        className="text-destructive border-destructive/30 hover:bg-destructive/10"
                      >
                        삭제하기
                      </Button>
                    </div>
                  </div>
                </Card>
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />

      {/* Voice Clone Onboarding Modal */}
      <VoiceCloneOnboarding
        isOpen={isOnboardingOpen}
        onClose={() => setIsOnboardingOpen(false)}
        onComplete={() => {
          setIsOnboardingOpen(false);
        }}
      />
    </div>
  );
}

export default function MyPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex flex-col bg-cream">
        <Header />
        <main className="flex-1 pt-16 flex items-center justify-center">
          <div className="animate-pulse text-gray-warm">로딩 중...</div>
        </main>
      </div>
    }>
      <MyPageContent />
    </Suspense>
  );
}
