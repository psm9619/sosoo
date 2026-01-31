"""
재요청(Refine) API 라우트

사용자가 첫 번째 개선안에 만족하지 않을 때 추가 수정을 요청합니다.
3단계 제한으로 무한 루프를 방지하고 비용을 효율화합니다.

## 재요청 플로우

1단계 (LOOP 2): 방향 확인 - TTS 없이 텍스트만 미리보기
2단계 (LOOP 3): 최종 생성 - TTS 포함, 이후 재요청 불가
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sse_starlette.sse import EventSourceResponse
from typing import AsyncGenerator
import json
import asyncio

from ..schemas import (
    RefineRequest,
    RefinePreviewResponse,
    RefineFinalResponse,
    BaseResponse,
)
from ..dependencies import UserContext, get_user_context
from ..config import Settings, get_settings

# LangGraph 워크플로우 import
from langgraph.workflows.refinement import create_refinement_graph

router = APIRouter(tags=["Refinement"])


@router.post("/refine")
async def refine_improvement(
    request: RefineRequest,
    user_context: UserContext = Depends(get_user_context),
    settings: Settings = Depends(get_settings),
) -> BaseResponse:
    """
    개선안 재생성 요청
    
    사용자의 추가 의도를 반영하여 개선안을 수정합니다.
    
    ## 단계별 동작
    
    ### Stage 1: 방향 프리뷰
    - TTS 없이 수정된 스크립트만 반환
    - 비용: Claude API만 사용 (저비용)
    - 사용자가 OK하면 Stage 2로 진행
    
    ### Stage 2: 최종 생성
    - TTS 포함 전체 재생성
    - 비용: Claude + ElevenLabs
    - 이후 추가 재요청 불가 (can_refine=False)
    
    ## 제한 사항
    
    - 총 재요청 횟수: 최대 2회 (Stage 1 → Stage 2)
    - Session 만료: 24시간
    - Guest 사용자: Stage 1만 가능 (TTS 없음)
    """
    
    # 세션 검증 및 기존 상태 로드
    session_data = await load_session(request.session_id)
    
    if not session_data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "code": "NOT_FOUND_SESSION",
                "message": "Session not found or expired"
            }
        )
    
    # 재요청 가능 여부 확인
    current_refinement_count = session_data.get("refinement_count", 0)
    
    if current_refinement_count >= 2:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "code": "REFINE_LIMIT_EXCEEDED",
                "message": "Maximum refinement attempts (2) exceeded"
            }
        )
    
    # Guest 사용자 Stage 2 제한
    if not user_context.is_authenticated and request.stage == 2:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "code": "FORBIDDEN_GUEST_STAGE2",
                "message": "Guest users can only preview. Please sign in for full TTS."
            }
        )
    
    # Stage에 따른 처리
    if request.stage == 1:
        return await handle_stage1_preview(request, session_data)
    else:
        return await handle_stage2_final(request, session_data, user_context)


async def handle_stage1_preview(
    request: RefineRequest,
    session_data: dict
) -> BaseResponse:
    """
    Stage 1: 방향 프리뷰
    
    TTS 없이 수정된 스크립트만 생성하여 빠르게 피드백을 받습니다.
    Claude API만 사용하므로 비용이 적게 듭니다.
    """
    
    # Refinement 그래프 실행 (preview 모드)
    graph = create_refinement_graph(include_tts=False)
    
    # 기존 상태에 사용자 의도 추가
    refinement_state = {
        **session_data,
        "user_intent": request.user_intent,
        "refinement_stage": 1,
    }
    
    config = {"configurable": {"thread_id": request.session_id}}
    result = await graph.ainvoke(refinement_state, config)
    
    # 응답 생성
    response_data = RefinePreviewResponse(
        session_id=request.session_id,
        preview_script=result.get("refined_script", ""),
        changes_summary=result.get("changes_summary", ""),
        stage=1,
    )
    
    # 세션 상태 업데이트 (refinement_count는 아직 증가 안 함)
    await update_session(request.session_id, {
        "pending_refinement": {
            "user_intent": request.user_intent,
            "preview_script": result.get("refined_script", ""),
        }
    })
    
    return BaseResponse(success=True, data=response_data.model_dump())


async def handle_stage2_final(
    request: RefineRequest,
    session_data: dict,
    user_context: UserContext,
) -> EventSourceResponse:
    """
    Stage 2: 최종 생성
    
    TTS를 포함한 최종 결과를 생성합니다.
    SSE로 진행 상황을 스트리밍합니다.
    """
    
    async def event_generator() -> AsyncGenerator[dict, None]:
        try:
            # 진행 상황 전송
            yield format_sse_event("progress", {
                "step": "refinement",
                "progress": 0,
                "message": "개선안 수정 중..."
            })
            
            # Refinement 그래프 실행 (full 모드 - TTS 포함)
            graph = create_refinement_graph(include_tts=True)
            
            # pending_refinement가 있으면 사용, 없으면 새로 처리
            pending = session_data.get("pending_refinement", {})
            user_intent = pending.get("user_intent") or request.user_intent
            
            refinement_state = {
                **session_data,
                "user_intent": user_intent,
                "refinement_stage": 2,
                "voice_type": session_data.get("voice_type", "default_male"),
            }
            
            config = {"configurable": {"thread_id": request.session_id}}
            
            yield format_sse_event("progress", {
                "step": "refinement",
                "progress": 50,
                "message": "스크립트 수정 완료, 음성 생성 중..."
            })
            
            result = await graph.ainvoke(refinement_state, config)
            
            yield format_sse_event("progress", {
                "step": "tts",
                "progress": 100,
                "message": "완료!"
            })
            
            # 응답 생성
            response_data = RefineFinalResponse(
                session_id=request.session_id,
                improved_script=result.get("refined_script", ""),
                improved_audio_url=result.get("refined_audio_url", ""),
                stage=2,
                can_refine=False,  # 더 이상 재요청 불가
            )
            
            yield format_sse_event("complete", response_data.model_dump())
            
            # 세션 상태 업데이트 (refinement_count 증가)
            asyncio.create_task(update_session(request.session_id, {
                "refinement_count": session_data.get("refinement_count", 0) + 1,
                "improved_script": result.get("refined_script", ""),
                "improved_audio_url": result.get("refined_audio_url", ""),
                "pending_refinement": None,  # 클리어
            }))
            
        except Exception as e:
            yield format_sse_event("error", {
                "code": "REFINE_ERROR",
                "message": str(e)
            })
    
    return EventSourceResponse(event_generator())


def format_sse_event(event_type: str, data: dict) -> dict:
    """SSE 이벤트 포맷"""
    return {
        "event": event_type,
        "data": json.dumps(data, ensure_ascii=False)
    }


async def load_session(session_id: str) -> dict | None:
    """
    세션 데이터 로드
    
    TODO: Supabase에서 세션 조회
    현재는 임시 구현
    """
    # 임시: 메모리 또는 Redis에서 로드
    # 실제 구현에서는 Supabase 조회
    
    # supabase.table("sessions").select("*").eq("session_id", session_id).execute()
    
    # 임시 반환 (테스트용)
    return {
        "session_id": session_id,
        "transcript": "테스트 트랜스크립트",
        "analysis_result": {},
        "improved_script": "테스트 개선안",
        "refinement_count": 0,
        "voice_type": "default_male",
    }


async def update_session(session_id: str, updates: dict) -> None:
    """
    세션 데이터 업데이트
    
    TODO: Supabase에 세션 업데이트
    """
    # supabase.table("sessions").update(updates).eq("session_id", session_id).execute()
    pass
