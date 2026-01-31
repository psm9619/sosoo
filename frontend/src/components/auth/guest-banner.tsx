'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/auth';

interface GuestBannerProps {
  /** 게스트 남은 사용 횟수 (선택) */
  remainingUses?: number;
  /** 최대 사용 횟수 */
  maxUses?: number;
  /** 배너 스타일 */
  variant?: 'info' | 'warning';
}

/**
 * 게스트 사용자에게 로그인 유도 배너
 */
export function GuestBanner({
  remainingUses,
  maxUses = 3,
  variant = 'info',
}: GuestBannerProps) {
  const { isGuest, isLoading } = useAuth();

  // 로그인된 사용자에게는 표시 안함
  if (isLoading || !isGuest) {
    return null;
  }

  const isWarning = variant === 'warning' || (remainingUses !== undefined && remainingUses <= 1);

  return (
    <div
      className={`
        px-4 py-3 rounded-xl text-sm flex items-center justify-between gap-4
        ${isWarning
          ? 'bg-coral/10 border border-coral/30 text-coral'
          : 'bg-teal-light/50 border border-teal/30 text-teal-dark'
        }
      `}
    >
      <div className="flex items-center gap-2">
        {/* 아이콘 */}
        <svg
          className="w-5 h-5 flex-shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          {isWarning ? (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          ) : (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          )}
        </svg>

        {/* 메시지 */}
        <span>
          {remainingUses !== undefined ? (
            <>
              게스트 모드로 이용 중입니다.{' '}
              <strong>오늘 {remainingUses}/{maxUses}회</strong> 남았습니다.
            </>
          ) : (
            '게스트 모드로 이용 중입니다. 로그인하면 모든 기능을 사용할 수 있어요.'
          )}
        </span>
      </div>

      {/* 로그인 버튼 */}
      <Link
        href="/login"
        className={`
          px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors
          ${isWarning
            ? 'bg-coral text-white hover:bg-coral/90'
            : 'bg-teal text-white hover:bg-teal-dark'
          }
        `}
      >
        로그인
      </Link>
    </div>
  );
}

/**
 * 게스트 제한 도달 시 표시하는 모달/카드
 */
export function GuestLimitReached() {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-warm-white rounded-2xl p-8 max-w-md w-full text-center shadow-2xl">
        {/* 아이콘 */}
        <div className="w-16 h-16 rounded-full bg-coral/10 flex items-center justify-center mx-auto mb-4">
          <svg
            className="w-8 h-8 text-coral"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
        </div>

        {/* 제목 */}
        <h2 className="text-xl font-bold text-charcoal mb-2">
          오늘의 무료 체험을 모두 사용했어요
        </h2>

        {/* 설명 */}
        <p className="text-gray-warm mb-6">
          회원가입하면 더 많은 연습을 할 수 있고,
          <br />
          연습 기록도 저장됩니다.
        </p>

        {/* 버튼들 */}
        <div className="space-y-3">
          <Link
            href="/login"
            className="block w-full py-3 rounded-xl bg-teal text-white font-medium hover:bg-teal-dark transition-colors"
          >
            무료로 시작하기
          </Link>
          <Link
            href="/"
            className="block w-full py-3 rounded-xl border border-border text-gray-warm font-medium hover:bg-secondary transition-colors"
          >
            홈으로 돌아가기
          </Link>
        </div>
      </div>
    </div>
  );
}
