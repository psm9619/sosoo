'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Header } from '@/components/layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth/hooks';

// 관리자 이메일 목록 (환경변수 또는 DB에서 관리할 수 있음)
const ADMIN_EMAILS = [
  process.env.NEXT_PUBLIC_ADMIN_EMAIL,
  'soominp17@gmail.com',
  'testvoiceup@gmail.com',
].filter(Boolean);

interface AdminMetrics {
  totalUsers: number;
  activeUsers: {
    daily: number;
    weekly: number;
    monthly: number;
  };
  totalProjects: number;
  totalAttempts: number;
  avgAttemptsPerUser: number;
  scoreDistribution: {
    range: string;
    count: number;
  }[];
  topQuestionCategories: {
    category: string;
    count: number;
  }[];
  recentActivity: {
    date: string;
    attempts: number;
    uniqueUsers: number;
  }[];
  coachingEffectiveness: {
    improvedAfter3Attempts: {
      total: number;
      improved: number;
      percentage: number;
    };
    northStar: {
      total: number;
      achieved: number;
      percentage: number;
    };
    avgScoreImprovement: number;
  };
  retention: {
    d1: number;
    d7: number;
    d30: number;
  };
}

export default function AdminDashboardPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isAdmin = user?.email && ADMIN_EMAILS.includes(user.email);

  // 관리자 권한 체크
  useEffect(() => {
    if (!authLoading && (!isAuthenticated || !isAdmin)) {
      router.push('/');
    }
  }, [authLoading, isAuthenticated, isAdmin, router]);

  // 메트릭 로드
  useEffect(() => {
    async function loadMetrics() {
      if (!isAdmin) return;

      try {
        const response = await fetch('/api/admin/metrics');
        if (!response.ok) {
          throw new Error('메트릭 로드 실패');
        }
        const data = await response.json();
        setMetrics(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : '메트릭 로드 중 오류');
      } finally {
        setIsLoading(false);
      }
    }

    if (isAdmin) {
      loadMetrics();
    }
  }, [isAdmin]);

  // 로딩 또는 권한 없음
  if (authLoading || !isAuthenticated || !isAdmin) {
    return (
      <div className="min-h-screen flex flex-col bg-cream">
        <Header />
        <main className="flex-1 pt-16 flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-coral-light/50 flex items-center justify-center animate-pulse">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-coral">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0110 0v4" />
              </svg>
            </div>
            <p className="text-gray-warm">권한 확인 중...</p>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col bg-cream">
        <Header />
        <main className="flex-1 pt-16 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-charcoal mb-4">오류 발생</h1>
            <p className="text-gray-warm mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>새로고침</Button>
          </div>
        </main>
      </div>
    );
  }

  const formatDate = (dateStr: string) => {
    return new Intl.DateTimeFormat('ko-KR', {
      month: 'short',
      day: 'numeric',
    }).format(new Date(dateStr));
  };

  return (
    <div className="min-h-screen flex flex-col bg-cream">
      <Header />
      <main className="flex-1 pt-16 px-6 py-12">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-charcoal mb-2">
                관리자 대시보드
              </h1>
              <p className="text-gray-warm">VoiceUp 서비스 현황</p>
            </div>
            <Link href="/admin/users">
              <Button variant="outline">사용자 관리</Button>
            </Link>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {[1, 2, 3, 4].map(i => (
                <Card key={i} className="p-6 bg-warm-white border-none animate-pulse">
                  <div className="h-8 bg-secondary rounded mb-2" />
                  <div className="h-4 bg-secondary rounded w-1/2" />
                </Card>
              ))}
            </div>
          ) : metrics && (
            <>
              {/* North Star Metric - 가장 중요한 지표 */}
              <Card className="p-6 bg-gradient-to-r from-teal to-teal-dark text-white mb-8">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm opacity-80 mb-1">North Star Metric</p>
                    <p className="text-lg font-medium">5회 연습 후 20%+ 점수 향상 비율</p>
                  </div>
                  <div className="text-right">
                    <p className="text-5xl font-bold">
                      {metrics.coachingEffectiveness?.northStar?.percentage || 0}%
                    </p>
                    <p className="text-sm opacity-80">
                      {metrics.coachingEffectiveness?.northStar?.achieved || 0} / {metrics.coachingEffectiveness?.northStar?.total || 0} 질문
                    </p>
                  </div>
                </div>
              </Card>

              {/* Key Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <Card className="p-6 bg-warm-white border-none">
                  <p className="text-3xl font-bold text-charcoal">{metrics.totalUsers}</p>
                  <p className="text-sm text-gray-warm">총 사용자</p>
                </Card>
                <Card className="p-6 bg-warm-white border-none">
                  <p className="text-3xl font-bold text-teal">{metrics.activeUsers.monthly}</p>
                  <p className="text-sm text-gray-warm">월간 활성 사용자</p>
                </Card>
                <Card className="p-6 bg-warm-white border-none">
                  <p className="text-3xl font-bold text-coral">{metrics.totalAttempts}</p>
                  <p className="text-sm text-gray-warm">총 연습 횟수</p>
                </Card>
                <Card className="p-6 bg-warm-white border-none">
                  <p className="text-3xl font-bold text-charcoal">
                    {metrics.avgAttemptsPerUser.toFixed(1)}
                  </p>
                  <p className="text-sm text-gray-warm">평균 연습/사용자</p>
                </Card>
              </div>

              {/* 코칭 효과 & 리텐션 */}
              <div className="grid md:grid-cols-2 gap-6 mb-8">
                {/* 코칭 효과 */}
                <Card className="p-6 bg-warm-white border-none">
                  <h3 className="font-semibold text-charcoal mb-4 flex items-center gap-2">
                    <span className="text-xl">📈</span>
                    코칭 효과
                  </h3>
                  <div className="space-y-4">
                    <div className="p-4 bg-teal-light/30 rounded-xl">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-charcoal font-medium">3회+ 연습 후 점수 개선</span>
                        <span className="text-2xl font-bold text-teal">
                          {metrics.coachingEffectiveness?.improvedAfter3Attempts?.percentage || 0}%
                        </span>
                      </div>
                      <p className="text-sm text-gray-warm">
                        {metrics.coachingEffectiveness?.improvedAfter3Attempts?.improved || 0}개 / {metrics.coachingEffectiveness?.improvedAfter3Attempts?.total || 0}개 질문
                      </p>
                      <div className="mt-2 h-2 bg-secondary rounded-full overflow-hidden">
                        <div
                          className="h-full bg-teal rounded-full transition-all"
                          style={{ width: `${metrics.coachingEffectiveness?.improvedAfter3Attempts?.percentage || 0}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-cream rounded-lg">
                      <span className="text-gray-warm">평균 점수 향상폭</span>
                      <span className={`font-bold ${(metrics.coachingEffectiveness?.avgScoreImprovement || 0) > 0 ? 'text-teal' : 'text-coral'}`}>
                        {(metrics.coachingEffectiveness?.avgScoreImprovement || 0) > 0 ? '+' : ''}
                        {metrics.coachingEffectiveness?.avgScoreImprovement || 0}점
                      </span>
                    </div>
                  </div>
                </Card>

                {/* 리텐션 */}
                <Card className="p-6 bg-warm-white border-none">
                  <h3 className="font-semibold text-charcoal mb-4 flex items-center gap-2">
                    <span className="text-xl">🔄</span>
                    리텐션
                  </h3>
                  <div className="space-y-4">
                    {[
                      { label: 'D1 (다음날 재방문)', value: metrics.retention?.d1 || 0, target: 50 },
                      { label: 'D7 (7일 후)', value: metrics.retention?.d7 || 0, target: 35 },
                      { label: 'D30 (30일 후)', value: metrics.retention?.d30 || 0, target: 15 },
                    ].map(({ label, value, target }) => (
                      <div key={label} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-warm text-sm">{label}</span>
                          <div className="flex items-center gap-2">
                            <span className={`font-bold ${value >= target ? 'text-teal' : 'text-charcoal'}`}>
                              {value}%
                            </span>
                            <span className="text-xs text-gray-soft">목표 {target}%</span>
                          </div>
                        </div>
                        <div className="h-2 bg-secondary rounded-full overflow-hidden relative">
                          {/* 목표선 */}
                          <div
                            className="absolute top-0 bottom-0 w-0.5 bg-gray-soft z-10"
                            style={{ left: `${target}%` }}
                          />
                          <div
                            className={`h-full rounded-full transition-all ${value >= target ? 'bg-teal' : 'bg-coral'}`}
                            style={{ width: `${Math.min(value, 100)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>

              {/* Active Users Card */}
              <div className="grid md:grid-cols-2 gap-6 mb-8">
                <Card className="p-6 bg-warm-white border-none">
                  <h3 className="font-semibold text-charcoal mb-4">활성 사용자</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-warm">일간 (DAU)</span>
                      <span className="font-bold text-charcoal">{metrics.activeUsers.daily}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-warm">주간 (WAU)</span>
                      <span className="font-bold text-charcoal">{metrics.activeUsers.weekly}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-warm">월간 (MAU)</span>
                      <span className="font-bold text-charcoal">{metrics.activeUsers.monthly}</span>
                    </div>
                    <div className="pt-2 border-t border-border">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-warm">DAU/MAU 비율</span>
                        <span className="font-bold text-teal">
                          {metrics.activeUsers.monthly > 0
                            ? ((metrics.activeUsers.daily / metrics.activeUsers.monthly) * 100).toFixed(1)
                            : 0}%
                        </span>
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Score Distribution */}
                <Card className="p-6 bg-warm-white border-none">
                  <h3 className="font-semibold text-charcoal mb-4">점수 분포</h3>
                  <div className="space-y-3">
                    {metrics.scoreDistribution.map(({ range, count }) => {
                      const total = metrics.scoreDistribution.reduce((a, b) => a + b.count, 0);
                      const percentage = total > 0 ? (count / total) * 100 : 0;
                      return (
                        <div key={range} className="flex items-center gap-3">
                          <span className="text-sm text-gray-warm w-16">{range}</span>
                          <div className="flex-1 h-4 bg-secondary rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                range.startsWith('90') || range.startsWith('80')
                                  ? 'bg-teal'
                                  : range.startsWith('70')
                                  ? 'bg-coral'
                                  : 'bg-gray-soft'
                              }`}
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <span className="text-sm text-charcoal w-12 text-right">{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </Card>
              </div>

              {/* Recent Activity Chart */}
              <Card className="p-6 bg-warm-white border-none">
                <h3 className="font-semibold text-charcoal mb-4">최근 7일 활동</h3>
                <div className="flex items-end gap-4 h-48">
                  {metrics.recentActivity.map(({ date, attempts, uniqueUsers }) => {
                    const maxAttempts = Math.max(...metrics.recentActivity.map(d => d.attempts));
                    const height = maxAttempts > 0 ? (attempts / maxAttempts) * 100 : 0;
                    return (
                      <div key={date} className="flex-1 flex flex-col items-center">
                        <div className="w-full flex flex-col items-center" style={{ height: '160px' }}>
                          <div
                            className="w-full max-w-12 bg-teal rounded-t transition-all"
                            style={{ height: `${height}%`, minHeight: attempts > 0 ? '4px' : '0' }}
                          />
                        </div>
                        <div className="mt-2 text-center">
                          <p className="text-xs text-gray-warm">{formatDate(date)}</p>
                          <p className="text-sm font-medium text-charcoal">{attempts}</p>
                          <p className="text-xs text-gray-soft">{uniqueUsers}명</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
