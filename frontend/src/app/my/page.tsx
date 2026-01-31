'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Header, Footer } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useProjectStore } from '@/lib/stores/project-store';

type TabType = 'projects' | 'settings';

export default function MyPage() {
  const [activeTab, setActiveTab] = useState<TabType>('projects');

  const { projects, deleteProject } = useProjectStore();

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
          <div className="max-w-4xl mx-auto flex items-center gap-6">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-teal to-teal-dark flex items-center justify-center text-white text-2xl font-bold">
              U
            </div>
            <div>
              <h1 className="text-2xl font-bold text-charcoal">사용자님</h1>
              <p className="text-gray-warm">user@example.com</p>
            </div>
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
                                onClick={() => {
                                  if (confirm('정말 삭제하시겠어요?')) {
                                    deleteProject(project.id);
                                  }
                                }}
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
                        defaultValue="사용자"
                        className="w-full max-w-sm px-4 py-3 rounded-xl border border-border bg-cream focus:outline-none focus:ring-2 focus:ring-teal"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-charcoal mb-2">
                        이메일
                      </label>
                      <input
                        type="email"
                        defaultValue="user@example.com"
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
    </div>
  );
}
