"""
분석 도구 단위 테스트

pace_analysis, filler_analysis, structure_analysis 도구를 테스트합니다.
"""

import pytest
from langgraph.tools import (
    analyze_pace,
    analyze_fillers,
    analyze_star_structure,
    get_pace_score,
    get_filler_score,
)


class TestPaceAnalysis:
    """말 속도 분석 테스트"""
    
    def test_optimal_pace(self):
        """적정 속도 테스트 (120-170 WPM)"""
        # 145 WPM 정도의 텍스트
        transcript = " ".join(["단어"] * 145)
        result = analyze_pace(transcript, 60.0)
        
        assert result["assessment"] == "optimal"
        assert 120 <= result["words_per_minute"] <= 170
        assert result["word_count"] == 145
    
    def test_fast_pace(self):
        """빠른 속도 테스트 (>170 WPM)"""
        # 200 WPM
        transcript = " ".join(["단어"] * 200)
        result = analyze_pace(transcript, 60.0)
        
        assert result["assessment"] == "too_fast"
        assert result["words_per_minute"] == 200
        assert "빠름" in result["deviation"]
    
    def test_slow_pace(self):
        """느린 속도 테스트 (<120 WPM)"""
        # 90 WPM
        transcript = " ".join(["단어"] * 90)
        result = analyze_pace(transcript, 60.0)
        
        assert result["assessment"] == "too_slow"
        assert result["words_per_minute"] == 90
        assert "느림" in result["deviation"]
    
    def test_zero_duration_handling(self):
        """0초 duration 처리 테스트"""
        transcript = "테스트 문장입니다"
        result = analyze_pace(transcript, 0.0)
        
        # 0으로 나누기 에러 없이 처리되어야 함
        assert result["words_per_minute"] > 0
    
    def test_pace_score_grades(self):
        """점수 변환 테스트"""
        assert get_pace_score(145) == "A"      # 적정 중간
        assert get_pace_score(120) == "B+"     # 적정 하한
        assert get_pace_score(170) == "B+"     # 적정 상한
        assert get_pace_score(100) == "C+"     # 약간 느림
        assert get_pace_score(200) == "C"      # 빠름
        assert get_pace_score(80) == "D"       # 매우 느림


class TestFillerAnalysis:
    """필러워드 분석 테스트"""
    
    def test_no_fillers(self):
        """필러워드 없는 경우"""
        transcript = "안녕하세요 저는 개발자입니다 오늘 발표를 하겠습니다"
        result = analyze_fillers(transcript)
        
        assert result["filler_count"] == 0
        assert result["filler_percentage"] == 0.0
        assert result["assessment"] == "excellent"
    
    def test_sound_fillers(self):
        """소리형 필러워드 감지"""
        transcript = "어... 그래서 음... 제가 했던 것은 아... 이것입니다"
        result = analyze_fillers(transcript)
        
        assert result["filler_count"] >= 3
        assert "sound" in result["fillers_by_type"]
    
    def test_word_fillers(self):
        """단어형 필러워드 감지"""
        transcript = "그 이제 뭐 약간 좀 그런 느낌입니다"
        result = analyze_fillers(transcript)
        
        assert result["filler_count"] >= 3
        assert "word" in result["fillers_by_type"]
    
    def test_excessive_fillers(self):
        """과도한 필러워드 감지"""
        # 10개 중 3개가 필러 (30%)
        transcript = "어 음 그 프로젝트를 어 진행하면서 음 느낀 것은 어 이것입니다"
        result = analyze_fillers(transcript)
        
        assert result["assessment"] == "excessive"
        assert result["filler_percentage"] > 5
    
    def test_filler_score_grades(self):
        """점수 변환 테스트"""
        assert get_filler_score(0.5) == "A"
        assert get_filler_score(1.5) == "B+"
        assert get_filler_score(2.5) == "B"
        assert get_filler_score(3.5) == "C+"
        assert get_filler_score(4.5) == "C"
        assert get_filler_score(6.0) == "D"


class TestStructureAnalysis:
    """STAR 구조 분석 테스트"""
    
    def test_complete_star(self):
        """완전한 STAR 구조"""
        transcript = """
        당시 팀에서 레거시 시스템 문제가 있었습니다.
        저는 마이그레이션을 목표로 해야 했습니다.
        그래서 제가 직접 설계하고 진행했습니다.
        결과적으로 40% 비용 절감을 달성했습니다.
        """
        result = analyze_star_structure(transcript)
        
        assert result["elements_found"]["situation"] is True
        assert result["elements_found"]["task"] is True
        assert result["elements_found"]["action"] is True
        assert result["elements_found"]["result"] is True
        assert result["has_numbers"] is True
        assert result["structure_score"] >= 70
    
    def test_missing_result(self):
        """Result 누락"""
        transcript = """
        당시 팀에서 문제가 있었습니다.
        저는 해결해야 했습니다.
        그래서 제가 진행했습니다.
        """
        result = analyze_star_structure(transcript)
        
        assert result["elements_found"]["result"] is False
        assert "result" in result["missing_elements"]
    
    def test_no_numbers(self):
        """숫자 없는 Result"""
        transcript = """
        당시 상황이 어려웠습니다.
        목표를 달성해야 했습니다.
        그래서 진행했습니다.
        결과적으로 성공했습니다.
        """
        result = analyze_star_structure(transcript)
        
        assert result["has_numbers"] is False
        assert "숫자" in result["recommendation"]
    
    def test_poor_structure(self):
        """구조가 부실한 경우"""
        transcript = "저는 개발자입니다 코딩을 합니다"
        result = analyze_star_structure(transcript)
        
        assert result["structure_score"] < 50
        assert len(result["missing_elements"]) >= 2


class TestIntegration:
    """도구 통합 테스트"""
    
    def test_realistic_transcript(self, sample_transcript):
        """실제 면접 답변 분석"""
        # 속도 분석
        pace_result = analyze_pace(sample_transcript, 45.0)
        assert pace_result["words_per_minute"] > 0
        
        # 필러 분석
        filler_result = analyze_fillers(sample_transcript)
        assert filler_result["filler_count"] >= 0
        
        # 구조 분석
        structure_result = analyze_star_structure(sample_transcript)
        assert "elements_found" in structure_result
    
    def test_empty_transcript(self):
        """빈 텍스트 처리"""
        empty = ""
        
        # 에러 없이 처리되어야 함
        pace_result = analyze_pace(empty, 1.0)
        filler_result = analyze_fillers(empty)
        structure_result = analyze_star_structure(empty)
        
        assert pace_result["word_count"] == 0
        assert filler_result["filler_count"] == 0
        assert structure_result["structure_score"] <= 50
