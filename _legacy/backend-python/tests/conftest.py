"""
Pytest 설정 및 공통 Fixture

테스트에서 공통으로 사용하는 fixture와 설정을 정의합니다.
"""

import pytest
import asyncio
from typing import Generator, AsyncGenerator


# ============================================
# Async 설정
# ============================================

@pytest.fixture(scope="session")
def event_loop() -> Generator[asyncio.AbstractEventLoop, None, None]:
    """세션 범위의 이벤트 루프 생성"""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


# ============================================
# 환경 변수 Mock
# ============================================

@pytest.fixture
def mock_env_vars(monkeypatch):
    """테스트용 환경 변수 설정"""
    monkeypatch.setenv("SUPABASE_URL", "https://test.supabase.co")
    monkeypatch.setenv("SUPABASE_SERVICE_KEY", "test-service-key")
    monkeypatch.setenv("OPENAI_API_KEY", "test-openai-key")
    monkeypatch.setenv("ANTHROPIC_API_KEY", "test-anthropic-key")
    monkeypatch.setenv("ELEVENLABS_API_KEY", "test-elevenlabs-key")


# ============================================
# 샘플 데이터
# ============================================

@pytest.fixture
def sample_transcript() -> str:
    """샘플 트랜스크립트"""
    return """안녕하세요, 저는 5년차 백엔드 개발자 홍길동입니다.

현재 ABC 회사에서 결제 시스템을 담당하고 있고요, 
어... 하루에 약 천만 건의 트랜잭션을 처리하는 시스템을 운영하고 있습니다.

음... 가장 큰 성과라고 하면, 작년에 레거시 시스템 마이그레이션 프로젝트를 
리드했었는데요, 그... 다운타임 없이 성공적으로 전환을 완료했습니다."""


@pytest.fixture
def sample_analysis_result() -> dict:
    """샘플 분석 결과"""
    return {
        "scores": {
            "logic_structure": "B+",
            "filler_words": "C+",
            "speaking_pace": "C",
            "confidence_tone": "B",
            "content_specificity": "B+",
        },
        "metrics": {
            "words_per_minute": 185,
            "filler_count": 5,
            "filler_percentage": 4.2,
            "total_words": 120,
            "duration_seconds": 45,
        },
        "suggestions": [
            {
                "priority": 1,
                "category": "pace",
                "suggestion": "말 속도를 10% 정도 낮춰보세요",
                "impact": "청취자가 내용을 더 잘 이해할 수 있습니다"
            },
            {
                "priority": 2,
                "category": "filler",
                "suggestion": "'어...'를 줄이고 의도적인 멈춤을 사용해보세요",
                "impact": "더 자신감 있고 준비된 인상을 줍니다"
            },
        ],
        "structure_analysis": "STAR 구조 중 Situation과 Action은 명확하나, Task와 Result가 약합니다.",
        "moderation_flags": [],
    }


@pytest.fixture
def sample_speech_coach_state(sample_transcript, sample_analysis_result) -> dict:
    """샘플 SpeechCoachState"""
    return {
        "session_id": "test-session-001",
        "user_id": "test-user-001",
        "mode": "quick",
        "audio_file_path": "https://test.storage.co/audio/test.webm",
        "audio_duration": 45.0,
        "question": "자기소개를 해주세요.",
        "project_id": None,
        "transcript": sample_transcript,
        "analysis_result": sample_analysis_result,
        "improved_script": "",
        "improved_script_draft": None,
        "reflection_notes": None,
        "improved_audio_url": "",
        "original_audio_url": "https://test.storage.co/audio/test.webm",
        "previous_sessions": [],
        "user_patterns": None,
        "context_documents": None,
        "context_analysis": None,
        "voice_type": "default_male",
        "voice_clone_id": None,
        "messages": [],
        "refinement_count": 0,
        "user_intent": None,
    }


# ============================================
# API 클라이언트 Mock
# ============================================

@pytest.fixture
def mock_openai_client(monkeypatch):
    """OpenAI 클라이언트 Mock"""
    
    class MockWhisperResponse:
        text = "안녕하세요, 저는 테스트 트랜스크립트입니다."
        duration = 30.0
    
    class MockTranscriptions:
        async def create(self, **kwargs):
            return MockWhisperResponse()
    
    class MockAudio:
        transcriptions = MockTranscriptions()
    
    class MockAsyncOpenAI:
        audio = MockAudio()
    
    monkeypatch.setattr("openai.AsyncOpenAI", MockAsyncOpenAI)


@pytest.fixture
def mock_anthropic_client(monkeypatch):
    """Anthropic 클라이언트 Mock"""
    
    class MockContent:
        text = '{"scores": {"logic_structure": "B"}, "suggestions": []}'
        type = "text"
    
    class MockResponse:
        content = [MockContent()]
    
    class MockMessages:
        async def create(self, **kwargs):
            return MockResponse()
    
    class MockAsyncAnthropic:
        messages = MockMessages()
    
    monkeypatch.setattr("anthropic.AsyncAnthropic", MockAsyncAnthropic)


# ============================================
# FastAPI 테스트 클라이언트
# ============================================

@pytest.fixture
def test_client(mock_env_vars):
    """FastAPI 테스트 클라이언트"""
    from fastapi.testclient import TestClient
    from api.main import app
    
    return TestClient(app)


@pytest.fixture
async def async_test_client(mock_env_vars):
    """비동기 FastAPI 테스트 클라이언트"""
    from httpx import AsyncClient
    from api.main import app
    
    async with AsyncClient(app=app, base_url="http://test") as client:
        yield client
