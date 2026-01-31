/**
 * 콘텐츠 모더레이션 노드
 * 부적절한 콘텐츠 탐지 및 민감 정보 마스킹
 */

export interface ModerationResult {
  isFlagged: boolean;
  flags: ModerationFlag[];
  maskedText: string;
  originalText: string;
}

export interface ModerationFlag {
  type: ModerationFlagType;
  severity: 'low' | 'medium' | 'high';
  description: string;
  matchedPattern?: string;
}

export type ModerationFlagType =
  | 'profanity'          // 비속어
  | 'discrimination'     // 차별적 표현
  | 'violence'           // 폭력적 표현
  | 'sensitive_personal' // 민감한 개인정보
  | 'threat'             // 위협
  | 'hate_speech';       // 혐오 발언

// 한국어 비속어 패턴 (일부 예시 - 실제 서비스에서는 더 포괄적인 목록 필요)
const PROFANITY_PATTERNS = [
  /시[0-9]*발/gi,
  /씨[0-9]*발/gi,
  /개새끼/gi,
  /병신/gi,
  /지랄/gi,
  /좆/gi,
  /니애미/gi,
  /느금마/gi,
  /ㅅㅂ/gi,
  /ㅂㅅ/gi,
  /ㄱㅅㄲ/gi,
];

// 차별적/혐오 표현 패턴
const DISCRIMINATION_PATTERNS = [
  /조선족/gi,
  /쪽바리/gi,
  /짱깨/gi,
  /흑형/gi,
  /백퇴/gi,
  /한남충/gi,
  /한녀충/gi,
  /맘충/gi,
  /급식충/gi,
  /틀딱/gi,
];

// 위협 패턴
const THREAT_PATTERNS = [
  /죽여버릴/gi,
  /죽이겠/gi,
  /칼빵/gi,
  /패버릴/gi,
  /박살내/gi,
  /폭파/gi,
  /테러/gi,
];

// 민감한 개인정보 패턴
const SENSITIVE_INFO_PATTERNS = {
  phoneNumber: /01[0-9]-?\d{3,4}-?\d{4}/g,
  residentNumber: /\d{6}-?[1-4]\d{6}/g,
  email: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
  creditCard: /\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}/g,
  bankAccount: /\d{3}-?\d{2,6}-?\d{2,6}/g,
};

/**
 * 텍스트 모더레이션 수행
 */
export function moderateContent(text: string): ModerationResult {
  const flags: ModerationFlag[] = [];
  let maskedText = text;

  // 1. 비속어 검사
  for (const pattern of PROFANITY_PATTERNS) {
    const matches = text.match(pattern);
    if (matches) {
      flags.push({
        type: 'profanity',
        severity: 'medium',
        description: '비속어가 포함되어 있습니다.',
        matchedPattern: matches[0],
      });
      // 마스킹
      maskedText = maskedText.replace(pattern, '***');
    }
  }

  // 2. 차별적 표현 검사
  for (const pattern of DISCRIMINATION_PATTERNS) {
    const matches = text.match(pattern);
    if (matches) {
      flags.push({
        type: 'discrimination',
        severity: 'high',
        description: '차별적인 표현이 포함되어 있습니다.',
        matchedPattern: matches[0],
      });
      maskedText = maskedText.replace(pattern, '[부적절한 표현]');
    }
  }

  // 3. 위협 표현 검사
  for (const pattern of THREAT_PATTERNS) {
    const matches = text.match(pattern);
    if (matches) {
      flags.push({
        type: 'threat',
        severity: 'high',
        description: '위협적인 표현이 포함되어 있습니다.',
        matchedPattern: matches[0],
      });
    }
  }

  // 4. 민감한 개인정보 검사 및 마스킹
  // 전화번호
  const phoneMatches = text.match(SENSITIVE_INFO_PATTERNS.phoneNumber);
  if (phoneMatches) {
    flags.push({
      type: 'sensitive_personal',
      severity: 'medium',
      description: '전화번호가 포함되어 있습니다. 자동으로 마스킹됩니다.',
    });
    maskedText = maskedText.replace(
      SENSITIVE_INFO_PATTERNS.phoneNumber,
      '***-****-****'
    );
  }

  // 주민등록번호
  const residentMatches = text.match(SENSITIVE_INFO_PATTERNS.residentNumber);
  if (residentMatches) {
    flags.push({
      type: 'sensitive_personal',
      severity: 'high',
      description: '주민등록번호가 포함되어 있습니다. 자동으로 마스킹됩니다.',
    });
    maskedText = maskedText.replace(
      SENSITIVE_INFO_PATTERNS.residentNumber,
      '******-*******'
    );
  }

  // 이메일
  const emailMatches = text.match(SENSITIVE_INFO_PATTERNS.email);
  if (emailMatches) {
    flags.push({
      type: 'sensitive_personal',
      severity: 'low',
      description: '이메일 주소가 포함되어 있습니다.',
    });
    // 이메일은 부분 마스킹 (첫 3자만 표시)
    maskedText = maskedText.replace(SENSITIVE_INFO_PATTERNS.email, (match) => {
      const [local, domain] = match.split('@');
      return `${local.slice(0, 3)}***@${domain}`;
    });
  }

  // 신용카드
  const creditMatches = text.match(SENSITIVE_INFO_PATTERNS.creditCard);
  if (creditMatches) {
    flags.push({
      type: 'sensitive_personal',
      severity: 'high',
      description: '신용카드 번호가 포함되어 있습니다. 자동으로 마스킹됩니다.',
    });
    maskedText = maskedText.replace(
      SENSITIVE_INFO_PATTERNS.creditCard,
      '****-****-****-****'
    );
  }

  const isFlagged =
    flags.some((f) => f.severity === 'high') || flags.length >= 3;

  return {
    isFlagged,
    flags,
    maskedText,
    originalText: text,
  };
}

/**
 * 모더레이션 결과를 DB 저장용 형식으로 변환
 */
export function moderationResultToDBFormat(result: ModerationResult): {
  is_flagged: boolean;
  moderation_flags: Record<string, unknown>;
} {
  return {
    is_flagged: result.isFlagged,
    moderation_flags: {
      flagCount: result.flags.length,
      types: result.flags.map((f) => f.type),
      severities: result.flags.map((f) => f.severity),
      hasMasking: result.maskedText !== result.originalText,
    },
  };
}

/**
 * 콘텐츠가 처리 가능한지 확인
 * (심각한 위반 시 false 반환)
 */
export function isContentProcessable(result: ModerationResult): boolean {
  // 위협이나 고위험 혐오 발언이 있으면 처리 거부
  const hasBlockingContent = result.flags.some(
    (f) =>
      f.type === 'threat' ||
      (f.type === 'hate_speech' && f.severity === 'high') ||
      (f.type === 'violence' && f.severity === 'high')
  );

  return !hasBlockingContent;
}

/**
 * 사용자에게 보여줄 모더레이션 경고 메시지 생성
 */
export function getModerationWarningMessage(result: ModerationResult): string | null {
  if (result.flags.length === 0) return null;

  const hasHighSeverity = result.flags.some((f) => f.severity === 'high');
  const hasSensitiveInfo = result.flags.some((f) => f.type === 'sensitive_personal');

  if (hasHighSeverity) {
    return '부적절한 표현이 감지되어 일부 내용이 수정되었습니다. 면접/발표에서는 전문적인 언어 사용을 권장합니다.';
  }

  if (hasSensitiveInfo) {
    return '개인정보 보호를 위해 민감한 정보가 자동으로 마스킹되었습니다.';
  }

  return null;
}
