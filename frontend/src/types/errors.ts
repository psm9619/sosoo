// ============================================
// 에러 코드 정의 (BE/FE 공유)
// ============================================

export interface ErrorCodeDefinition {
  status: number;
  message: string;
  userAction?: string;
}

export const ERROR_CODES: Record<string, ErrorCodeDefinition> = {
  // ============================================
  // Auth (401)
  // ============================================
  AUTH_INVALID_TOKEN: {
    status: 401,
    message: "인증 토큰이 유효하지 않습니다",
    userAction: "다시 로그인해주세요"
  },
  AUTH_EXPIRED_TOKEN: {
    status: 401,
    message: "토큰이 만료되었습니다",
    userAction: "다시 로그인해주세요"
  },
  AUTH_MISSING_TOKEN: {
    status: 401,
    message: "인증이 필요합니다",
    userAction: "로그인해주세요"
  },

  // ============================================
  // Guest Session (401, 429)
  // ============================================
  GUEST_SESSION_EXPIRED: {
    status: 401,
    message: "게스트 세션이 만료되었습니다",
    userAction: "새로 시작해주세요"
  },
  GUEST_RATE_LIMIT_EXCEEDED: {
    status: 429,
    message: "게스트 토큰 발급 한도를 초과했습니다",
    userAction: "1시간 후 다시 시도하거나 회원가입해주세요"
  },

  // ============================================
  // Audio (400, 500)
  // ============================================
  AUDIO_TOO_SHORT: {
    status: 400,
    message: "5초 이상 녹음해주세요",
    userAction: "다시 녹음해주세요"
  },
  AUDIO_TOO_LONG: {
    status: 400,
    message: "5분 이하로 녹음해주세요",
    userAction: "더 짧게 녹음해주세요"
  },
  AUDIO_INVALID_FORMAT: {
    status: 400,
    message: "지원하지 않는 오디오 형식입니다",
    userAction: "webm, mp3, wav 형식을 사용해주세요"
  },
  AUDIO_UPLOAD_FAILED: {
    status: 400,
    message: "오디오 업로드에 실패했습니다",
    userAction: "다시 시도해주세요"
  },
  AUDIO_DOWNLOAD_FAILED: {
    status: 500,
    message: "오디오 다운로드에 실패했습니다",
    userAction: "잠시 후 다시 시도해주세요"
  },
  AUDIO_CORRUPTED: {
    status: 400,
    message: "오디오 파일이 손상되었습니다",
    userAction: "다시 녹음해주세요"
  },

  // ============================================
  // STT (400, 500, 504)
  // ============================================
  STT_FAILED: {
    status: 500,
    message: "음성 인식에 실패했습니다",
    userAction: "잠시 후 다시 시도해주세요"
  },
  STT_TIMEOUT: {
    status: 504,
    message: "음성 인식 시간이 초과되었습니다",
    userAction: "더 짧은 음성으로 다시 시도해주세요"
  },
  STT_NO_SPEECH: {
    status: 400,
    message: "음성이 감지되지 않았습니다",
    userAction: "다시 녹음해주세요"
  },
  STT_QUOTA_EXCEEDED: {
    status: 429,
    message: "음성 인식 한도를 초과했습니다",
    userAction: "내일 다시 시도하거나 유료 플랜을 이용해주세요"
  },

  // ============================================
  // Analysis (500, 504)
  // ============================================
  ANALYSIS_FAILED: {
    status: 500,
    message: "분석 중 오류가 발생했습니다",
    userAction: "잠시 후 다시 시도해주세요"
  },
  ANALYSIS_TIMEOUT: {
    status: 504,
    message: "분석 시간이 초과되었습니다",
    userAction: "더 짧은 음성으로 다시 시도해주세요"
  },
  ANALYSIS_QUOTA_EXCEEDED: {
    status: 429,
    message: "분석 한도를 초과했습니다",
    userAction: "내일 다시 시도하거나 유료 플랜을 이용해주세요"
  },

  // ============================================
  // TTS (503, 429, 400)
  // ============================================
  TTS_FAILED: {
    status: 503,
    message: "음성 생성에 실패했습니다",
    userAction: "잠시 후 다시 시도해주세요"
  },
  TTS_TIMEOUT: {
    status: 504,
    message: "음성 생성 시간이 초과되었습니다",
    userAction: "잠시 후 다시 시도해주세요"
  },
  TTS_QUOTA_EXCEEDED: {
    status: 429,
    message: "음성 생성 한도를 초과했습니다",
    userAction: "내일 다시 시도하거나 유료 플랜을 이용해주세요"
  },
  TTS_VOICE_CLONE_NOT_READY: {
    status: 400,
    message: "보이스 클론이 아직 준비되지 않았습니다",
    userAction: "마이페이지에서 목소리를 등록해주세요"
  },

  // ============================================
  // Refinement (400)
  // ============================================
  REFINEMENT_LIMIT_EXCEEDED: {
    status: 400,
    message: "재요청 횟수를 초과했습니다 (최대 2회)",
    userAction: "현재 결과를 사용하거나 새로운 세션을 시작하세요"
  },
  REFINEMENT_INVALID_FEEDBACK: {
    status: 400,
    message: "피드백이 너무 짧습니다 (최소 10자)",
    userAction: "더 구체적인 피드백을 입력해주세요"
  },
  REFINEMENT_FEEDBACK_TOO_LONG: {
    status: 400,
    message: "피드백이 너무 깁니다 (최대 200자)",
    userAction: "더 짧게 입력해주세요"
  },

  // ============================================
  // Session (404, 410, 400)
  // ============================================
  SESSION_NOT_FOUND: {
    status: 404,
    message: "세션을 찾을 수 없습니다",
    userAction: "새로운 세션을 시작해주세요"
  },
  SESSION_EXPIRED: {
    status: 410,
    message: "세션이 만료되었습니다",
    userAction: "새로운 세션을 시작해주세요"
  },
  SESSION_INVALID_STATE: {
    status: 400,
    message: "잘못된 세션 상태입니다",
    userAction: "새로운 세션을 시작해주세요"
  },

  // ============================================
  // Project (404, 403)
  // ============================================
  PROJECT_NOT_FOUND: {
    status: 404,
    message: "프로젝트를 찾을 수 없습니다",
    userAction: "올바른 프로젝트를 선택해주세요"
  },
  PROJECT_ACCESS_DENIED: {
    status: 403,
    message: "프로젝트에 접근할 수 없습니다",
    userAction: "본인의 프로젝트만 사용할 수 있습니다"
  },

  // ============================================
  // Rate Limit (429)
  // ============================================
  RATE_LIMIT_EXCEEDED: {
    status: 429,
    message: "요청 한도를 초과했습니다",
    userAction: "잠시 후 다시 시도해주세요"
  },
  DAILY_QUOTA_EXCEEDED: {
    status: 429,
    message: "일일 사용량을 초과했습니다",
    userAction: "내일 다시 시도하거나 유료 플랜을 이용해주세요"
  },

  // ============================================
  // Content Moderation (400, 500)
  // ============================================
  CONTENT_VIOLATION: {
    status: 400,
    message: "부적절한 내용이 감지되었습니다",
    userAction: "적절한 내용으로 다시 시도해주세요"
  },
  CONTENT_PROFANITY_DETECTED: {
    status: 400,
    message: "욕설이 감지되었습니다",
    userAction: "적절한 표현으로 다시 시도해주세요"
  },
  CONTENT_PII_DETECTED: {
    status: 400,
    message: "개인정보가 감지되었습니다",
    userAction: "개인정보를 제거하고 다시 시도해주세요"
  },
  CONTENT_MODERATION_FAILED: {
    status: 500,
    message: "콘텐츠 검증 중 오류가 발생했습니다",
    userAction: "잠시 후 다시 시도해주세요"
  },

  // ============================================
  // Generic (500)
  // ============================================
  INTERNAL_SERVER_ERROR: {
    status: 500,
    message: "서버 오류가 발생했습니다",
    userAction: "잠시 후 다시 시도해주세요"
  },
  SERVICE_UNAVAILABLE: {
    status: 503,
    message: "서비스를 일시적으로 사용할 수 없습니다",
    userAction: "잠시 후 다시 시도해주세요"
  },
  NETWORK_ERROR: {
    status: 500,
    message: "네트워크 오류가 발생했습니다",
    userAction: "인터넷 연결을 확인하고 다시 시도해주세요"
  }
};

// 에러 코드 타입
export type ErrorCode = keyof typeof ERROR_CODES;

// Helper: 에러 코드로 HTTP 상태 가져오기
export function getErrorStatus(code: ErrorCode): number {
  return ERROR_CODES[code].status;
}

// Helper: 에러 코드로 메시지 가져오기
export function getErrorMessage(code: ErrorCode): string {
  return ERROR_CODES[code].message;
}

// Helper: 에러 코드로 사용자 액션 가져오기
export function getErrorUserAction(code: ErrorCode): string | undefined {
  return ERROR_CODES[code].userAction;
}
