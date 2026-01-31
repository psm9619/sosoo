import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  // 환경변수 체크 - 없으면 통과
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('[Middleware] Supabase env vars not available, skipping auth check');
    return NextResponse.next();
  }

  let supabaseResponse = NextResponse.next({
    request,
  });

  try {
    const supabase = createServerClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) =>
              request.cookies.set(name, value)
            );
            supabaseResponse = NextResponse.next({
              request,
            });
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options)
            );
          },
        },
      }
    );

    // 세션 갱신 (중요: 만료 방지)
    const {
      data: { session },
    } = await supabase.auth.getSession();

    const pathname = request.nextUrl.pathname;

    // 보호된 라우트 정의
    const protectedRoutes = ['/my'];
    const isProtectedRoute = protectedRoutes.some((route) =>
      pathname.startsWith(route)
    );

    // 인증이 필요한 라우트에 비로그인 접근 시
    if (isProtectedRoute && !session) {
      const redirectUrl = new URL('/login', request.url);
      redirectUrl.searchParams.set('next', pathname);
      return NextResponse.redirect(redirectUrl);
    }

    // 이미 로그인된 사용자가 로그인 페이지 접근 시
    if (pathname === '/login' && session) {
      return NextResponse.redirect(new URL('/studio', request.url));
    }

    return supabaseResponse;
  } catch (error) {
    console.error('[Middleware] Error:', error);
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    /*
     * 다음 경로 제외:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
