/**
 * Voice Clone API Route
 * ElevenLabs 음성 클론 생성
 *
 * POST: 음성 샘플로 클론 생성
 * DELETE: 클론 삭제
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

// ElevenLabs API
const ELEVENLABS_API_URL = 'https://api.elevenlabs.io/v1';

interface ElevenLabsVoiceResponse {
  voice_id: string;
  name: string;
  description?: string;
}

/**
 * POST: 음성 클론 생성
 */
export async function POST(request: NextRequest) {
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

    // 2. FormData 파싱
    const formData = await request.formData();
    const audioFile = formData.get('audio') as File | null;
    const voiceName = formData.get('voiceName') as string || '내 목소리';
    const consentGiven = formData.get('consentGiven') === 'true';

    // 동의 기록 데이터 (법적 증거용)
    const consentVersion = formData.get('consentVersion') as string || 'v1.0';
    const consentText = formData.get('consentText') as string || '';
    const sampleDurationSeconds = parseFloat(formData.get('sampleDurationSeconds') as string || '0');

    // 클라이언트 정보 추출 (법적 증거용)
    const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
                     request.headers.get('x-real-ip') ||
                     null;
    const userAgent = request.headers.get('user-agent') || null;

    if (!audioFile) {
      return NextResponse.json(
        { error: { code: 'INVALID_REQUEST', message: '오디오 파일이 필요합니다.' } },
        { status: 400 }
      );
    }

    if (!consentGiven) {
      return NextResponse.json(
        { error: { code: 'CONSENT_REQUIRED', message: '음성 클론 정책에 동의가 필요합니다.' } },
        { status: 400 }
      );
    }

    // 3. 오디오 파일 검증 (30초-1분 권장, 최대 10MB)
    if (audioFile.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: { code: 'FILE_TOO_LARGE', message: '파일 크기는 10MB 이하여야 합니다.' } },
        { status: 400 }
      );
    }

    // 4. 기존 클론 확인 (한 사용자당 하나만 허용)
    const supabaseAdmin = getSupabaseAdmin();
    const { data: existingClone } = await supabaseAdmin
      .from('voice_clones')
      .select('id, elevenlabs_voice_id')
      .eq('user_id', user.id)
      .single();

    // 기존 클론이 있으면 ElevenLabs에서도 삭제
    if (existingClone?.elevenlabs_voice_id) {
      try {
        await fetch(`${ELEVENLABS_API_URL}/voices/${existingClone.elevenlabs_voice_id}`, {
          method: 'DELETE',
          headers: {
            'xi-api-key': process.env.ELEVENLABS_API_KEY!,
          },
        });
      } catch (e) {
        console.error('Failed to delete existing ElevenLabs voice:', e);
      }

      // DB에서도 삭제
      await supabaseAdmin
        .from('voice_clones')
        .delete()
        .eq('id', existingClone.id);
    }

    // 5. Supabase Storage에 샘플 업로드
    const audioBuffer = await audioFile.arrayBuffer();
    const fileName = `${user.id}/sample-${Date.now()}.webm`;

    // MIME 타입에서 코덱 정보 제거 (audio/webm;codecs=opus → audio/webm)
    const baseMimeType = (audioFile.type || 'audio/webm').split(';')[0];

    const { error: uploadError } = await supabaseAdmin.storage
      .from('voice-samples')
      .upload(fileName, audioBuffer, {
        contentType: baseMimeType,
        upsert: true,
      });

    if (uploadError) {
      console.error('Failed to upload audio sample:', uploadError);
      return NextResponse.json(
        { error: { code: 'UPLOAD_ERROR', message: '오디오 업로드에 실패했습니다.' } },
        { status: 500 }
      );
    }

    const { data: urlData } = supabaseAdmin.storage
      .from('voice-samples')
      .getPublicUrl(fileName);

    // 6. DB에 processing 상태로 레코드 생성
    const { data: voiceCloneRecord, error: insertError } = await supabaseAdmin
      .from('voice_clones')
      .insert({
        user_id: user.id,
        voice_name: voiceName,
        status: 'processing',
        sample_audio_url: urlData.publicUrl,
      })
      .select()
      .single();

    if (insertError || !voiceCloneRecord) {
      return NextResponse.json(
        { error: { code: 'DB_ERROR', message: '데이터베이스 오류가 발생했습니다.' } },
        { status: 500 }
      );
    }

    // 7. users 테이블에 동의 정보 업데이트
    await supabaseAdmin
      .from('users')
      .update({
        voice_clone_consent: true,
        voice_clone_consent_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    // 8. voice_clone_consents 테이블에 동의 기록 저장 (법적 증거용)
    if (consentText) {
      await supabaseAdmin
        .from('voice_clone_consents')
        .insert({
          user_id: user.id,
          consent_version: consentVersion,
          consent_text: consentText,
          consent_checkbox_text: '위 내용을 읽었으며, 제 음성이 오직 저의 발화 연습을 위해서만 사용됨에 동의합니다.',
          ip_address: clientIp,
          user_agent: userAgent,
          sample_duration_seconds: sampleDurationSeconds > 0 ? sampleDurationSeconds : null,
        });
    }

    // 9. ElevenLabs에 비동기로 클론 생성 요청
    // (실제로는 백그라운드 작업으로 처리하는 것이 좋지만, 여기서는 직접 호출)
    createVoiceCloneAsync(
      user.id,
      voiceCloneRecord.id,
      audioBuffer,
      voiceName,
      supabaseAdmin
    );

    // 10. 즉시 응답 (processing 상태)
    return NextResponse.json({
      voiceCloneId: voiceCloneRecord.id,
      voiceName: voiceName,
      status: 'processing',
      estimatedReadyTime: null, // ElevenLabs는 보통 1-2분 소요
    });
  } catch (error) {
    console.error('Voice clone creation error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: '서버 오류가 발생했습니다.' } },
      { status: 500 }
    );
  }
}

/**
 * DELETE: 음성 클론 삭제
 */
export async function DELETE(request: NextRequest) {
  try {
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

    // 사용자의 클론 찾기
    const { data: voiceClone } = await supabaseAdmin
      .from('voice_clones')
      .select('id, elevenlabs_voice_id, sample_audio_url')
      .eq('user_id', user.id)
      .eq(voiceCloneId ? 'id' : 'user_id', voiceCloneId || user.id)
      .single();

    if (!voiceClone) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: '음성 클론을 찾을 수 없습니다.' } },
        { status: 404 }
      );
    }

    // ElevenLabs에서 삭제
    if (voiceClone.elevenlabs_voice_id) {
      try {
        await fetch(`${ELEVENLABS_API_URL}/voices/${voiceClone.elevenlabs_voice_id}`, {
          method: 'DELETE',
          headers: {
            'xi-api-key': process.env.ELEVENLABS_API_KEY!,
          },
        });
      } catch (e) {
        console.error('Failed to delete ElevenLabs voice:', e);
      }
    }

    // Storage에서 샘플 삭제
    if (voiceClone.sample_audio_url) {
      const path = voiceClone.sample_audio_url.split('/voice-samples/')[1];
      if (path) {
        await supabaseAdmin.storage.from('voice-samples').remove([path]);
      }
    }

    // DB에서 삭제
    await supabaseAdmin.from('voice_clones').delete().eq('id', voiceClone.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Voice clone deletion error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: '서버 오류가 발생했습니다.' } },
      { status: 500 }
    );
  }
}

/**
 * 비동기 클론 생성 (백그라운드)
 */
async function createVoiceCloneAsync(
  userId: string,
  recordId: string,
  audioBuffer: ArrayBuffer,
  voiceName: string,
  supabaseAdmin: ReturnType<typeof getSupabaseAdmin>
) {
  try {
    // ElevenLabs IVC (Instant Voice Cloning) API 호출
    const formData = new FormData();
    formData.append('name', `voiceup_${userId.slice(0, 8)}_${voiceName}`);
    formData.append('description', `VoiceUp user voice clone`);
    formData.append('files', new Blob([audioBuffer], { type: 'audio/webm' }), 'sample.webm');

    const response = await fetch(`${ELEVENLABS_API_URL}/voices/add`, {
      method: 'POST',
      headers: {
        'xi-api-key': process.env.ELEVENLABS_API_KEY!,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('ElevenLabs API error:', errorText);
      throw new Error(`ElevenLabs API error: ${response.status}`);
    }

    const result: ElevenLabsVoiceResponse = await response.json();

    // 성공: DB 업데이트
    await supabaseAdmin
      .from('voice_clones')
      .update({
        elevenlabs_voice_id: result.voice_id,
        status: 'ready',
        updated_at: new Date().toISOString(),
      })
      .eq('id', recordId);

    console.log(`Voice clone created successfully: ${result.voice_id}`);
  } catch (error) {
    console.error('Voice clone creation failed:', error);

    // 실패: DB 업데이트
    await supabaseAdmin
      .from('voice_clones')
      .update({
        status: 'failed',
        error_message: error instanceof Error ? error.message : '클론 생성 실패',
        updated_at: new Date().toISOString(),
      })
      .eq('id', recordId);
  }
}
