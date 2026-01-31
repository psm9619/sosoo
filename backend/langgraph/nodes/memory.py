"""
Memory 노드 - Dual Memory System (LTM/STM)

Long-term Memory와 Short-term Memory를 관리하는 노드입니다.

## 워크플로우 내 위치

```
[START]
    │
    ▼
┌─────────────────┐
│  Load Memory    │  ← 이 파일: LTM 캐시 확인 + STM 로드
└────────┬────────┘
         │
         ▼
    ... (분석/개선) ...
         │
         ▼
┌─────────────────┐
│ Extract Memory  │  ← 이 파일: STM 추출 + LTM 승격
└────────┬────────┘
         │
         ▼
[END]
```

## Memory 사용 전략

1. **LTM (Long-term Memory)**
   - 세션 시작 시 캐시 확인
   - 캐시 유효하면 DB 조회 스킵 (효율성 ↑)
   - 사용자가 프로필 변경 시에만 업데이트

2. **STM (Short-term Memory)**
   - 세션마다 DB에서 로드
   - 세션 종료 시 자동 추출 & 저장
   - 5회 이상 반복 시 LTM으로 승격
"""

import os
import json
from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta
from anthropic import AsyncAnthropic

from supabase import create_client

from ..state import (
    SpeechCoachState,
    LongTermMemory,
    ShortTermMemory,
    MemoryPromptContext,
    STMType,
    # 유틸리티 함수
    create_default_ltm,
    is_ltm_cache_valid,
    create_speech_pattern_stm,
    create_improvement_stm,
    get_stm_by_type,
    get_promotable_stm,
    build_memory_prompt_context,
    format_memory_prompt,
    should_promote_stm,
    promote_stm_to_ltm,
)


# ============================================
# Memory 로드 노드
# ============================================

async def load_memory(state: SpeechCoachState) -> dict:
    """
    Memory 로드 노드 (워크플로우 시작 시 호출)
    
    1. LTM 캐시 확인 → 유효하면 스킵
    2. LTM 로드 (캐시 만료 시)
    3. STM 로드 (항상)
    4. Memory 프롬프트 생성
    
    Args:
        state: 현재 워크플로우 상태
            - user_id: 사용자 ID
            - ltm_cache_valid: LTM 캐시 유효 여부
            - long_term_memory: 캐싱된 LTM (있으면)
    
    Returns:
        dict: 업데이트할 상태 필드
            - long_term_memory: LTM 데이터
            - short_term_memories: STM 리스트
            - memory_prompt_context: 프롬프트 컨텍스트
            - memory_prompt_text: 프롬프트 문자열
            - ltm_loaded, ltm_cache_valid, ltm_cache_expires_at
            - messages: 진행 메시지
    """
    
    user_id = state.get("user_id")
    session_id = state.get("session_id")
    
    # Guest 사용자는 Memory 없음
    if not user_id:
        return {
            "long_term_memory": None,
            "short_term_memories": [],
            "memory_prompt_context": None,
            "memory_prompt_text": None,
            "ltm_loaded": False,
            "ltm_cache_valid": False,
            "messages": ["게스트 모드 - Memory 없음"]
        }
    
    messages = []
    
    # === 1. LTM 로드 ===
    ltm = state.get("long_term_memory")
    ltm_loaded = state.get("ltm_loaded", False)
    
    # 캐시 유효성 확인
    if ltm_loaded and is_ltm_cache_valid(state):
        messages.append("LTM 캐시 사용")
    else:
        # DB에서 LTM 로드
        ltm = await _load_ltm_from_db(user_id)
        ltm_loaded = True
        messages.append("LTM 로드 완료" if ltm else "LTM 새로 생성")
    
    # LTM이 없으면 기본값 생성
    if not ltm:
        ltm = create_default_ltm(user_id)
    
    # === 2. STM 로드 ===
    stm_list = await _load_stm_from_db(user_id)
    messages.append(f"STM {len(stm_list)}개 로드")
    
    # === 3. Memory 프롬프트 생성 ===
    prompt_context = build_memory_prompt_context(ltm, stm_list)
    prompt_text = format_memory_prompt(prompt_context)
    
    if prompt_text:
        messages.append("Memory 프롬프트 생성 완료")
    
    # === 4. 캐시 만료 시간 설정 ===
    now = datetime.utcnow()
    cache_expires = (now + timedelta(hours=24)).isoformat()
    
    return {
        "long_term_memory": ltm,
        "short_term_memories": stm_list,
        "memory_prompt_context": prompt_context,
        "memory_prompt_text": prompt_text,
        "ltm_loaded": ltm_loaded,
        "ltm_cache_valid": True,
        "ltm_cache_expires_at": cache_expires,
        "messages": messages,
    }


async def _load_ltm_from_db(user_id: str) -> Optional[LongTermMemory]:
    """DB에서 Long-term Memory 로드"""
    
    try:
        supabase = create_client(
            os.getenv("SUPABASE_URL"),
            os.getenv("SUPABASE_SERVICE_KEY")
        )
        
        response = supabase.table("long_term_memories") \
            .select("*") \
            .eq("user_id", user_id) \
            .single() \
            .execute()
        
        if response.data:
            return response.data
        return None
        
    except Exception as e:
        print(f"LTM 로드 실패: {e}")
        return None


async def _load_stm_from_db(user_id: str) -> List[ShortTermMemory]:
    """DB에서 Short-term Memory 로드 (만료되지 않은 것만)"""
    
    try:
        supabase = create_client(
            os.getenv("SUPABASE_URL"),
            os.getenv("SUPABASE_SERVICE_KEY")
        )
        
        now = datetime.utcnow().isoformat()
        
        response = supabase.table("short_term_memories") \
            .select("*") \
            .eq("user_id", user_id) \
            .or_(f"expires_at.is.null,expires_at.gt.{now}") \
            .order("updated_at", desc=True) \
            .limit(30) \
            .execute()
        
        return response.data or []
        
    except Exception as e:
        print(f"STM 로드 실패: {e}")
        return []


# ============================================
# Memory 추출 노드
# ============================================

async def extract_memory(state: SpeechCoachState) -> dict:
    """
    Memory 추출 노드 (세션 종료 시 호출)
    
    분석 결과에서 저장할 가치가 있는 정보를 추출하여
    Short-term Memory로 저장합니다.
    
    또한 5회 이상 반복된 STM은 LTM으로 승격합니다.
    
    Args:
        state: 현재 워크플로우 상태
            - user_id: 사용자 ID
            - session_id: 세션 ID
            - analysis_result: 분석 결과
            - transcript: 원본 텍스트
            - short_term_memories: 기존 STM 리스트
            - long_term_memory: LTM
    
    Returns:
        dict: 업데이트할 상태 필드
            - short_term_memories: 업데이트된 STM 리스트
            - long_term_memory: 업데이트된 LTM (승격 발생 시)
            - memory_extraction_result: 추출 결과
            - messages: 진행 메시지
    """
    
    user_id = state.get("user_id")
    session_id = state.get("session_id")
    
    # Guest 사용자는 Memory 저장 안 함
    if not user_id:
        return {
            "memory_extraction_result": None,
            "messages": ["게스트 모드 - Memory 저장 스킵"]
        }
    
    analysis = state.get("analysis_result", {})
    transcript = state.get("transcript", "")
    existing_stm = state.get("short_term_memories", [])
    ltm = state.get("long_term_memory")
    
    messages = []
    
    # === 1. Claude로 Memory 추출 ===
    extraction_result = await _extract_memories_with_claude(
        transcript=transcript,
        analysis=analysis,
        existing_stm=existing_stm,
        ltm=ltm,
    )
    
    # === 2. 새 STM 생성 ===
    new_stm_list = []
    
    for mem_data in extraction_result.get("new_memories", []):
        mem_type = mem_data.get("type")
        
        if mem_type == "speech_pattern":
            stm = create_speech_pattern_stm(
                user_id=user_id,
                session_id=session_id,
                pattern_type=mem_data.get("subtype", "general"),
                description=mem_data.get("content", ""),
                severity=mem_data.get("severity", "medium"),
                numeric_value=mem_data.get("numeric_value"),
                ttl_days=mem_data.get("ttl_days", 14),
            )
            new_stm_list.append(stm)
            
        elif mem_type == "improvement_progress":
            stm = create_improvement_stm(
                user_id=user_id,
                session_id=session_id,
                category=mem_data.get("category", "general"),
                initial_score=mem_data.get("initial_score", "B"),
                current_score=mem_data.get("current_score", "B"),
            )
            new_stm_list.append(stm)
    
    if new_stm_list:
        messages.append(f"STM {len(new_stm_list)}개 추출")
    
    # === 3. 점수 히스토리 추가 ===
    score_history_entry = None
    if analysis.get("scores"):
        score_history_entry = {
            "session_id": session_id,
            "timestamp": datetime.utcnow().isoformat(),
            "scores": analysis["scores"],
            "metrics": analysis.get("metrics"),
        }
    
    # === 4. STM → LTM 승격 확인 ===
    updated_ltm = ltm
    promotable = get_promotable_stm(existing_stm + new_stm_list)
    
    for stm in promotable:
        if should_promote_stm(stm):
            updated_ltm = promote_stm_to_ltm(updated_ltm, stm)
            messages.append(f"STM 승격: {stm.get('speech_pattern', {}).get('pattern_type', 'unknown')}")
    
    # === 5. DB에 저장 ===
    await _save_stm_to_db(user_id, new_stm_list)
    
    if updated_ltm != ltm:
        await _save_ltm_to_db(user_id, updated_ltm)
        messages.append("LTM 업데이트 완료")
    
    return {
        "short_term_memories": new_stm_list,  # 리듀서가 기존과 병합
        "long_term_memory": updated_ltm,
        "score_history": [score_history_entry] if score_history_entry else [],
        "memory_extraction_result": extraction_result,
        "messages": messages or ["Memory 추출 완료"],
    }


async def _extract_memories_with_claude(
    transcript: str,
    analysis: dict,
    existing_stm: List[ShortTermMemory],
    ltm: Optional[LongTermMemory],
) -> dict:
    """Claude를 사용하여 저장할 Memory 추출"""
    
    # 기존 STM 요약
    existing_patterns = []
    for stm in existing_stm[:5]:
        pattern = stm.get("speech_pattern", {})
        if pattern:
            existing_patterns.append(
                f"- {pattern.get('pattern_type')}: {pattern.get('description')} (반복: {stm.get('mention_count', 1)}회)"
            )
    
    existing_stm_text = "\n".join(existing_patterns) if existing_patterns else "없음"
    
    # 분석 결과 요약
    scores = analysis.get("scores", {})
    metrics = analysis.get("metrics", {})
    suggestions = analysis.get("suggestions", [])
    
    scores_text = ", ".join(f"{k}: {v}" for k, v in scores.items()) if scores else "없음"
    suggestions_text = "\n".join(
        f"- [{s.get('category')}] {s.get('suggestion')}"
        for s in suggestions[:3]
    ) if suggestions else "없음"
    
    prompt = f"""다음 스피치 분석 결과에서 장기적으로 기억할 가치가 있는 정보를 추출해주세요.

## 이번 세션 분석 결과

### 원본 텍스트 (일부)
{transcript[:500]}...

### 점수
{scores_text}

### 측정값
- 말 속도: {metrics.get('words_per_minute', 'N/A')} WPM
- 필러워드: {metrics.get('filler_percentage', 'N/A')}%

### 개선 제안
{suggestions_text}

## 기존 Short-term Memory
{existing_stm_text}

## 추출 기준

1. **speech_pattern**: 반복되는 말하기 패턴 (필러워드 습관, 말 속도 경향 등)
2. **improvement_progress**: 이전 대비 개선/악화된 영역
3. **session_insight**: 이번 세션에서 발견된 중요 인사이트

## 제외 기준

- 일회성 실수 (패턴이 아닌 것)
- 이미 기존 STM에 있는 내용과 중복
- 너무 일반적인 내용

## 응답 형식 (JSON)

{{
    "should_save": true/false,
    "reasoning": "저장 여부 이유",
    "new_memories": [
        {{
            "type": "speech_pattern",
            "subtype": "filler/pace/structure/tone",
            "content": "설명 (1-2문장)",
            "severity": "high/medium/low",
            "numeric_value": 숫자값 (있으면),
            "ttl_days": 7-30
        }},
        {{
            "type": "improvement_progress",
            "category": "pace/filler/structure",
            "initial_score": "이전 점수",
            "current_score": "현재 점수"
        }}
    ]
}}

**중요**: 진짜 가치 있는 정보만 추출하세요. 매 세션마다 무조건 저장하는 것은 비효율적입니다."""

    try:
        client = AsyncAnthropic()
        
        response = await client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=1000,
            messages=[
                {"role": "user", "content": prompt}
            ]
        )
        
        # JSON 파싱
        response_text = response.content[0].text
        
        # JSON 블록 추출
        import re
        json_match = re.search(r'\{[\s\S]*\}', response_text)
        
        if json_match:
            return json.loads(json_match.group())
        
        return {"should_save": False, "new_memories": []}
        
    except Exception as e:
        print(f"Memory 추출 실패: {e}")
        return {"should_save": False, "new_memories": [], "error": str(e)}


async def _save_stm_to_db(user_id: str, stm_list: List[ShortTermMemory]) -> None:
    """Short-term Memory DB 저장"""
    
    if not stm_list:
        return
    
    try:
        supabase = create_client(
            os.getenv("SUPABASE_URL"),
            os.getenv("SUPABASE_SERVICE_KEY")
        )
        
        for stm in stm_list:
            # upsert (id 기준)
            supabase.table("short_term_memories").upsert(stm).execute()
            
    except Exception as e:
        print(f"STM 저장 실패: {e}")


async def _save_ltm_to_db(user_id: str, ltm: LongTermMemory) -> None:
    """Long-term Memory DB 저장"""
    
    try:
        supabase = create_client(
            os.getenv("SUPABASE_URL"),
            os.getenv("SUPABASE_SERVICE_KEY")
        )
        
        supabase.table("long_term_memories").upsert(ltm).execute()
        
    except Exception as e:
        print(f"LTM 저장 실패: {e}")


# ============================================
# LTM 직접 업데이트 (워크플로우 외부)
# ============================================

async def update_user_ltm(
    user_id: str,
    updates: Dict[str, Any],
) -> LongTermMemory:
    """
    사용자 LTM 직접 업데이트
    
    프로필 변경 등 워크플로우 루프 없이 LTM만 업데이트할 때 사용합니다.
    
    Args:
        user_id: 사용자 ID
        updates: 업데이트할 필드들
            - profile: UserProfile 업데이트
            - career: CareerContext 업데이트
            - goal: GoalContext 업데이트
            - feedback_preference: FeedbackPreference 업데이트
    
    Returns:
        LongTermMemory: 업데이트된 LTM
    """
    
    # 기존 LTM 로드
    ltm = await _load_ltm_from_db(user_id)
    
    if not ltm:
        ltm = create_default_ltm(user_id)
    
    # 업데이트 적용
    now = datetime.utcnow().isoformat()
    
    for key in ["profile", "career", "goal", "feedback_preference"]:
        if key in updates and updates[key]:
            ltm[key] = {**ltm.get(key, {}), **updates[key]}
    
    ltm["updated_at"] = now
    ltm["version"] = ltm.get("version", 0) + 1
    
    # DB 저장
    await _save_ltm_to_db(user_id, ltm)
    
    return ltm


async def get_user_ltm(user_id: str) -> Optional[LongTermMemory]:
    """사용자 LTM 조회 (외부 API용)"""
    return await _load_ltm_from_db(user_id)


async def get_user_stm(user_id: str) -> List[ShortTermMemory]:
    """사용자 STM 조회 (외부 API용)"""
    return await _load_stm_from_db(user_id)


# ============================================
# 테스트용 Mock
# ============================================

async def load_memory_mock(state: SpeechCoachState) -> dict:
    """테스트용 Mock Memory 로드"""
    
    mock_ltm = {
        "id": "ltm_test",
        "user_id": "test_user",
        "profile": {
            "name": "테스터",
            "occupation": "백엔드 개발자",
            "experience_years": 5,
            "industry": "IT",
        },
        "career": {
            "current_role": "시니어 개발자",
            "target_role": "테크 리드",
            "key_skills": ["Python", "FastAPI", "PostgreSQL"],
            "achievements": ["서비스 응답속도 50% 개선"],
        },
        "goal": {
            "primary_goal": "interview",
            "target_company": "네이버",
            "target_date": "2024-03-01",
            "specific_concerns": ["컬처핏 면접"],
        },
        "feedback_preference": {
            "style": "direct",
            "detail_level": "detailed",
            "language": "formal",
        },
        "confirmed_traits": [
            {
                "trait_type": "weakness",
                "category": "pace",
                "description": "말 속도가 빠른 경향",
                "confirmed_count": 5,
            }
        ],
        "created_at": "2024-01-01T00:00:00Z",
        "updated_at": "2024-01-30T00:00:00Z",
        "version": 3,
    }
    
    mock_stm = [
        {
            "id": "stm_1",
            "user_id": "test_user",
            "memory_type": "speech_pattern",
            "speech_pattern": {
                "pattern_type": "filler",
                "description": "'어...' 사용 빈도 높음",
                "severity": "medium",
                "occurrence_count": 3,
                "trend": "improving",
            },
            "importance": "medium",
            "mention_count": 3,
            "ttl_days": 14,
        }
    ]
    
    prompt_context = build_memory_prompt_context(mock_ltm, mock_stm)
    prompt_text = format_memory_prompt(prompt_context)
    
    return {
        "long_term_memory": mock_ltm,
        "short_term_memories": mock_stm,
        "memory_prompt_context": prompt_context,
        "memory_prompt_text": prompt_text,
        "ltm_loaded": True,
        "ltm_cache_valid": True,
        "ltm_cache_expires_at": (datetime.utcnow() + timedelta(hours=24)).isoformat(),
        "messages": ["[MOCK] Memory 로드 완료"],
    }


async def extract_memory_mock(state: SpeechCoachState) -> dict:
    """테스트용 Mock Memory 추출"""
    
    return {
        "short_term_memories": [
            {
                "id": "stm_new",
                "user_id": "test_user",
                "memory_type": "speech_pattern",
                "speech_pattern": {
                    "pattern_type": "pace",
                    "description": "이번 세션 말 속도 개선됨",
                    "severity": "low",
                    "trend": "improving",
                },
                "importance": "medium",
                "mention_count": 1,
                "ttl_days": 14,
            }
        ],
        "memory_extraction_result": {
            "should_save": True,
            "reasoning": "말 속도 개선 패턴 감지",
            "new_memories": [{"type": "speech_pattern"}],
        },
        "messages": ["[MOCK] Memory 추출 완료"],
    }