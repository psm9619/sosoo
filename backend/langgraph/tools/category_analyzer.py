"""
카테고리별 스피치 분석 도구

4가지 카테고리로 스피치를 분석합니다:
1. 전달력 (Delivery): 말 속도, 필러워드, 발음/명확성
2. 구조력 (Structure): 논리적 흐름, STAR 구조, 두괄식
3. 내용력 (Content): 구체성, 숫자/성과, 사례
4. 설득력 (Persuasion): 자신감, 톤, 강조, 감정 전달

각 도구는 ReAct 패턴에서 Claude가 호출할 수 있습니다.
"""

import re
from typing import Dict, List, Optional


# ============================================
# 1. 전달력 (Delivery) 분석
# ============================================

def analyze_delivery(
    transcript: str,
    duration_seconds: float,
    audio_features: Dict = None,
) -> Dict:
    """
    전달력 분석
    
    측정 항목:
    - 말 속도 (WPM): 120-170이 적정
    - 필러워드 비율: 3% 이하가 이상적
    - 문장 완결성: 문장이 완전히 끝나는지
    """
    
    issues = []
    strengths = []
    sub_scores = {}
    
    # --- 1. 말 속도 (WPM) ---
    words = transcript.split()
    word_count = len(words)
    minutes = duration_seconds / 60 if duration_seconds > 0 else 1
    wpm = int(word_count / minutes)
    
    if 120 <= wpm <= 170:
        wpm_score = 100
        strengths.append(f"말 속도 적정 ({wpm} WPM)")
    elif 100 <= wpm < 120 or 170 < wpm <= 200:
        wpm_score = 75
        if wpm < 120:
            issues.append(f"말 속도 약간 느림 ({wpm} WPM, 목표: 120-170)")
        else:
            issues.append(f"말 속도 약간 빠름 ({wpm} WPM, 목표: 120-170)")
    elif 80 <= wpm < 100 or 200 < wpm <= 230:
        wpm_score = 50
        if wpm < 100:
            issues.append(f"말 속도 느림 ({wpm} WPM)")
        else:
            issues.append(f"말 속도 빠름 ({wpm} WPM)")
    else:
        wpm_score = 25
        issues.append(f"말 속도 조절 필요 ({wpm} WPM)")
    
    sub_scores["말 속도"] = wpm_score
    sub_scores["wpm"] = wpm
    
    # --- 2. 필러워드 비율 ---
    filler_patterns = [
        r'\b어+\b', r'\b음+\b', r'\b그+\b', r'\b저+\b',
        r'\b뭐+\b', r'\b이제\b', r'\b약간\b', r'\b좀\b',
        r'\b그러니까\b', r'\b아니\b', r'\b근데\b',
    ]
    
    filler_count = 0
    for pattern in filler_patterns:
        filler_count += len(re.findall(pattern, transcript, re.IGNORECASE))
    
    filler_percentage = (filler_count / word_count * 100) if word_count > 0 else 0
    
    if filler_percentage <= 3:
        filler_score = 100
        strengths.append(f"필러워드 적음 ({filler_percentage:.1f}%)")
    elif filler_percentage <= 5:
        filler_score = 75
        issues.append(f"필러워드 약간 많음 ({filler_percentage:.1f}%, 목표: 3% 이하)")
    elif filler_percentage <= 8:
        filler_score = 50
        issues.append(f"필러워드 많음 ({filler_percentage:.1f}%)")
    else:
        filler_score = 25
        issues.append(f"필러워드 매우 많음 ({filler_percentage:.1f}%)")
    
    sub_scores["필러워드"] = filler_score
    sub_scores["filler_count"] = filler_count
    sub_scores["filler_percentage"] = round(filler_percentage, 1)
    
    # --- 3. 문장 완결성 ---
    sentences = re.split(r'[.!?。]', transcript)
    complete_sentences = [s for s in sentences if len(s.strip()) > 10]
    incomplete_count = sum(1 for s in complete_sentences if s.strip().endswith(('는', '고', '면', '서')))
    
    if len(complete_sentences) > 0:
        incomplete_ratio = incomplete_count / len(complete_sentences)
        if incomplete_ratio <= 0.1:
            sentence_score = 100
            strengths.append("문장 완결성 좋음")
        elif incomplete_ratio <= 0.2:
            sentence_score = 75
        elif incomplete_ratio <= 0.3:
            sentence_score = 50
            issues.append("문장이 완결되지 않는 경우가 있음")
        else:
            sentence_score = 25
            issues.append("문장 완결성 부족")
    else:
        sentence_score = 50
    
    sub_scores["문장 완결성"] = sentence_score
    
    # --- 종합 점수 계산 ---
    total_score = int(
        wpm_score * 0.4 +
        filler_score * 0.4 +
        sentence_score * 0.2
    )
    
    return {
        "score": total_score,
        "sub_scores": sub_scores,
        "issues": issues,
        "strengths": strengths,
        "metrics": {
            "wpm": wpm,
            "filler_count": filler_count,
            "filler_percentage": round(filler_percentage, 1),
            "word_count": word_count,
        }
    }


# ============================================
# 2. 구조력 (Structure) 분석
# ============================================

def analyze_structure(transcript: str) -> Dict:
    """
    구조력 분석
    
    측정 항목:
    - STAR 구조 준수: Situation, Task, Action, Result
    - 두괄식 표현: 결론을 먼저 말하는지
    - 논리적 연결어 사용
    """
    
    issues = []
    strengths = []
    sub_scores = {}
    text_lower = transcript.lower()
    
    # --- 1. STAR 구조 분석 ---
    star_elements = {
        "situation": False,
        "task": False,
        "action": False,
        "result": False,
    }
    
    situation_patterns = [r'당시', r'그때', r'상황', r'배경', r'처음', r'시작', r'있었는데', r'있었습니다', r'에서']
    task_patterns = [r'목표', r'해야', r'필요', r'과제', r'문제', r'요구', r'역할', r'담당', r'맡']
    action_patterns = [r'했습니다', r'진행', r'수행', r'실행', r'구현', r'개발', r'해서', r'하여', r'통해', r'적용']
    result_patterns = [r'결과', r'성과', r'달성', r'개선', r'향상', r'증가', r'감소', r'%', r'퍼센트', r'배', r'만큼']
    
    for pattern in situation_patterns:
        if re.search(pattern, text_lower):
            star_elements["situation"] = True
            break
    for pattern in task_patterns:
        if re.search(pattern, text_lower):
            star_elements["task"] = True
            break
    for pattern in action_patterns:
        if re.search(pattern, text_lower):
            star_elements["action"] = True
            break
    for pattern in result_patterns:
        if re.search(pattern, text_lower):
            star_elements["result"] = True
            break
    
    star_count = sum(star_elements.values())
    star_score = int(star_count / 4 * 100)
    
    missing_elements = [k.upper() for k, v in star_elements.items() if not v]
    if missing_elements:
        issues.append(f"STAR 구조 부족: {', '.join(missing_elements)} 없음")
    else:
        strengths.append("STAR 구조 완벽히 갖춤")
    
    sub_scores["STAR 구조"] = star_score
    sub_scores["star_elements"] = star_elements
    
    # --- 2. 두괄식 분석 ---
    sentences = re.split(r'[.!?。]', transcript)
    first_sentences = ' '.join(sentences[:2]) if sentences else ''
    
    conclusion_first_patterns = [r'^저는', r'^결론', r'^핵심', r'^요약하면', r'^말씀드리면', r'입니다$', r'습니다$', r'였습니다$']
    is_conclusion_first = any(re.search(pattern, first_sentences) for pattern in conclusion_first_patterns)
    
    if is_conclusion_first:
        dugu_score = 100
        strengths.append("두괄식 표현 사용")
    else:
        dugu_score = 50
        issues.append("두괄식 표현 부족 (결론을 먼저 말하면 좋음)")
    
    sub_scores["두괄식"] = dugu_score
    
    # --- 3. 논리적 연결어 ---
    connectors = [r'따라서', r'그래서', r'결과적으로', r'그러므로', r'왜냐하면', r'때문에', r'덕분에', r'첫째', r'둘째', r'마지막으로', r'또한', r'그리고']
    connector_count = sum(len(re.findall(pattern, text_lower)) for pattern in connectors)
    
    if connector_count >= 3:
        connector_score = 100
        strengths.append(f"논리적 연결어 잘 사용 ({connector_count}개)")
    elif connector_count >= 2:
        connector_score = 75
    elif connector_count >= 1:
        connector_score = 50
        issues.append("논리적 연결어 부족")
    else:
        connector_score = 25
        issues.append("논리적 연결어 없음")
    
    sub_scores["연결어"] = connector_score
    sub_scores["connector_count"] = connector_count
    
    total_score = int(star_score * 0.5 + dugu_score * 0.3 + connector_score * 0.2)
    
    return {
        "score": total_score,
        "sub_scores": sub_scores,
        "issues": issues,
        "strengths": strengths,
        "star_elements": star_elements,
    }


# ============================================
# 3. 내용력 (Content) 분석
# ============================================

def analyze_content(transcript: str) -> Dict:
    """
    내용력 분석
    
    측정 항목:
    - 구체적 숫자/성과 언급
    - 구체적 사례/경험
    - 기술/도구 언급
    """
    
    issues = []
    strengths = []
    sub_scores = {}
    
    words = transcript.split()
    word_count = len(words)
    
    # --- 1. 숫자/성과 언급 ---
    number_patterns = [r'\d+%', r'\d+퍼센트', r'\d+배', r'\d+만', r'\d+억', r'\d+명', r'\d+개', r'\d+건', r'\d+초', r'\d+분', r'\d+시간', r'\d+일', r'\d+주', r'\d+개월']
    
    number_mentions = []
    for pattern in number_patterns:
        matches = re.findall(pattern, transcript)
        number_mentions.extend(matches)
    
    number_count = len(number_mentions)
    
    if number_count >= 3:
        number_score = 100
        strengths.append(f"구체적 숫자 잘 사용 ({number_count}개: {', '.join(number_mentions[:3])})")
    elif number_count >= 2:
        number_score = 75
        strengths.append(f"숫자 언급 있음 ({number_count}개)")
    elif number_count >= 1:
        number_score = 50
        issues.append(f"숫자 언급 부족 ({number_count}개, 목표: 2-3개)")
    else:
        number_score = 25
        issues.append("구체적 숫자 없음 (성과를 수치로 표현하면 좋음)")
    
    sub_scores["숫자/성과"] = number_score
    sub_scores["number_count"] = number_count
    sub_scores["number_mentions"] = number_mentions[:5]
    
    # --- 2. 구체적 사례 ---
    example_patterns = [r'예를 들어', r'예를 들면', r'예시로', r'실제로', r'구체적으로', r'프로젝트', r'경험', r'사례', r'A회사', r'B팀', r'당시']
    example_count = sum(len(re.findall(pattern, transcript, re.IGNORECASE)) for pattern in example_patterns)
    
    if example_count >= 2:
        example_score = 100
        strengths.append("구체적 사례 제시")
    elif example_count >= 1:
        example_score = 70
    else:
        example_score = 40
        issues.append("구체적 사례 부족")
    
    sub_scores["구체적 사례"] = example_score
    
    # --- 3. 전문성 표현 ---
    tech_patterns = [r'python', r'java', r'javascript', r'react', r'node', r'sql', r'database', r'api', r'서버', r'클라이언트', r'애자일', r'스크럼', r'칸반', r'CI/CD', r'DevOps', r'git', r'docker', r'aws', r'gcp', r'azure', r'KPI', r'ROI', r'매출', r'비용', r'효율']
    tech_count = sum(len(re.findall(pattern, transcript, re.IGNORECASE)) for pattern in tech_patterns)
    
    if tech_count >= 3:
        tech_score = 100
        strengths.append(f"전문 용어 적절히 사용 ({tech_count}개)")
    elif tech_count >= 1:
        tech_score = 70
    else:
        tech_score = 50
    
    sub_scores["전문성"] = tech_score
    
    total_score = int(number_score * 0.4 + example_score * 0.35 + tech_score * 0.25)
    
    return {
        "score": total_score,
        "sub_scores": sub_scores,
        "issues": issues,
        "strengths": strengths,
    }


# ============================================
# 4. 설득력 (Persuasion) 분석
# ============================================

def analyze_persuasion(transcript: str) -> Dict:
    """
    설득력 분석
    
    측정 항목:
    - 자신감 있는 표현
    - 불필요한 겸양/부정 표현
    - 강조/확신 표현
    """
    
    issues = []
    strengths = []
    sub_scores = {}
    text_lower = transcript.lower()
    
    # --- 1. 자신감 표현 ---
    confident_patterns = [r'확신', r'자신있', r'잘 할 수 있', r'능력', r'성공적', r'효과적', r'입증', r'검증', r'했습니다', r'달성했', r'이뤘']
    confident_count = sum(len(re.findall(pattern, text_lower)) for pattern in confident_patterns)
    
    if confident_count >= 3:
        confident_score = 100
        strengths.append("자신감 있는 표현")
    elif confident_count >= 2:
        confident_score = 80
    elif confident_count >= 1:
        confident_score = 60
    else:
        confident_score = 40
        issues.append("자신감 있는 표현 부족")
    
    sub_scores["자신감 표현"] = confident_score
    
    # --- 2. 불필요한 겸양 표현 ---
    humble_patterns = [r'잘 모르', r'부족', r'미흡', r'아직', r'것 같', r'일 수도', r'할지도', r'그냥', r'별로', r'사실', r'죄송', r'실례']
    humble_count = sum(len(re.findall(pattern, text_lower)) for pattern in humble_patterns)
    
    if humble_count == 0:
        humble_score = 100
        strengths.append("불필요한 겸양 없음")
    elif humble_count <= 1:
        humble_score = 80
    elif humble_count <= 2:
        humble_score = 60
        issues.append(f"불필요한 겸양 표현 감지 ({humble_count}회)")
    else:
        humble_score = 40
        issues.append(f"겸양 표현 많음 ({humble_count}회) - 자신감 있게!")
    
    sub_scores["겸양 표현"] = humble_score
    sub_scores["humble_count"] = humble_count
    
    # --- 3. 강조 표현 ---
    emphasis_patterns = [r'특히', r'가장', r'핵심', r'중요', r'반드시', r'꼭', r'확실히', r'분명히', r'최고', r'최선', r'유일']
    emphasis_count = sum(len(re.findall(pattern, text_lower)) for pattern in emphasis_patterns)
    
    if emphasis_count >= 2:
        emphasis_score = 100
        strengths.append(f"강조 표현 적절히 사용 ({emphasis_count}개)")
    elif emphasis_count >= 1:
        emphasis_score = 70
    else:
        emphasis_score = 50
        issues.append("강조 표현 부족 (핵심을 강조하면 좋음)")
    
    sub_scores["강조 표현"] = emphasis_score
    
    total_score = int(confident_score * 0.4 + humble_score * 0.35 + emphasis_score * 0.25)
    
    return {
        "score": total_score,
        "sub_scores": sub_scores,
        "issues": issues,
        "strengths": strengths,
    }


# ============================================
# 통합 분석 함수
# ============================================

def analyze_all_categories(
    transcript: str,
    duration_seconds: float = 60,
) -> Dict[str, Dict]:
    """4개 카테고리 모두 분석"""
    
    return {
        "delivery": analyze_delivery(transcript, duration_seconds),
        "structure": analyze_structure(transcript),
        "content": analyze_content(transcript),
        "persuasion": analyze_persuasion(transcript),
    }


def get_category_summary(results: Dict[str, Dict]) -> Dict:
    """분석 결과 요약 생성"""
    
    scores = {}
    all_issues = []
    all_strengths = []
    
    for category, data in results.items():
        scores[category] = data["score"]
        all_issues.extend([(category, issue) for issue in data.get("issues", [])])
        all_strengths.extend([(category, strength) for strength in data.get("strengths", [])])
    
    avg_score = sum(scores.values()) / len(scores) if scores else 0
    sorted_scores = sorted(scores.items(), key=lambda x: x[1])
    
    return {
        "scores": scores,
        "average_score": round(avg_score, 1),
        "weakest_category": sorted_scores[0] if sorted_scores else None,
        "strongest_category": sorted_scores[-1] if sorted_scores else None,
        "total_issues": len(all_issues),
        "total_strengths": len(all_strengths),
        "top_issues": all_issues[:3],
        "top_strengths": all_strengths[:3],
    }


# ============================================
# Claude Tools 형식 정의
# ============================================

CATEGORY_TOOLS_DEFINITION = [
    {
        "name": "analyze_delivery",
        "description": "전달력 분석: 말 속도(WPM), 필러워드 비율, 문장 완결성을 측정합니다.",
        "input_schema": {
            "type": "object",
            "properties": {
                "transcript": {"type": "string", "description": "분석할 텍스트"},
                "duration_seconds": {"type": "number", "description": "오디오 길이(초)"}
            },
            "required": ["transcript", "duration_seconds"]
        }
    },
    {
        "name": "analyze_structure",
        "description": "구조력 분석: STAR 구조 준수, 두괄식 표현, 논리적 연결어를 분석합니다.",
        "input_schema": {
            "type": "object",
            "properties": {
                "transcript": {"type": "string", "description": "분석할 텍스트"}
            },
            "required": ["transcript"]
        }
    },
    {
        "name": "analyze_content",
        "description": "내용력 분석: 구체적 숫자/성과, 사례, 전문성 표현을 분석합니다.",
        "input_schema": {
            "type": "object",
            "properties": {
                "transcript": {"type": "string", "description": "분석할 텍스트"}
            },
            "required": ["transcript"]
        }
    },
    {
        "name": "analyze_persuasion",
        "description": "설득력 분석: 자신감 표현, 불필요한 겸양, 강조 표현을 분석합니다.",
        "input_schema": {
            "type": "object",
            "properties": {
                "transcript": {"type": "string", "description": "분석할 텍스트"}
            },
            "required": ["transcript"]
        }
    },
]