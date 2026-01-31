"""
개선안 생성(Improvement) 노드

분석 결과를 바탕으로 개선된 스크립트를 생성합니다.
Reflection 패턴을 적용하여 생성된 개선안의 품질을 검증합니다.

## Reflection 패턴이란?

AI가 자신의 출력을 한 번 더 검토하는 패턴입니다.
사람도 중요한 글을 쓸 때 다시 읽어보며 수정하듯이,
AI도 첫 번째 출력을 검토하고 개선하면 품질이 올라갑니다.

## 처리 흐름
1. generate_improved_script: 1차 개선안 생성
2. reflect_on_improvement: 자기 검토 수행
3. (필요시) 수정된 최종 개선안 반환
"""

from typing import Any
from anthropic import AsyncAnthropic
import json
import re

from ..state import SpeechCoachState
from ..utils.prompts import (
    IMPROVEMENT_SYSTEM_PROMPT,
    REFLECTION_SYSTEM_PROMPT,
    build_improvement_prompt,
    build_reflection_prompt,
)


async def generate_improved_script(state: SpeechCoachState) -> dict:
    """
    개선 스크립트 생성 노드 (1차)
    
    분석 결과를 바탕으로 원본의 개성은 유지하면서
    구조와 전달력만 개선한 스크립트를 생성합니다.
    
    ## 개선 원칙
    
    1. 원본의 핵심 메시지 유지
    2. 화자의 말투/어휘 스타일 보존
    3. 분석에서 지적한 문제점만 수정
    4. 실제로 따라 말할 수 있는 자연스러운 문장
    
    Args:
        state: 현재 워크플로우 상태
            - transcript: 원본 텍스트
            - analysis_result: 분석 결과
            - question: 연습 중인 질문 (선택)
    
    Returns:
        dict: 업데이트할 상태 필드
            - improved_script_draft: 1차 개선안 (Reflection 전)
            - messages: 진행 메시지
    """
    
    transcript = state["transcript"]
    analysis = state["analysis_result"]
    question = state.get("question", "")
    
    # 개선 프롬프트 구성
    prompt = build_improvement_prompt(
        transcript=transcript,
        analysis=analysis,
        question=question,
    )
    
    # Claude API 호출
    client = AsyncAnthropic()
    
    response = await client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=2000,
        system=IMPROVEMENT_SYSTEM_PROMPT,
        messages=[
            {"role": "user", "content": prompt}
        ]
    )
    
    improved_script = response.content[0].text
    
    # 불필요한 서두/마무리 제거 (있다면)
    improved_script = clean_script_output(improved_script)
    
    return {
        "improved_script_draft": improved_script,
        "messages": ["1차 개선안 생성 완료"]
    }


async def reflect_on_improvement(state: SpeechCoachState) -> dict:
    """
    Reflection 노드: 생성된 개선안을 자기 검토
    
    1차 개선안이 다음 기준을 충족하는지 검토합니다:
    
    1. 원본의 핵심 메시지가 유지되었는가?
    2. 분석에서 지적한 문제점이 실제로 개선되었는가?
    3. 원본의 개성/말투가 너무 많이 바뀌지 않았는가?
    4. 실제로 따라 말할 수 있는 자연스러운 문장인가?
    
    문제가 발견되면 수정된 버전을 반환합니다.
    
    Args:
        state: 현재 워크플로우 상태
            - transcript: 원본 텍스트
            - improved_script_draft: 1차 개선안
            - analysis_result: 분석 결과
    
    Returns:
        dict: 업데이트할 상태 필드
            - improved_script: 최종 개선안
            - reflection_notes: 검토 중 발견한 이슈
            - messages: 진행 메시지
    """
    
    transcript = state["transcript"]
    draft = state["improved_script_draft"]
    analysis = state["analysis_result"]
    
    # Reflection 프롬프트 구성
    prompt = build_reflection_prompt(
        original=transcript,
        draft=draft,
        analysis=analysis,
    )
    
    # Claude API 호출
    client = AsyncAnthropic()
    
    response = await client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=2000,
        system=REFLECTION_SYSTEM_PROMPT,
        messages=[
            {"role": "user", "content": prompt}
        ]
    )
    
    reflection_text = response.content[0].text
    
    # Reflection 결과 파싱
    reflection_result = parse_reflection_response(reflection_text)
    
    # 통과 여부에 따라 최종 스크립트 결정
    if reflection_result["passes_review"]:
        # 문제 없으면 1차 개선안 그대로 사용
        final_script = draft
        notes = []
    else:
        # 문제 있으면 수정된 버전 사용
        final_script = reflection_result.get("final_script", draft)
        notes = reflection_result.get("issues_found", [])
    
    return {
        "improved_script": final_script,
        "reflection_notes": notes,
        "messages": ["개선안 품질 검토 완료"]
    }


def clean_script_output(script: str) -> str:
    """
    스크립트 출력 정리
    
    Claude가 추가한 불필요한 서두/마무리를 제거합니다.
    예: "Here's the improved version:", "---" 등
    """
    
    # 흔한 서두 패턴 제거
    patterns_to_remove = [
        r"^(Here'?s?|다음은|아래는).*?:\s*\n*",
        r"^---+\s*\n*",
        r"^\*\*.*?\*\*\s*\n*",
        r"^개선(된|한) (스크립트|버전).*?:\s*\n*",
    ]
    
    result = script
    for pattern in patterns_to_remove:
        result = re.sub(pattern, "", result, flags=re.IGNORECASE | re.MULTILINE)
    
    # 흔한 마무리 패턴 제거
    ending_patterns = [
        r"\n*---+\s*$",
        r"\n*\*\*.*?\*\*\s*$",
        r"\n*(이상입니다|감사합니다)\.?\s*$",
    ]
    
    for pattern in ending_patterns:
        result = re.sub(pattern, "", result, flags=re.IGNORECASE)
    
    return result.strip()


def parse_reflection_response(response_text: str) -> dict:
    """
    Reflection 응답 파싱
    
    JSON 형식의 응답을 파싱합니다.
    JSON이 없으면 텍스트에서 패턴을 찾아 추론합니다.
    """
    
    # JSON 블록 찾기
    json_match = re.search(r'\{[\s\S]*\}', response_text)
    
    if json_match:
        try:
            parsed = json.loads(json_match.group())
            return {
                "passes_review": parsed.get("passes_review", True),
                "issues_found": parsed.get("issues_found", []),
                "suggested_fixes": parsed.get("suggested_fixes", []),
                "final_script": parsed.get("final_script", ""),
            }
        except json.JSONDecodeError:
            pass
    
    # JSON 파싱 실패 시 키워드 기반 추론
    text_lower = response_text.lower()
    
    # 문제 없음 표현들
    passes_keywords = ["문제 없", "통과", "적합", "양호", "passes", "good", "ok"]
    # 문제 있음 표현들
    fails_keywords = ["문제", "수정 필요", "개선 필요", "issues", "problems"]
    
    passes = any(kw in text_lower for kw in passes_keywords)
    fails = any(kw in text_lower for kw in fails_keywords)
    
    return {
        "passes_review": passes and not fails,
        "issues_found": [],
        "suggested_fixes": [],
        "final_script": "",  # 추출 실패 시 빈 문자열
    }


async def generate_refined_script(state: SpeechCoachState) -> dict:
    """
    재요청(Refinement) 시 개선안 재생성
    
    사용자의 추가 의도를 반영하여 개선안을 수정합니다.
    3단계 재요청 플로우의 일부입니다.
    
    Args:
        state: 현재 워크플로우 상태
            - improved_script: 현재 개선안
            - user_intent: 사용자가 원하는 수정 방향
            - analysis_result: 원래 분석 결과
    
    Returns:
        dict: 업데이트할 상태 필드
            - refined_script: 수정된 개선안
            - changes_summary: 변경 사항 요약
            - messages: 진행 메시지
    """
    
    current_script = state.get("improved_script", "")
    user_intent = state.get("user_intent", "")
    analysis = state.get("analysis_result", {})
    
    prompt = f"""현재 개선안:
{current_script}

사용자의 추가 요청:
{user_intent}

위 요청을 반영하여 개선안을 수정해주세요.
변경 사항을 간단히 요약하고, 수정된 스크립트를 제공해주세요.

응답 형식:
## 변경 사항
(무엇을 어떻게 바꿨는지 1-2문장으로)

## 수정된 스크립트
(전체 스크립트)
"""
    
    client = AsyncAnthropic()
    
    response = await client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=2000,
        system="당신은 스피치 코치입니다. 사용자의 의도를 반영하여 개선안을 수정합니다.",
        messages=[
            {"role": "user", "content": prompt}
        ]
    )
    
    response_text = response.content[0].text
    
    # 변경 사항과 스크립트 분리
    changes_summary, refined_script = parse_refinement_response(response_text)
    
    return {
        "refined_script": refined_script,
        "changes_summary": changes_summary,
        "messages": ["개선안 수정 완료"]
    }


def parse_refinement_response(response_text: str) -> tuple[str, str]:
    """
    재요청 응답에서 변경사항과 스크립트 분리
    """
    
    # ## 패턴으로 분리 시도
    parts = re.split(r'##\s*수정된\s*스크립트', response_text, flags=re.IGNORECASE)
    
    if len(parts) >= 2:
        changes_part = parts[0]
        script_part = parts[1]
        
        # 변경 사항 추출
        changes_match = re.search(r'##\s*변경\s*사항\s*\n(.*)', changes_part, re.DOTALL | re.IGNORECASE)
        changes_summary = changes_match.group(1).strip() if changes_match else ""
        
        return changes_summary, script_part.strip()
    
    # 분리 실패 시 전체를 스크립트로
    return "", response_text.strip()


# ============================================
# 테스트용 Mock
# ============================================

async def generate_improved_script_mock(state: SpeechCoachState) -> dict:
    """테스트용 Mock 개선안 생성"""
    
    return {
        "improved_script_draft": """안녕하세요, 저는 5년차 백엔드 개발자 홍길동입니다.

ABC 회사에서 하루 1천만 트랜잭션을 처리하는 결제 시스템을 설계하고 운영하고 있습니다.

가장 큰 성과는 레거시 시스템 마이그레이션 프로젝트입니다.
다운타임 제로로 전환을 완료하여 연간 운영비용을 40% 절감했습니다.

이 경험을 바탕으로 귀사의 시스템 현대화에 기여하고 싶습니다.""",
        "messages": ["[MOCK] 1차 개선안 생성 완료"]
    }


async def reflect_on_improvement_mock(state: SpeechCoachState) -> dict:
    """테스트용 Mock Reflection"""
    
    return {
        "improved_script": state.get("improved_script_draft", ""),
        "reflection_notes": [],
        "messages": ["[MOCK] 품질 검토 완료 - 문제 없음"]
    }
