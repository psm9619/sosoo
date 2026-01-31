"""
API 스키마 패키지

모든 요청/응답 스키마를 한 곳에서 import할 수 있도록 합니다.
"""

from .requests import (
    AnalyzeRequest,
    RefineRequest,
    VoiceCloneRequest,
    ProjectCreateRequest,
    ContextUploadRequest,
)

from .responses import (
    # 공통
    BaseResponse,
    ErrorDetail,
    
    # 분석
    ScoreCard,
    AnalysisMetrics,
    ImprovementSuggestion,
    AnalysisResult,
    AnalyzeResponse,
    
    # SSE 이벤트
    ProgressEvent,
    CompleteEvent,
    ErrorEvent,
    
    # 재요청
    RefinePreviewResponse,
    RefineFinalResponse,
    
    # Voice Clone
    VoiceCloneResponse,
    
    # 프로젝트 & 세션
    ProjectResponse,
    SessionSummary,
    SessionHistoryResponse,
    
    # Health
    HealthResponse,
)

__all__ = [
    # Requests
    "AnalyzeRequest",
    "RefineRequest",
    "VoiceCloneRequest",
    "ProjectCreateRequest",
    "ContextUploadRequest",
    
    # Responses
    "BaseResponse",
    "ErrorDetail",
    "ScoreCard",
    "AnalysisMetrics",
    "ImprovementSuggestion",
    "AnalysisResult",
    "AnalyzeResponse",
    "ProgressEvent",
    "CompleteEvent",
    "ErrorEvent",
    "RefinePreviewResponse",
    "RefineFinalResponse",
    "VoiceCloneResponse",
    "ProjectResponse",
    "SessionSummary",
    "SessionHistoryResponse",
    "HealthResponse",
]
