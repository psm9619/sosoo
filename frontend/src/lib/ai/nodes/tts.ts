/**
 * TTS (Text-to-Speech) 노드
 * ElevenLabs API를 사용하여 텍스트를 음성으로 변환
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { SpeechCoachState, RefinementState } from '../state';

// ElevenLabs 기본 음성 ID
const DEFAULT_VOICES = {
  default_male: 'pNInz6obpgDQGcFmaJgB', // Adam
  default_female: '21m00Tcm4TlvDq8ikWAM', // Rachel
};

// Lazy-loaded Supabase 클라이언트 (서버 사이드)
let supabaseInstance: SupabaseClient | null = null;

function getSupabase(): SupabaseClient {
  if (!supabaseInstance) {
    supabaseInstance = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }
  return supabaseInstance;
}

/**
 * ElevenLabs TTS API 호출
 */
export async function textToSpeech(
  text: string,
  voiceType: SpeechCoachState['voiceType'],
  voiceCloneId?: string
): Promise<ArrayBuffer> {
  // 음성 ID 결정
  let voiceId: string;

  if (voiceType === 'cloned' && voiceCloneId) {
    voiceId = voiceCloneId;
  } else if (voiceType in DEFAULT_VOICES) {
    voiceId = DEFAULT_VOICES[voiceType as keyof typeof DEFAULT_VOICES];
  } else {
    voiceId = DEFAULT_VOICES.default_male;
  }

  // ElevenLabs API 호출
  const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
    method: 'POST',
    headers: {
      'xi-api-key': process.env.ELEVENLABS_API_KEY!,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text,
      model_id: 'eleven_multilingual_v2', // 한국어 지원
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.75,
        use_speaker_boost: true,
      },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`TTS_ERROR: ElevenLabs API 오류 - ${response.status}: ${error}`);
  }

  return response.arrayBuffer();
}

/**
 * Supabase Storage에 오디오 업로드
 */
export async function uploadAudioToStorage(
  audioData: ArrayBuffer,
  sessionId: string,
  suffix: string = 'improved'
): Promise<string> {
  const fileName = `${suffix}/${sessionId}_${suffix}.mp3`;

  const { error } = await getSupabase().storage
    .from('audio')
    .upload(fileName, audioData, {
      contentType: 'audio/mpeg',
      upsert: true,
    });

  if (error) {
    throw new Error(`STORAGE_ERROR: 오디오 업로드 실패 - ${error.message}`);
  }

  // Public URL 생성
  const { data } = getSupabase().storage.from('audio').getPublicUrl(fileName);

  return data.publicUrl;
}

/**
 * TTS 노드 - 상태를 업데이트
 */
export async function ttsNode(state: SpeechCoachState): Promise<Partial<SpeechCoachState>> {
  const script = state.improvedScript || state.improvedScriptDraft;

  if (!script) {
    return {
      error: { code: 'TTS_ERROR', message: '개선된 스크립트가 없습니다.' },
    };
  }

  try {
    // 1. TTS 생성
    const audioData = await textToSpeech(script, state.voiceType, state.voiceCloneId);

    // 2. Supabase에 업로드
    const improvedAudioUrl = await uploadAudioToStorage(audioData, state.sessionId);

    return {
      improvedAudioUrl,
      messages: [
        ...state.messages,
        { step: 'tts', progress: 100, message: '음성이 생성되었습니다.' },
      ],
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'TTS 생성 중 오류가 발생했습니다.';
    const code = message.startsWith('TTS_') || message.startsWith('STORAGE_')
      ? message.split(':')[0]
      : 'TTS_ERROR';

    // 클론 음성 실패 시 기본 음성으로 재시도
    if (state.voiceType === 'cloned' && state.voiceCloneId) {
      try {
        const audioData = await textToSpeech(script, 'default_male');
        const improvedAudioUrl = await uploadAudioToStorage(audioData, state.sessionId);

        return {
          improvedAudioUrl,
          messages: [
            ...state.messages,
            { step: 'tts', progress: 100, message: '기본 음성으로 생성되었습니다. (클론 음성 오류)' },
          ],
        };
      } catch {
        // 재시도도 실패
      }
    }

    return {
      error: { code, message },
      messages: [
        ...state.messages,
        { step: 'tts', progress: 0, message },
      ],
    };
  }
}

/**
 * Refinement TTS 노드 (재요청 2단계용)
 */
export async function refinementTtsNode(state: RefinementState): Promise<Partial<RefinementState>> {
  if (!state.refinedScript) {
    return {
      messages: [
        ...state.messages,
        { step: 'tts', progress: 0, message: '수정된 스크립트가 없습니다.' },
      ],
    };
  }

  try {
    const audioData = await textToSpeech(state.refinedScript, state.voiceType, state.voiceCloneId);
    const improvedAudioUrl = await uploadAudioToStorage(audioData, state.sessionId, 'refined');

    return {
      improvedAudioUrl,
      messages: [
        ...state.messages,
        { step: 'tts', progress: 100, message: '음성이 생성되었습니다.' },
      ],
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'TTS 생성 중 오류가 발생했습니다.';

    return {
      messages: [
        ...state.messages,
        { step: 'tts', progress: 0, message },
      ],
    };
  }
}
