import { NextResponse } from 'next/server';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { getAdminMetrics } from '@/lib/supabase/admin';

// 관리자 이메일 목록
const ADMIN_EMAILS = [
  process.env.ADMIN_EMAIL,
  'soominp17@gmail.com',
  'testvoiceup@gmail.com',
].filter(Boolean);

export async function GET() {
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

    // 메트릭 조회
    const metrics = await getAdminMetrics();

    return NextResponse.json(metrics);
  } catch (error) {
    console.error('[Admin Metrics Error]', error);
    return NextResponse.json(
      { error: '메트릭 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
