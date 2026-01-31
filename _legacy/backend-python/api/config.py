"""
환경변수 설정 및 검증 모듈

서버 시작 시 필수 환경변수가 모두 설정되어 있는지 확인합니다.
누락된 변수가 있으면 명확한 에러 메시지와 함께 시작을 중단합니다.
"""

from pydantic_settings import BaseSettings
from typing import List
import os


class Settings(BaseSettings):
    """
    애플리케이션 설정 클래스
    
    .env 파일이나 환경변수에서 값을 자동으로 로드합니다.
    Pydantic의 BaseSettings를 상속받아 타입 검증도 자동으로 수행됩니다.
    """
    
    # Server
    host: str = "0.0.0.0"
    port: int = 8000
    debug: bool = False
    
    # Supabase
    supabase_url: str
    supabase_service_key: str
    supabase_anon_key: str = ""
    
    # OpenAI (Whisper)
    openai_api_key: str
    
    # Anthropic (Claude)
    anthropic_api_key: str
    
    # ElevenLabs
    elevenlabs_api_key: str
    elevenlabs_default_voice_male: str = "pNInz6obpgDQGcFmaJgB"  # Adam
    elevenlabs_default_voice_female: str = "21m00Tcm4TlvDq8ikWAM"  # Rachel
    
    # CORS
    allowed_origins: str = "http://localhost:3000"
    
    @property
    def allowed_origins_list(self) -> List[str]:
        """CORS 허용 도메인 리스트로 변환"""
        return [origin.strip() for origin in self.allowed_origins.split(",")]
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False


# 필수 환경변수 목록
REQUIRED_VARS = [
    "SUPABASE_URL",
    "SUPABASE_SERVICE_KEY",
    "OPENAI_API_KEY",
    "ANTHROPIC_API_KEY",
    "ELEVENLABS_API_KEY",
]


def validate_env() -> None:
    """
    필수 환경변수 검증
    
    서버 시작 전에 호출하여 누락된 변수가 있으면 
    명확한 에러 메시지를 출력합니다.
    """
    missing = [var for var in REQUIRED_VARS if not os.getenv(var)]
    
    if missing:
        error_msg = f"""
╔══════════════════════════════════════════════════════════════╗
║  ❌ Missing Required Environment Variables                    ║
╠══════════════════════════════════════════════════════════════╣
║  The following variables must be set:                        ║
║                                                              ║
"""
        for var in missing:
            error_msg += f"║    • {var:<52} ║\n"
        
        error_msg += """║                                                              ║
║  Please check your .env file or environment settings.        ║
╚══════════════════════════════════════════════════════════════╝
"""
        raise ValueError(error_msg)


def get_settings() -> Settings:
    """
    Settings 인스턴스 반환
    
    의존성 주입에서 사용됩니다.
    """
    return Settings()


# 전역 설정 인스턴스 (선택적 사용)
# 서버 시작 시 validate_env()를 먼저 호출한 후 사용
settings = None


def init_settings() -> Settings:
    """설정 초기화 및 검증"""
    global settings
    validate_env()
    settings = Settings()
    return settings
