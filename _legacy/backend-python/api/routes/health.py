"""
Health Check 라우트

서버 상태와 외부 서비스 연결 상태를 확인합니다.
모니터링 시스템이나 로드밸런서에서 주기적으로 호출합니다.
"""

from fastapi import APIRouter, Depends
from datetime import datetime
import httpx

from ..schemas import HealthResponse, BaseResponse
from ..config import Settings, get_settings

router = APIRouter(tags=["Health"])


@router.get("/health", response_model=BaseResponse)
async def health_check(
    settings: Settings = Depends(get_settings)
) -> BaseResponse:
    """
    서버 상태 확인
    
    외부 서비스(OpenAI, Anthropic, ElevenLabs)의 연결 상태도 함께 확인합니다.
    모든 서비스가 정상이면 "healthy", 일부 문제가 있으면 "degraded",
    핵심 서비스가 모두 죽었으면 "unhealthy"를 반환합니다.
    """
    
    services = {}
    
    # OpenAI API 상태 확인 (간단한 ping)
    services["openai"] = await check_openai(settings.openai_api_key)
    
    # Anthropic API 상태 확인
    services["anthropic"] = await check_anthropic(settings.anthropic_api_key)
    
    # ElevenLabs API 상태 확인
    services["elevenlabs"] = await check_elevenlabs(settings.elevenlabs_api_key)
    
    # 전체 상태 결정
    all_healthy = all(services.values())
    any_healthy = any(services.values())
    
    if all_healthy:
        status = "healthy"
    elif any_healthy:
        status = "degraded"
    else:
        status = "unhealthy"
    
    response_data = HealthResponse(
        status=status,
        version="1.0.0",  # TODO: 버전 관리
        timestamp=datetime.utcnow(),
        services=services
    )
    
    return BaseResponse(success=True, data=response_data.model_dump())


async def check_openai(api_key: str) -> bool:
    """OpenAI API 연결 확인"""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                "https://api.openai.com/v1/models",
                headers={"Authorization": f"Bearer {api_key}"},
                timeout=5.0
            )
            return response.status_code == 200
    except Exception:
        return False


async def check_anthropic(api_key: str) -> bool:
    """Anthropic API 연결 확인"""
    try:
        async with httpx.AsyncClient() as client:
            # Anthropic은 models 엔드포인트가 없으므로 간단히 헤더 검증
            # 실제로는 가벼운 요청을 보내볼 수 있음
            response = await client.get(
                "https://api.anthropic.com/v1/models",
                headers={
                    "x-api-key": api_key,
                    "anthropic-version": "2023-06-01"
                },
                timeout=5.0
            )
            # 401이 아니면 API 키는 유효함
            return response.status_code != 401
    except Exception:
        return False


async def check_elevenlabs(api_key: str) -> bool:
    """ElevenLabs API 연결 확인"""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                "https://api.elevenlabs.io/v1/user",
                headers={"xi-api-key": api_key},
                timeout=5.0
            )
            return response.status_code == 200
    except Exception:
        return False


@router.get("/ping")
async def ping():
    """
    간단한 서버 생존 확인
    
    외부 서비스 체크 없이 서버가 살아있는지만 확인합니다.
    로드밸런서의 빠른 health check에 적합합니다.
    """
    return {"status": "pong", "timestamp": datetime.utcnow().isoformat()}
