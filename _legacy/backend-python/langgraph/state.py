"""
LangGraph 상태 정의

워크플로우 전체에서 공유되는 상태(State)를 정의합니다.
State는 그래프의 "기억"으로, 각 노드가 읽고 쓰는 데이터를 담습니다.

TypedDict를 사용하여 타입 안전성을 보장하고,
Annotated를 사용하여 리스트 필드의 병합 방식을 지정합니다.
"""

from typing import TypedDict, Literal, Annotated, List, Optional, Any
import operator


class AnalysisScores(TypedDict):
    """
    분석 점수 구조
    
    각 항목은 A/B+/B/C+/C/D 등급으로 표시됩니다.
    """
    logic_structure: str      # 논리/구조
    filler_words: str         # 필러워드
    speaking_pace: str        # 말 속도
    confidence_tone: str      # 자신감/톤
    content_specificity: str  # 내용 구체성


class AnalysisMetrics(TypedDict):
    """
    객관적 측정 지표
    
    ReAct 패턴의 도구들이 수집한 정량적 데이터입니다.
    """
    words_per_minute: int         # 분당 단어 수 (WPM)
    filler_count: int             # 필러워드 총 개수
    filler_percentage: float      # 필러워드 비율 (%)
    total_words: int              # 총 단어 수
    duration_seconds: float       # 오디오 길이 (초)


class AnalysisResult(TypedDict):
    """
    분석 결과 전체 구조
    """
    scores: AnalysisScores
    metrics: AnalysisMetrics
    suggestions: List[dict]       # 개선 제안 목록
    structure_analysis: str       # STAR 구조 분석 결과
    moderation_flags: List[str]   # 모더레이션 플래그


class UserPatterns(TypedDict):
    """
    Progressive Context: 유저 히스토리에서 추출한 패턴
    
    이전 세션들을 분석하여 반복되는 문제점과 개선 추세를 파악합니다.
    """
    is_new_user: bool
    session_count: int
    recurring_issues: List[str]   # 반복되는 문제점
    improvement_trend: str        # 개선 추세 (improving/stable/declining)
    last_session_date: Optional[str]


class SpeechCoachState(TypedDict):
    """
    메인 워크플로우 상태
    
    STT → 분석 → 개선안 생성 → TTS 전체 파이프라인에서 사용됩니다.
    각 노드는 이 상태의 일부를 읽고, 필요한 필드를 업데이트합니다.
    
    ## 필드 그룹
    
    ### 세션 정보
    - session_id, user_id, mode: 세션 식별 및 모드 설정
    
    ### 입력 데이터
    - audio_file_path: 분석할 오디오 파일 경로/URL
    - question: 연습 중인 질문 (선택)
    - project_id: 프로젝트 ID (Deep Mode)
    
    ### 처리 결과
    - transcript: STT 변환 결과
    - analysis_result: 분석 결과
    - improved_script: 개선된 스크립트
    - improved_script_draft: Reflection 전 초안
    
    ### 출력
    - improved_audio_url: TTS 생성된 오디오 URL
    
    ### Progressive Context
    - previous_sessions: 이전 세션 기록
    - user_patterns: 유저 패턴 분석
    - context_documents: 업로드된 문서 내용
    
    ### 음성 설정
    - voice_type: TTS 음성 타입
    - voice_clone_id: Voice Clone ID (있는 경우)
    
    ### 메시지 (UI 업데이트용)
    - messages: 진행 상황 메시지 (누적)
    
    ### 재요청 관련
    - refinement_count: 재요청 횟수
    - user_intent: 재요청 시 유저 의도
    """
    
    # ===== 세션 정보 =====
    session_id: str
    user_id: Optional[str]  # Guest는 None
    mode: Literal["quick", "deep"]
    
    # ===== 입력 데이터 =====
    audio_file_path: str
    audio_duration: Optional[float]  # 오디오 길이 (초)
    question: Optional[str]
    project_id: Optional[str]
    
    # ===== 처리 결과 =====
    transcript: str
    analysis_result: AnalysisResult
    improved_script: str
    improved_script_draft: Optional[str]  # Reflection 전 초안
    reflection_notes: Optional[List[str]]  # Reflection 검토 결과
    
    # ===== 출력 =====
    improved_audio_url: str
    original_audio_url: str
    
    # ===== Progressive Context =====
    previous_sessions: List[dict]
    user_patterns: Optional[UserPatterns]
    context_documents: Optional[List[str]]  # Deep Mode: 문서 내용
    context_analysis: Optional[str]  # Deep Mode: 문서 분석 결과
    
    # ===== 음성 설정 =====
    voice_type: Literal["default_male", "default_female", "cloned"]
    voice_clone_id: Optional[str]
    
    # ===== 메시지 (누적) =====
    # Annotated[List, operator.add]는 각 노드의 반환값이 기존 리스트에 추가됨
    messages: Annotated[List[str], operator.add]
    
    # ===== 재요청 관련 =====
    refinement_count: int
    user_intent: Optional[str]


class RefinementState(TypedDict):
    """
    재요청 워크플로우 상태
    
    기존 세션의 상태를 기반으로 사용자 의도를 반영한 재생성을 수행합니다.
    """
    
    # 기존 세션 정보
    session_id: str
    original_transcript: str
    original_analysis: AnalysisResult
    current_script: str  # 현재 개선안
    
    # 재요청 입력
    user_intent: str
    refinement_stage: Literal[1, 2]  # 1=프리뷰, 2=최종
    
    # 재요청 출력
    refined_script: str
    changes_summary: str
    refined_audio_url: Optional[str]  # Stage 2에서만
    
    # 음성 설정 (Stage 2에서 사용)
    voice_type: Literal["default_male", "default_female", "cloned"]
    voice_clone_id: Optional[str]
    
    # 메시지
    messages: Annotated[List[str], operator.add]


# ============================================
# 상태 초기화 헬퍼
# ============================================

def create_initial_state(
    session_id: str,
    audio_url: str,
    mode: Literal["quick", "deep"] = "quick",
    user_id: Optional[str] = None,
    voice_type: Literal["default_male", "default_female", "cloned"] = "default_male",
    **kwargs
) -> SpeechCoachState:
    """
    초기 상태 생성 헬퍼 함수
    
    필수 필드만 지정하고 나머지는 기본값으로 설정합니다.
    
    Args:
        session_id: 세션 ID
        audio_url: 오디오 파일 URL
        mode: 분석 모드 (quick/deep)
        user_id: 사용자 ID (Guest는 None)
        voice_type: TTS 음성 타입
        **kwargs: 추가 필드 값
    
    Returns:
        초기화된 SpeechCoachState
    """
    return SpeechCoachState(
        # 세션 정보
        session_id=session_id,
        user_id=user_id,
        mode=mode,
        
        # 입력
        audio_file_path=audio_url,
        audio_duration=None,
        question=kwargs.get("question"),
        project_id=kwargs.get("project_id"),
        
        # 처리 결과 (초기값)
        transcript="",
        analysis_result={},
        improved_script="",
        improved_script_draft=None,
        reflection_notes=None,
        
        # 출력
        improved_audio_url="",
        original_audio_url=audio_url,
        
        # Progressive Context
        previous_sessions=[],
        user_patterns=None,
        context_documents=None,
        context_analysis=None,
        
        # 음성
        voice_type=voice_type,
        voice_clone_id=kwargs.get("voice_clone_id"),
        
        # 메시지
        messages=[],
        
        # 재요청
        refinement_count=0,
        user_intent=None,
    )
