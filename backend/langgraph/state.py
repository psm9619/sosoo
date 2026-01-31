"""
LangGraph 상태 정의 (Dual Memory System)

워크플로우 전체에서 공유되는 상태(State)를 정의합니다.
Memory를 Short-term과 Long-term으로 분리하여 효율적으로 관리합니다.

## Memory 시스템 구조

┌─────────────────────────────────────────────────────────────────┐
│                      Dual Memory System                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────┐    ┌─────────────────────────┐    │
│  │    Long-term Memory     │    │   Short-term Memory     │    │
│  │    (거의 안 바뀜)        │    │   (자주 업데이트)        │    │
│  ├─────────────────────────┤    ├─────────────────────────┤    │
│  │ • 사용자 프로필          │    │ • 스피치 패턴           │    │
│  │ • 직업/경력 정보         │    │ • 개선 진행 상황        │    │
│  │ • 면접 목표/일정         │    │ • 세션별 인사이트       │    │
│  │ • 선호하는 피드백 스타일  │    │ • 반복되는 문제점       │    │
│  │ • 강점/약점 (확정된)     │    │ • 최근 점수 변화        │    │
│  └─────────────────────────┘    └─────────────────────────┘    │
│           │                              │                      │
│           │  ┌────────────────────────┐  │                      │
│           └─▶│   Analysis Prompt      │◀─┘                      │
│              │  (두 Memory 결합)       │                        │
│              └────────────────────────┘                         │
│                                                                 │
│  ★ Long-term: 세션 시작 시 1회 로드 (캐싱, 루프 안 돌아도 됨)    │
│  ★ Short-term: 매 세션 종료 시 업데이트 (루프 돌며 갱신)         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

## 효율성 포인트

1. Long-term Memory는 캐싱됨 → 매번 DB 조회 안 함
2. 사용자 프로필 변경 시에만 LTM 업데이트
3. Short-term Memory는 세션마다 자동 갱신
4. TTL 기반으로 오래된 STM 자동 정리
"""

from typing import TypedDict, Literal, Annotated, List, Optional, Any, Dict
import operator
from datetime import datetime, timedelta
from enum import Enum


# ============================================
# Memory 타입 Enum
# ============================================

class LTMType(str, Enum):
    """Long-term Memory 타입 (거의 안 바뀜)"""
    USER_PROFILE = "user_profile"
    CAREER_CONTEXT = "career_context"
    GOAL_CONTEXT = "goal_context"
    FEEDBACK_PREFERENCE = "feedback_preference"
    CONFIRMED_TRAIT = "confirmed_trait"  # 확정된 강점/약점


class STMType(str, Enum):
    """Short-term Memory 타입 (자주 업데이트)"""
    SPEECH_PATTERN = "speech_pattern"
    IMPROVEMENT_PROGRESS = "improvement_progress"
    SESSION_INSIGHT = "session_insight"
    RECURRING_ISSUE = "recurring_issue"
    RECENT_SCORE = "recent_score"


# ============================================
# Long-term Memory TypedDict (거의 안 바뀌는 정보)
# ============================================

class UserProfile(TypedDict):
    """사용자 기본 프로필"""
    name: Optional[str]
    occupation: Optional[str]           # 직업
    experience_years: Optional[int]     # 경력 연수
    industry: Optional[str]             # 산업군
    company_type: Optional[str]         # 대기업/스타트업/etc


class CareerContext(TypedDict):
    """경력 맥락"""
    current_role: Optional[str]         # 현재 역할
    target_role: Optional[str]          # 목표 역할
    key_skills: List[str]               # 주요 스킬
    achievements: List[str]             # 주요 성과


class GoalContext(TypedDict):
    """목표 맥락"""
    primary_goal: Literal["interview", "presentation", "general"]
    target_company: Optional[str]       # 목표 회사
    target_date: Optional[str]          # 면접/발표 일정
    specific_concerns: List[str]        # 걱정되는 점


class FeedbackPreference(TypedDict):
    """피드백 선호"""
    style: Literal["direct", "gentle", "balanced"]
    detail_level: Literal["brief", "detailed"]
    language: Literal["formal", "casual"]


class ConfirmedTrait(TypedDict):
    """확정된 강점/약점 (여러 세션에서 검증됨)"""
    trait_type: Literal["strength", "weakness"]
    category: str                       # pace, filler, structure, etc
    description: str
    confirmed_count: int                # 몇 세션에서 확인됐는지
    first_detected: str
    last_confirmed: str


class LongTermMemory(TypedDict):
    """
    Long-term Memory (LTM)
    
    ★ 사용자의 기본 정보와 맥락 (거의 변하지 않음)
    ★ 워크플로우 전체를 돌지 않고도 바로 접근 가능
    ★ 캐싱되어 빠른 조회
    
    업데이트 시점:
    - 사용자가 프로필 정보를 명시적으로 변경할 때
    - onboarding 과정에서 정보 수집할 때
    - 관리자가 수동으로 수정할 때
    """
    id: str
    user_id: str
    
    # 핵심 프로필 정보
    profile: UserProfile
    career: CareerContext
    goal: GoalContext
    feedback_preference: FeedbackPreference
    
    # 확정된 강점/약점 (STM에서 승격됨)
    confirmed_traits: List[ConfirmedTrait]
    
    # 메타데이터
    created_at: str
    updated_at: str
    version: int


# ============================================
# Short-term Memory TypedDict (자주 업데이트)
# ============================================

class SpeechPatternData(TypedDict):
    """스피치 패턴 데이터"""
    pattern_type: str                   # filler, pace, structure, etc
    description: str
    severity: Literal["high", "medium", "low"]
    occurrence_count: int
    trend: Literal["improving", "stable", "worsening"]
    numeric_value: Optional[float]      # 측정 가능한 경우 (예: WPM, 필러%)


class ImprovementData(TypedDict):
    """개선 진행 데이터"""
    category: str
    initial_score: str
    current_score: str
    best_score: str
    improvement_rate: float             # 개선율 %
    sessions_measured: int


class SessionInsightData(TypedDict):
    """세션 인사이트 데이터"""
    key_observation: str
    recommendation: str
    user_reaction: Optional[str]        # 사용자 반응


class ShortTermMemory(TypedDict):
    """
    Short-term Memory (STM)
    
    ★ 자주 업데이트되는 스피치 피드백 정보
    ★ 세션마다 변화
    ★ TTL 기반 자동 만료
    
    업데이트 시점:
    - 매 세션 종료 시 자동 추출
    - 분석 결과에서 패턴 감지 시
    """
    id: str
    user_id: str
    memory_type: str                    # STMType 값
    
    # 타입별 데이터 (하나만 채워짐)
    speech_pattern: Optional[SpeechPatternData]
    improvement: Optional[ImprovementData]
    session_insight: Optional[SessionInsightData]
    
    # 메타데이터
    importance: Literal["high", "medium", "low"]
    mention_count: int                  # 반복 횟수
    ttl_days: int
    source_session_id: str
    created_at: str
    updated_at: str
    expires_at: Optional[str]


# ============================================
# 분석 관련 TypedDict
# ============================================

class AnalysisScores(TypedDict):
    """분석 점수"""
    logic_structure: str
    filler_words: str
    speaking_pace: str
    confidence_tone: str
    content_specificity: str


class AnalysisMetrics(TypedDict):
    """측정 지표"""
    words_per_minute: int
    filler_count: int
    filler_percentage: float
    total_words: int
    duration_seconds: float


class Suggestion(TypedDict):
    """개선 제안"""
    priority: int
    category: str
    suggestion: str
    impact: str


class AnalysisResult(TypedDict):
    """분석 결과"""
    scores: AnalysisScores
    metrics: AnalysisMetrics
    suggestions: List[Suggestion]
    structure_analysis: str
    moderation_flags: List[str]


class ScoreHistoryEntry(TypedDict):
    """점수 히스토리 항목"""
    session_id: str
    timestamp: str
    scores: AnalysisScores
    metrics: Optional[AnalysisMetrics]


# ============================================
# Progressive Context TypedDict
# ============================================

class SessionSummary(TypedDict):
    """이전 세션 요약"""
    session_id: str
    created_at: str
    scores: AnalysisScores
    top_suggestions: List[str]
    improved: bool


class UserPatterns(TypedDict):
    """유저 패턴"""
    is_new_user: bool
    session_count: int
    recurring_issues: List[str]
    improvement_trend: Literal["improving", "stable", "declining", "unknown"]
    last_session_date: Optional[str]


# ============================================
# Memory Prompt Context
# ============================================

class MemoryPromptContext(TypedDict):
    """Memory 기반 프롬프트 컨텍스트"""
    # LTM에서 추출
    user_background: str
    user_goals: str
    feedback_style: str
    confirmed_strengths: List[str]
    confirmed_weaknesses: List[str]
    
    # STM에서 추출
    recent_patterns: List[str]
    improvement_status: str
    focus_areas: List[str]


# ============================================
# 커스텀 리듀서 함수
# ============================================

def merge_long_term_memory(
    existing: Optional[LongTermMemory],
    new: Optional[LongTermMemory]
) -> Optional[LongTermMemory]:
    """
    Long-term Memory 병합 리듀서
    
    - 새 데이터로 기존 데이터 deep merge
    - version 번호 증가
    - None 값은 무시
    """
    if not new:
        return existing
    if not existing:
        return new
    
    merged = {**existing}
    
    # Deep merge for nested dicts
    for key in ["profile", "career", "goal", "feedback_preference"]:
        if new.get(key):
            merged[key] = {
                **existing.get(key, {}),
                **{k: v for k, v in new[key].items() if v is not None}
            }
    
    # Merge confirmed_traits (중복 제거)
    if new.get("confirmed_traits"):
        existing_traits = {t["category"]: t for t in existing.get("confirmed_traits", [])}
        for trait in new["confirmed_traits"]:
            existing_traits[trait["category"]] = trait
        merged["confirmed_traits"] = list(existing_traits.values())
    
    merged["updated_at"] = datetime.utcnow().isoformat()
    merged["version"] = existing.get("version", 0) + 1
    
    return merged


def merge_short_term_memories(
    existing: List[ShortTermMemory],
    new: List[ShortTermMemory]
) -> List[ShortTermMemory]:
    """
    Short-term Memory 병합 리듀서
    
    - 같은 타입+카테고리는 업데이트
    - 새로운 것은 추가
    - mention_count 자동 증가
    - 만료된 것 자동 제거
    - 최대 30개 유지
    """
    if not new:
        return existing
    
    now = datetime.utcnow()
    
    # 만료되지 않은 것만 유지
    valid_existing = []
    for m in existing:
        expires = m.get("expires_at")
        if not expires or datetime.fromisoformat(expires) > now:
            valid_existing.append(m)
    
    # 타입+카테고리로 인덱싱
    def get_key(m):
        pattern = m.get("speech_pattern") or {}
        improvement = m.get("improvement") or {}
        subkey = pattern.get("pattern_type") or improvement.get("category") or ""
        return f"{m['memory_type']}:{subkey}"
    
    memory_map = {get_key(m): m for m in valid_existing}
    
    # 새 Memory 병합
    for mem in new:
        key = get_key(mem)
        if key in memory_map:
            old = memory_map[key]
            memory_map[key] = {
                **old,
                **mem,
                "mention_count": old.get("mention_count", 1) + 1,
                "updated_at": now.isoformat(),
            }
        else:
            memory_map[key] = {
                **mem,
                "mention_count": 1,
                "created_at": now.isoformat(),
                "updated_at": now.isoformat(),
            }
    
    # 중요도 + 최신순 정렬
    importance_order = {"high": 0, "medium": 1, "low": 2}
    result = sorted(
        memory_map.values(),
        key=lambda m: (
            importance_order.get(m.get("importance", "low"), 2),
            m.get("mention_count", 0) * -1,
        )
    )
    
    return result[:30]


def merge_score_history(
    existing: List[ScoreHistoryEntry],
    new: List[ScoreHistoryEntry]
) -> List[ScoreHistoryEntry]:
    """점수 히스토리 병합 (최근 10개 유지)"""
    seen_sessions = set()
    unique = []
    
    for entry in new + existing:
        if entry["session_id"] not in seen_sessions:
            seen_sessions.add(entry["session_id"])
            unique.append(entry)
    
    sorted_entries = sorted(unique, key=lambda x: x["timestamp"], reverse=True)
    return sorted_entries[:10]


def dedupe_suggestions(
    existing: List[Suggestion],
    new: List[Suggestion]
) -> List[Suggestion]:
    """제안 중복 제거"""
    if not new:
        return existing
    
    by_category = {}
    for s in existing + new:
        by_category[s.get("category", "general")] = s
    
    result = sorted(by_category.values(), key=lambda x: x.get("priority", 99))
    return result[:5]


# ============================================
# 메인 State 정의
# ============================================

class SpeechCoachState(TypedDict):
    """
    메인 워크플로우 상태 (Dual Memory System)
    
    ┌────────────────────────────────────────────────────────────┐
    │                    Memory 사용 전략                         │
    ├────────────────────────────────────────────────────────────┤
    │                                                            │
    │  [세션 시작]                                                │
    │       │                                                    │
    │       ├─ LTM 캐시 확인 ─┬─ 유효함 → 바로 사용 (루프 스킵)   │
    │       │                 └─ 만료됨 → DB에서 1회 로드         │
    │       │                                                    │
    │       ├─ STM 로드 (DB에서 최근 것만)                        │
    │       │                                                    │
    │       └─ Memory 프롬프트 생성 (LTM + STM 결합)              │
    │                                                            │
    │  [세션 진행]                                                │
    │       │                                                    │
    │       ├─ 분석/개선 시 Memory 프롬프트 활용                  │
    │       │                                                    │
    │       └─ 사용자가 프로필 정보 제공 시에만 LTM 업데이트      │
    │                                                            │
    │  [세션 종료]                                                │
    │       │                                                    │
    │       ├─ STM 추출 & 저장 (자동)                            │
    │       │                                                    │
    │       └─ STM → LTM 승격 판단 (5회 이상 반복 시)            │
    │                                                            │
    └────────────────────────────────────────────────────────────┘
    """
    
    # ===== 세션 정보 =====
    session_id: str
    user_id: Optional[str]
    mode: Literal["quick", "deep"]
    
    # ===== 입력 데이터 =====
    audio_file_path: str
    audio_duration: Optional[float]
    question: Optional[str]
    project_id: Optional[str]
    
    # ===== Long-term Memory (LTM) =====
    # ★ 거의 변하지 않는 사용자 정보
    # ★ 캐싱되어 있으면 바로 사용 (워크플로우 루프 안 돌아도 됨)
    long_term_memory: Annotated[Optional[LongTermMemory], merge_long_term_memory]
    
    # LTM 캐시 관리
    ltm_loaded: bool                    # LTM 로드 완료 여부
    ltm_cache_valid: bool               # 캐시 유효 여부
    ltm_cache_expires_at: Optional[str] # 캐시 만료 시간
    
    # ===== Short-term Memory (STM) =====
    # ★ 자주 변하는 스피치 피드백 정보
    # ★ 세션마다 업데이트
    short_term_memories: Annotated[List[ShortTermMemory], merge_short_term_memories]
    
    # 점수 히스토리 (STM 별도 관리)
    score_history: Annotated[List[ScoreHistoryEntry], merge_score_history]
    
    # ===== Memory 프롬프트 =====
    # LTM + STM 결합하여 생성된 프롬프트 컨텍스트
    memory_prompt_context: Optional[MemoryPromptContext]
    memory_prompt_text: Optional[str]   # 실제 프롬프트 문자열
    
    # ===== 처리 결과 =====
    transcript: str
    analysis_result: Optional[AnalysisResult]
    suggestions: Annotated[List[Suggestion], dedupe_suggestions]
    improved_script: str
    improved_script_draft: Optional[str]
    reflection_notes: Optional[List[str]]
    
    # ===== 출력 =====
    improved_audio_url: str
    original_audio_url: str
    
    # ===== Progressive Context =====
    previous_sessions: Annotated[List[SessionSummary], operator.add]
    user_patterns: Optional[UserPatterns]
    context_documents: Optional[List[str]]
    context_analysis: Optional[str]
    
    # ===== 음성 설정 =====
    voice_type: Literal["default_male", "default_female", "cloned"]
    voice_clone_id: Optional[str]
    
    # ===== 메시지 & 메타데이터 =====
    messages: Annotated[List[str], operator.add]
    metadata: Annotated[Dict[str, Any], operator.or_]
    
    # ===== 재요청 관련 =====
    refinement_count: int
    user_intent: Optional[str]
    
    # ===== Memory 추출 결과 =====
    memory_extraction_result: Optional[Dict[str, Any]]


# ============================================
# 상태 초기화 헬퍼
# ============================================

def create_initial_state(
    session_id: str,
    audio_url: str,
    mode: Literal["quick", "deep"] = "quick",
    user_id: Optional[str] = None,
    voice_type: Literal["default_male", "default_female", "cloned"] = "default_male",
    cached_ltm: Optional[LongTermMemory] = None,
    existing_stm: List[ShortTermMemory] = None,
    **kwargs
) -> SpeechCoachState:
    """
    초기 상태 생성
    
    Args:
        cached_ltm: 캐싱된 LTM (있으면 로드 스킵)
        existing_stm: 기존 STM (DB에서 로드)
    """
    now = datetime.utcnow()
    cache_expires = (now + timedelta(hours=24)).isoformat()
    
    return SpeechCoachState(
        # 세션
        session_id=session_id,
        user_id=user_id,
        mode=mode,
        
        # 입력
        audio_file_path=audio_url,
        audio_duration=None,
        question=kwargs.get("question"),
        project_id=kwargs.get("project_id"),
        
        # LTM
        long_term_memory=cached_ltm,
        ltm_loaded=cached_ltm is not None,
        ltm_cache_valid=cached_ltm is not None,
        ltm_cache_expires_at=cache_expires if cached_ltm else None,
        
        # STM
        short_term_memories=existing_stm or [],
        score_history=[],
        
        # Memory 프롬프트
        memory_prompt_context=None,
        memory_prompt_text=None,
        
        # 처리 결과
        transcript="",
        analysis_result=None,
        suggestions=[],
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
        metadata={
            "created_at": now.isoformat(),
            "version": "2.0",
            "memory_system": "dual",
        },
        
        # 재요청
        refinement_count=0,
        user_intent=None,
        
        # Memory 추출
        memory_extraction_result=None,
    )


# ============================================
# Long-term Memory 유틸리티
# ============================================

def create_default_ltm(user_id: str) -> LongTermMemory:
    """새 사용자용 기본 LTM 생성"""
    now = datetime.utcnow().isoformat()
    
    return LongTermMemory(
        id=f"ltm_{user_id}",
        user_id=user_id,
        profile=UserProfile(
            name=None,
            occupation=None,
            experience_years=None,
            industry=None,
            company_type=None,
        ),
        career=CareerContext(
            current_role=None,
            target_role=None,
            key_skills=[],
            achievements=[],
        ),
        goal=GoalContext(
            primary_goal="general",
            target_company=None,
            target_date=None,
            specific_concerns=[],
        ),
        feedback_preference=FeedbackPreference(
            style="balanced",
            detail_level="detailed",
            language="formal",
        ),
        confirmed_traits=[],
        created_at=now,
        updated_at=now,
        version=1,
    )


def is_ltm_cache_valid(state: SpeechCoachState) -> bool:
    """LTM 캐시 유효성 확인"""
    if not state.get("ltm_cache_valid"):
        return False
    
    expires_at = state.get("ltm_cache_expires_at")
    if not expires_at:
        return False
    
    return datetime.fromisoformat(expires_at) > datetime.utcnow()


def update_ltm_profile(
    ltm: LongTermMemory,
    profile_updates: Dict[str, Any]
) -> LongTermMemory:
    """LTM 프로필 부분 업데이트 (루프 없이 직접)"""
    return merge_long_term_memory(ltm, {"profile": profile_updates})


def promote_stm_to_ltm(
    ltm: LongTermMemory,
    stm: ShortTermMemory
) -> LongTermMemory:
    """
    STM을 LTM으로 승격 (5회 이상 반복된 패턴)
    
    Speech Pattern → Confirmed Trait
    """
    pattern = stm.get("speech_pattern")
    if not pattern:
        return ltm
    
    now = datetime.utcnow().isoformat()
    
    new_trait = ConfirmedTrait(
        trait_type="weakness" if pattern["severity"] == "high" else "strength" if pattern["trend"] == "improving" else "weakness",
        category=pattern["pattern_type"],
        description=pattern["description"],
        confirmed_count=stm.get("mention_count", 1),
        first_detected=stm.get("created_at", now),
        last_confirmed=now,
    )
    
    return merge_long_term_memory(ltm, {"confirmed_traits": [new_trait]})


# ============================================
# Short-term Memory 유틸리티
# ============================================

def create_speech_pattern_stm(
    user_id: str,
    session_id: str,
    pattern_type: str,
    description: str,
    severity: Literal["high", "medium", "low"],
    numeric_value: Optional[float] = None,
    ttl_days: int = 14,
) -> ShortTermMemory:
    """Speech Pattern STM 생성"""
    now = datetime.utcnow()
    
    return ShortTermMemory(
        id=f"stm_{user_id}_{pattern_type}_{int(now.timestamp())}",
        user_id=user_id,
        memory_type=STMType.SPEECH_PATTERN.value,
        speech_pattern=SpeechPatternData(
            pattern_type=pattern_type,
            description=description,
            severity=severity,
            occurrence_count=1,
            trend="stable",
            numeric_value=numeric_value,
        ),
        improvement=None,
        session_insight=None,
        importance=severity,
        mention_count=1,
        ttl_days=ttl_days,
        source_session_id=session_id,
        created_at=now.isoformat(),
        updated_at=now.isoformat(),
        expires_at=(now + timedelta(days=ttl_days)).isoformat(),
    )


def create_improvement_stm(
    user_id: str,
    session_id: str,
    category: str,
    initial_score: str,
    current_score: str,
) -> ShortTermMemory:
    """Improvement Progress STM 생성"""
    now = datetime.utcnow()
    
    score_map = {"A": 4, "B+": 3.5, "B": 3, "C+": 2.5, "C": 2, "D": 1}
    initial_val = score_map.get(initial_score, 2.5)
    current_val = score_map.get(current_score, 2.5)
    rate = ((current_val - initial_val) / initial_val * 100) if initial_val > 0 else 0
    
    return ShortTermMemory(
        id=f"stm_{user_id}_improvement_{category}",
        user_id=user_id,
        memory_type=STMType.IMPROVEMENT_PROGRESS.value,
        speech_pattern=None,
        improvement=ImprovementData(
            category=category,
            initial_score=initial_score,
            current_score=current_score,
            best_score=max(initial_score, current_score, key=lambda x: score_map.get(x, 0)),
            improvement_rate=round(rate, 1),
            sessions_measured=1,
        ),
        session_insight=None,
        importance="high" if rate > 15 else "medium",
        mention_count=1,
        ttl_days=30,
        source_session_id=session_id,
        created_at=now.isoformat(),
        updated_at=now.isoformat(),
        expires_at=None,  # Progress는 만료 없음
    )


def get_stm_by_type(
    memories: List[ShortTermMemory],
    mem_type: STMType
) -> List[ShortTermMemory]:
    """타입별 STM 조회"""
    return [m for m in memories if m.get("memory_type") == mem_type.value]


def get_promotable_stm(memories: List[ShortTermMemory]) -> List[ShortTermMemory]:
    """LTM 승격 대상 STM 조회 (5회 이상 반복)"""
    return [m for m in memories if m.get("mention_count", 0) >= 5]


# ============================================
# Memory Prompt Builder
# ============================================

def build_memory_prompt_context(
    ltm: Optional[LongTermMemory],
    stm_list: List[ShortTermMemory],
) -> MemoryPromptContext:
    """LTM + STM에서 프롬프트 컨텍스트 생성"""
    
    # === LTM 추출 ===
    user_background = ""
    user_goals = ""
    feedback_style = ""
    confirmed_strengths = []
    confirmed_weaknesses = []
    
    if ltm:
        # 배경
        profile = ltm.get("profile", {})
        parts = []
        if profile.get("occupation"):
            exp = f" ({profile.get('experience_years')}년차)" if profile.get("experience_years") else ""
            parts.append(f"{profile['occupation']}{exp}")
        if profile.get("industry"):
            parts.append(f"{profile['industry']}")
        user_background = ", ".join(parts) if parts else ""
        
        # 목표
        goal = ltm.get("goal", {})
        goal_parts = []
        if goal.get("primary_goal"):
            goal_map = {"interview": "면접 준비", "presentation": "발표 준비", "general": "일반 연습"}
            goal_parts.append(goal_map.get(goal["primary_goal"], goal["primary_goal"]))
        if goal.get("target_company"):
            goal_parts.append(f"{goal['target_company']} 목표")
        if goal.get("target_date"):
            goal_parts.append(f"D-Day: {goal['target_date']}")
        user_goals = ", ".join(goal_parts) if goal_parts else ""
        
        # 피드백 스타일
        pref = ltm.get("feedback_preference", {})
        style_map = {"direct": "직접적", "gentle": "부드러운", "balanced": "균형잡힌"}
        feedback_style = f"{style_map.get(pref.get('style', ''), '')} 피드백"
        
        # 확정된 강점/약점
        for trait in ltm.get("confirmed_traits", []):
            if trait.get("trait_type") == "strength":
                confirmed_strengths.append(trait["description"])
            else:
                confirmed_weaknesses.append(trait["description"])
    
    # === STM 추출 ===
    recent_patterns = []
    improvement_status = ""
    focus_areas = []
    
    # 최근 패턴
    patterns = get_stm_by_type(stm_list, STMType.SPEECH_PATTERN)
    for p in patterns[:3]:
        data = p.get("speech_pattern", {})
        if data:
            trend_map = {"improving": "↑", "stable": "→", "worsening": "↓"}
            recent_patterns.append(
                f"{data.get('pattern_type', '')}: {data.get('description', '')} {trend_map.get(data.get('trend', ''), '')}"
            )
    
    # 개선 상태
    improvements = get_stm_by_type(stm_list, STMType.IMPROVEMENT_PROGRESS)
    improving = [i for i in improvements if (i.get("improvement", {}).get("improvement_rate", 0) or 0) > 0]
    declining = [i for i in improvements if (i.get("improvement", {}).get("improvement_rate", 0) or 0) < 0]
    
    status_parts = []
    if improving:
        cats = [i["improvement"]["category"] for i in improving if i.get("improvement")]
        status_parts.append(f"개선 중: {', '.join(cats)}")
    if declining:
        cats = [i["improvement"]["category"] for i in declining if i.get("improvement")]
        status_parts.append(f"주의: {', '.join(cats)}")
    improvement_status = " | ".join(status_parts) if status_parts else "데이터 수집 중"
    
    # 집중 영역 (high severity)
    high_priority = [p for p in patterns if p.get("importance") == "high"]
    focus_areas = [p.get("speech_pattern", {}).get("pattern_type", "") for p in high_priority[:2]]
    
    return MemoryPromptContext(
        user_background=user_background,
        user_goals=user_goals,
        feedback_style=feedback_style,
        confirmed_strengths=confirmed_strengths,
        confirmed_weaknesses=confirmed_weaknesses,
        recent_patterns=recent_patterns,
        improvement_status=improvement_status,
        focus_areas=focus_areas,
    )


def format_memory_prompt(context: MemoryPromptContext) -> str:
    """Memory 컨텍스트를 프롬프트 문자열로 변환"""
    
    sections = []
    
    # === LTM 섹션 (고정 정보) ===
    ltm_parts = []
    if context.get("user_background"):
        ltm_parts.append(f"• 사용자: {context['user_background']}")
    if context.get("user_goals"):
        ltm_parts.append(f"• 목표: {context['user_goals']}")
    if context.get("feedback_style"):
        ltm_parts.append(f"• 피드백: {context['feedback_style']}")
    if context.get("confirmed_strengths"):
        ltm_parts.append(f"• 강점: {', '.join(context['confirmed_strengths'][:2])}")
    if context.get("confirmed_weaknesses"):
        ltm_parts.append(f"• 약점: {', '.join(context['confirmed_weaknesses'][:2])}")
    
    if ltm_parts:
        sections.append("## 사용자 정보\n" + "\n".join(ltm_parts))
    
    # === STM 섹션 (최근 패턴) ===
    stm_parts = []
    if context.get("recent_patterns"):
        stm_parts.append("• 최근 패턴:\n  - " + "\n  - ".join(context["recent_patterns"]))
    if context.get("improvement_status"):
        stm_parts.append(f"• 개선 상태: {context['improvement_status']}")
    if context.get("focus_areas"):
        stm_parts.append(f"• 이번 세션 집중: {', '.join(context['focus_areas'])}")
    
    if stm_parts:
        sections.append("## 최근 분석\n" + "\n".join(stm_parts))
    
    if not sections:
        return ""
    
    return "\n\n".join(sections) + "\n\n위 정보를 참고하여 개인화된 코칭을 제공하세요."


# ============================================
# 상태 유틸리티 함수
# ============================================

def get_improvement_trend(state: SpeechCoachState) -> str:
    """점수 히스토리에서 개선 추세 계산"""
    history = state.get("score_history", [])
    
    if len(history) < 2:
        return "unknown"
    
    def avg_score(scores: Dict[str, str]) -> float:
        score_map = {"A": 4, "B+": 3.5, "B": 3, "C+": 2.5, "C": 2, "D": 1}
        vals = [score_map.get(v, 2.5) for v in scores.values()]
        return sum(vals) / len(vals) if vals else 2.5
    
    recent = avg_score(history[0]["scores"])
    older_avg = sum(avg_score(h["scores"]) for h in history[1:]) / len(history[1:])
    
    diff = recent - older_avg
    if diff > 0.3:
        return "improving"
    elif diff < -0.3:
        return "declining"
    return "stable"


def should_update_ltm(state: SpeechCoachState) -> bool:
    """LTM 업데이트 필요 여부 판단"""
    intent = (state.get("user_intent") or "").lower()
    keywords = ["프로필", "정보", "경력", "목표", "회사", "설정", "변경"]
    return any(kw in intent for kw in keywords)


def should_promote_stm(stm: ShortTermMemory) -> bool:
    """STM → LTM 승격 여부 판단"""
    return stm.get("mention_count", 0) >= 5 and stm.get("importance") in ["high", "medium"]