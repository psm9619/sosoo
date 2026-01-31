'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth';

const navItems = [
  { href: '/', label: '홈' },
  { href: '/about', label: '서비스 소개' },
  { href: '/examples', label: '예시' },
  { href: '/studio', label: '스튜디오', highlight: true },
];

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, isLoading, signOut } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const handleSignOut = async () => {
    try {
      setShowDropdown(false);
      setShowMobileMenu(false);
      await signOut();
      // 약간의 딜레이 후 홈으로 이동 (상태 정리 시간 확보)
      setTimeout(() => {
        router.push('/');
        router.refresh();
      }, 100);
    } catch (error) {
      console.error('Sign out error:', error);
      // 에러가 나도 홈으로 이동
      router.push('/');
    }
  };

  const closeMobileMenu = () => {
    setShowMobileMenu(false);
  };

  // 사용자 이름 또는 이메일의 첫 글자
  const userInitial = user?.email?.charAt(0).toUpperCase() || 'U';
  const userDisplayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || '사용자';

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-cream/80 backdrop-blur-md border-b border-border/50">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal to-teal-dark flex items-center justify-center group-hover:scale-105 transition-transform">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              className="text-white"
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
          <span className="font-logo font-semibold text-lg text-charcoal">
            Voice<span className="text-teal">Up</span>
          </span>
        </Link>

        {/* Navigation */}
        <nav className="hidden md:flex items-center gap-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium transition-all',
                item.highlight
                  ? pathname === item.href || pathname?.startsWith('/studio')
                    ? 'bg-gradient-to-r from-teal to-teal-dark text-white shadow-sm'
                    : 'text-teal font-semibold hover:bg-teal-light/30 border border-teal/30'
                  : pathname === item.href
                    ? 'text-teal bg-teal-light/50'
                    : 'text-gray-warm hover:text-charcoal hover:bg-secondary'
              )}
            >
              {item.highlight && (
                <span className="inline-flex items-center gap-1.5">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="inline">
                    <path
                      d="M12 2C10.9 2 10 2.9 10 4V12C10 13.1 10.9 14 12 14C13.1 14 14 13.1 14 12V4C14 2.9 13.1 2 12 2Z"
                      fill="currentColor"
                    />
                    <path
                      d="M17 12C17 14.76 14.76 17 12 17C9.24 17 7 14.76 7 12H5C5 15.53 7.61 18.43 11 18.92V22H13V18.92C16.39 18.43 19 15.53 19 12H17Z"
                      fill="currentColor"
                    />
                  </svg>
                  {item.label}
                </span>
              )}
              {!item.highlight && item.label}
            </Link>
          ))}
        </nav>

        {/* Auth Area */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* 모바일 햄버거 메뉴 버튼 */}
          <button
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            className="md:hidden p-2 text-gray-warm hover:text-charcoal hover:bg-secondary rounded-lg transition-colors"
            aria-label="메뉴 열기"
          >
            {showMobileMenu ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 12h18M3 6h18M3 18h18" />
              </svg>
            )}
          </button>

          {isLoading ? (
            // 로딩 상태
            <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse" />
          ) : isAuthenticated ? (
            // 로그인된 상태
            <div className="relative">
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="flex items-center gap-2 hover:opacity-80 transition-opacity"
              >
                {/* 프로필 아바타 */}
                {user?.user_metadata?.avatar_url ? (
                  <img
                    src={user.user_metadata.avatar_url}
                    alt={userDisplayName}
                    className="w-8 h-8 rounded-full object-cover border-2 border-teal"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal to-teal-dark flex items-center justify-center text-white text-sm font-medium">
                    {userInitial}
                  </div>
                )}
                {/* 드롭다운 화살표 */}
                <svg
                  className={cn(
                    'w-4 h-4 text-gray-warm transition-transform',
                    showDropdown && 'rotate-180'
                  )}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* 드롭다운 메뉴 */}
              {showDropdown && (
                <>
                  {/* 배경 클릭 시 닫기 */}
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowDropdown(false)}
                  />
                  <div className="absolute right-0 mt-2 w-56 bg-warm-white rounded-xl shadow-lg border border-border/50 py-2 z-20">
                    {/* 사용자 정보 */}
                    <div className="px-4 py-3 border-b border-border/50">
                      <p className="text-sm font-medium text-charcoal truncate">
                        {userDisplayName}
                      </p>
                      <p className="text-xs text-gray-soft truncate">
                        {user?.email}
                      </p>
                    </div>

                    {/* 메뉴 항목 */}
                    <div className="py-1">
                      <Link
                        href="/my"
                        className="block px-4 py-2 text-sm text-charcoal hover:bg-secondary transition-colors"
                        onClick={() => setShowDropdown(false)}
                      >
                        마이페이지
                      </Link>
                      <Link
                        href="/studio"
                        className="flex items-center gap-2 px-4 py-2 text-sm text-teal font-medium hover:bg-teal-light/30 transition-colors"
                        onClick={() => setShowDropdown(false)}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                          <path
                            d="M12 2C10.9 2 10 2.9 10 4V12C10 13.1 10.9 14 12 14C13.1 14 14 13.1 14 12V4C14 2.9 13.1 2 12 2Z"
                            fill="currentColor"
                          />
                          <path
                            d="M17 12C17 14.76 14.76 17 12 17C9.24 17 7 14.76 7 12H5C5 15.53 7.61 18.43 11 18.92V22H13V18.92C16.39 18.43 19 15.53 19 12H17Z"
                            fill="currentColor"
                          />
                        </svg>
                        스튜디오
                      </Link>
                    </div>

                    {/* 로그아웃 */}
                    <div className="border-t border-border/50 pt-1">
                      <button
                        onClick={handleSignOut}
                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        로그아웃
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            // 비로그인 상태
            <Link href="/login">
              <Button size="sm" className="bg-teal hover:bg-teal-dark text-white">
                로그인
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* 모바일 메뉴 */}
      {showMobileMenu && (
        <>
          {/* 배경 오버레이 */}
          <div
            className="fixed inset-0 bg-black/20 z-40 md:hidden"
            onClick={closeMobileMenu}
          />
          {/* 메뉴 패널 */}
          <div className="fixed top-16 left-0 right-0 bg-warm-white border-b border-border shadow-lg z-50 md:hidden animate-in slide-in-from-top-2 duration-200">
            <nav className="max-w-6xl mx-auto px-4 py-4 space-y-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={closeMobileMenu}
                  className={cn(
                    'block px-4 py-3 rounded-lg text-sm font-medium transition-all',
                    item.highlight
                      ? pathname === item.href || pathname?.startsWith('/studio')
                        ? 'bg-gradient-to-r from-teal to-teal-dark text-white'
                        : 'text-teal font-semibold bg-teal-light/20'
                      : pathname === item.href
                        ? 'text-teal bg-teal-light/30'
                        : 'text-charcoal hover:bg-secondary'
                  )}
                >
                  {item.highlight ? (
                    <span className="inline-flex items-center gap-2">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path
                          d="M12 2C10.9 2 10 2.9 10 4V12C10 13.1 10.9 14 12 14C13.1 14 14 13.1 14 12V4C14 2.9 13.1 2 12 2Z"
                          fill="currentColor"
                        />
                        <path
                          d="M17 12C17 14.76 14.76 17 12 17C9.24 17 7 14.76 7 12H5C5 15.53 7.61 18.43 11 18.92V22H13V18.92C16.39 18.43 19 15.53 19 12H17Z"
                          fill="currentColor"
                        />
                      </svg>
                      {item.label}
                    </span>
                  ) : (
                    item.label
                  )}
                </Link>
              ))}

              {/* 로그인 상태에 따른 추가 메뉴 */}
              {isAuthenticated ? (
                <>
                  <div className="border-t border-border my-2 pt-2">
                    <Link
                      href="/my"
                      onClick={closeMobileMenu}
                      className="block px-4 py-3 rounded-lg text-sm font-medium text-charcoal hover:bg-secondary transition-colors"
                    >
                      마이페이지
                    </Link>
                    <button
                      onClick={handleSignOut}
                      className="w-full text-left px-4 py-3 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                    >
                      로그아웃
                    </button>
                  </div>
                </>
              ) : (
                <div className="border-t border-border my-2 pt-2">
                  <Link
                    href="/login"
                    onClick={closeMobileMenu}
                    className="block px-4 py-3 rounded-lg text-sm font-medium text-teal bg-teal-light/30 hover:bg-teal-light/50 transition-colors text-center"
                  >
                    로그인
                  </Link>
                </div>
              )}
            </nav>
          </div>
        </>
      )}
    </header>
  );
}
