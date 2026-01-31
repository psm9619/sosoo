"""
말 속도(Pace) 분석 도구

WPM(Words Per Minute)을 계산하고 적절성을 평가합니다.

## 이상적인 말 속도

- 면접/발표: 120-170 WPM (한국어 기준)
- 일상 대화: 150-200 WPM
- 중요한 포인트: 100-120 WPM (천천히)

## 사용 방식

이 도구는 ReAct 패턴에서 Claude가 "말 속도가 빠른 것 같은데?"라고 
생각할 때 호출하여 정확한 수치를 확인하는 데 사용됩니다.
"""

from typing import Literal


def analyze_pace(transcript: str, duration_seconds: float) -> dict:
    """
    말 속도(WPM) 분석
    
    트랜스크립트와 오디오 길이를 바탕으로 WPM을 계산하고,
    면접/발표에 적합한 속도인지 평가합니다.
    
    Args:
        transcript: 분석할 텍스트
        duration_seconds: 오디오 길이 (초)
    
    Returns:
        dict: 분석 결과
            - words_per_minute: 분당 단어 수
            - word_count: 총 단어 수
            - duration_seconds: 입력된 오디오 길이
            - assessment: 평가 (too_fast/optimal/too_slow)
            - target_range: 목표 범위
            - recommendation: 개선 권고사항
    """
    
    # 단어 수 계산 (한국어는 공백 기준)
    words = transcript.split()
    word_count = len(words)
    
    # WPM 계산 (0으로 나누기 방지)
    if duration_seconds <= 0:
        duration_seconds = 1.0
    
    wpm = (word_count / duration_seconds) * 60
    wpm = round(wpm)
    
    # 평가
    assessment, recommendation = evaluate_pace(wpm)
    
    # 적정 범위와의 차이 계산
    target_min, target_max = 120, 170
    
    if wpm > target_max:
        deviation = f"{round((wpm - target_max) / target_max * 100)}% 빠름"
    elif wpm < target_min:
        deviation = f"{round((target_min - wpm) / target_min * 100)}% 느림"
    else:
        deviation = "적정 범위"
    
    return {
        "words_per_minute": wpm,
        "word_count": word_count,
        "duration_seconds": round(duration_seconds, 1),
        "assessment": assessment,
        "target_range": f"{target_min}-{target_max} WPM",
        "deviation": deviation,
        "recommendation": recommendation,
    }


def evaluate_pace(wpm: int) -> tuple[Literal["too_fast", "optimal", "too_slow"], str]:
    """WPM 기반 속도 평가"""
    
    if wpm > 180:
        return (
            "too_fast",
            "말 속도가 매우 빠릅니다. 중요한 포인트에서 의도적으로 멈추고, "
            "핵심 단어를 강조하며 말해보세요."
        )
    elif wpm > 170:
        return (
            "too_fast",
            "약간 빠른 편입니다. 숫자나 핵심 성과를 말할 때 "
            "조금 더 천천히 말하면 청취자가 이해하기 쉬워집니다."
        )
    elif wpm >= 120:
        return (
            "optimal",
            "적절한 말 속도입니다. 이 페이스를 유지하세요."
        )
    elif wpm >= 100:
        return (
            "too_slow",
            "약간 느린 편입니다. 자신감 있게 조금 더 빠르게 말해보세요."
        )
    else:
        return (
            "too_slow",
            "말 속도가 많이 느립니다. 답변 내용을 더 연습하고 자신감 있게 말해보세요."
        )


def get_pace_score(wpm: int) -> str:
    """WPM을 점수(A/B+/B/C+/C/D)로 변환"""
    
    if 130 <= wpm <= 160:
        return "A"
    elif 120 <= wpm <= 170:
        return "B+"
    elif 110 <= wpm <= 180:
        return "B"
    elif 100 <= wpm <= 190:
        return "C+"
    elif 90 <= wpm <= 200:
        return "C"
    else:
        return "D"
