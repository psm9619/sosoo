'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { User, Session } from '@supabase/supabase-js';
import type { AuthState, AuthProvider } from './types';

/**
 * 인증 상태 관리 훅
 */
export function useAuth(): AuthState & {
  signInWithOAuth: (provider: AuthProvider) => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<{ error: string | null }>;
  signUpWithEmail: (email: string, password: string) => Promise<{ error: string | null; needsVerification?: boolean }>;
  signOut: () => Promise<void>;
} {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    // 초기 세션 가져오기
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    // 인증 상태 변경 구독
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signInWithOAuth = useCallback(async (provider: AuthProvider) => {
    const supabase = createClient();

    const redirectTo = `${window.location.origin}/auth/callback`;

    await supabase.auth.signInWithOAuth({
      provider: provider as 'google', // kakao는 OIDC로 설정 후 사용
      options: {
        redirectTo,
      },
    });
  }, []);

  const signInWithEmail = useCallback(async (email: string, password: string) => {
    const supabase = createClient();

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    return { error: error?.message ?? null };
  }, []);

  const signUpWithEmail = useCallback(async (email: string, password: string): Promise<{ error: string | null; needsVerification?: boolean }> => {
    const supabase = createClient();

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      return { error: error.message };
    }

    // 이메일 인증 필요 여부 확인
    const needsVerification = !!(data.user && !data.session);

    return { error: null, needsVerification };
  }, []);

  const signOut = useCallback(async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
  }, []);

  return {
    user,
    session,
    isLoading,
    isAuthenticated: !!session,
    isGuest: !session,
    signInWithOAuth,
    signInWithEmail,
    signUpWithEmail,
    signOut,
  };
}

/**
 * 게스트/회원 구분 훅
 */
export function useUserStatus() {
  const { user, isLoading, isAuthenticated, isGuest } = useAuth();

  return {
    isLoading,
    isAuthenticated,
    isGuest,
    userId: user?.id ?? null,
    email: user?.email ?? null,
    // 게스트 사용 제한 (예: 일일 3회)
    canUseAsGuest: true, // TODO: 실제 제한 로직 구현
  };
}
