'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Header } from '@/components/layout';
import { Card } from '@/components/ui/card';
import { useProjectStore } from '@/lib/stores/project-store';
import { useAuth } from '@/lib/auth/hooks';
import { getProjects } from '@/lib/supabase/projects';
import type { Project } from '@/types';

export default function StudioPage() {
  const { projects: localProjects, setProjects } = useProjectStore();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [dbProjects, setDbProjects] = useState<Project[]>([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);

  // 로그인 사용자: DB에서 프로젝트 로드
  useEffect(() => {
    async function loadProjects() {
      if (isAuthenticated && user) {
        setIsLoadingProjects(true);
        try {
          const projects = await getProjects(user.id);
          setDbProjects(projects);
          // 로컬 스토어도 DB 데이터로 동기화 (캐시 역할)
          setProjects(projects);
        } catch (error) {
          console.error('[loadProjects] Error:', error);
          // DB 조회 실패 시 로컬 스토어 사용
          setDbProjects(localProjects.filter(p => p.userId === user.id));
        } finally {
          setIsLoadingProjects(false);
        }
      }
    }

    if (!authLoading) {
      loadProjects();
    }
  }, [isAuthenticated, user, authLoading, setProjects]);

  // 표시할 프로젝트 결정
  // - 로그인: DB 프로젝트 (면접/발표/자유스피치 모두)
  // - 비로그인: 로컬 프로젝트 중 자유스피치만
  const displayProjects = isAuthenticated
    ? dbProjects
    : localProjects.filter(p => p.type === 'free_speech');

  const recentProjects = displayProjects.slice(0, 3);
  const isLoading = authLoading || isLoadingProjects;

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

          {/* Login Banner for Guests */}
          {!authLoading && !isAuthenticated && (
            <Card className="p-4 mb-8 bg-teal-light/20 border border-teal/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-teal">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-teal-dark">면접/발표 연습을 저장하려면 로그인하세요</p>
                    <p className="text-xs text-gray-warm">성장 추적, 맞춤 피드백, 여러 기기에서 연습 가능</p>
                  </div>
                </div>
                <Link
                  href="/login"
                  className="px-4 py-2 bg-teal text-white text-sm font-medium rounded-lg hover:bg-teal-dark transition-colors"
                >
                  로그인
                </Link>
              </div>
            </Card>
          )}

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
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-charcoal">면접 프로젝트</h3>
                        {!isAuthenticated && (
                          <span className="text-xs px-2 py-0.5 bg-teal-light/50 text-teal-dark rounded-full">로그인 필요</span>
                        )}
                      </div>
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
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-charcoal">발표 프로젝트</h3>
                        {!isAuthenticated && (
                          <span className="text-xs px-2 py-0.5 bg-coral-light/50 text-coral rounded-full">로그인 필요</span>
                        )}
                      </div>
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
          {isLoading ? (
            <section>
              <h2 className="text-lg font-semibold text-charcoal mb-4">최근 프로젝트</h2>
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="p-4 bg-warm-white border-none animate-pulse">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-secondary" />
                      <div className="flex-1">
                        <div className="h-4 bg-secondary rounded w-1/3 mb-2" />
                        <div className="h-3 bg-secondary rounded w-1/2" />
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </section>
          ) : recentProjects.length > 0 ? (
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
          ) : !isAuthenticated ? (
            <section>
              <h2 className="text-lg font-semibold text-charcoal mb-4">최근 프로젝트</h2>
              <Card className="p-8 bg-warm-white border-none text-center">
                <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-secondary flex items-center justify-center">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-soft">
                    <path d="M12 2L2 7L12 12L22 7L12 2Z" />
                    <path d="M2 17L12 22L22 17" />
                    <path d="M2 12L12 17L22 12" />
                  </svg>
                </div>
                <p className="text-gray-warm mb-2">아직 프로젝트가 없어요</p>
                <p className="text-sm text-gray-soft">자유 스피치로 바로 연습하거나, 로그인 후 프로젝트를 만들어보세요</p>
              </Card>
            </section>
          ) : null}
        </div>
      </main>
    </div>
  );
}
