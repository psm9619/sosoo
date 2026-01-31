"""
TTS (Text-to-Speech) 노드

ElevenLabs API를 사용하여 개선된 스크립트를 음성으로 변환합니다.
기본 음성(남/여)과 사용자의 Voice Clone을 모두 지원합니다.

## 음성 옵션

1. default_male: ElevenLabs 기본 남성 음성 (Adam)
2. default_female: ElevenLabs 기본 여성 음성 (Rachel)
3. cloned: 사용자가 등록한 Voice Clone

## 비용 고려사항

ElevenLabs는 문자당 과금되므로, 긴 스크립트는 비용이 높습니다.
필요시 스크립트를 요약하거나, 핵심 부분만 TTS 처리할 수 있습니다.
"""

import httpx
import os
from typing import Optional

from ..state import SpeechCoachState


# 기본 음성 ID (ElevenLabs에서 제공하는 음성)
DEFAULT_VOICES = {
    "default_male": os.getenv("ELEVENLABS_DEFAULT_VOICE_MALE", "pNInz6obpgDQGcFmaJgB"),  # Adam
    "default_female": os.getenv("ELEVENLABS_DEFAULT_VOICE_FEMALE", "21m00Tcm4TlvDq8ikWAM"),  # Rachel
}

# ElevenLabs API 엔드포인트
ELEVENLABS_API_URL = "https://api.elevenlabs.io/v1"


async def generate_tts(state: SpeechCoachState) -> dict:
    """
    TTS 생성 노드
    
    개선된 스크립트를 ElevenLabs API를 통해 음성으로 변환합니다.
    생성된 오디오는 Supabase Storage에 업로드되고 URL이 반환됩니다.
    
    Args:
        state: 현재 워크플로우 상태
            - improved_script: 개선된 스크립트
            - voice_type: 음성 타입 (default_male/default_female/cloned)
            - voice_clone_id: Voice Clone ID (cloned 타입일 때)
            - session_id: 세션 ID (파일명에 사용)
    
    Returns:
        dict: 업데이트할 상태 필드
            - improved_audio_url: 생성된 TTS 오디오 URL
            - messages: 진행 메시지
    
    Raises:
        ValueError: TTS 생성 실패
    """
    
    script = state["improved_script"]
    voice_type = state.get("voice_type", "default_male")
    voice_clone_id = state.get("voice_clone_id")
    session_id = state["session_id"]
    
    # 음성 ID 결정
    if voice_type == "cloned" and voice_clone_id:
        voice_id = voice_clone_id
    else:
        # Clone이 없거나 기본 음성 선택 시
        voice_id = DEFAULT_VOICES.get(voice_type, DEFAULT_VOICES["default_male"])
    
    # ElevenLabs API 호출
    api_key = os.getenv("ELEVENLABS_API_KEY")
    if not api_key:
        raise ValueError("ELEVENLABS_API_KEY not configured")
    
    async with httpx.AsyncClient() as client:
        # TTS 요청
        response = await client.post(
            f"{ELEVENLABS_API_URL}/text-to-speech/{voice_id}",
            headers={
                "xi-api-key": api_key,
                "Content-Type": "application/json",
            },
            json={
                "text": script,
                "model_id": "eleven_multilingual_v2",  # 다국어 모델 (한국어 지원)
                "voice_settings": {
                    "stability": 0.5,           # 음성 안정성
                    "similarity_boost": 0.75,   # 원본 음성 유사도
                    "style": 0.0,               # 스타일 강도
                    "use_speaker_boost": True,  # 화자 특성 강화
                }
            },
            timeout=60.0,  # TTS는 시간이 걸릴 수 있음
        )
        
        if response.status_code != 200:
            error_detail = response.text
            raise ValueError(f"ElevenLabs TTS failed: {response.status_code} - {error_detail}")
        
        audio_data = response.content
    
    # Supabase Storage에 업로드
    audio_url = await upload_to_storage(
        audio_data=audio_data,
        filename=f"{session_id}_improved.mp3",
    )
    
    return {
        "improved_audio_url": audio_url,
        "messages": [f"음성 생성 완료 ({voice_type})"]
    }


async def upload_to_storage(audio_data: bytes, filename: str) -> str:
    """
    오디오 파일을 Supabase Storage에 업로드
    
    Args:
        audio_data: 오디오 바이너리 데이터
        filename: 저장할 파일명
    
    Returns:
        str: 업로드된 파일의 공개 URL
    """
    from supabase import create_client
    
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_SERVICE_KEY")
    
    if not supabase_url or not supabase_key:
        raise ValueError("Supabase configuration missing")
    
    supabase = create_client(supabase_url, supabase_key)
    
    # 버킷: 'audio' (미리 생성 필요)
    bucket = "audio"
    file_path = f"improved/{filename}"
    
    # 업로드 (기존 파일 덮어쓰기)
    result = supabase.storage.from_(bucket).upload(
        path=file_path,
        file=audio_data,
        file_options={"content-type": "audio/mpeg", "upsert": "true"}
    )
    
    # 공개 URL 생성
    public_url = supabase.storage.from_(bucket).get_public_url(file_path)
    
    return public_url


async def create_voice_clone(
    sample_audio_urls: list[str],
    voice_name: str,
    user_id: str,
) -> dict:
    """
    Voice Clone 생성
    
    사용자의 샘플 오디오를 사용하여 ElevenLabs에서 Voice Clone을 생성합니다.
    이 함수는 별도의 엔드포인트에서 호출됩니다 (워크플로우 외부).
    
    Args:
        sample_audio_urls: 샘플 오디오 URL 목록 (최소 1개)
        voice_name: 클론 음성 이름
        user_id: 사용자 ID
    
    Returns:
        dict: Voice Clone 정보
            - voice_id: ElevenLabs Voice ID
            - voice_name: 음성 이름
            - status: 생성 상태
    """
    
    api_key = os.getenv("ELEVENLABS_API_KEY")
    if not api_key:
        raise ValueError("ELEVENLABS_API_KEY not configured")
    
    # 샘플 오디오 다운로드
    sample_files = []
    async with httpx.AsyncClient() as client:
        for i, url in enumerate(sample_audio_urls):
            response = await client.get(url, timeout=30.0)
            if response.status_code == 200:
                sample_files.append((f"sample_{i}.mp3", response.content))
    
    if not sample_files:
        raise ValueError("No valid sample audio files")
    
    # ElevenLabs Voice Clone API 호출
    async with httpx.AsyncClient() as client:
        # multipart/form-data 요청
        files = [
            ("files", (name, data, "audio/mpeg"))
            for name, data in sample_files
        ]
        
        response = await client.post(
            f"{ELEVENLABS_API_URL}/voices/add",
            headers={"xi-api-key": api_key},
            data={
                "name": f"{voice_name}_{user_id[:8]}",  # 고유한 이름
                "description": f"Voice clone for user {user_id}",
            },
            files=files,
            timeout=120.0,  # Clone 생성은 시간이 걸림
        )
        
        if response.status_code != 200:
            raise ValueError(f"Voice clone creation failed: {response.text}")
        
        result = response.json()
    
    return {
        "voice_id": result["voice_id"],
        "voice_name": voice_name,
        "status": "ready",
    }


async def delete_voice_clone(voice_id: str) -> bool:
    """
    Voice Clone 삭제
    
    사용자가 탈퇴하거나 Clone 삭제를 요청할 때 호출합니다.
    
    Args:
        voice_id: 삭제할 Voice ID
    
    Returns:
        bool: 삭제 성공 여부
    """
    
    api_key = os.getenv("ELEVENLABS_API_KEY")
    if not api_key:
        return False
    
    async with httpx.AsyncClient() as client:
        response = await client.delete(
            f"{ELEVENLABS_API_URL}/voices/{voice_id}",
            headers={"xi-api-key": api_key},
            timeout=30.0,
        )
        
        return response.status_code == 200


# ============================================
# 테스트용 Mock
# ============================================

async def generate_tts_mock(state: SpeechCoachState) -> dict:
    """테스트용 Mock TTS"""
    
    return {
        "improved_audio_url": f"https://example.com/audio/{state['session_id']}_improved.mp3",
        "messages": ["[MOCK] 음성 생성 완료"]
    }
