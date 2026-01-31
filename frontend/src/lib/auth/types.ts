import type { User, Session } from '@supabase/supabase-js';

export type AuthProvider = 'google' | 'kakao';

export interface AuthState {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isGuest: boolean;
}

export interface AuthError {
  message: string;
  code?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignUpCredentials extends LoginCredentials {
  // 추가 필드가 필요하면 여기에
}
