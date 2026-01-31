"""
Claude 프롬프트 템플릿

분석, 개선안 생성, Reflection 등에 사용되는 프롬프트를 정의합니다.
프롬프트 엔지니어링의 핵심 요소들을 포함합니다.
"""

from typing import Optional, List, Dict, Any


# ============================================
# 시스템 프롬프트
# ============================================

ANALYSIS_SYSTEM_PROMPT = """당신은 10년 경력의 전문 스피치 코치입니다.
면접, 발표, 프레젠테이션 코칭 전문가로서 수천 명을 코칭한 경험이 있습니다.

## 분석 원칙

1. **객관적 데이터 기반**: 느낌보다 수치로 판단합니다
2. **실용적 조언**: 바로 적용할 수 있는 구체적인 팁을 제공합니다
3. **긍정적 톤**: 비판보다 발전 가능성에 초점을 맞춥니다
4. **우선순위**: 가장 효과적인 1-2가지 개선점에 집중합니다

## 평가 기준

- 논리/구조: STAR 구조 준수, 두괄식 표현
- 필러워드: 전체의 4% 이하가 이상적
- 말 속도: 120-170 WPM이 이상적
- 자신감: 어조의 확신, 불필요한 겸양 회피
- 구체성: 숫자, 사례, 구체적 결과 포함

## 점수 체계

A: 탁월함 (거의 수정 불필요)
B+: 좋음 (미세 조정만 필요)
B: 양호 (몇 가지 개선점 있음)
C+: 보통 (명확한 개선점 있음)
C: 개선 필요 (여러 문제점 있음)
D: 많은 개선 필요"""


IMPROVEMENT_SYSTEM_PROMPT = """당신은 스피치 작가입니다.
원본의 개성과 메시지를 살리면서, 전달력을 높이는 것이 목표입니다.

## 개선 원칙

1. **메시지 보존**: 원본이 말하고자 하는 핵심은 절대 변경하지 않습니다
2. **말투 유지**: 화자의 어휘, 표현 스타일을 최대한 유지합니다
3. **자연스러움**: 실제로 따라 말할 수 있는 자연스러운 문장을 씁니다
4. **최소 개입**: 문제가 있는 부분만 수정하고, 잘된 부분은 그대로 둡니다

## 금지 사항

- 원본에 없는 내용 추가하지 않기
- 너무 교과서적/격식체로 바꾸지 않기
- 전문 용어나 어려운 표현 넣지 않기
- 원본보다 지나치게 길어지지 않기

## 출력 형식

개선된 스크립트만 출력하세요. 설명이나 서두는 넣지 마세요."""


REFLECTION_SYSTEM_PROMPT = """당신은 스피치 코칭 품질 검토자입니다.
개선안이 원본의 의도를 잘 살렸는지, 실제로 사용할 수 있는지 검토합니다.

## 검토 기준

1. **메시지 보존**: 원본의 핵심 메시지가 유지되었는가?
2. **개선 반영**: 분석에서 지적한 문제점이 실제로 개선되었는가?
3. **개성 유지**: 원본의 말투/스타일이 너무 많이 바뀌지 않았는가?
4. **자연스러움**: 실제로 따라 말할 수 있는 자연스러운 문장인가?

## 출력 형식 (JSON)

{
    "passes_review": true/false,
    "issues_found": ["문제점1", "문제점2"],
    "suggested_fixes": ["수정사항1"],
    "final_script": "수정된 최종 스크립트 (문제 없으면 빈 문자열)"
}"""


# ============================================
# 프롬프트 빌더 함수
# ============================================

def build_analysis_prompt(
    transcript: str,
    pace_data: dict,
    filler_data: dict,
    structure_data: dict = None,
    user_patterns: dict = None,
    previous_sessions: List[dict] = None,
) -> str:
    """
    분석 프롬프트 구성
    
    도구에서 수집한 객관적 데이터와 Progressive Context를 포함합니다.
    """
    
    prompt_parts = []
    
    # 1. 원본 텍스트
    prompt_parts.append(f"""## 분석할 답변

{transcript}""")
    
    # 2. 객관적 측정 데이터
    prompt_parts.append(f"""
## 측정 데이터 (도구 분석 결과)

### 말 속도
- WPM: {pace_data.get('words_per_minute', 'N/A')}
- 평가: {pace_data.get('assessment', 'N/A')}
- 목표 범위: {pace_data.get('target_range', '120-170 WPM')}

### 필러워드
- 개수: {filler_data.get('filler_count', 0)}개
- 비율: {filler_data.get('filler_percentage', 0)}%
- 평가: {filler_data.get('assessment', 'N/A')}""")
    
    # 3. STAR 구조 데이터 (있으면)
    if structure_data:
        elements = structure_data.get('elements_found', {})
        prompt_parts.append(f"""
### STAR 구조
- Situation: {'✓' if elements.get('situation') else '✗'}
- Task: {'✓' if elements.get('task') else '✗'}
- Action: {'✓' if elements.get('action') else '✗'}
- Result: {'✓' if elements.get('result') else '✗'}
- 숫자 포함: {'예' if structure_data.get('has_numbers') else '아니오'}""")
    
    # 4. Progressive Context (있으면)
    if user_patterns and not user_patterns.get('is_new_user'):
        prompt_parts.append(f"""
## 유저 히스토리 (Progressive Context)

- 세션 횟수: {user_patterns.get('session_count', 0)}회
- 반복 문제점: {', '.join(user_patterns.get('recurring_issues', [])) or '없음'}
- 개선 추세: {user_patterns.get('improvement_trend', 'unknown')}

이 유저에게는 위 반복 패턴에 대한 진전 여부를 확인하고, 
격려하거나 추가 조언을 해주세요.""")
    
    # 5. 분석 요청
    prompt_parts.append("""
## 요청사항

위 데이터를 바탕으로 종합 분석을 수행하고, 다음 JSON 형식으로 응답해주세요:

{
    "scores": {
        "logic_structure": "A/B+/B/C+/C/D",
        "filler_words": "...",
        "speaking_pace": "...",
        "confidence_tone": "...",
        "content_specificity": "..."
    },
    "suggestions": [
        {"priority": 1, "category": "카테고리", "suggestion": "제안", "impact": "효과"}
    ],
    "structure_analysis": "STAR 구조 분석 설명",
    "progressive_note": "이전 세션 대비 변화 (해당되는 경우)"
}""")
    
    return "\n".join(prompt_parts)


def build_improvement_prompt(
    transcript: str,
    analysis: dict,
    question: Optional[str] = None,
) -> str:
    """개선안 생성 프롬프트 구성"""
    
    prompt_parts = []
    
    # 1. 질문 (있으면)
    if question:
        prompt_parts.append(f"## 면접 질문\n{question}\n")
    
    # 2. 원본 답변
    prompt_parts.append(f"""## 원본 답변

{transcript}""")
    
    # 3. 분석 결과 요약
    suggestions = analysis.get('suggestions', [])
    if suggestions:
        suggestion_text = "\n".join(
            f"- [{s.get('category', '')}] {s.get('suggestion', '')}"
            for s in suggestions[:3]  # 상위 3개만
        )
        prompt_parts.append(f"""
## 분석에서 발견된 개선점

{suggestion_text}""")
    
    # 4. 개선 요청
    prompt_parts.append("""
## 요청사항

위 분석 결과를 바탕으로 개선된 스크립트를 작성해주세요.

주의사항:
1. 원본의 핵심 메시지와 말투를 유지하세요
2. 위에서 지적한 문제점만 개선하세요
3. 실제로 따라 말할 수 있는 자연스러운 문장을 쓰세요
4. 설명 없이 개선된 스크립트만 출력하세요""")
    
    return "\n".join(prompt_parts)


def build_reflection_prompt(
    original: str,
    draft: str,
    analysis: dict,
) -> str:
    """Reflection 프롬프트 구성"""
    
    return f"""## 원본 답변

{original}

## 생성된 개선안

{draft}

## 원래 분석에서 지적한 문제점

{_format_suggestions(analysis.get('suggestions', []))}

## 검토 요청

위 개선안이 다음 기준을 충족하는지 검토하고, JSON으로 응답해주세요:

1. 원본의 핵심 메시지가 유지되었는가?
2. 분석에서 지적한 문제점이 실제로 개선되었는가?
3. 원본의 말투/스타일이 너무 많이 바뀌지 않았는가?
4. 실제로 따라 말할 수 있는 자연스러운 문장인가?

{{
    "passes_review": true/false,
    "issues_found": ["발견된 문제점"],
    "suggested_fixes": ["권장 수정사항"],
    "final_script": "수정된 스크립트 (문제 없으면 빈 문자열)"
}}"""


def _format_suggestions(suggestions: List[dict]) -> str:
    """개선 제안 포맷팅"""
    if not suggestions:
        return "없음"
    
    return "\n".join(
        f"- {s.get('suggestion', '')}"
        for s in suggestions[:5]
    )
