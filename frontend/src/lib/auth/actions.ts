'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import type { AuthProvider, LoginCredentials, SignUpCredentials } from './types';

const OAUTH_PROVIDERS: Record<AuthProvider, { provider: 'google' } | { provider: string; options: { queryParams: Record<string, string> } }> = {
  google: { provider: 'google' },
  kakao: {
    provider: 'kakao',
    options: {
      queryParams: {
        // Kakao OIDC 설정 시 필요한 추가 파라미터
      },
    },
  },
};

/**
 * OAuth 로그인 URL 생성
 */
export async function getOAuthUrl(provider: AuthProvider, redirectTo?: string) {
  const supabase = await createClient();

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const callbackUrl = `${baseUrl}/auth/callback`;

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: provider as 'google', // Kakao는 OIDC로 설정 후 사용
    options: {
      redirectTo: callbackUrl + (redirectTo ? `?next=${encodeURIComponent(redirectTo)}` : ''),
    },
  });

  if (error) {
    console.error('OAuth error:', error);
    return { url: null, error: error.message };
  }

  return { url: data.url, error: null };
}

/**
 * 이메일/비밀번호 로그인
 */
export async function signInWithEmail(credentials: LoginCredentials) {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email: credentials.email,
    password: credentials.password,
  });

  if (error) {
    return { user: null, error: error.message };
  }

  return { user: data.user, error: null };
}

/**
 * 이메일/비밀번호 회원가입
 */
export async function signUpWithEmail(credentials: SignUpCredentials) {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signUp({
    email: credentials.email,
    password: credentials.password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback`,
    },
  });

  if (error) {
    return { user: null, error: error.message };
  }

  // 이메일 인증이 필요한 경우
  if (data.user && !data.session) {
    return {
      user: data.user,
      error: null,
      needsEmailVerification: true,
    };
  }

  return { user: data.user, error: null };
}

/**
 * 로그아웃
 */
export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/');
}

/**
 * 현재 세션 가져오기
 */
export async function getSession() {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

/**
 * 현재 사용자 가져오기
 */
export async function getUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

/**
 * 비밀번호 재설정 이메일 발송
 */
export async function resetPassword(email: string) {
  const supabase = await createClient();

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/reset-password`,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, error: null };
}

/**
 * 비밀번호 업데이트
 */
export async function updatePassword(newPassword: string) {
  const supabase = await createClient();

  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, error: null };
}
