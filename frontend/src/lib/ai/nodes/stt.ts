/**
 * STT (Speech-to-Text) 노드
 * OpenAI Whisper API를 사용하여 음성을 텍스트로 변환
 */

import OpenAI, { toFile } from 'openai';
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

// Whisper API가 지원하는 오디오 형식
const SUPPORTED_FORMATS = ['flac', 'm4a', 'mp3', 'mp4', 'mpeg', 'mpga', 'oga', 'ogg', 'wav', 'webm'];

// MIME 타입 → 파일 확장자 매핑
const MIME_TO_FORMAT: Record<string, string> = {
  'audio/webm': 'webm',
  'video/webm': 'webm',
  'audio/mp3': 'mp3',
  'audio/mpeg': 'mp3',
  'audio/wav': 'wav',
  'audio/wave': 'wav',
  'audio/x-wav': 'wav',
  'audio/mp4': 'm4a',
  'audio/m4a': 'm4a',
  'audio/ogg': 'ogg',
  'audio/flac': 'flac',
};

// 최소/최대 길이 (초)
const MIN_DURATION = 5;
const MAX_DURATION = 300;

interface STTResult {
  transcript: string;
  audioDuration: number;
}

/**
 * Data URL을 Buffer로 디코딩
 */
function decodeDataUrl(dataUrl: string): { buffer: Buffer; mimeType: string } {
  // Data URL 형식: data:[<mediatype>][;base64],<data>
  // mediatype은 audio/webm;codecs=opus 같은 형식일 수 있음
  const match = dataUrl.match(/^data:([^;,]+(?:;[^;,]+)*)?(?:;base64)?,(.*)$/);
  if (!match) {
    console.error('[STT] Data URL parsing failed. URL prefix:', dataUrl.substring(0, 100));
    throw new Error('INVALID_DATA_URL: Invalid data URL format');
  }

  const fullMimeType = match[1] || 'application/octet-stream';
  // MIME 타입에서 기본 타입만 추출 (codecs 파라미터 제거)
  const mimeType = fullMimeType.split(';')[0];
  const base64Data = match[2];

  if (!base64Data) {
    throw new Error('INVALID_DATA_URL: No data in URL');
  }

  const buffer = Buffer.from(base64Data, 'base64');

  console.log('[STT] Decoded data URL - Full MIME:', fullMimeType, 'Base MIME:', mimeType, 'Size:', buffer.length);

  return { buffer, mimeType };
}

/**
 * 오디오 URL에서 파일을 가져와 Whisper로 전사
 */
export async function speechToText(audioUrl: string): Promise<STTResult> {
  let buffer: Buffer;
  let detectedMime = '';

  // Data URL vs HTTP URL 분기 처리
  if (audioUrl.startsWith('data:')) {
    // Data URL 직접 디코딩 (base64)
    console.log('[STT] Processing data URL...');
    const decoded = decodeDataUrl(audioUrl);
    buffer = decoded.buffer;
    detectedMime = decoded.mimeType.toLowerCase();
    console.log('[STT] Data URL decoded - MIME:', detectedMime, 'Size:', buffer.length, 'bytes');
  } else {
    // HTTP URL - fetch로 다운로드
    console.log('[STT] Fetching audio from URL...');
    const response = await fetch(audioUrl);
    if (!response.ok) {
      throw new Error(`AUDIO_DOWNLOAD_ERROR: Failed to download audio: ${response.status}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    buffer = Buffer.from(arrayBuffer);

    const contentType = response.headers.get('content-type') || '';
    detectedMime = contentType.split(';')[0].trim().toLowerCase();
    console.log('[STT] Downloaded - MIME:', detectedMime, 'Size:', buffer.length, 'bytes');
  }

  // 포맷 감지
  let format = MIME_TO_FORMAT[detectedMime] || 'webm';

  // URL에서 확장자 추출 (fallback)
  if (!audioUrl.startsWith('data:')) {
    const urlMatch = audioUrl.match(/\.(\w+)(?:\?|$)/);
    if (urlMatch) {
      const ext = urlMatch[1].toLowerCase();
      if (SUPPORTED_FORMATS.includes(ext)) {
        format = ext;
      }
    }
  }

  console.log('[STT] Final format:', format);

  // OpenAI toFile로 파일 생성
  const file = await toFile(buffer, `audio.${format}`);
  console.log('[STT] File created successfully');

  // Whisper API 호출
  console.log('[STT] Calling Whisper API...');
  let transcription;
  try {
    transcription = await getOpenAI().audio.transcriptions.create({
      file,
      model: 'whisper-1',
      language: 'ko',
      response_format: 'verbose_json',
    });
    console.log('[STT] Whisper API success, duration:', transcription.duration);
  } catch (apiError) {
    console.error('[STT] Whisper API error:', apiError);
    if (apiError instanceof Error) {
      console.error('[STT] Error message:', apiError.message);
    }
    throw apiError;
  }

  // 결과 검증
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
