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

// MIME 타입 → 파일 확장자 매핑 (모바일 브라우저 호환성 포함)
const MIME_TO_FORMAT: Record<string, string> = {
  // WebM (Chrome, Firefox)
  'audio/webm': 'webm',
  'video/webm': 'webm',
  // MP3
  'audio/mp3': 'mp3',
  'audio/mpeg': 'mp3',
  'audio/mpeg3': 'mp3',
  'audio/x-mpeg-3': 'mp3',
  // WAV
  'audio/wav': 'wav',
  'audio/wave': 'wav',
  'audio/x-wav': 'wav',
  // M4A / MP4 (iOS Safari)
  'audio/mp4': 'm4a',
  'audio/m4a': 'm4a',
  'audio/x-m4a': 'm4a',
  'audio/aac': 'm4a',
  'audio/x-aac': 'm4a',
  'video/mp4': 'mp4',
  // OGG
  'audio/ogg': 'ogg',
  'audio/x-ogg': 'ogg',
  'application/ogg': 'ogg',
  // FLAC
  'audio/flac': 'flac',
  'audio/x-flac': 'flac',
  // 3GPP (일부 안드로이드)
  'audio/3gpp': 'mp4',
  'audio/3gpp2': 'mp4',
  // AMR (일부 안드로이드)
  'audio/amr': 'mp4',
};

// 최소/최대 길이 (초)
const MIN_DURATION = 5;
const MAX_DURATION = 300;

/**
 * 파일 헤더(magic bytes)로 오디오 포맷 감지
 */
function detectFormatFromBuffer(buffer: Buffer): string | null {
  if (buffer.length < 12) return null;

  // WebM: 1A 45 DF A3
  if (buffer[0] === 0x1a && buffer[1] === 0x45 && buffer[2] === 0xdf && buffer[3] === 0xa3) {
    return 'webm';
  }

  // OGG: OggS
  if (buffer[0] === 0x4f && buffer[1] === 0x67 && buffer[2] === 0x67 && buffer[3] === 0x53) {
    return 'ogg';
  }

  // FLAC: fLaC
  if (buffer[0] === 0x66 && buffer[1] === 0x4c && buffer[2] === 0x61 && buffer[3] === 0x43) {
    return 'flac';
  }

  // WAV: RIFF....WAVE
  if (buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46 &&
      buffer[8] === 0x57 && buffer[9] === 0x41 && buffer[10] === 0x56 && buffer[11] === 0x45) {
    return 'wav';
  }

  // MP3: ID3 태그 또는 프레임 헤더 (FF FB, FF FA, FF F3, FF F2)
  if ((buffer[0] === 0x49 && buffer[1] === 0x44 && buffer[2] === 0x33) || // ID3
      (buffer[0] === 0xff && (buffer[1] & 0xe0) === 0xe0)) { // MP3 frame
    return 'mp3';
  }

  // MP4/M4A: ....ftyp
  if (buffer[4] === 0x66 && buffer[5] === 0x74 && buffer[6] === 0x79 && buffer[7] === 0x70) {
    return 'm4a';
  }

  return null;
}

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

  // 포맷 감지 - 여러 방법으로 시도
  let format: string | null = null;

  // 1. MIME 타입으로 감지
  if (detectedMime && MIME_TO_FORMAT[detectedMime]) {
    format = MIME_TO_FORMAT[detectedMime];
    console.log('[STT] Format from MIME:', format);
  }

  // 2. URL에서 확장자 추출 (HTTP URL인 경우)
  if (!format && !audioUrl.startsWith('data:')) {
    const urlMatch = audioUrl.match(/\.(\w+)(?:\?|$)/);
    if (urlMatch) {
      const ext = urlMatch[1].toLowerCase();
      if (SUPPORTED_FORMATS.includes(ext)) {
        format = ext;
        console.log('[STT] Format from URL extension:', format);
      }
    }
  }

  // 3. 파일 헤더(magic bytes)로 감지 (가장 신뢰할 수 있음)
  const detectedFromBuffer = detectFormatFromBuffer(buffer);
  if (detectedFromBuffer) {
    // 버퍼 감지가 MIME과 다르면 버퍼 감지 결과 사용 (더 신뢰할 수 있음)
    if (!format || format !== detectedFromBuffer) {
      console.log('[STT] Format from buffer detection:', detectedFromBuffer, '(overriding:', format, ')');
      format = detectedFromBuffer;
    }
  }

  // 4. 최종 fallback
  if (!format) {
    // iOS Safari는 주로 m4a를 사용하므로 모바일에서 더 안전한 기본값
    format = 'webm';
    console.log('[STT] Using fallback format:', format);
  }

  console.log('[STT] Final format:', format, '| MIME:', detectedMime);

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
