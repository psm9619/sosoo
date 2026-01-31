'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Header, Footer } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

// Mock data for projects
const mockProjects = [
  {
    id: '1',
    title: '스타트업 피칭 발표',
    createdAt: '2025-01-30T10:30:00',
    duration: 45,
    status: 'complete' as const,
    improvements: ['추임새 제거', '문장 구조화'],
  },
  {
    id: '2',
    title: '면접 자기소개',
    createdAt: '2025-01-29T14:20:00',
    duration: 32,
    status: 'complete' as const,
    improvements: ['어순 정리', '전문성 강조'],
  },
  {
    id: '3',
    title: '유튜브 인트로',
    createdAt: '2025-01-28T09:15:00',
    duration: 18,
    status: 'complete' as const,
    improvements: ['간결화', '시청자 기대감'],
  },
];

type TabType = 'projects' | 'settings';

export default function MyPage() {
  const [activeTab, setActiveTab] = useState<TabType>('projects');
  const [consentAI, setConsentAI] = useState(false);

  // Format date to Korean style
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  };

  // Format duration
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
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
                    총 {mockProjects.length}개의 프로젝트
                  </h2>
                  <Link href="/studio">
                    <Button className="bg-teal hover:bg-teal-dark">
                      새 프로젝트
                    </Button>
                  </Link>
                </div>

                {/* Projects List */}
                {mockProjects.length > 0 ? (
                  <div className="space-y-4">
                    {mockProjects.map((project) => (
                      <Card
                        key={project.id}
                        className="p-6 bg-warm-white border-none hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="font-semibold text-charcoal">
                                {project.title}
                              </h3>
                              <span className="px-2 py-0.5 bg-teal-light/50 text-teal-dark text-xs rounded-full">
                                완료
                              </span>
                            </div>
                            <p className="text-sm text-gray-warm mb-3">
                              {formatDate(project.createdAt)} · {formatDuration(project.duration)}
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {project.improvements.map((improvement, i) => (
                                <span
                                  key={i}
                                  className="px-2 py-1 bg-secondary text-gray-warm text-xs rounded"
                                >
                                  {improvement}
                                </span>
                              ))}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm">
                              보기
                            </Button>
                            <Button variant="ghost" size="sm" className="text-gray-soft hover:text-destructive">
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                              </svg>
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card className="p-12 bg-warm-white border-none text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-secondary flex items-center justify-center">
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" className="text-gray-soft">
                        <path d="M12 2C10.9 2 10 2.9 10 4V12C10 13.1 10.9 14 12 14C13.1 14 14 13.1 14 12V4C14 2.9 13.1 2 12 2Z" stroke="currentColor" strokeWidth="2" />
                        <path d="M17 12C17 14.76 14.76 17 12 17C9.24 17 7 14.76 7 12H5C5 15.53 7.61 18.43 11 18.92V22H13V18.92C16.39 18.43 19 15.53 19 12H17Z" stroke="currentColor" strokeWidth="2" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-charcoal mb-2">
                      아직 프로젝트가 없어요
                    </h3>
                    <p className="text-gray-warm mb-6">
                      첫 번째 발화 코칭을 시작해보세요!
                    </p>
                    <Link href="/studio">
                      <Button className="bg-coral hover:bg-coral/90">
                        시작하기
                      </Button>
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
                    <div className="flex items-start justify-between gap-4 p-4 bg-cream rounded-xl">
                      <div>
                        <p className="font-medium text-charcoal">AI 학습 동의</p>
                        <p className="text-sm text-gray-warm mt-1">
                          내 음성 데이터를 서비스 개선을 위한 AI 학습에 활용하는 것에 동의합니다.
                        </p>
                      </div>
                      <button
                        onClick={() => setConsentAI(!consentAI)}
                        className={`relative w-12 h-7 rounded-full transition-colors ${
                          consentAI ? 'bg-teal' : 'bg-gray-soft/30'
                        }`}
                      >
                        <span
                          className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                            consentAI ? 'left-6' : 'left-1'
                          }`}
                        />
                      </button>
                    </div>

                    <div className="p-4 bg-coral-light/30 rounded-xl">
                      <p className="font-medium text-charcoal mb-2">데이터 보관 정책</p>
                      <ul className="text-sm text-gray-warm space-y-1">
                        <li>• 프로젝트 데이터는 삭제 전까지 영구 보관됩니다.</li>
                        <li>• 언제든지 개별 프로젝트를 삭제할 수 있습니다.</li>
                        <li>• 계정 삭제 시 모든 데이터가 삭제됩니다.</li>
                      </ul>
                      <Link href="/data-policy" className="text-sm text-teal hover:text-teal-dark mt-2 inline-block">
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
                      <Button variant="outline" className="text-destructive border-destructive/30 hover:bg-destructive/10">
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
