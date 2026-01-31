"""
API 요청 스키마 정의

프론트엔드에서 백엔드로 전송하는 데이터의 구조를 정의합니다.
Pydantic을 사용하여 자동 검증과 문서화가 이루어집니다.
"""

from pydantic import BaseModel, Field, validator
from typing import Optional, Literal
from datetime import datetime


class AnalyzeRequest(BaseModel):
    """
    스피치 분석 요청 스키마
    
    프론트엔드에서 녹음된 오디오의 URL과 함께 분석에 필요한
    메타데이터를 전송합니다.
    """
    
    # 필수 필드
    audio_url: str = Field(
        ...,
        description="Supabase Storage에 업로드된 오디오 파일의 URL",
        example="https://xxx.supabase.co/storage/v1/object/public/audio/recording.webm"
    )
    
    # 선택 필드
    project_id: Optional[str] = Field(
        None,
        description="프로젝트 ID (Deep Mode에서 컨텍스트 문서 연결에 사용)"
    )
    
    mode: Literal["quick", "deep"] = Field(
        "quick",
        description="분석 모드. quick=빠른 분석, deep=컨텍스트 기반 심층 분석"
    )
    
    voice_type: Literal["default_male", "default_female", "cloned"] = Field(
        "default_male",
        description="TTS에 사용할 음성 타입"
    )
    
    question: Optional[str] = Field(
        None,
        description="연습 중인 질문 (있으면 더 맥락 있는 분석 가능)"
    )
    
    @validator("audio_url")
    def validate_audio_url(cls, v):
        """오디오 URL 유효성 검증"""
        if not v.startswith(("http://", "https://")):
            raise ValueError("audio_url must be a valid HTTP(S) URL")
        return v


class RefineRequest(BaseModel):
    """
    개선안 재생성 요청 스키마 (3단계 재요청)
    
    사용자가 첫 번째 개선안에 만족하지 않을 때,
    추가 의도를 입력받아 재생성합니다.
    """
    
    session_id: str = Field(
        ...,
        description="현재 분석 세션의 ID"
    )
    
    user_intent: str = Field(
        ...,
        min_length=10,
        max_length=200,
        description="사용자가 원하는 방향 (50-100자 권장)",
        example="좀 더 자신감 있는 톤으로 바꿔주세요. 숫자를 더 강조하고 싶어요."
    )
    
    stage: Literal[1, 2] = Field(
        1,
        description="재요청 단계. 1=방향 프리뷰(TTS 없음), 2=최종 생성(TTS 포함)"
    )
    
    @validator("user_intent")
    def validate_intent_length(cls, v):
        """의도 텍스트 길이 검증 및 정제"""
        # 앞뒤 공백 제거
        v = v.strip()
        
        if len(v) < 10:
            raise ValueError("user_intent must be at least 10 characters")
        
        return v


class VoiceCloneRequest(BaseModel):
    """
    Voice Cloning 요청 스키마
    
    사용자가 자신의 목소리를 클로닝하기 위해
    샘플 오디오를 제출할 때 사용합니다.
    """
    
    sample_audio_urls: list[str] = Field(
        ...,
        min_length=1,
        max_length=5,
        description="클로닝에 사용할 샘플 오디오 URL 목록 (1-5개)"
    )
    
    voice_name: str = Field(
        "My Voice",
        max_length=50,
        description="클론된 음성의 이름"
    )
    
    consent_given: bool = Field(
        ...,
        description="Voice Cloning 이용약관 동의 여부"
    )
    
    @validator("consent_given")
    def require_consent(cls, v):
        """동의 필수 검증"""
        if not v:
            raise ValueError("consent_given must be True to proceed with voice cloning")
        return v


class ProjectCreateRequest(BaseModel):
    """
    프로젝트 생성 요청 스키마
    """
    
    name: str = Field(
        ...,
        min_length=1,
        max_length=100,
        description="프로젝트 이름",
        example="1/31 데이터분석가 면접 준비"
    )
    
    segment: Literal["regular", "urgent"] = Field(
        "urgent",
        description="프로젝트 타입. regular=꾸준한 연습, urgent=급한 준비"
    )
    
    target_date: Optional[datetime] = Field(
        None,
        description="D-Day 날짜 (urgent 모드일 때 사용)"
    )
    
    description: Optional[str] = Field(
        None,
        max_length=500,
        description="프로젝트 설명"
    )


class ContextUploadRequest(BaseModel):
    """
    컨텍스트 문서 업로드 요청 스키마
    
    Deep Mode에서 이력서, 포트폴리오 등을 업로드할 때 사용합니다.
    """
    
    project_id: str = Field(
        ...,
        description="문서를 연결할 프로젝트 ID"
    )
    
    document_urls: list[str] = Field(
        ...,
        min_length=1,
        max_length=10,
        description="업로드된 문서 URL 목록"
    )
    
    document_types: list[str] = Field(
        default_factory=list,
        description="각 문서의 타입 (resume, portfolio, project_doc 등)"
    )


# ============================================
# Memory 관련 스키마 🆕
# ============================================

class UserProfileSchema(BaseModel):
    """사용자 프로필 스키마"""
    
    name: Optional[str] = Field(None, description="이름")
    occupation: Optional[str] = Field(None, description="직업/직무")
    experience_years: Optional[int] = Field(None, ge=0, le=50, description="경력 연수")
    industry: Optional[str] = Field(None, description="산업군")
    company_type: Optional[str] = Field(None, description="회사 유형 (대기업/스타트업 등)")


class CareerContextSchema(BaseModel):
    """경력 맥락 스키마"""
    
    current_role: Optional[str] = Field(None, description="현재 역할")
    target_role: Optional[str] = Field(None, description="목표 역할")
    key_skills: Optional[list[str]] = Field(default_factory=list, description="주요 스킬")
    achievements: Optional[list[str]] = Field(default_factory=list, description="주요 성과")


class GoalContextSchema(BaseModel):
    """목표 맥락 스키마"""
    
    primary_goal: Optional[Literal["interview", "presentation", "general"]] = Field(
        None, description="주요 목표"
    )
    target_company: Optional[str] = Field(None, description="목표 회사")
    target_date: Optional[str] = Field(None, description="목표 날짜 (YYYY-MM-DD)")
    specific_concerns: Optional[list[str]] = Field(default_factory=list, description="걱정되는 점")


class FeedbackPreferenceSchema(BaseModel):
    """피드백 선호 스키마"""
    
    style: Optional[Literal["direct", "gentle", "balanced"]] = Field(
        None, description="피드백 스타일"
    )
    detail_level: Optional[Literal["brief", "detailed"]] = Field(
        None, description="상세도"
    )
    language: Optional[Literal["formal", "casual"]] = Field(
        None, description="어투"
    )


class UpdateLTMRequest(BaseModel):
    """
    Long-term Memory 업데이트 요청 스키마
    
    사용자 프로필, 목표 등 LTM 정보를 업데이트할 때 사용합니다.
    워크플로우 루프를 돌지 않고 직접 업데이트합니다.
    """
    
    profile: Optional[UserProfileSchema] = Field(
        None, description="프로필 업데이트"
    )
    career: Optional[CareerContextSchema] = Field(
        None, description="경력 맥락 업데이트"
    )
    goal: Optional[GoalContextSchema] = Field(
        None, description="목표 맥락 업데이트"
    )
    feedback_preference: Optional[FeedbackPreferenceSchema] = Field(
        None, description="피드백 선호 업데이트"
    )