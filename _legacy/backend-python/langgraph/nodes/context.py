"""
Context 노드 - Progressive Context & RAG 패턴

유저의 과거 세션 기록과 업로드된 문서를 활용하여
맥락 있는 분석과 개인화된 코칭을 제공합니다.

## RAG (Retrieval-Augmented Generation) 패턴이란?

AI가 답변을 생성할 때 관련 정보를 먼저 검색(Retrieve)해서 참고하는 방식입니다.
이 프로젝트에서는 두 가지 용도로 사용합니다:

1. **Progressive Context**: 유저의 과거 세션 기록을 참조하여
   "지난번에 말 속도 피드백 드렸는데, 이번엔 많이 개선되셨네요!" 같은
   연속성 있는 코칭 제공

2. **Document Context**: Deep Mode에서 이력서, 포트폴리오 등을 참조하여
   "이력서에 Redis 경험이 있는데, 답변에서 더 구체적으로 설명하면 좋겠어요"
   같은 맥락 있는 피드백 제공
"""

import os
from typing import Optional, List
from supabase import create_client
from collections import Counter

from ..state import SpeechCoachState, UserPatterns


async def load_progressive_context(state: SpeechCoachState) -> dict:
    """
    Progressive Context 로드 노드
    
    유저의 과거 세션 기록을 불러와서 분석에 활용합니다.
    이 정보가 있으면 AI가 연속성 있는 코칭을 제공할 수 있습니다.
    
    ## 로드하는 정보
    
    - 최근 5개 세션의 분석 결과
    - 반복되는 문제점 패턴
    - 개선 추세 (점수 변화)
    
    Args:
        state: 현재 워크플로우 상태
            - user_id: 사용자 ID (Guest는 None)
    
    Returns:
        dict: 업데이트할 상태 필드
            - previous_sessions: 이전 세션 기록 리스트
            - user_patterns: 유저 패턴 분석 결과
            - messages: 진행 메시지
    """
    
    user_id = state.get("user_id")
    
    # Guest 사용자는 히스토리 없음
    if not user_id:
        return {
            "previous_sessions": [],
            "user_patterns": {
                "is_new_user": True,
                "session_count": 0,
                "recurring_issues": [],
                "improvement_trend": "unknown",
                "last_session_date": None,
            },
            "messages": ["게스트 모드 - 히스토리 없음"]
        }
    
    # Supabase에서 과거 세션 조회
    try:
        supabase = create_client(
            os.getenv("SUPABASE_URL"),
            os.getenv("SUPABASE_SERVICE_KEY")
        )
        
        # 최근 5개 세션 조회 (같은 프로젝트 내에서)
        project_id = state.get("project_id")
        
        query = supabase.table("sessions") \
            .select("session_id, analysis_result, improved_script, created_at") \
            .eq("user_id", user_id) \
            .order("created_at", desc=True) \
            .limit(5)
        
        # 프로젝트가 지정되어 있으면 필터링
        if project_id:
            query = query.eq("project_id", project_id)
        
        response = query.execute()
        previous_sessions = response.data or []
        
    except Exception as e:
        # DB 조회 실패 시 빈 리스트로 진행
        print(f"Failed to load progressive context: {e}")
        previous_sessions = []
    
    # 패턴 분석
    user_patterns = extract_user_patterns(previous_sessions)
    
    # 메시지 생성
    if user_patterns["is_new_user"]:
        message = "첫 세션입니다"
    else:
        message = f"이전 {user_patterns['session_count']}개 세션 컨텍스트 로드"
    
    return {
        "previous_sessions": previous_sessions,
        "user_patterns": user_patterns,
        "messages": [message]
    }


def extract_user_patterns(sessions: List[dict]) -> UserPatterns:
    """
    과거 세션에서 유저 패턴 추출
    
    반복되는 문제점, 개선 추세 등을 분석합니다.
    
    Args:
        sessions: 과거 세션 기록 리스트
    
    Returns:
        UserPatterns: 분석된 유저 패턴
    """
    
    if not sessions:
        return {
            "is_new_user": True,
            "session_count": 0,
            "recurring_issues": [],
            "improvement_trend": "unknown",
            "last_session_date": None,
        }
    
    # 모든 세션에서 improvement_suggestions 수집
    all_suggestions = []
    scores_history = []
    
    for session in sessions:
        analysis = session.get("analysis_result", {})
        
        # 개선 제안 수집
        suggestions = analysis.get("suggestions", [])
        for s in suggestions:
            if isinstance(s, dict):
                all_suggestions.append(s.get("category", "unknown"))
            elif isinstance(s, str):
                all_suggestions.append(s)
        
        # 점수 수집 (개선 추세 분석용)
        scores = analysis.get("scores", {})
        if scores:
            scores_history.append(scores)
    
    # 반복되는 문제점 찾기 (2회 이상 등장)
    suggestion_counts = Counter(all_suggestions)
    recurring_issues = [
        issue for issue, count in suggestion_counts.most_common(5)
        if count >= 2
    ]
    
    # 개선 추세 분석
    improvement_trend = analyze_improvement_trend(scores_history)
    
    return {
        "is_new_user": False,
        "session_count": len(sessions),
        "recurring_issues": recurring_issues,
        "improvement_trend": improvement_trend,
        "last_session_date": sessions[0].get("created_at") if sessions else None,
    }


def analyze_improvement_trend(scores_history: List[dict]) -> str:
    """
    점수 히스토리에서 개선 추세 분석
    
    최근 세션일수록 점수가 높아지면 "improving",
    낮아지면 "declining", 변화 없으면 "stable"
    
    Args:
        scores_history: 점수 기록 리스트 (최신순)
    
    Returns:
        str: 개선 추세 (improving/stable/declining/unknown)
    """
    
    if len(scores_history) < 2:
        return "unknown"
    
    # 점수를 숫자로 변환하는 함수
    def score_to_num(score: str) -> float:
        mapping = {"A": 4.0, "B+": 3.5, "B": 3.0, "C+": 2.5, "C": 2.0, "D": 1.0}
        return mapping.get(score, 2.5)  # 기본값 B
    
    # 각 세션의 평균 점수 계산
    session_averages = []
    for scores in scores_history:
        if isinstance(scores, dict):
            nums = [score_to_num(v) for v in scores.values() if isinstance(v, str)]
            if nums:
                session_averages.append(sum(nums) / len(nums))
    
    if len(session_averages) < 2:
        return "unknown"
    
    # 최신 vs 과거 비교 (scores_history는 최신순이므로 역순)
    recent = session_averages[0]  # 최신
    older = sum(session_averages[1:]) / len(session_averages[1:])  # 과거 평균
    
    diff = recent - older
    
    if diff > 0.3:
        return "improving"
    elif diff < -0.3:
        return "declining"
    else:
        return "stable"


async def analyze_uploaded_context(state: SpeechCoachState) -> dict:
    """
    업로드된 문서 분석 노드 (Deep Mode)
    
    이력서, 포트폴리오 등 업로드된 문서를 분석하여
    면접 질문 생성과 맥락 있는 피드백에 활용합니다.
    
    Args:
        state: 현재 워크플로우 상태
            - project_id: 프로젝트 ID
            - context_documents: 문서 URL 리스트 (또는 None)
    
    Returns:
        dict: 업데이트할 상태 필드
            - context_analysis: 문서 분석 결과
            - messages: 진행 메시지
    """
    
    project_id = state.get("project_id")
    
    if not project_id:
        return {
            "context_analysis": None,
            "messages": ["Quick Mode - 문서 분석 생략"]
        }
    
    # 프로젝트의 컨텍스트 문서 조회
    try:
        supabase = create_client(
            os.getenv("SUPABASE_URL"),
            os.getenv("SUPABASE_SERVICE_KEY")
        )
        
        response = supabase.table("project_documents") \
            .select("document_url, document_type, extracted_text") \
            .eq("project_id", project_id) \
            .execute()
        
        documents = response.data or []
        
    except Exception as e:
        print(f"Failed to load project documents: {e}")
        return {
            "context_analysis": None,
            "messages": ["문서 로드 실패"]
        }
    
    if not documents:
        return {
            "context_analysis": None,
            "messages": ["업로드된 문서 없음"]
        }
    
    # 문서 내용 결합
    document_contents = []
    for doc in documents:
        text = doc.get("extracted_text", "")
        doc_type = doc.get("document_type", "unknown")
        if text:
            document_contents.append(f"[{doc_type}]\n{text}")
    
    combined_content = "\n\n---\n\n".join(document_contents)
    
    # Claude로 핵심 정보 추출
    from anthropic import AsyncAnthropic
    
    client = AsyncAnthropic()
    
    extraction_prompt = f"""다음 문서들에서 면접/발표에 활용할 수 있는 핵심 정보를 추출해주세요.

문서 내용:
{combined_content[:10000]}  # 토큰 제한

추출할 정보:
1. 주요 기술 스택/역량
2. 핵심 프로젝트와 구체적 성과 (숫자 포함)
3. 차별화 포인트
4. 예상되는 면접 질문 3-5개

JSON 형식으로 응답해주세요:
{{
    "skills": ["스킬1", "스킬2", ...],
    "key_achievements": [
        {{"project": "프로젝트명", "achievement": "성과", "numbers": "수치"}},
        ...
    ],
    "differentiators": ["차별점1", ...],
    "expected_questions": ["질문1", ...]
}}
"""
    
    response = await client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=1500,
        messages=[
            {"role": "user", "content": extraction_prompt}
        ]
    )
    
    context_analysis = response.content[0].text
    
    return {
        "context_analysis": context_analysis,
        "context_documents": [d.get("extracted_text", "") for d in documents],
        "messages": [f"문서 {len(documents)}개 분석 완료"]
    }


def build_progressive_context_prompt(
    user_patterns: Optional[UserPatterns],
    previous_sessions: List[dict],
) -> str:
    """
    Progressive Context를 분석 프롬프트에 추가할 섹션 생성
    
    Args:
        user_patterns: 유저 패턴 분석 결과
        previous_sessions: 과거 세션 기록
    
    Returns:
        str: 프롬프트에 추가할 컨텍스트 섹션
    """
    
    if not user_patterns or user_patterns.get("is_new_user"):
        return ""
    
    context_parts = []
    
    # 기본 정보
    context_parts.append(f"[유저 히스토리]")
    context_parts.append(f"- 지금까지 {user_patterns['session_count']}회 연습")
    context_parts.append(f"- 개선 추세: {user_patterns['improvement_trend']}")
    
    # 반복 문제점
    if user_patterns.get("recurring_issues"):
        issues = ", ".join(user_patterns["recurring_issues"][:3])
        context_parts.append(f"- 반복적인 개선점: {issues}")
    
    # 가장 최근 세션 피드백 요약
    if previous_sessions:
        last_session = previous_sessions[0]
        last_analysis = last_session.get("analysis_result", {})
        last_scores = last_analysis.get("scores", {})
        
        if last_scores:
            scores_str = ", ".join(f"{k}: {v}" for k, v in last_scores.items())
            context_parts.append(f"- 지난 세션 점수: {scores_str}")
    
    context_parts.append("")
    context_parts.append("이 유저에게는 위 반복 패턴에 대해 진전이 있는지 확인하고,")
    context_parts.append("격려하거나 추가 조언을 해주세요.")
    
    return "\n".join(context_parts)


# ============================================
# 테스트용 Mock
# ============================================

async def load_progressive_context_mock(state: SpeechCoachState) -> dict:
    """테스트용 Mock Progressive Context"""
    
    return {
        "previous_sessions": [
            {
                "session_id": "prev_001",
                "analysis_result": {
                    "scores": {"pace": "C", "filler": "C+"},
                    "suggestions": [{"category": "pace"}, {"category": "filler"}]
                },
                "created_at": "2024-01-30T10:00:00Z"
            }
        ],
        "user_patterns": {
            "is_new_user": False,
            "session_count": 3,
            "recurring_issues": ["pace", "filler"],
            "improvement_trend": "improving",
            "last_session_date": "2024-01-30T10:00:00Z",
        },
        "messages": ["[MOCK] 컨텍스트 로드 완료"]
    }
