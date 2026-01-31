"""
필러워드(Filler Words) 분석 도구

"어...", "음...", "그..." 같은 필러워드를 감지하고 분석합니다.
"""

import re
from typing import List, Dict
from collections import Counter


# 한국어 필러워드 패턴 정의
FILLER_PATTERNS = {
    "sound": [
        r'\b어+[\.…~]*\b',
        r'\b음+[\.…~]*\b',
        r'\b아+[\.…~]*\b',
        r'\b에+[\.…~]*\b',
    ],
    "word": [
        r'\b그+\b',
        r'\b저+\b',
        r'\b뭐+\b',
        r'\b이제\b',
        r'\b약간\b',
        r'\b좀\b',
    ],
    "phrase": [
        r'그러니까',
        r'말하자면',
        r'어떻게 보면',
        r'솔직히',
        r'사실',
    ],
}


def analyze_fillers(transcript: str) -> dict:
    """필러워드 분석"""
    
    total_words = len(transcript.split())
    
    if total_words == 0:
        return {
            "filler_count": 0,
            "filler_percentage": 0.0,
            "fillers_by_type": {},
            "fillers_detected": [],
            "assessment": "excellent",
            "recommendation": "분석할 텍스트가 없습니다.",
        }
    
    fillers_by_type = {}
    all_fillers = []
    
    for filler_type, patterns in FILLER_PATTERNS.items():
        type_fillers = []
        for pattern in patterns:
            matches = re.findall(pattern, transcript, re.IGNORECASE)
            type_fillers.extend(matches)
        if type_fillers:
            fillers_by_type[filler_type] = type_fillers
            all_fillers.extend(type_fillers)
    
    filler_count = len(all_fillers)
    filler_percentage = round((filler_count / total_words) * 100, 1)
    
    assessment, recommendation = evaluate_fillers(filler_percentage, fillers_by_type)
    filler_counter = Counter(all_fillers)
    
    return {
        "filler_count": filler_count,
        "filler_percentage": filler_percentage,
        "total_words": total_words,
        "fillers_by_type": {k: len(v) for k, v in fillers_by_type.items()},
        "fillers_detected": all_fillers[:10],
        "most_common_fillers": filler_counter.most_common(5),
        "assessment": assessment,
        "recommendation": recommendation,
    }


def evaluate_fillers(percentage: float, by_type: Dict[str, List[str]]) -> tuple[str, str]:
    """필러워드 비율 기반 평가"""
    
    type_advice = {
        "sound": "'어...', '음...' 대신 잠시 멈춤(pause)을 사용해보세요.",
        "word": "'그', '뭐' 같은 습관적 단어를 의식하고 줄여보세요.",
        "phrase": "시간 벌기용 표현 대신 핵심을 바로 말해보세요.",
    }
    
    dominant_type = max(by_type.keys(), key=lambda k: len(by_type[k])) if by_type else None
    
    if percentage <= 2:
        return ("excellent", "필러워드 사용이 매우 적습니다.")
    elif percentage <= 4:
        base = "필러워드 사용이 허용 범위 내입니다."
        if dominant_type:
            return ("acceptable", f"{base} {type_advice.get(dominant_type, '')}")
        return ("acceptable", base)
    elif percentage <= 6:
        base = "필러워드가 다소 많습니다."
        if dominant_type:
            return ("excessive", f"{base} {type_advice.get(dominant_type, '')}")
        return ("excessive", base)
    else:
        return ("excessive", "필러워드가 매우 많습니다. '어...' 대신 의도적인 멈춤을 사용해보세요.")


def get_filler_score(percentage: float) -> str:
    """필러워드 비율을 점수로 변환"""
    if percentage <= 1:
        return "A"
    elif percentage <= 2:
        return "B+"
    elif percentage <= 3:
        return "B"
    elif percentage <= 4:
        return "C+"
    elif percentage <= 5:
        return "C"
    else:
        return "D"
