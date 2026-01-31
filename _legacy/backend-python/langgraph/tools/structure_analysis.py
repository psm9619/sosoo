"""
구조(Structure) 분석 도구

STAR 구조(Situation-Task-Action-Result)를 분석합니다.

## STAR 구조란?

면접에서 경험을 효과적으로 전달하기 위한 프레임워크입니다:
- Situation: 상황 설명 (언제, 어디서, 어떤 배경)
- Task: 과제/목표 (무엇을 해야 했는지)
- Action: 행동 (어떻게 했는지, 본인의 역할)
- Result: 결과 (어떤 성과를 얻었는지, 가능하면 숫자로)

## 좋은 STAR 답변의 특징

1. 모든 요소가 포함됨
2. 순서가 자연스러움
3. Result에 구체적인 숫자/성과가 있음
4. Action에서 본인의 기여가 명확함
"""

import re
from typing import Dict, List, Optional


# STAR 요소별 키워드/패턴
STAR_INDICATORS = {
    "situation": {
        "keywords": [
            "상황", "당시", "그때", "배경", "환경", "팀에서", "회사에서",
            "프로젝트", "시작", "처음", "년", "월",
        ],
        "patterns": [
            r'\d{4}년',                    # 연도 언급
            r'당시[에는]*',
            r'[에서|에] 근무',
            r'팀[에서]*',
        ],
        "weight": 1.0,
    },
    "task": {
        "keywords": [
            "목표", "해야", "과제", "문제", "이슈", "필요", "요구",
            "기대", "달성", "책임", "담당", "맡아",
        ],
        "patterns": [
            r'해야\s*(했|할)',
            r'필요[가|했]',
            r'목표[는|가]',
        ],
        "weight": 1.0,
    },
    "action": {
        "keywords": [
            "그래서", "저는", "했습니다", "진행", "수행", "실행",
            "개발", "설계", "구현", "분석", "제안", "주도",
            "협업", "조율", "해결", "적용",
        ],
        "patterns": [
            r'제가\s*(직접|먼저)',
            r'[을|를]\s*했습니다',
            r'[을|를]\s*진행',
        ],
        "weight": 1.5,  # Action이 가장 중요
    },
    "result": {
        "keywords": [
            "결과", "성과", "달성", "개선", "향상", "증가", "감소",
            "절감", "단축", "완료", "성공",
        ],
        "patterns": [
            r'\d+%',                       # 퍼센트
            r'\d+[배|건|개|명|원|달러]',    # 숫자+단위
            r'결과[적으로|는]',
            r'성과[는|가]',
        ],
        "weight": 1.5,  # Result도 중요 (숫자 포함 시 가산점)
    },
}


def analyze_star_structure(transcript: str) -> dict:
    """
    STAR 구조 분석
    
    트랜스크립트에서 STAR 각 요소의 존재 여부와 품질을 분석합니다.
    
    Args:
        transcript: 분석할 텍스트
    
    Returns:
        dict: 분석 결과
            - elements_found: 각 요소의 존재 여부
            - element_scores: 각 요소의 점수 (0-100)
            - structure_score: 종합 구조 점수 (0-100)
            - missing_elements: 누락된 요소
            - order_analysis: 요소 순서 분석
            - has_numbers: Result에 숫자가 있는지
            - recommendation: 개선 권고사항
    """
    
    # 각 요소 분석
    elements_found = {}
    element_scores = {}
    element_positions = {}
    
    for element, config in STAR_INDICATORS.items():
        score, found_items, position = analyze_element(
            transcript,
            config["keywords"],
            config["patterns"],
        )
        
        elements_found[element] = score > 30  # 30점 이상이면 존재한다고 판단
        element_scores[element] = score
        
        if position is not None:
            element_positions[element] = position
    
    # 종합 점수 계산 (가중치 적용)
    total_weight = sum(c["weight"] for c in STAR_INDICATORS.values())
    weighted_score = sum(
        element_scores[e] * STAR_INDICATORS[e]["weight"]
        for e in element_scores
    ) / total_weight
    
    # 숫자 포함 여부 (Result 품질)
    has_numbers = bool(re.search(r'\d+[%배건개명원달러]', transcript))
    if has_numbers:
        weighted_score = min(100, weighted_score + 10)  # 가산점
    
    # 순서 분석
    order_analysis = analyze_order(element_positions)
    if order_analysis["is_natural"]:
        weighted_score = min(100, weighted_score + 5)  # 순서 좋으면 가산점
    
    # 누락된 요소
    missing_elements = [e for e, found in elements_found.items() if not found]
    
    # 권고사항 생성
    recommendation = generate_structure_recommendation(
        elements_found,
        element_scores,
        has_numbers,
        order_analysis,
    )
    
    return {
        "elements_found": elements_found,
        "element_scores": element_scores,
        "structure_score": round(weighted_score),
        "missing_elements": missing_elements,
        "order_analysis": order_analysis,
        "has_numbers": has_numbers,
        "recommendation": recommendation,
        "assessment": get_structure_assessment(weighted_score),
    }


def analyze_element(
    text: str,
    keywords: List[str],
    patterns: List[str],
) -> tuple[int, List[str], Optional[int]]:
    """
    개별 STAR 요소 분석
    
    Returns:
        tuple: (점수, 발견된 항목들, 첫 등장 위치)
    """
    
    found_items = []
    first_position = None
    
    text_lower = text.lower()
    
    # 키워드 검색
    for keyword in keywords:
        if keyword in text_lower:
            found_items.append(keyword)
            pos = text_lower.find(keyword)
            if first_position is None or pos < first_position:
                first_position = pos
    
    # 패턴 검색
    for pattern in patterns:
        matches = re.findall(pattern, text, re.IGNORECASE)
        if matches:
            found_items.extend(matches)
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                pos = match.start()
                if first_position is None or pos < first_position:
                    first_position = pos
    
    # 점수 계산 (발견된 항목 수 기반)
    if not found_items:
        score = 0
    elif len(found_items) == 1:
        score = 40
    elif len(found_items) == 2:
        score = 60
    elif len(found_items) <= 4:
        score = 80
    else:
        score = 100
    
    return score, found_items, first_position


def analyze_order(positions: Dict[str, int]) -> dict:
    """STAR 요소 순서 분석"""
    
    ideal_order = ["situation", "task", "action", "result"]
    
    # 위치가 있는 요소만 추출
    present = [(e, p) for e, p in positions.items() if p is not None]
    
    if len(present) < 2:
        return {
            "is_natural": True,
            "actual_order": [],
            "note": "순서 분석에 충분한 요소가 없습니다.",
        }
    
    # 실제 순서
    sorted_elements = sorted(present, key=lambda x: x[1])
    actual_order = [e for e, _ in sorted_elements]
    
    # 이상적인 순서와 비교
    ideal_indices = {e: i for i, e in enumerate(ideal_order)}
    is_natural = all(
        ideal_indices.get(actual_order[i], 0) <= ideal_indices.get(actual_order[i+1], 0)
        for i in range(len(actual_order) - 1)
    )
    
    return {
        "is_natural": is_natural,
        "actual_order": actual_order,
        "note": "순서가 자연스럽습니다." if is_natural else "STAR 순서를 조정해보세요.",
    }


def generate_structure_recommendation(
    elements_found: Dict[str, bool],
    element_scores: Dict[str, int],
    has_numbers: bool,
    order_analysis: dict,
) -> str:
    """구조 개선 권고사항 생성"""
    
    recommendations = []
    
    # 누락된 요소
    if not elements_found.get("situation"):
        recommendations.append("상황(Situation) 설명을 추가하세요. '당시 어떤 상황이었는지' 배경을 먼저 말해주세요.")
    
    if not elements_found.get("task"):
        recommendations.append("과제(Task)를 명확히 하세요. '무엇을 해야 했는지' 목표를 언급해주세요.")
    
    if not elements_found.get("action"):
        recommendations.append("행동(Action)을 구체적으로 설명하세요. '제가 어떻게 했는지'를 자세히 말해주세요.")
    
    if not elements_found.get("result"):
        recommendations.append("결과(Result)를 추가하세요. 어떤 성과를 얻었는지 말해주세요.")
    elif not has_numbers:
        recommendations.append("결과에 숫자를 추가하세요. '30% 개선', '2주 단축' 같은 구체적인 수치가 설득력을 높입니다.")
    
    # 순서 문제
    if not order_analysis.get("is_natural"):
        recommendations.append("STAR 순서를 조정해보세요. 상황 → 과제 → 행동 → 결과 순서가 가장 자연스럽습니다.")
    
    if not recommendations:
        return "STAR 구조가 잘 갖춰져 있습니다. 이 구조를 유지하세요."
    
    return " ".join(recommendations)


def get_structure_assessment(score: int) -> str:
    """구조 점수를 평가로 변환"""
    
    if score >= 80:
        return "excellent"
    elif score >= 60:
        return "good"
    elif score >= 40:
        return "fair"
    else:
        return "needs_improvement"


def get_structure_score_grade(score: int) -> str:
    """구조 점수를 등급(A/B+/B/C+/C/D)으로 변환"""
    
    if score >= 85:
        return "A"
    elif score >= 75:
        return "B+"
    elif score >= 65:
        return "B"
    elif score >= 55:
        return "C+"
    elif score >= 45:
        return "C"
    else:
        return "D"
