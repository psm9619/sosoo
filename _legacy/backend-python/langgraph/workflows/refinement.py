"""
재요청(Refinement) 워크플로우

사용자가 첫 번째 개선안에 만족하지 않을 때 추가 수정을 수행합니다.
3단계 비용 최적화 전략을 적용합니다.

## 3단계 비용 최적화

### Loop 1 (초기 분석) - 이미 완료된 상태
- Full Cost: STT + Claude + TTS
- 결과: 첫 번째 개선안

### Loop 2 (Stage 1: 프리뷰) - 이 워크플로우
- Low Cost: Claude만 (TTS 없음)
- 결과: 방향 프리뷰 (텍스트만)
- 사용자가 OK하면 Stage 2로

### Loop 3 (Stage 2: 최종) - 이 워크플로우
- Full Cost: Claude + TTS
- 결과: 최종 개선안 (음성 포함)
- 이후 재요청 불가
"""

from langgraph.graph import StateGraph, START, END

from ..state import RefinementState
from ..nodes.improvement import generate_refined_script
from ..nodes.tts import generate_tts


def create_refinement_graph(include_tts: bool = True) -> StateGraph:
    """
    재요청 워크플로우 그래프 생성
    
    Args:
        include_tts: TTS 포함 여부
            - True: Stage 2 (최종 생성, TTS 포함)
            - False: Stage 1 (프리뷰, TTS 없음)
    
    Returns:
        StateGraph: 컴파일된 워크플로우 그래프
    """
    
    graph = StateGraph(RefinementState)
    
    # 노드 등록
    graph.add_node("refine_script", refine_script_node)
    
    if include_tts:
        graph.add_node("tts", tts_for_refinement)
    
    # 엣지 연결
    graph.add_edge(START, "refine_script")
    
    if include_tts:
        graph.add_edge("refine_script", "tts")
        graph.add_edge("tts", END)
    else:
        graph.add_edge("refine_script", END)
    
    return graph.compile()


async def refine_script_node(state: RefinementState) -> dict:
    """
    스크립트 재생성 노드
    
    사용자의 의도를 반영하여 개선안을 수정합니다.
    """
    from anthropic import AsyncAnthropic
    
    current_script = state["current_script"]
    user_intent = state["user_intent"]
    original_analysis = state.get("original_analysis", {})
    
    # 프롬프트 구성
    prompt = f"""현재 개선안:
{current_script}

사용자의 추가 요청:
{user_intent}

원래 분석에서 발견된 문제점:
{_format_analysis_suggestions(original_analysis)}

위 요청을 반영하여 개선안을 수정해주세요.

주의사항:
1. 사용자의 의도를 정확히 반영하세요
2. 기존에 잘 개선된 부분은 유지하세요
3. 자연스럽게 말할 수 있는 문장을 유지하세요

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
        "messages": ["스크립트 수정 완료"]
    }


async def tts_for_refinement(state: RefinementState) -> dict:
    """
    재요청용 TTS 노드
    
    RefinementState를 SpeechCoachState 형식으로 변환하여 TTS 처리합니다.
    """
    from ..nodes.tts import generate_tts
    
    # TTS 노드에 필요한 형태로 상태 구성
    tts_state = {
        "session_id": state["session_id"],
        "improved_script": state["refined_script"],
        "voice_type": state.get("voice_type", "default_male"),
        "voice_clone_id": state.get("voice_clone_id"),
    }
    
    result = await generate_tts(tts_state)
    
    return {
        "refined_audio_url": result.get("improved_audio_url", ""),
        "messages": ["음성 생성 완료"]
    }


def parse_refinement_response(response_text: str) -> tuple[str, str]:
    """
    재요청 응답에서 변경사항과 스크립트 분리
    """
    import re
    
    # ## 패턴으로 분리 시도
    parts = re.split(r'##\s*수정된\s*스크립트', response_text, flags=re.IGNORECASE)
    
    if len(parts) >= 2:
        changes_part = parts[0]
        script_part = parts[1]
        
        # 변경 사항 추출
        changes_match = re.search(
            r'##\s*변경\s*사항\s*\n(.*)',
            changes_part,
            re.DOTALL | re.IGNORECASE
        )
        changes_summary = changes_match.group(1).strip() if changes_match else ""
        
        return changes_summary, script_part.strip()
    
    # 분리 실패 시 전체를 스크립트로
    return "", response_text.strip()


def _format_analysis_suggestions(analysis: dict) -> str:
    """분석 결과의 개선 제안 포맷팅"""
    suggestions = analysis.get("suggestions", [])
    
    if not suggestions:
        return "없음"
    
    return "\n".join(
        f"- {s.get('suggestion', '')}"
        for s in suggestions[:3]
    )


# ============================================
# Stage별 편의 함수
# ============================================

def create_preview_graph() -> StateGraph:
    """
    Stage 1: 프리뷰 그래프
    
    TTS 없이 수정된 스크립트만 생성합니다.
    """
    return create_refinement_graph(include_tts=False)


def create_final_graph() -> StateGraph:
    """
    Stage 2: 최종 생성 그래프
    
    TTS를 포함한 최종 결과를 생성합니다.
    """
    return create_refinement_graph(include_tts=True)
