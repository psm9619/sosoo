"""
Content Moderation 노드

사용자의 음성 내용에서 부적절한 컨텐츠를 감지합니다.
분석 프롬프트에 통합되어 별도의 API 호출 없이 처리됩니다.

## 감지 항목

1. 욕설/비속어
2. 민감한 개인정보 (주민번호, 계좌번호 등)
3. 위협/폭력적 내용
4. 기타 부적절한 컨텐츠

## 처리 방식

- 심각도가 낮은 경우: 플래그만 기록하고 계속 진행
- 심각도가 높은 경우: 세션 중단 및 관리자 알림
- 개인정보: 자동 마스킹 후 진행
"""

import re
from typing import List, Tuple

from ..state import SpeechCoachState


# 욕설/비속어 패턴 (한국어)
PROFANITY_PATTERNS = [
    r'씨[발빨팔]',
    r'개[새시]끼',
    r'병[신싄]',
    r'지[랄럴]',
    r'꺼[져저]',
    # 추가 패턴...
]

# 개인정보 패턴
PII_PATTERNS = {
    "phone": r'01[0-9]-?\d{4}-?\d{4}',
    "rrn": r'\d{6}-?[1-4]\d{6}',  # 주민등록번호
    "account": r'\d{3,4}-?\d{2,4}-?\d{4,6}',  # 계좌번호 (대략적)
    "email": r'[\w.-]+@[\w.-]+\.\w+',
}


async def check_moderation(state: SpeechCoachState) -> dict:
    """
    콘텐츠 모더레이션 체크 노드
    
    트랜스크립트에서 부적절한 내용을 감지하고 필요시 마스킹합니다.
    
    Args:
        state: 현재 워크플로우 상태
            - transcript: STT 변환된 텍스트
    
    Returns:
        dict: 업데이트할 상태 필드
            - transcript: (마스킹된) 텍스트
            - moderation_flags: 감지된 이슈 목록
            - messages: 진행 메시지
    
    Raises:
        ValueError: 심각한 위협/폭력 컨텐츠 감지 시
    """
    
    transcript = state["transcript"]
    flags: List[str] = []
    masked_transcript = transcript
    
    # 1. 욕설 체크
    profanity_found = check_profanity(transcript)
    if profanity_found:
        flags.append(f"profanity_detected:{len(profanity_found)}")
        # 욕설은 마스킹하지 않고 플래그만 기록
    
    # 2. 개인정보 체크 및 마스킹
    masked_transcript, pii_found = mask_pii(masked_transcript)
    if pii_found:
        for pii_type, count in pii_found:
            flags.append(f"pii_{pii_type}:{count}")
    
    # 3. 위협 컨텐츠 체크 (심각한 경우 중단)
    threat_level = check_threats(transcript)
    if threat_level == "severe":
        # 심각한 위협은 세션 중단
        raise ValueError("Content moderation: Severe threat detected. Session terminated.")
    elif threat_level == "moderate":
        flags.append("threat_moderate")
    
    # 메시지 생성
    if flags:
        message = f"모더레이션 완료: {len(flags)}개 이슈 감지"
    else:
        message = "모더레이션 완료: 이상 없음"
    
    return {
        "transcript": masked_transcript,
        "moderation_flags": flags,
        "messages": [message]
    }


def check_profanity(text: str) -> List[str]:
    """
    욕설/비속어 감지
    
    Args:
        text: 검사할 텍스트
    
    Returns:
        List[str]: 감지된 욕설 목록
    """
    found = []
    
    for pattern in PROFANITY_PATTERNS:
        matches = re.findall(pattern, text, re.IGNORECASE)
        found.extend(matches)
    
    return found


def mask_pii(text: str) -> Tuple[str, List[Tuple[str, int]]]:
    """
    개인정보 마스킹
    
    감지된 개인정보를 [MASKED_XXX] 형태로 대체합니다.
    
    Args:
        text: 원본 텍스트
    
    Returns:
        Tuple: (마스킹된 텍스트, [(타입, 개수), ...])
    """
    masked = text
    found = []
    
    for pii_type, pattern in PII_PATTERNS.items():
        matches = re.findall(pattern, masked)
        if matches:
            found.append((pii_type, len(matches)))
            # 마스킹
            masked = re.sub(pattern, f"[MASKED_{pii_type.upper()}]", masked)
    
    return masked, found


def check_threats(text: str) -> str:
    """
    위협/폭력 컨텐츠 체크
    
    심각도를 판단하여 반환합니다.
    
    Args:
        text: 검사할 텍스트
    
    Returns:
        str: 위협 수준 (none/moderate/severe)
    """
    # 심각한 위협 키워드
    severe_keywords = [
        "죽이", "폭발", "총", "칼로", "테러",
    ]
    
    # 중간 수준 키워드
    moderate_keywords = [
        "때리", "패", "협박",
    ]
    
    text_lower = text.lower()
    
    for keyword in severe_keywords:
        if keyword in text_lower:
            return "severe"
    
    for keyword in moderate_keywords:
        if keyword in text_lower:
            return "moderate"
    
    return "none"


def build_moderation_prompt_section() -> str:
    """
    분석 프롬프트에 포함할 모더레이션 지시 섹션
    
    Claude 분석 시 함께 모더레이션을 수행하도록 합니다.
    별도의 API 호출 없이 비용을 절약합니다.
    """
    
    return """
## 콘텐츠 검토 (분석과 함께 수행)

답변 내용에서 다음 항목을 함께 확인해주세요:
1. 부적절한 언어 사용 여부
2. 민감한 개인정보 노출 (마스킹 제안)
3. 부적절한 내용

발견 시 analysis 결과의 moderation_flags 필드에 기록해주세요.
"""


# ============================================
# 테스트용 Mock
# ============================================

async def check_moderation_mock(state: SpeechCoachState) -> dict:
    """테스트용 Mock 모더레이션"""
    
    return {
        "transcript": state["transcript"],
        "moderation_flags": [],
        "messages": ["[MOCK] 모더레이션 완료"]
    }
