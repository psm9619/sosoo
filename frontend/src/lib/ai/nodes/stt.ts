/**
 * STT (Speech-to-Text) 노드
 * OpenAI Whisper API를 사용하여 음성을 텍스트로 변환
 */

import OpenAI from 'openai';
import type { SpeechCoachState } from '../state';

// Lazy-loaded OpenAI client (avoid build-time instantiation)
let openaiInstance: OpenAI | null = null;

function getOpenAI(): OpenAI {
  if (!openaiInstance) {
    openaiInstance = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return openaiInstance;
}

// 지원 오디오 형식
const SUPPORTED_FORMATS = ['mp3', 'mp4', 'mpeg', 'mpga', 'm4a', 'wav', 'webm'];

// 최소/최대 길이 (초)
const MIN_DURATION = 5;
const MAX_DURATION = 300;

interface STTResult {
  transcript: string;
  audioDuration: number;
}

/**
 * 오디오 URL에서 파일을 가져와 Whisper로 전사
 */
export async function speechToText(audioUrl: string): Promise<STTResult> {
  // 1. 오디오 파일 다운로드
  const response = await fetch(audioUrl);
  if (!response.ok) {
    throw new Error(`AUDIO_DOWNLOAD_ERROR: Failed to download audio: ${response.status}`);
  }

  // 2. Content-Type으로 형식 추론
  const contentType = response.headers.get('content-type') || '';
  let format = 'webm'; // 기본값

  if (contentType.includes('mp3') || contentType.includes('mpeg')) {
    format = 'mp3';
  } else if (contentType.includes('wav')) {
    format = 'wav';
  } else if (contentType.includes('m4a') || contentType.includes('mp4')) {
    format = 'm4a';
  } else if (contentType.includes('webm')) {
    format = 'webm';
  }

  // URL에서 확장자 추출 시도
  const urlMatch = audioUrl.match(/\.(\w+)(?:\?|$)/);
  if (urlMatch && SUPPORTED_FORMATS.includes(urlMatch[1].toLowerCase())) {
    format = urlMatch[1].toLowerCase();
  }

  // 3. Blob → File 변환
  const blob = await response.blob();
  const file = new File([blob], `audio.${format}`, { type: blob.type || `audio/${format}` });

  // 4. Whisper API 호출
  const transcription = await getOpenAI().audio.transcriptions.create({
    file,
    model: 'whisper-1',
    language: 'ko', // 한국어
    response_format: 'verbose_json', // duration 포함
  });

  // 5. 결과 검증
  const duration = transcription.duration || 0;

  if (duration < MIN_DURATION) {
    throw new Error(`AUDIO_TOO_SHORT: 녹음이 너무 짧습니다 (${duration}초). 최소 ${MIN_DURATION}초 이상 녹음해주세요.`);
  }

  if (duration > MAX_DURATION) {
    throw new Error(`AUDIO_TOO_LONG: 녹음이 너무 깁니다 (${duration}초). 최대 ${MAX_DURATION}초까지 가능합니다.`);
  }

  const transcript = transcription.text?.trim();

  if (!transcript) {
    throw new Error('AUDIO_NO_SPEECH: 음성이 감지되지 않았습니다. 다시 녹음해주세요.');
  }

  return {
    transcript,
    audioDuration: duration,
  };
}

/**
 * STT 노드 - 상태를 업데이트
 */
export async function sttNode(state: SpeechCoachState): Promise<Partial<SpeechCoachState>> {
  try {
    const { transcript, audioDuration } = await speechToText(state.audioUrl);

    return {
      transcript,
      audioDuration,
      messages: [
        ...state.messages,
        { step: 'stt', progress: 100, message: '음성 인식이 완료되었습니다.' },
      ],
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'STT 처리 중 오류가 발생했습니다.';
    const code = message.startsWith('AUDIO_') ? message.split(':')[0] : 'STT_ERROR';

    return {
      error: { code, message },
      messages: [
        ...state.messages,
        { step: 'stt', progress: 0, message },
      ],
    };
  }
}
