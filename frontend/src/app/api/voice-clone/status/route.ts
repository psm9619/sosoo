/**
 * Voice Clone Status API Route
 * 음성 클론 상태 조회
 *
 * GET: 사용자의 음성 클론 상태 조회
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/lib/supabase/server';

// Supabase Admin 클라이언트 (Service Role)
function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

/**
 * GET: 음성 클론 상태 조회
 *
 * Query params:
 * - id: 특정 클론 ID (optional)
 * - 없으면 사용자의 현재 클론 조회
 */
export async function GET(request: NextRequest) {
  try {
    // 1. 인증 확인
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: '로그인이 필요합니다.' } },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const voiceCloneId = searchParams.get('id');

    const supabaseAdmin = getSupabaseAdmin();

    // 2. 클론 조회
    let query = supabaseAdmin
      .from('voice_clones')
      .select('*')
      .eq('user_id', user.id);

    if (voiceCloneId) {
      query = query.eq('id', voiceCloneId);
    }

    const { data: voiceClone, error } = await query.maybeSingle();

    if (error) {
      console.error('Voice clone query error:', error);
      return NextResponse.json(
        { error: { code: 'DB_ERROR', message: '조회 중 오류가 발생했습니다.' } },
        { status: 500 }
      );
    }

    if (!voiceClone) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: '음성 클론이 없습니다.' } },
        { status: 404 }
      );
    }

    // 3. 응답
    return NextResponse.json({
      voiceCloneId: voiceClone.id,
      elevenlabsVoiceId: voiceClone.elevenlabs_voice_id,
      voiceName: voiceClone.voice_name,
      status: voiceClone.status,
      sampleAudioUrl: voiceClone.sample_audio_url,
      errorMessage: voiceClone.error_message,
      sampleDurationSeconds: voiceClone.sample_duration_seconds,
      createdAt: voiceClone.created_at,
      updatedAt: voiceClone.updated_at,
    });
  } catch (error) {
    console.error('Voice clone status error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: '서버 오류가 발생했습니다.' } },
      { status: 500 }
    );
  }
}
