"""
API 응답 스키마 정의

백엔드에서 프론트엔드로 전송하는 데이터의 구조를 정의합니다.
모든 응답은 success, data, error 형태의 래퍼를 사용합니다.
"""

from pydantic import BaseModel, Field
from typing import Optional, Any, Literal, Dict, List
from datetime import datetime


# ============================================
# 공통 응답 래퍼
# ============================================

class ErrorDetail(BaseModel):
    """에러 상세 정보"""
    code: str = Field(..., description="에러 코드 (CATEGORY_SPECIFIC 형식)")
    message: str = Field(..., description="사용자에게 표시할 에러 메시지")


class BaseResponse(BaseModel):
    """
    모든 API 응답의 기본 형태
    
    성공 시: {"success": true, "data": {...}}
    실패 시: {"success": false, "error": {"code": "...", "message": "..."}}
    """
    success: bool = True
    data: Optional[Any] = None
    error: Optional[ErrorDetail] = None


# ============================================
# 분석 관련 응답
# ============================================

class ScoreCard(BaseModel):
    """
    스피치 분석 점수표
    
    각 항목은 A/B+/B/C+/C/D 등급 또는 점수로 표시됩니다.
    """
    logic_structure: str = Field(..., description="논리/구조 점수", example="B+")
    filler_words: str = Field(..., description="필러워드 점수", example="A")
    speaking_pace: str = Field(..., description="말 속도 점수", example="C")
    confidence_tone: str = Field(..., description="자신감/톤 점수", example="B")
    content_specificity: str = Field(..., description="내용 구체성 점수", example="C+")


class AnalysisMetrics(BaseModel):
    """
    객관적 측정 지표
    
    ReAct 패턴의 도구들이 수집한 정량적 데이터입니다.
    """
    words_per_minute: int = Field(..., description="분당 단어 수 (WPM)")
    filler_count: int = Field(..., description="필러워드 총 개수")
    filler_percentage: float = Field(..., description="필러워드 비율 (%)")
    total_words: int = Field(..., description="총 단어 수")
    duration_seconds: float = Field(..., description="오디오 길이 (초)")


class ImprovementSuggestion(BaseModel):
    """개선 제안 항목"""
    priority: int = Field(..., description="우선순위 (1이 가장 높음)")
    category: str = Field(..., description="카테고리", example="pace")
    suggestion: str = Field(..., description="개선 제안 내용")
    impact: str = Field(..., description="개선 시 기대 효과")


class AnalysisResult(BaseModel):
    """
    AI 분석 결과 전체
    
    점수표, 측정 지표, 개선 제안을 포함합니다.
    """
    scores: ScoreCard
    metrics: AnalysisMetrics
    suggestions: List[ImprovementSuggestion]
    structure_analysis: Optional[str] = Field(None, description="STAR 구조 분석 결과")
    progressive_context_note: Optional[str] = Field(
        None, 
        description="이전 세션 대비 변화 피드백"
    )


class AnalyzeResponse(BaseModel):
    """
    분석 API 최종 응답
    
    SSE 스트리밍이 완료된 후 반환되는 전체 결과입니다.
    """
    session_id: str = Field(..., description="세션 ID (재요청 시 사용)")
    transcript: str = Field(..., description="STT 변환된 원본 텍스트")
    analysis: AnalysisResult = Field(..., description="분석 결과")
    improved_script: str = Field(..., description="개선된 스크립트")
    improved_audio_url: str = Field(..., description="개선된 스크립트의 TTS 오디오 URL")
    original_audio_url: str = Field(..., description="원본 오디오 URL")
    refinement_count: int = Field(0, description="재요청 횟수 (최대 2)")
    can_refine: bool = Field(True, description="추가 재요청 가능 여부")


# ============================================
# SSE 이벤트
# ============================================

class ProgressEvent(BaseModel):
    """
    SSE 진행 상황 이벤트
    
    프론트엔드에서 로딩 UI를 표시하는 데 사용합니다.
    """
    event: Literal["progress"] = "progress"
    step: Literal["stt", "analysis", "improvement", "reflection", "tts"]
    progress: int = Field(..., ge=0, le=100, description="진행률 (0-100)")
    message: Optional[str] = Field(None, description="표시할 메시지")


class CompleteEvent(BaseModel):
    """SSE 완료 이벤트"""
    event: Literal["complete"] = "complete"
    data: AnalyzeResponse


class ErrorEvent(BaseModel):
    """SSE 에러 이벤트"""
    event: Literal["error"] = "error"
    code: str
    message: str


# ============================================
# 재요청 (Refine) 응답
# ============================================

class RefinePreviewResponse(BaseModel):
    """
    재요청 1단계: 방향 프리뷰 응답
    
    TTS 없이 개선 방향만 미리 보여줍니다.
    사용자가 OK하면 2단계로 진행합니다.
    """
    session_id: str
    preview_script: str = Field(..., description="수정된 스크립트 프리뷰")
    changes_summary: str = Field(..., description="변경 사항 요약")
    stage: Literal[1] = 1


class RefineFinalResponse(BaseModel):
    """
    재요청 2단계: 최종 생성 응답
    
    TTS를 포함한 최종 결과입니다.
    이후 추가 재요청은 불가능합니다.
    """
    session_id: str
    improved_script: str
    improved_audio_url: str
    stage: Literal[2] = 2
    can_refine: bool = False


# ============================================
# Voice Cloning 응답
# ============================================

class VoiceCloneResponse(BaseModel):
    """Voice Cloning 완료 응답"""
    voice_clone_id: str = Field(..., description="생성된 Voice Clone ID")
    voice_name: str = Field(..., description="음성 이름")
    status: Literal["processing", "ready", "failed"]
    estimated_ready_time: Optional[datetime] = Field(
        None,
        description="예상 완료 시간 (processing 상태일 때)"
    )


# ============================================
# 프로젝트 & 세션 응답
# ============================================

class ProjectResponse(BaseModel):
    """프로젝트 정보 응답"""
    project_id: str
    name: str
    segment: Literal["regular", "urgent"]
    target_date: Optional[datetime]
    d_day: Optional[int] = Field(None, description="D-Day까지 남은 일수")
    session_count: int = Field(0, description="총 세션 수")
    created_at: datetime


class SessionSummary(BaseModel):
    """세션 요약 정보"""
    session_id: str
    question: Optional[str]
    overall_score: str = Field(..., description="종합 점수", example="B+")
    created_at: datetime


class SessionHistoryResponse(BaseModel):
    """세션 히스토리 응답"""
    project_id: str
    sessions: List[SessionSummary]
    total_count: int
    growth_summary: Optional[str] = Field(
        None,
        description="성장 요약 (Progressive Context)"
    )


# ============================================
# Health Check
# ============================================

class HealthResponse(BaseModel):
    """서버 상태 확인 응답"""
    status: Literal["healthy", "degraded", "unhealthy"]
    version: str
    timestamp: datetime
    services: Dict[str, bool] = Field(
        default_factory=dict,
        description="외부 서비스 연결 상태"
    )
