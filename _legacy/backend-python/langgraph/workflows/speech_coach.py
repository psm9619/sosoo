"""
메인 스피치 코칭 워크플로우

STT → 분석 → 개선안 생성 → TTS 전체 파이프라인을 정의합니다.
LangGraph의 StateGraph를 사용하여 각 노드를 연결합니다.

## 워크플로우 구조

```
[START]
    │
    ▼
┌─────────────────┐
│  Load Context   │  ← RAG: Progressive Context
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│      STT        │  ← Whisper API
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│    Analysis     │  ← ReAct: 도구 사용 분석
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Improvement   │  ← 개선안 1차 생성
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Reflection    │  ← 자기 검토
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│      TTS        │  ← ElevenLabs API
└────────┬────────┘
         │
         ▼
[END]
```
"""

from langgraph.graph import StateGraph, START, END
from typing import Literal

from ..state import SpeechCoachState
from ..nodes import (
    # Context
    load_progressive_context,
    
    # Core Pipeline
    speech_to_text,
    analyze_content,
    generate_improved_script,
    reflect_on_improvement,
    generate_tts,
    
    # Moderation
    check_moderation,
)


def create_speech_coach_graph(
    use_react: bool = False,
    use_reflection: bool = True,
    use_moderation: bool = True,
) -> StateGraph:
    """
    스피치 코칭 워크플로우 그래프 생성
    
    Args:
        use_react: ReAct 패턴 사용 여부 (기본: False, MVP는 기본 분석)
        use_reflection: Reflection 사용 여부 (기본: True)
        use_moderation: 모더레이션 사용 여부 (기본: True)
    
    Returns:
        StateGraph: 컴파일된 워크플로우 그래프
    """
    
    # 그래프 생성
    graph = StateGraph(SpeechCoachState)
    
    # ===== 노드 등록 =====
    
    # 1. Progressive Context 로드
    graph.add_node("load_context", load_progressive_context)
    
    # 2. STT
    graph.add_node("stt", speech_to_text)
    
    # 3. 모더레이션 (선택적)
    if use_moderation:
        graph.add_node("moderation", check_moderation)
    
    # 4. 분석
    if use_react:
        from ..nodes import analyze_content_react
        graph.add_node("analyze", analyze_content_react)
    else:
        graph.add_node("analyze", analyze_content)
    
    # 5. 개선안 생성
    graph.add_node("improve", generate_improved_script)
    
    # 6. Reflection (선택적)
    if use_reflection:
        graph.add_node("reflect", reflect_on_improvement)
    
    # 7. TTS
    graph.add_node("tts", generate_tts)
    
    # ===== 엣지 연결 =====
    
    # START → load_context
    graph.add_edge(START, "load_context")
    
    # load_context → stt
    graph.add_edge("load_context", "stt")
    
    # stt → moderation 또는 analyze
    if use_moderation:
        graph.add_edge("stt", "moderation")
        graph.add_edge("moderation", "analyze")
    else:
        graph.add_edge("stt", "analyze")
    
    # analyze → improve
    graph.add_edge("analyze", "improve")
    
    # improve → reflect 또는 tts
    if use_reflection:
        graph.add_edge("improve", "reflect")
        graph.add_edge("reflect", "tts")
    else:
        graph.add_edge("improve", "tts")
    
    # tts → END
    graph.add_edge("tts", END)
    
    # 그래프 컴파일
    return graph.compile()


def create_quick_mode_graph() -> StateGraph:
    """
    Quick Mode 워크플로우
    
    최소한의 노드로 빠른 분석을 수행합니다.
    Reflection과 ReAct를 생략하여 속도를 높입니다.
    """
    return create_speech_coach_graph(
        use_react=False,
        use_reflection=False,
        use_moderation=False,
    )


def create_deep_mode_graph() -> StateGraph:
    """
    Deep Mode 워크플로우
    
    모든 기능을 활성화하여 심층 분석을 수행합니다.
    ReAct, Reflection, 모더레이션을 모두 사용합니다.
    """
    return create_speech_coach_graph(
        use_react=True,
        use_reflection=True,
        use_moderation=True,
    )


def should_use_tts(state: SpeechCoachState) -> Literal["tts", "skip_tts"]:
    """TTS 사용 여부 결정"""
    if not state.get("improved_script"):
        return "skip_tts"
    return "tts"


def check_moderation_result(state: SpeechCoachState) -> Literal["continue", "abort"]:
    """모더레이션 결과 확인"""
    flags = state.get("moderation_flags", [])
    severe_flags = ["threat_severe", "illegal_content"]
    if any(f in flag for flag in flags for f in severe_flags):
        return "abort"
    return "continue"


def create_mock_graph() -> StateGraph:
    """테스트용 Mock 그래프"""
    from ..nodes import (
        load_progressive_context_mock,
        speech_to_text_mock,
        analyze_content_mock,
        generate_improved_script_mock,
        reflect_on_improvement_mock,
        generate_tts_mock,
    )
    
    graph = StateGraph(SpeechCoachState)
    
    graph.add_node("load_context", load_progressive_context_mock)
    graph.add_node("stt", speech_to_text_mock)
    graph.add_node("analyze", analyze_content_mock)
    graph.add_node("improve", generate_improved_script_mock)
    graph.add_node("reflect", reflect_on_improvement_mock)
    graph.add_node("tts", generate_tts_mock)
    
    graph.add_edge(START, "load_context")
    graph.add_edge("load_context", "stt")
    graph.add_edge("stt", "analyze")
    graph.add_edge("analyze", "improve")
    graph.add_edge("improve", "reflect")
    graph.add_edge("reflect", "tts")
    graph.add_edge("tts", END)
    
    return graph.compile()
