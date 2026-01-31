"""
STT (Speech-to-Text) 노드

OpenAI Whisper API를 사용하여 오디오를 텍스트로 변환합니다.
이 노드는 워크플로우의 첫 번째 단계로, 사용자의 음성을 분석 가능한 텍스트로 바꿉니다.

## 처리 흐름
1. 오디오 파일 URL에서 파일 다운로드
2. 파일 형식 검증 및 필요시 변환
3. Whisper API 호출
4. 트랜스크립트 반환

## 에러 처리
- 오디오가 너무 짧은 경우 (5초 미만)
- 지원하지 않는 형식
- API 에러
"""

import httpx
import tempfile
import os
from typing import Any
from openai import AsyncOpenAI

from ..state import SpeechCoachState


# Whisper가 지원하는 파일 형식
SUPPORTED_FORMATS = {".mp3", ".mp4", ".mpeg", ".mpga", ".m4a", ".wav", ".webm"}


async def speech_to_text(state: SpeechCoachState) -> dict:
    """
    Whisper STT 노드
    
    오디오 파일을 텍스트로 변환합니다.
    
    Args:
        state: 현재 워크플로우 상태
            - audio_file_path: 오디오 파일 URL
    
    Returns:
        dict: 업데이트할 상태 필드
            - transcript: 변환된 텍스트
            - audio_duration: 오디오 길이 (초)
            - messages: 진행 메시지
    
    Raises:
        ValueError: 오디오가 너무 짧거나 형식이 잘못된 경우
    """
    
    audio_url = state["audio_file_path"]
    
    # 1. 오디오 파일 다운로드
    audio_data, file_extension = await download_audio(audio_url)
    
    # 2. 파일 형식 검증
    if file_extension.lower() not in SUPPORTED_FORMATS:
        raise ValueError(f"Unsupported audio format: {file_extension}. Supported: {SUPPORTED_FORMATS}")
    
    # 3. 임시 파일로 저장 (Whisper API는 파일 객체 필요)
    with tempfile.NamedTemporaryFile(suffix=file_extension, delete=False) as tmp_file:
        tmp_file.write(audio_data)
        tmp_path = tmp_file.name
    
    try:
        # 4. Whisper API 호출
        client = AsyncOpenAI()  # 환경변수에서 API 키 자동 로드
        
        with open(tmp_path, "rb") as audio_file:
            # verbose_json으로 호출하면 duration도 받을 수 있음
            response = await client.audio.transcriptions.create(
                model="whisper-1",
                file=audio_file,
                language="ko",  # 한국어 지정 (정확도 향상)
                response_format="verbose_json",  # duration 포함
            )
        
        transcript = response.text
        duration = getattr(response, 'duration', None)
        
        # 5. 오디오 길이 검증 (최소 5초)
        if duration and duration < 5:
            raise ValueError(f"Audio is too short ({duration:.1f}s). Minimum 5 seconds required.")
        
        # 6. 트랜스크립트 비어있으면 에러
        if not transcript or not transcript.strip():
            raise ValueError("Could not transcribe audio. Please check audio quality and try again.")
        
        return {
            "transcript": transcript.strip(),
            "audio_duration": duration,
            "messages": [f"음성 인식 완료: {len(transcript)}자"]
        }
        
    finally:
        # 임시 파일 정리
        if os.path.exists(tmp_path):
            os.unlink(tmp_path)


async def download_audio(url: str) -> tuple[bytes, str]:
    """
    오디오 파일 다운로드
    
    URL에서 오디오 파일을 다운로드하고 확장자를 추출합니다.
    
    Args:
        url: 오디오 파일 URL
    
    Returns:
        tuple: (파일 데이터, 확장자)
    
    Raises:
        ValueError: 다운로드 실패
    """
    
    async with httpx.AsyncClient() as client:
        response = await client.get(url, follow_redirects=True, timeout=30.0)
        
        if response.status_code != 200:
            raise ValueError(f"Failed to download audio: HTTP {response.status_code}")
        
        # URL에서 확장자 추출
        # 예: https://xxx.supabase.co/storage/v1/object/public/audio/recording.webm
        from urllib.parse import urlparse
        path = urlparse(url).path
        _, ext = os.path.splitext(path)
        
        # 확장자가 없으면 Content-Type에서 추론
        if not ext:
            content_type = response.headers.get("content-type", "")
            ext = guess_extension_from_content_type(content_type)
        
        return response.content, ext


def guess_extension_from_content_type(content_type: str) -> str:
    """Content-Type에서 파일 확장자 추론"""
    
    mapping = {
        "audio/webm": ".webm",
        "audio/mp3": ".mp3",
        "audio/mpeg": ".mp3",
        "audio/wav": ".wav",
        "audio/x-wav": ".wav",
        "audio/mp4": ".mp4",
        "audio/m4a": ".m4a",
    }
    
    for ct, ext in mapping.items():
        if ct in content_type:
            return ext
    
    # 기본값
    return ".webm"


# ============================================
# 유닛 테스트용 Mock
# ============================================

async def speech_to_text_mock(state: SpeechCoachState) -> dict:
    """
    테스트용 Mock STT
    
    실제 API 호출 없이 더미 데이터를 반환합니다.
    pytest에서 monkeypatch로 이 함수로 교체할 수 있습니다.
    """
    
    return {
        "transcript": """안녕하세요, 저는 5년차 백엔드 개발자 홍길동입니다.
        
현재 ABC 회사에서 결제 시스템을 담당하고 있고요, 
어... 하루에 약 천만 건의 트랜잭션을 처리하는 시스템을 운영하고 있습니다.

음... 가장 큰 성과라고 하면, 작년에 레거시 시스템 마이그레이션 프로젝트를 
리드했었는데요, 그... 다운타임 없이 성공적으로 전환을 완료했습니다.""",
        "audio_duration": 45.0,
        "messages": ["[MOCK] 음성 인식 완료"]
    }
