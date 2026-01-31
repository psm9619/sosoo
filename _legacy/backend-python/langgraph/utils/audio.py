"""
오디오 처리 유틸리티

오디오 파일의 다운로드, 포맷 변환, 메타데이터 추출 등을 처리합니다.
"""

import httpx
import tempfile
import os
from typing import Optional, Tuple
from urllib.parse import urlparse


# 지원하는 오디오 포맷
SUPPORTED_FORMATS = {
    ".mp3": "audio/mpeg",
    ".mp4": "audio/mp4",
    ".m4a": "audio/m4a",
    ".wav": "audio/wav",
    ".webm": "audio/webm",
    ".ogg": "audio/ogg",
    ".flac": "audio/flac",
}


async def download_audio(url: str, timeout: float = 30.0) -> Tuple[bytes, str]:
    """
    URL에서 오디오 파일 다운로드
    
    Args:
        url: 오디오 파일 URL
        timeout: 다운로드 타임아웃 (초)
    
    Returns:
        Tuple[bytes, str]: (오디오 데이터, 파일 확장자)
    
    Raises:
        ValueError: 다운로드 실패 또는 지원하지 않는 포맷
    """
    
    async with httpx.AsyncClient() as client:
        response = await client.get(url, follow_redirects=True, timeout=timeout)
        
        if response.status_code != 200:
            raise ValueError(f"Failed to download audio: HTTP {response.status_code}")
        
        # 확장자 추출
        extension = get_extension_from_url(url)
        
        if not extension:
            # URL에서 추출 실패 시 Content-Type에서 추론
            content_type = response.headers.get("content-type", "")
            extension = get_extension_from_content_type(content_type)
        
        if extension not in SUPPORTED_FORMATS:
            raise ValueError(f"Unsupported audio format: {extension}")
        
        return response.content, extension


def get_extension_from_url(url: str) -> Optional[str]:
    """URL에서 파일 확장자 추출"""
    
    path = urlparse(url).path
    _, ext = os.path.splitext(path)
    
    return ext.lower() if ext else None


def get_extension_from_content_type(content_type: str) -> str:
    """Content-Type에서 파일 확장자 추론"""
    
    content_type_mapping = {
        "audio/mpeg": ".mp3",
        "audio/mp3": ".mp3",
        "audio/mp4": ".mp4",
        "audio/m4a": ".m4a",
        "audio/x-m4a": ".m4a",
        "audio/wav": ".wav",
        "audio/x-wav": ".wav",
        "audio/webm": ".webm",
        "audio/ogg": ".ogg",
        "audio/flac": ".flac",
    }
    
    for ct, ext in content_type_mapping.items():
        if ct in content_type.lower():
            return ext
    
    return ".webm"  # 기본값


def save_temp_file(data: bytes, extension: str) -> str:
    """
    임시 파일로 저장
    
    Args:
        data: 파일 데이터
        extension: 파일 확장자 (.mp3, .wav 등)
    
    Returns:
        str: 임시 파일 경로
    """
    
    with tempfile.NamedTemporaryFile(
        suffix=extension,
        delete=False,
    ) as tmp_file:
        tmp_file.write(data)
        return tmp_file.name


def cleanup_temp_file(path: str) -> None:
    """임시 파일 삭제"""
    
    if path and os.path.exists(path):
        try:
            os.unlink(path)
        except Exception:
            pass


def get_audio_duration_estimate(data: bytes, extension: str) -> Optional[float]:
    """
    오디오 길이 추정 (간단한 방법)
    
    정확한 길이는 ffprobe 같은 도구가 필요하지만,
    대략적인 추정을 위한 간단한 계산입니다.
    
    Args:
        data: 오디오 데이터
        extension: 파일 확장자
    
    Returns:
        Optional[float]: 추정 길이 (초), 계산 불가 시 None
    """
    
    # 평균 비트레이트 기반 추정 (매우 대략적)
    bitrate_estimates = {
        ".mp3": 128000,   # 128 kbps
        ".m4a": 128000,
        ".wav": 1411200,  # 16bit 44.1kHz stereo
        ".webm": 64000,   # 64 kbps (Opus)
        ".ogg": 128000,
    }
    
    bitrate = bitrate_estimates.get(extension)
    if not bitrate:
        return None
    
    # 길이 = 파일 크기 * 8 / 비트레이트
    size_bits = len(data) * 8
    duration = size_bits / bitrate
    
    return round(duration, 1)


def validate_audio_duration(duration: Optional[float], min_seconds: float = 5.0) -> bool:
    """
    오디오 길이 유효성 검증
    
    Args:
        duration: 오디오 길이 (초)
        min_seconds: 최소 길이 (기본 5초)
    
    Returns:
        bool: 유효 여부
    """
    
    if duration is None:
        return True  # 길이를 모르면 일단 통과
    
    return duration >= min_seconds


def format_duration(seconds: float) -> str:
    """
    초를 사람이 읽기 쉬운 형식으로 변환
    
    Args:
        seconds: 초
    
    Returns:
        str: "1분 30초" 형식
    """
    
    minutes = int(seconds // 60)
    remaining_seconds = int(seconds % 60)
    
    if minutes > 0:
        return f"{minutes}분 {remaining_seconds}초"
    else:
        return f"{remaining_seconds}초"
