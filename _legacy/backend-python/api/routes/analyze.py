"""
분석 API 라우트

스피치 분석의 메인 엔드포인트입니다.
SSE(Server-Sent Events)를 사용하여 실시간 진행 상황을 전달합니다.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sse_starlette.sse import EventSourceResponse
from typing import AsyncGenerator
import json
import asyncio
import uuid

from ..schemas import (
    AnalyzeRequest,
    AnalyzeResponse,
    ProgressEvent,
    BaseResponse,
)
from ..dependencies import UserContext, get_user_context, get_supabase
from ..config import Settings, get_settings

# LangGraph 워크플로우 import
from langgraph.workflows.speech_coach import create_speech_coach_graph
from langgraph.state import SpeechCoachState

router = APIRouter(tags=["Analysis"])


@router.post("/analyze")
async def analyze_speech(
    request: AnalyzeRequest,
    user_context: UserContext = Depends(get_user_context),
    settings: Settings = Depends(get_settings),
) -> EventSourceResponse:
    """
    스피치 분석 API (SSE 스트리밍)
    
    오디오 URL을 받아 STT → 분석 → 개선안 생성 → TTS 파이프라인을 실행합니다.
    각 단계의 진행 상황을 SSE로 실시간 전송합니다.
    
    ## SSE 이벤트 타입
    
    - `progress`: 진행 상황 업데이트
      ```json
      {"step": "stt", "progress": 50, "message": "음성 인식 중..."}
      ```
    
    - `complete`: 분석 완료
      ```json
      {"session_id": "...", "transcript": "...", "analysis": {...}, ...}
      ```
    
    - `error`: 에러 발생
      ```json
      {"code": "AUDIO_TOO_SHORT", "message": "..."}
      ```
    
    ## 인증
    
    - 인증된 사용자: 전체 기능 사용 가능
    - Guest: Quick Mode만 사용 가능, Voice Clone 불가
    """
    
    # Guest 사용자 제한 확인
    if not user_context.is_authenticated:
        if request.mode == "deep":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={
                    "code": "FORBIDDEN_GUEST_DEEP_MODE",
                    "message": "Deep Mode requires authentication. Please sign in."
                }
            )
        if request.voice_type == "cloned":
            # Voice Clone은 인증+동의 필요
            request.voice_type = "default_male"  # 자동 fallback
    
    # 세션 ID 생성
    session_id = str(uuid.uuid4())
    
    # SSE 이벤트 제너레이터
    async def event_generator() -> AsyncGenerator[dict, None]:
        try:
            # 1. STT 단계
            yield format_progress_event("stt", 0, "음성 인식을 시작합니다...")
            
            # LangGraph 워크플로우 생성 및 실행
            graph = create_speech_coach_graph()
            
            # 초기 상태 설정
            initial_state: SpeechCoachState = {
                "session_id": session_id,
                "user_id": user_context.user_id or user_context.guest_session,
                "mode": request.mode,
                "audio_file_path": request.audio_url,
                "voice_type": request.voice_type,
                "question": request.question,
                "project_id": request.project_id,
                "transcript": "",
                "analysis_result": {},
                "improved_script": "",
                "improved_audio_url": "",
                "previous_sessions": [],
                "messages": [],
            }
            
            # 그래프 실행 (스트리밍 모드)
            config = {"configurable": {"thread_id": session_id}}
            
            current_step = "stt"
            async for event in graph.astream(initial_state, config, stream_mode="updates"):
                # 노드별 진행 상황 업데이트
                for node_name, node_output in event.items():
                    
                    # 노드 이름에 따라 step과 progress 결정
                    if "stt" in node_name:
                        current_step = "stt"
                        yield format_progress_event("stt", 100, "음성 인식 완료")
                        yield format_progress_event("analysis", 0, "AI 분석을 시작합니다...")
                    
                    elif "analyze" in node_name or "analysis" in node_name:
                        current_step = "analysis"
                        yield format_progress_event("analysis", 50, "스피치 패턴 분석 중...")
                    
                    elif "improve" in node_name:
                        current_step = "improvement"
                        yield format_progress_event("analysis", 100, "분석 완료")
                        yield format_progress_event("improvement", 0, "개선안 생성 중...")
                    
                    elif "reflect" in node_name:
                        current_step = "reflection"
                        yield format_progress_event("improvement", 50, "개선안 품질 검토 중...")
                    
                    elif "tts" in node_name:
                        current_step = "tts"
                        yield format_progress_event("improvement", 100, "개선안 생성 완료")
                        yield format_progress_event("tts", 0, "음성 생성 중...")
                    
                    # 메시지 업데이트가 있으면 함께 전송
                    if "messages" in node_output and node_output["messages"]:
                        latest_message = node_output["messages"][-1]
                        yield format_progress_event(
                            current_step, 
                            50, 
                            latest_message
                        )
            
            # 최종 상태 가져오기
            final_state = graph.get_state(config).values
            
            yield format_progress_event("tts", 100, "완료!")
            
            # 완료 이벤트 전송
            response_data = AnalyzeResponse(
                session_id=session_id,
                transcript=final_state.get("transcript", ""),
                analysis=final_state.get("analysis_result", {}),
                improved_script=final_state.get("improved_script", ""),
                improved_audio_url=final_state.get("improved_audio_url", ""),
                original_audio_url=request.audio_url,
                refinement_count=0,
                can_refine=True,
            )
            
            yield {
                "event": "complete",
                "data": json.dumps(response_data.model_dump(), ensure_ascii=False)
            }
            
            # DB에 세션 저장 (비동기로 처리)
            asyncio.create_task(
                save_session_to_db(session_id, user_context, request, final_state)
            )
            
        except Exception as e:
            # 에러 이벤트 전송
            error_code = categorize_error(e)
            yield {
                "event": "error",
                "data": json.dumps({
                    "code": error_code,
                    "message": str(e)
                }, ensure_ascii=False)
            }
    
    return EventSourceResponse(event_generator())


def format_progress_event(step: str, progress: int, message: str) -> dict:
    """SSE progress 이벤트 포맷"""
    return {
        "event": "progress",
        "data": json.dumps({
            "step": step,
            "progress": progress,
            "message": message
        }, ensure_ascii=False)
    }


def categorize_error(error: Exception) -> str:
    """에러를 카테고리별 코드로 변환"""
    error_str = str(error).lower()
    
    if "audio" in error_str or "whisper" in error_str:
        if "too short" in error_str:
            return "AUDIO_TOO_SHORT"
        if "format" in error_str:
            return "AUDIO_INVALID_FORMAT"
        return "AUDIO_PROCESSING_ERROR"
    
    if "anthropic" in error_str or "claude" in error_str:
        if "rate" in error_str:
            return "RATE_LIMIT_CLAUDE"
        return "ANALYSIS_ERROR"
    
    if "elevenlabs" in error_str or "tts" in error_str:
        if "rate" in error_str:
            return "RATE_LIMIT_TTS"
        return "TTS_ERROR"
    
    return "INTERNAL_ERROR"


async def save_session_to_db(
    session_id: str,
    user_context: UserContext,
    request: AnalyzeRequest,
    final_state: dict
) -> None:
    """세션 결과를 DB에 저장 (백그라운드 태스크)"""
    try:
        # TODO: Supabase에 세션 저장
        # supabase.table("sessions").insert({...}).execute()
        pass
    except Exception as e:
        # 로깅만 하고 사용자에게는 에러 표시 안 함
        print(f"Failed to save session {session_id}: {e}")


@router.get("/analyze/{session_id}")
async def get_analysis_result(
    session_id: str,
    user_context: UserContext = Depends(get_user_context),
) -> BaseResponse:
    """
    분석 결과 조회
    
    SSE 연결이 끊어진 경우 결과를 다시 조회할 때 사용합니다.
    """
    # TODO: DB에서 세션 조회
    # result = supabase.table("sessions").select("*").eq("session_id", session_id).execute()
    
    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail={"code": "NOT_FOUND_SESSION", "message": "Session not found"}
    )
