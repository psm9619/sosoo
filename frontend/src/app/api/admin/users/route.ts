import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { getUsers } from '@/lib/supabase/admin';

// 관리자 이메일 목록
const ADMIN_EMAILS = [
  process.env.ADMIN_EMAIL,
  'soominp17@gmail.com',
].filter(Boolean);

export async function GET(request: NextRequest) {
  try {
    // 인증 확인
    const supabase = await createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: '인증되지 않은 요청입니다.' },
        { status: 401 }
      );
    }

    // 관리자 권한 확인
    if (!user.email || !ADMIN_EMAILS.includes(user.email)) {
      return NextResponse.json(
        { error: '관리자 권한이 필요합니다.' },
        { status: 403 }
      );
    }

    // 쿼리 파라미터 파싱
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    // 사용자 목록 조회
    const result = await getUsers({ page, limit });

    return NextResponse.json(result);
  } catch (error) {
    console.error('[Admin Users Error]', error);
    return NextResponse.json(
      { error: '사용자 목록 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
