'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState, type ReactNode } from 'react';

interface QueryProviderProps {
  children: ReactNode;
}

export function QueryProvider({ children }: QueryProviderProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // SSE 기반이라 stale time 길게 설정
            staleTime: 60 * 1000,
            // 네트워크 에러 시 재시도
            retry: (failureCount, error) => {
              // 인증 에러는 재시도하지 않음
              if (error instanceof Error && error.message.includes('401')) {
                return false;
              }
              return failureCount < 2;
            },
          },
          mutations: {
            // mutation 에러는 재시도하지 않음
            retry: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  );
}
