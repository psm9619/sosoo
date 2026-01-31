"""
분석(Analysis) 노드

Claude API를 사용하여 스피치를 분석합니다.
ReAct 패턴을 적용하여 도구를 활용한 객관적 데이터 수집과 
주관적 피드백 생성을 수행합니다.

## ReAct 패턴이란?

Reasoning + Action의 줄임말로, AI가 바로 답을 내놓는 대신
"이걸 확인해봐야겠다" → "도구로 확인" → "결과를 보니..." → "그럼 다음은..."
처럼 사고 과정을 거치는 패턴입니다.

## 분석 항목

1. 구조/논리성: STAR 구조 준수 여부
2. 필러워드: "어...", "음...", "그..." 등의 비율
3. 말 속도: WPM (Words Per Minute)
4. 자신감/톤: 어조의 확신 정도
5. 구체성: 숫자, 사례 등 구체적 표현
"""

from typing import Any, List
from anthropic import AsyncAnthropic

from ..state import SpeechCoachState, AnalysisResult
from ..tools import (
    analyze_pace,
    analyze_fillers,
    analyze_star_structure,
)
from ..utils.prompts import ANALYSIS_SYSTEM_PROMPT, build_analysis_prompt


async def analyze_content(state: SpeechCoachState) -> dict:
    """
    스피치 분석 노드 (기본 버전)
    
    Claude API를 직접 호출하여 분석을 수행합니다.
    도구 사용 없이 프롬프트만으로 분석하는 간단한 버전입니다.
    MVP에서는 이 버전을 사용하고, 이후 ReAct 버전으로 업그레이드합니다.
    
    Args:
        state: 현재 워크플로우 상태
            - transcript: STT 변환된 텍스트
            - audio_duration: 오디오 길이 (초)
            - previous_sessions: 이전 세션 기록 (Progressive Context)
            - user_patterns: 유저 패턴 분석 결과
            - memory_prompt_text: Memory 시스템 프롬프트 (LTM + STM)
    
    Returns:
        dict: 업데이트할 상태 필드
            - analysis_result: 분석 결과
            - messages: 진행 메시지
    """
    
    transcript = state["transcript"]
    duration = state.get("audio_duration", 60)
    
    # 도구를 사용하여 객관적 지표 먼저 수집
    pace_result = analyze_pace(transcript, duration)
    filler_result = analyze_fillers(transcript)
    structure_result = analyze_star_structure(transcript)
    
    # Progressive Context가 있으면 프롬프트에 추가
    user_patterns = state.get("user_patterns")
    previous_sessions = state.get("previous_sessions", [])
    
    # 🆕 Memory 프롬프트 (LTM + STM 결합)
    memory_prompt = state.get("memory_prompt_text")
    
    # Claude 분석 프롬프트 구성
    prompt = build_analysis_prompt(
        transcript=transcript,
        pace_data=pace_result,
        filler_data=filler_result,
        structure_data=structure_result,
        user_patterns=user_patterns,
        previous_sessions=previous_sessions,
        memory_prompt=memory_prompt,  # 🆕 Memory 프롬프트 추가
    )
    
    # Claude API 호출
    client = AsyncAnthropic()
    
    response = await client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=2000,
        system=ANALYSIS_SYSTEM_PROMPT,
        messages=[
            {"role": "user", "content": prompt}
        ]
    )
    
    # 응답 파싱
    analysis_text = response.content[0].text
    analysis_result = parse_analysis_response(analysis_text, pace_result, filler_result)
    
    return {
        "analysis_result": analysis_result,
        "messages": ["AI 분석 완료"]
    }


async def analyze_content_react(state: SpeechCoachState) -> dict:
    """
    스피치 분석 노드 (ReAct 버전)
    
    Claude가 스스로 필요한 도구를 선택하여 호출하고,
    그 결과를 바탕으로 종합적인 분석을 수행합니다.
    
    이 버전은 더 정교한 분석이 가능하지만, 
    API 호출이 여러 번 발생할 수 있어 비용이 높습니다.
    Growth 단계에서 사용을 권장합니다.
    
    Args:
        state: 현재 워크플로우 상태
    
    Returns:
        dict: 업데이트할 상태 필드
    """
    
    transcript = state["transcript"]
    duration = state.get("audio_duration", 60)
    
    # 도구 정의 (Claude Tools 형식)
    tools = [
        {
            "name": "analyze_pace",
            "description": "말 속도(WPM)를 측정합니다. 목표 범위는 120-170 WPM입니다.",
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
            "name": "analyze_fillers",
            "description": "필러워드(어..., 음..., 그...)를 감지합니다. 목표는 전체의 4% 이하입니다.",
            "input_schema": {
                "type": "object",
                "properties": {
                    "transcript": {"type": "string", "description": "분석할 텍스트"}
                },
                "required": ["transcript"]
            }
        },
        {
            "name": "analyze_star_structure",
            "description": "STAR 구조(Situation-Task-Action-Result)를 분석합니다.",
            "input_schema": {
                "type": "object",
                "properties": {
                    "transcript": {"type": "string", "description": "분석할 텍스트"}
                },
                "required": ["transcript"]
            }
        }
    ]
    
    # ReAct 시스템 프롬프트
    react_system_prompt = """당신은 전문 스피치 코치입니다.

사용자의 답변을 분석할 때, 주어진 도구들을 활용해서 객관적인 데이터를 수집하세요.
단순히 느낌으로 판단하지 말고, 도구를 사용해서 정확한 수치를 확인한 후 피드백하세요.

분석 순서:
1. 전체적인 인상을 파악합니다
2. 도구를 호출해서 객관적 데이터를 수집합니다
3. 데이터를 바탕으로 구체적인 피드백을 작성합니다

최종 분석 결과는 다음 JSON 형식으로 작성해주세요:
{
    "scores": {
        "logic_structure": "A/B+/B/C+/C/D",
        "filler_words": "...",
        "speaking_pace": "...",
        "confidence_tone": "...",
        "content_specificity": "..."
    },
    "suggestions": [
        {"priority": 1, "category": "pace", "suggestion": "...", "impact": "..."},
        ...
    ],
    "structure_analysis": "STAR 구조 분석 설명",
    "progressive_note": "이전 세션 대비 변화 (있는 경우)"
}
"""
    
    # Claude API 호출 (도구 사용 가능)
    client = AsyncAnthropic()
    
    messages = [
        {"role": "user", "content": f"다음 면접 답변을 분석해주세요.\n\n{transcript}\n\n오디오 길이: {duration}초"}
    ]
    
    # 도구 호출 루프 (최대 5회)
    tool_results = {}
    
    for iteration in range(5):
        response = await client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=2000,
            system=react_system_prompt,
            tools=tools,
            messages=messages,
        )
        
        # 도구 호출이 있는지 확인
        tool_calls = [block for block in response.content if block.type == "tool_use"]
        
        if not tool_calls:
            # 도구 호출 없으면 최종 답변
            break
        
        # 도구 실행 및 결과 추가
        for tool_call in tool_calls:
            tool_name = tool_call.name
            tool_input = tool_call.input
            
            # 실제 도구 함수 호출
            if tool_name == "analyze_pace":
                result = analyze_pace(tool_input["transcript"], tool_input["duration_seconds"])
            elif tool_name == "analyze_fillers":
                result = analyze_fillers(tool_input["transcript"])
            elif tool_name == "analyze_star_structure":
                result = analyze_star_structure(tool_input["transcript"])
            else:
                result = {"error": f"Unknown tool: {tool_name}"}
            
            tool_results[tool_name] = result
            
            # 메시지에 도구 결과 추가
            messages.append({"role": "assistant", "content": response.content})
            messages.append({
                "role": "user",
                "content": [
                    {
                        "type": "tool_result",
                        "tool_use_id": tool_call.id,
                        "content": str(result)
                    }
                ]
            })
    
    # 최종 텍스트 응답 추출
    final_text = ""
    for block in response.content:
        if hasattr(block, "text"):
            final_text = block.text
            break
    
    # 응답 파싱
    analysis_result = parse_analysis_response(
        final_text, 
        tool_results.get("analyze_pace", {}),
        tool_results.get("analyze_fillers", {})
    )
    
    return {
        "analysis_result": analysis_result,
        "messages": ["ReAct 분석 완료"]
    }


def parse_analysis_response(
    response_text: str,
    pace_data: dict,
    filler_data: dict
) -> AnalysisResult:
    """
    Claude 응답을 AnalysisResult 형식으로 파싱
    
    JSON 형식의 응답을 파싱하되, JSON이 아닌 경우
    텍스트에서 정보를 추출합니다.
    """
    import json
    import re
    
    # JSON 블록 찾기
    json_match = re.search(r'\{[\s\S]*\}', response_text)
    
    if json_match:
        try:
            parsed = json.loads(json_match.group())
            
            # metrics는 도구 결과에서 가져옴
            metrics = {
                "words_per_minute": pace_data.get("words_per_minute", 0),
                "filler_count": filler_data.get("filler_count", 0),
                "filler_percentage": filler_data.get("filler_percentage", 0),
                "total_words": pace_data.get("word_count", 0),
                "duration_seconds": pace_data.get("duration_seconds", 0),
            }
            
            return {
                "scores": parsed.get("scores", default_scores()),
                "metrics": metrics,
                "suggestions": parsed.get("suggestions", []),
                "structure_analysis": parsed.get("structure_analysis", ""),
                "moderation_flags": [],
            }
            
        except json.JSONDecodeError:
            pass
    
    # JSON 파싱 실패 시 기본값 반환
    return {
        "scores": default_scores(),
        "metrics": {
            "words_per_minute": pace_data.get("words_per_minute", 0),
            "filler_count": filler_data.get("filler_count", 0),
            "filler_percentage": filler_data.get("filler_percentage", 0),
            "total_words": pace_data.get("word_count", 0),
            "duration_seconds": 0,
        },
        "suggestions": [],
        "structure_analysis": response_text[:500],  # 앞부분만
        "moderation_flags": [],
    }


def default_scores() -> dict:
    """기본 점수 반환"""
    return {
        "logic_structure": "B",
        "filler_words": "B",
        "speaking_pace": "B",
        "confidence_tone": "B",
        "content_specificity": "B",
    }


# ============================================
# 테스트용 Mock
# ============================================

async def analyze_content_mock(state: SpeechCoachState) -> dict:
    """테스트용 Mock 분석"""
    
    return {
        "analysis_result": {
            "scores": {
                "logic_structure": "B+",
                "filler_words": "C+",
                "speaking_pace": "C",
                "confidence_tone": "B",
                "content_specificity": "B+",
            },
            "metrics": {
                "words_per_minute": 185,
                "filler_count": 5,
                "filler_percentage": 4.2,
                "total_words": 120,
                "duration_seconds": 45,
            },
            "suggestions": [
                {
                    "priority": 1,
                    "category": "pace",
                    "suggestion": "말 속도를 10% 정도 낮춰보세요",
                    "impact": "청취자가 내용을 더 잘 이해할 수 있습니다"
                },
                {
                    "priority": 2,
                    "category": "filler",
                    "suggestion": "'어...'를 줄이고 의도적인 멈춤을 사용해보세요",
                    "impact": "더 자신감 있고 준비된 인상을 줍니다"
                },
                {
                    "priority": 3,
                    "category": "structure",
                    "suggestion": "결론(Result)을 먼저 말한 뒤 과정(Action)을 설명해보세요",
                    "impact": "핵심 메시지가 더 명확하게 전달됩니다"
                },
            ],
            "structure_analysis": "STAR 구조 중 Situation과 Action은 명확하나, Task와 Result가 약합니다.",
            "moderation_flags": [],
        },
        "messages": ["[MOCK] AI 분석 완료"]
    }