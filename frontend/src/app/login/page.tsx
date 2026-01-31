'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Header } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/lib/auth';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signInWithOAuth, signInWithEmail, signUpWithEmail, isAuthenticated, isLoading: authLoading } = useAuth();

  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // URL에서 에러 메시지 가져오기
  useEffect(() => {
    const errorParam = searchParams.get('error');
    if (errorParam) {
      setError(decodeURIComponent(errorParam));
    }
  }, [searchParams]);

  // 이미 로그인된 경우 리다이렉트
  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      const next = searchParams.get('next') || '/studio';
      router.push(next);
    }
  }, [isAuthenticated, authLoading, router, searchParams]);

  const handleGoogleLogin = async () => {
    setError(null);
    setIsLoading(true);
    try {
      await signInWithOAuth('google');
    } catch (err) {
      setError('Google 로그인 중 오류가 발생했습니다.');
      setIsLoading(false);
    }
  };

  const handleKakaoLogin = async () => {
    setError(null);
    setIsLoading(true);
    try {
      await signInWithOAuth('kakao');
    } catch (err) {
      setError('카카오 로그인 중 오류가 발생했습니다.');
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setIsLoading(true);

    try {
      if (isLogin) {
        // 로그인
        const result = await signInWithEmail(email, password);
        if (result.error) {
          setError(getErrorMessage(result.error));
        } else {
          const next = searchParams.get('next') || '/studio';
          router.push(next);
        }
      } else {
        // 회원가입
        const result = await signUpWithEmail(email, password);
        if (result.error) {
          setError(getErrorMessage(result.error));
        } else if (result.needsVerification) {
          setSuccessMessage('인증 이메일을 발송했습니다. 이메일을 확인해주세요.');
          setEmail('');
          setPassword('');
        } else {
          const next = searchParams.get('next') || '/studio';
          router.push(next);
        }
      }
    } catch (err) {
      setError('오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  // 에러 메시지 한국어화
  function getErrorMessage(error: string): string {
    const errorMap: Record<string, string> = {
      'Invalid login credentials': '이메일 또는 비밀번호가 올바르지 않습니다.',
      'Email not confirmed': '이메일 인증이 필요합니다. 메일함을 확인해주세요.',
      'User already registered': '이미 가입된 이메일입니다.',
      'Password should be at least 6 characters': '비밀번호는 최소 6자 이상이어야 합니다.',
      'Unable to validate email address: invalid format': '올바른 이메일 형식이 아닙니다.',
    };
    return errorMap[error] || error;
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream">
        <div className="animate-pulse text-gray-warm">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-cream">
      <Header />
      <main className="flex-1 pt-16 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal to-teal-dark flex items-center justify-center">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className="text-white">
                  <path d="M12 2C10.9 2 10 2.9 10 4V12C10 13.1 10.9 14 12 14C13.1 14 14 13.1 14 12V4C14 2.9 13.1 2 12 2Z" fill="currentColor" />
                  <path d="M17 12C17 14.76 14.76 17 12 17C9.24 17 7 14.76 7 12H5C5 15.53 7.61 18.43 11 18.92V22H13V18.92C16.39 18.43 19 15.53 19 12H17Z" fill="currentColor" />
                </svg>
              </div>
              <span className="font-semibold text-2xl text-charcoal">
                Voice<span className="text-teal">Up</span>
              </span>
            </div>
            <h1 className="text-2xl font-bold text-charcoal mb-2">
              {isLogin ? '다시 만나서 반가워요!' : '함께 시작해요!'}
            </h1>
            <p className="text-gray-warm">
              {isLogin
                ? '로그인하고 발화 연습을 이어가세요.'
                : '회원가입하고 모든 기능을 이용하세요.'}
            </p>
          </div>

          <Card className="p-8 bg-warm-white border-none shadow-xl">
            {/* Error/Success Messages */}
            {error && (
              <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                {error}
              </div>
            )}
            {successMessage && (
              <div className="mb-4 p-3 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm">
                {successMessage}
              </div>
            )}

            {/* Social Login */}
            <div className="space-y-3 mb-6">
              <Button
                variant="outline"
                className="w-full py-6 justify-center gap-3 hover:bg-secondary"
                onClick={handleGoogleLogin}
                disabled={isLoading}
              >
                <svg width="20" height="20" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                {isLoading ? '로그인 중...' : 'Google로 계속하기'}
              </Button>

              <Button
                variant="outline"
                className="w-full py-6 justify-center gap-3 bg-[#FEE500] hover:bg-[#FEE500]/90 border-[#FEE500] text-charcoal"
                onClick={handleKakaoLogin}
                disabled={isLoading}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="#000000">
                  <path d="M12 3C6.48 3 2 6.48 2 10.8c0 2.76 1.8 5.2 4.52 6.6-.2.72-.72 2.6-.82 3-.12.48.18.48.38.36.16-.08 2.52-1.72 3.56-2.4.76.12 1.56.2 2.36.2 5.52 0 10-3.48 10-7.76S17.52 3 12 3z" />
                </svg>
                {isLoading ? '로그인 중...' : '카카오로 계속하기'}
              </Button>
            </div>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-warm-white text-gray-soft">또는</span>
              </div>
            </div>

            {/* Email Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-charcoal mb-2">
                  이메일
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="hello@example.com"
                  className="w-full px-4 py-3 rounded-xl border border-border bg-cream focus:outline-none focus:ring-2 focus:ring-teal focus:border-transparent transition-all"
                  required
                  disabled={isLoading}
                />
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-charcoal mb-2">
                  비밀번호
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 rounded-xl border border-border bg-cream focus:outline-none focus:ring-2 focus:ring-teal focus:border-transparent transition-all"
                  required
                  minLength={6}
                  disabled={isLoading}
                />
                {!isLogin && (
                  <p className="mt-1 text-xs text-gray-soft">최소 6자 이상</p>
                )}
              </div>

              {isLogin && (
                <div className="text-right">
                  <Link href="/forgot-password" className="text-sm text-teal hover:text-teal-dark">
                    비밀번호를 잊으셨나요?
                  </Link>
                </div>
              )}

              <Button
                type="submit"
                className="w-full py-6 bg-teal hover:bg-teal-dark text-white"
                disabled={isLoading}
              >
                {isLoading ? '처리 중...' : isLogin ? '로그인' : '회원가입'}
              </Button>
            </form>

            {/* Toggle */}
            <p className="mt-6 text-center text-sm text-gray-warm">
              {isLogin ? '아직 계정이 없으신가요?' : '이미 계정이 있으신가요?'}{' '}
              <button
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError(null);
                  setSuccessMessage(null);
                }}
                className="text-teal hover:text-teal-dark font-medium"
                disabled={isLoading}
              >
                {isLogin ? '회원가입' : '로그인'}
              </button>
            </p>
          </Card>

          {/* Guest option */}
          <p className="mt-6 text-center text-sm text-gray-soft">
            <Link href="/studio" className="hover:text-gray-warm">
              로그인 없이 체험하기 →
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}

function LoginLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-cream">
      <div className="animate-pulse text-gray-warm">로딩 중...</div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginLoading />}>
      <LoginContent />
    </Suspense>
  );
}
