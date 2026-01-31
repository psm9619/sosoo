"""
LangGraph 도구 패키지

ReAct 패턴에서 Claude가 호출하는 분석 도구들입니다.
각 도구는 객관적인 데이터를 수집하여 AI 분석의 정확도를 높입니다.

## 도구 카테고리

1. 기본 분석 도구 (Legacy)
   - analyze_pace: 말 속도 분석
   - analyze_fillers: 필러워드 분석
   - analyze_star_structure: STAR 구조 분석

2. 카테고리별 분석 도구 (4가지 카테고리)
   - analyze_delivery: 전달력 분석
   - analyze_structure: 구조력 분석
   - analyze_content: 내용력 분석
   - analyze_persuasion: 설득력 분석

3. 우선순위 결정 도구
   - classify_situation: 상황 분류
   - get_priority_weights: 우선순위 가중치 계산
   - calculate_weighted_scores: 가중치 적용 점수 계산
"""

from .pace_analysis import (
    analyze_pace,
    get_pace_score,
)
from .filler_analysis import (
    analyze_fillers,
    get_filler_score,
)
from .structure_analysis import (
    analyze_star_structure,
    get_structure_score_grade,
)

# 카테고리별 분석 도구
from .category_analyzer import (
    analyze_delivery,
    analyze_structure,
    analyze_content,
    analyze_persuasion,
    analyze_all_categories,
    get_category_summary,
    CATEGORY_TOOLS_DEFINITION,
)

# 우선순위 결정 도구
from .priority_tools import (
    classify_situation,
    get_priority_weights,
    build_priority_ranking_result,
    calculate_weighted_scores,
    get_improvement_priority,
    SpeechCategory,
    SpeechSituation,
    CATEGORY_LABELS,
    SITUATION_LABELS,
    DEFAULT_WEIGHTS,
    PRIORITY_TOOLS_DEFINITION,
)

__all__ = [
    # 기본 분석 도구 (Legacy)
    "analyze_pace",
    "get_pace_score",
    "analyze_fillers",
    "get_filler_score",
    "analyze_star_structure",
    "get_structure_score_grade",
    
    # 카테고리별 분석 도구
    "analyze_delivery",
    "analyze_structure",
    "analyze_content",
    "analyze_persuasion",
    "analyze_all_categories",
    "get_category_summary",
    "CATEGORY_TOOLS_DEFINITION",
    
    # 우선순위 결정 도구
    "classify_situation",
    "get_priority_weights",
    "build_priority_ranking_result",
    "calculate_weighted_scores",
    "get_improvement_priority",
    "SpeechCategory",
    "SpeechSituation",
    "CATEGORY_LABELS",
    "SITUATION_LABELS",
    "DEFAULT_WEIGHTS",
    "PRIORITY_TOOLS_DEFINITION",
]