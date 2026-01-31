'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Header } from '@/components/layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth/hooks';

// 관리자 이메일 목록
const ADMIN_EMAILS = [
  process.env.NEXT_PUBLIC_ADMIN_EMAIL,
  'soominp17@gmail.com',
  'testvoiceup@gmail.com',
].filter(Boolean);

interface UserSummary {
  id: string;
  email: string;
  displayName: string | null;
  createdAt: string;
  projectCount: number;
  attemptCount: number;
  avgScore: number | null;
  lastActivityAt: string | null;
}

export default function AdminUsersPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [users, setUsers] = useState<UserSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isAdmin = user?.email && ADMIN_EMAILS.includes(user.email);
  const limit = 20;

  // 관리자 권한 체크
  useEffect(() => {
    if (!authLoading && (!isAuthenticated || !isAdmin)) {
      router.push('/');
    }
  }, [authLoading, isAuthenticated, isAdmin, router]);

  // 사용자 목록 로드
  useEffect(() => {
    async function loadUsers() {
      if (!isAdmin) return;

      setIsLoading(true);
      try {
        const response = await fetch(`/api/admin/users?page=${page}&limit=${limit}`);
        if (!response.ok) {
          throw new Error('사용자 목록 로드 실패');
        }
        const data = await response.json();
        setUsers(data.users);
        setTotal(data.total);
      } catch (err) {
        setError(err instanceof Error ? err.message : '사용자 목록 로드 중 오류');
      } finally {
        setIsLoading(false);
      }
    }

    if (isAdmin) {
      loadUsers();
    }
  }, [isAdmin, page]);

  // 로딩 또는 권한 없음
  if (authLoading || !isAuthenticated || !isAdmin) {
    return (
      <div className="min-h-screen flex flex-col bg-cream">
        <Header />
        <main className="flex-1 pt-16 flex items-center justify-center">
          <p className="text-gray-warm">권한 확인 중...</p>
        </main>
      </div>
    );
  }

  const formatDate = (dateStr: string) => {
    return new Intl.DateTimeFormat('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(new Date(dateStr));
  };

  const formatRelativeTime = (dateStr: string | null) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return '오늘';
    if (diffDays === 1) return '어제';
    if (diffDays < 7) return `${diffDays}일 전`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}주 전`;
    return formatDate(dateStr);
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="min-h-screen flex flex-col bg-cream">
      <Header />
      <main className="flex-1 pt-16 px-6 py-12">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <Link
                href="/admin"
                className="inline-flex items-center gap-1 text-sm text-gray-warm hover:text-charcoal mb-2"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M15 18l-6-6 6-6" />
                </svg>
                대시보드
              </Link>
              <h1 className="text-2xl md:text-3xl font-bold text-charcoal">
                사용자 관리
              </h1>
              <p className="text-gray-warm">총 {total}명의 사용자</p>
            </div>
          </div>

          {error && (
            <Card className="p-4 mb-6 bg-coral-light/30 border border-coral/30">
              <p className="text-coral text-sm">{error}</p>
            </Card>
          )}

          {/* Users Table */}
          <Card className="bg-warm-white border-none overflow-hidden mb-6">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-secondary/50">
                  <tr>
                    <th className="text-left px-4 py-3 text-sm font-medium text-charcoal">사용자</th>
                    <th className="text-center px-4 py-3 text-sm font-medium text-charcoal">프로젝트</th>
                    <th className="text-center px-4 py-3 text-sm font-medium text-charcoal">연습 횟수</th>
                    <th className="text-center px-4 py-3 text-sm font-medium text-charcoal">평균 점수</th>
                    <th className="text-center px-4 py-3 text-sm font-medium text-charcoal">마지막 활동</th>
                    <th className="text-center px-4 py-3 text-sm font-medium text-charcoal">가입일</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {isLoading ? (
                    // 스켈레톤 로딩
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        <td className="px-4 py-4">
                          <div className="h-4 bg-secondary rounded w-32" />
                        </td>
                        <td className="px-4 py-4 text-center">
                          <div className="h-4 bg-secondary rounded w-8 mx-auto" />
                        </td>
                        <td className="px-4 py-4 text-center">
                          <div className="h-4 bg-secondary rounded w-8 mx-auto" />
                        </td>
                        <td className="px-4 py-4 text-center">
                          <div className="h-4 bg-secondary rounded w-8 mx-auto" />
                        </td>
                        <td className="px-4 py-4 text-center">
                          <div className="h-4 bg-secondary rounded w-16 mx-auto" />
                        </td>
                        <td className="px-4 py-4 text-center">
                          <div className="h-4 bg-secondary rounded w-20 mx-auto" />
                        </td>
                      </tr>
                    ))
                  ) : users.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-12 text-center text-gray-warm">
                        사용자가 없습니다.
                      </td>
                    </tr>
                  ) : (
                    users.map((u) => (
                      <tr key={u.id} className="hover:bg-cream/50">
                        <td className="px-4 py-4">
                          <div>
                            <p className="font-medium text-charcoal">
                              {u.displayName || '이름 없음'}
                            </p>
                            <p className="text-sm text-gray-soft">{u.email}</p>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <span className="text-charcoal">{u.projectCount}</span>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <span className="text-charcoal">{u.attemptCount}</span>
                        </td>
                        <td className="px-4 py-4 text-center">
                          {u.avgScore !== null ? (
                            <span
                              className={`px-2 py-0.5 rounded-full text-sm ${
                                u.avgScore >= 80
                                  ? 'bg-teal-light/50 text-teal-dark'
                                  : u.avgScore >= 60
                                  ? 'bg-coral-light/50 text-coral'
                                  : 'bg-secondary text-gray-warm'
                              }`}
                            >
                              {u.avgScore}점
                            </span>
                          ) : (
                            <span className="text-gray-soft">-</span>
                          )}
                        </td>
                        <td className="px-4 py-4 text-center">
                          <span className="text-gray-warm text-sm">
                            {formatRelativeTime(u.lastActivityAt)}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <span className="text-gray-warm text-sm">
                            {formatDate(u.createdAt)}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                이전
              </Button>
              <span className="text-sm text-gray-warm px-4">
                {page} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                다음
              </Button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
