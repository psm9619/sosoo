"""
FastAPI 의존성 모듈

JWT 토큰 검증, Supabase 클라이언트 생성 등
라우트에서 공통으로 사용하는 의존성들을 정의합니다.
"""

from fastapi import Depends, HTTPException, status, Header
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from supabase import create_client, Client
from typing import Optional
import jwt

from .config import get_settings, Settings


# Bearer 토큰 스키마
security = HTTPBearer(auto_error=False)


async def get_supabase(
    settings: Settings = Depends(get_settings)
) -> Client:
    """
    Supabase 클라이언트 의존성
    
    Service Key를 사용하므로 모든 테이블에 접근 가능합니다.
    주의: 프론트엔드에는 절대 노출하면 안 됩니다.
    """
    return create_client(
        settings.supabase_url,
        settings.supabase_service_key
    )


async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    settings: Settings = Depends(get_settings)
) -> Optional[dict]:
    """
    현재 사용자 정보 추출 의존성
    
    Supabase JWT 토큰을 검증하고 사용자 정보를 반환합니다.
    토큰이 없거나 유효하지 않으면 None을 반환합니다.
    
    Returns:
        dict: 사용자 정보 (sub, email 등)
        None: 인증되지 않은 경우 (Guest)
    """
    if not credentials:
        return None
    
    token = credentials.credentials
    
    try:
        # Supabase JWT는 SUPABASE_URL에서 공개키로 검증
        # 여기서는 간단히 디코딩만 수행 (실제로는 공개키 검증 필요)
        payload = jwt.decode(
            token,
            options={"verify_signature": False}  # TODO: 실제 환경에서는 검증 필요
        )
        
        return {
            "user_id": payload.get("sub"),
            "email": payload.get("email"),
            "role": payload.get("role", "authenticated"),
        }
        
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "AUTH_TOKEN_EXPIRED", "message": "Token has expired"}
        )
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "AUTH_INVALID_TOKEN", "message": "Invalid token"}
        )


async def require_auth(
    user: Optional[dict] = Depends(get_current_user)
) -> dict:
    """
    인증 필수 의존성
    
    로그인한 사용자만 접근 가능한 엔드포인트에서 사용합니다.
    인증되지 않은 경우 401 에러를 발생시킵니다.
    """
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "AUTH_REQUIRED", "message": "Authentication required"}
        )
    return user


async def get_guest_session(
    x_guest_session: Optional[str] = Header(None, alias="X-Guest-Session")
) -> Optional[str]:
    """
    Guest 세션 ID 추출
    
    인증되지 않은 사용자의 임시 세션을 추적하기 위해 사용합니다.
    프론트엔드에서 UUID를 생성하여 헤더로 전달합니다.
    """
    return x_guest_session


class UserContext:
    """
    사용자 컨텍스트 클래스
    
    인증된 사용자와 Guest를 통합하여 처리합니다.
    """
    
    def __init__(
        self,
        user: Optional[dict] = None,
        guest_session: Optional[str] = None
    ):
        self.user = user
        self.guest_session = guest_session
    
    @property
    def is_authenticated(self) -> bool:
        """인증된 사용자인지 확인"""
        return self.user is not None
    
    @property
    def user_id(self) -> Optional[str]:
        """사용자 ID (인증된 경우)"""
        return self.user.get("user_id") if self.user else None
    
    @property
    def session_id(self) -> str:
        """
        세션 식별자
        
        인증된 사용자는 user_id, Guest는 guest_session을 사용합니다.
        """
        if self.is_authenticated:
            return f"user:{self.user_id}"
        return f"guest:{self.guest_session or 'anonymous'}"
    
    @property
    def can_use_voice_clone(self) -> bool:
        """Voice Cloning 사용 가능 여부"""
        # 인증된 사용자 + 동의한 경우에만 가능
        # 실제로는 DB에서 consent 확인 필요
        return self.is_authenticated


async def get_user_context(
    user: Optional[dict] = Depends(get_current_user),
    guest_session: Optional[str] = Depends(get_guest_session)
) -> UserContext:
    """
    통합 사용자 컨텍스트 의존성
    
    인증 여부에 관계없이 사용자를 식별하고 권한을 확인할 수 있습니다.
    """
    return UserContext(user=user, guest_session=guest_session)
