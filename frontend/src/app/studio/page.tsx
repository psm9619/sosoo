'use client';

import Link from 'next/link';
import { Header } from '@/components/layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useProjectStore } from '@/lib/stores/project-store';

export default function StudioPage() {
  const { projects } = useProjectStore();
  const recentProjects = projects.slice(0, 3);

  return (
    <div className="min-h-screen flex flex-col bg-cream">
      <Header />
      <main className="flex-1 pt-16 px-6 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-3xl md:text-4xl font-bold text-charcoal mb-4">
              발화 코칭 <span className="text-teal">스튜디오</span>
            </h1>
            <p className="text-gray-warm">
              면접, 발표, 자유 스피치 연습을 시작해보세요.
            </p>
          </div>

          {/* Quick Start Section */}
          <section className="mb-12">
            <h2 className="text-lg font-semibold text-charcoal mb-4">바로 시작하기</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {/* 면접 바로 시작 */}
              <Link href="/studio/quick?type=interview">
                <Card className="p-6 bg-warm-white border-none hover:shadow-lg transition-all hover:-translate-y-1 cursor-pointer group">
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-teal-light/50 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <span className="text-2xl">💼</span>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-charcoal mb-1">면접 연습</h3>
                      <p className="text-sm text-gray-warm">
                        기본 면접 질문으로 바로 연습을 시작해요.
                        별도 설정 없이 빠르게 시작할 수 있어요.
                      </p>
                    </div>
                  </div>
                </Card>
              </Link>

              {/* 자유 스피치 */}
              <Link href="/studio/quick?type=free_speech">
                <Card className="p-6 bg-warm-white border-none hover:shadow-lg transition-all hover:-translate-y-1 cursor-pointer group">
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-coral-light/50 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <span className="text-2xl">🎙️</span>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-charcoal mb-1">자유 스피치</h3>
                      <p className="text-sm text-gray-warm">
                        자유롭게 말하고 AI 피드백을 받아요.
                        주제 제한 없이 연습할 수 있어요.
                      </p>
                    </div>
                  </div>
                </Card>
              </Link>
            </div>
          </section>

          {/* New Project Section */}
          <section className="mb-12">
            <h2 className="text-lg font-semibold text-charcoal mb-4">새 프로젝트 만들기</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {/* 면접 프로젝트 */}
              <Link href="/studio/new?type=interview">
                <Card className="p-6 bg-gradient-to-br from-teal/5 to-teal/10 border border-teal/20 hover:shadow-lg transition-all hover:-translate-y-1 cursor-pointer">
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-teal text-white flex items-center justify-center">
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-charcoal mb-1">면접 프로젝트</h3>
                      <p className="text-sm text-gray-warm mb-3">
                        회사와 포지션을 입력하면 맞춤 질문을 생성해드려요.
                        카테고리별로 체계적인 준비가 가능해요.
                      </p>
                      <span className="inline-flex items-center gap-1 text-teal text-sm font-medium">
                        프로젝트 만들기
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M5 12h14M12 5l7 7-7 7" />
                        </svg>
                      </span>
                    </div>
                  </div>
                </Card>
              </Link>

              {/* 발표 프로젝트 */}
              <Link href="/studio/new?type=presentation">
                <Card className="p-6 bg-gradient-to-br from-coral/5 to-coral/10 border border-coral/20 hover:shadow-lg transition-all hover:-translate-y-1 cursor-pointer">
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-coral text-white flex items-center justify-center">
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="2" y="3" width="20" height="14" rx="2" />
                        <path d="M8 21h8M12 17v4" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-charcoal mb-1">발표 프로젝트</h3>
                      <p className="text-sm text-gray-warm mb-3">
                        발표 자료나 컨텍스트를 입력하면 예상 질문을 만들어드려요.
                        Q&A 대비에 효과적이에요.
                      </p>
                      <span className="inline-flex items-center gap-1 text-coral text-sm font-medium">
                        프로젝트 만들기
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M5 12h14M12 5l7 7-7 7" />
                        </svg>
                      </span>
                    </div>
                  </div>
                </Card>
              </Link>
            </div>
          </section>

          {/* Recent Projects */}
          {recentProjects.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-charcoal">최근 프로젝트</h2>
                <Link href="/my" className="text-sm text-teal hover:text-teal-dark">
                  전체 보기 →
                </Link>
              </div>
              <div className="space-y-3">
                {recentProjects.map((project) => (
                  <Link key={project.id} href={`/studio/${project.id}`}>
                    <Card className="p-4 bg-warm-white border-none hover:shadow-md transition-shadow cursor-pointer">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                            project.type === 'interview'
                              ? 'bg-teal-light/50'
                              : project.type === 'presentation'
                              ? 'bg-coral-light/50'
                              : 'bg-secondary'
                          }`}>
                            <span>
                              {project.type === 'interview' ? '💼' : project.type === 'presentation' ? '🎤' : '🎙️'}
                            </span>
                          </div>
                          <div>
                            <h3 className="font-medium text-charcoal">{project.title}</h3>
                            <p className="text-sm text-gray-warm">
                              질문 {project.questions.length}개 ·
                              {project.questions.reduce((acc, q) => acc + q.attempts.length, 0)}회 연습
                            </p>
                          </div>
                        </div>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-soft">
                          <path d="M9 18l6-6-6-6" />
                        </svg>
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      </main>
    </div>
  );
}
