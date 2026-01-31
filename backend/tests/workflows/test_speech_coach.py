"""
스피치 코칭 워크플로우 테스트

전체 파이프라인과 개별 노드 연결을 테스트합니다.
"""

import pytest
from langgraph.workflows import (
    create_speech_coach_graph,
    create_quick_mode_graph,
    create_deep_mode_graph,
    create_mock_graph,
)
from langgraph.state import create_initial_state


class TestGraphCreation:
    """그래프 생성 테스트"""
    
    def test_create_default_graph(self):
        """기본 그래프 생성"""
        graph = create_speech_coach_graph()
        assert graph is not None
    
    def test_create_quick_mode_graph(self):
        """Quick Mode 그래프 생성"""
        graph = create_quick_mode_graph()
        assert graph is not None
    
    def test_create_deep_mode_graph(self):
        """Deep Mode 그래프 생성"""
        graph = create_deep_mode_graph()
        assert graph is not None
    
    def test_create_mock_graph(self):
        """Mock 그래프 생성"""
        graph = create_mock_graph()
        assert graph is not None


class TestInitialState:
    """초기 상태 생성 테스트"""
    
    def test_create_initial_state_required_fields(self):
        """필수 필드로 초기 상태 생성"""
        state = create_initial_state(
            session_id="test-001",
            audio_url="https://example.com/audio.webm",
        )
        
        assert state["session_id"] == "test-001"
        assert state["audio_file_path"] == "https://example.com/audio.webm"
        assert state["mode"] == "quick"  # 기본값
        assert state["transcript"] == ""
        assert state["messages"] == []
    
    def test_create_initial_state_all_fields(self):
        """모든 필드로 초기 상태 생성"""
        state = create_initial_state(
            session_id="test-002",
            audio_url="https://example.com/audio.webm",
            mode="deep",
            user_id="user-001",
            voice_type="default_female",
            question="자기소개를 해주세요.",
            project_id="project-001",
        )
        
        assert state["mode"] == "deep"
        assert state["user_id"] == "user-001"
        assert state["voice_type"] == "default_female"
        assert state["question"] == "자기소개를 해주세요."
        assert state["project_id"] == "project-001"


@pytest.mark.asyncio
class TestMockWorkflow:
    """Mock 워크플로우 실행 테스트"""
    
    async def test_mock_workflow_execution(self):
        """Mock 워크플로우 전체 실행"""
        graph = create_mock_graph()
        
        initial_state = create_initial_state(
            session_id="mock-test-001",
            audio_url="https://example.com/audio.webm",
            user_id="test-user",
        )
        
        # 워크플로우 실행
        result = await graph.ainvoke(initial_state)
        
        # 결과 검증
        assert result["transcript"] != ""
        assert result["analysis_result"] != {}
        assert result["improved_script"] != ""
        assert result["improved_audio_url"] != ""
        assert len(result["messages"]) > 0
    
    async def test_mock_workflow_messages(self):
        """Mock 워크플로우 메시지 누적 확인"""
        graph = create_mock_graph()
        
        initial_state = create_initial_state(
            session_id="mock-test-002",
            audio_url="https://example.com/audio.webm",
        )
        
        result = await graph.ainvoke(initial_state)
        
        # 각 노드에서 메시지가 추가되었는지 확인
        messages = result["messages"]
        assert any("컨텍스트" in m or "MOCK" in m for m in messages)
        assert any("인식" in m or "MOCK" in m for m in messages)
        assert any("분석" in m or "MOCK" in m for m in messages)


class TestGraphConfiguration:
    """그래프 설정 테스트"""
    
    def test_react_option(self):
        """ReAct 옵션 테스트"""
        # ReAct 비활성화
        graph_basic = create_speech_coach_graph(use_react=False)
        assert graph_basic is not None
        
        # ReAct 활성화
        graph_react = create_speech_coach_graph(use_react=True)
        assert graph_react is not None
    
    def test_reflection_option(self):
        """Reflection 옵션 테스트"""
        # Reflection 비활성화
        graph_no_reflect = create_speech_coach_graph(use_reflection=False)
        assert graph_no_reflect is not None
        
        # Reflection 활성화
        graph_with_reflect = create_speech_coach_graph(use_reflection=True)
        assert graph_with_reflect is not None
    
    def test_moderation_option(self):
        """모더레이션 옵션 테스트"""
        # 모더레이션 비활성화
        graph_no_mod = create_speech_coach_graph(use_moderation=False)
        assert graph_no_mod is not None
        
        # 모더레이션 활성화
        graph_with_mod = create_speech_coach_graph(use_moderation=True)
        assert graph_with_mod is not None
