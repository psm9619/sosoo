-- ============================================
-- VoiceUp Database Schema v2
-- ============================================
-- 프론트엔드 데이터 모델에 맞춰 재설계
--
-- Data Model:
--   Project → Questions[] → Attempts[]
--
-- Tables:
--   1. users - 사용자 프로필
--   2. projects - 프로젝트 (면접/발표/자유스피치)
--   3. questions - 질문 (프로젝트당 여러 개)
--   4. attempts - 연습 시도 (질문당 여러 개)
--   5. project_documents - 컨텍스트 문서
--   6. voice_clones - 보이스 클론
-- ============================================


-- ============================================
-- ENUM TYPES
-- ============================================

-- 프로젝트 타입
create type project_type as enum ('interview', 'presentation', 'free_speech');

-- 면접 질문 카테고리
create type interview_category as enum (
    'basic',        -- 기본 (자기소개 등)
    'motivation',   -- 지원동기
    'competency',   -- 역량
    'technical',    -- 기술
    'situation',    -- 상황대처
    'culture_fit'   -- 컬쳐핏
);

-- 시도 상태
create type attempt_status as enum ('processing', 'completed', 'failed');

-- Voice Clone 상태
create type voice_clone_status as enum ('processing', 'ready', 'failed');


-- ============================================
-- 1. USERS (사용자 프로필)
-- ============================================
-- Supabase Auth (auth.users)와 1:1 관계

create table public.users (
    id uuid primary key references auth.users(id) on delete cascade,
    email text not null,
    display_name text,
    avatar_url text,

    -- Voice Clone 동의 여부
    voice_clone_consent boolean default false,
    voice_clone_consent_at timestamptz,

    -- 본인인증 상태 (Voice Cloning 전 필수)
    identity_verified boolean default false,
    identity_verified_at timestamptz,

    -- 사용량 제한
    daily_session_limit int default 10,
    monthly_session_limit int default 100,

    -- 메타데이터
    created_at timestamptz default now() not null,
    updated_at timestamptz default now() not null
);

create index idx_users_email on public.users(email);

comment on table public.users is '사용자 프로필 (Supabase Auth 연동)';


-- ============================================
-- 2. PROJECTS (프로젝트)
-- ============================================
-- 면접/발표/자유스피치 프로젝트

create table public.projects (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references public.users(id) on delete cascade,

    -- 기본 정보
    type project_type not null default 'interview',
    title text not null,

    -- 면접 전용 필드
    company text,           -- 회사명
    "position" text,        -- 포지션

    -- 발표/자유스피치 전용
    description text,       -- 발표 개요

    -- AI 컨텍스트 (Claude가 생성)
    context_summary text,           -- 문서 요약
    context_keywords text[],        -- 핵심 키워드
    context_experiences jsonb,      -- 주요 경험 (구조화)
    -- context_experiences 구조:
    -- [
    --   { "title": "프로젝트명", "role": "역할", "achievements": ["성과1", "성과2"] },
    --   ...
    -- ]

    -- D-Day 관리
    target_date date,       -- 면접일/발표일

    -- 상태
    is_archived boolean default false,

    -- 메타데이터
    created_at timestamptz default now() not null,
    updated_at timestamptz default now() not null
);

create index idx_projects_user_id on public.projects(user_id);
create index idx_projects_user_active on public.projects(user_id) where is_archived = false;
create index idx_projects_type on public.projects(type);

comment on table public.projects is '스피치 연습 프로젝트';
comment on column public.projects.type is 'interview: 면접, presentation: 발표, free_speech: 자유스피치';
comment on column public.projects.context_summary is 'AI가 생성한 컨텍스트 문서 요약';
comment on column public.projects.context_experiences is 'AI가 추출한 주요 경험/성과';


-- ============================================
-- 3. QUESTIONS (질문)
-- ============================================
-- 프로젝트당 여러 질문

create table public.questions (
    id uuid primary key default gen_random_uuid(),
    project_id uuid not null references public.projects(id) on delete cascade,

    -- 질문 내용
    text text not null,

    -- 면접 카테고리 (면접 프로젝트만)
    category interview_category,

    -- 순서
    "order" int not null default 1,

    -- AI 생성 여부
    is_ai_generated boolean default false,

    -- AI 생성 시 참조한 컨텍스트 (디버깅용)
    generation_context text,

    -- 메타데이터
    created_at timestamptz default now() not null
);

create index idx_questions_project on public.questions(project_id);
create index idx_questions_project_order on public.questions(project_id, "order");
create index idx_questions_category on public.questions(category) where category is not null;

comment on table public.questions is '프로젝트별 질문';
comment on column public.questions.category is '면접 카테고리 (면접 프로젝트만 해당)';
comment on column public.questions.is_ai_generated is 'AI가 컨텍스트 기반으로 생성한 질문 여부';


-- ============================================
-- 4. ATTEMPTS (연습 시도)
-- ============================================
-- 질문당 여러 연습 시도 (= 기존 sessions)

create table public.attempts (
    id uuid primary key default gen_random_uuid(),
    question_id uuid not null references public.questions(id) on delete cascade,
    user_id uuid not null references public.users(id) on delete cascade,

    -- STT 결과
    original_text text,             -- 원본 발화 (transcript)
    duration_seconds float,         -- 녹음 길이

    -- AI 분석 결과
    analysis jsonb,
    -- analysis 구조:
    -- {
    --   "scores": {
    --     "logic_structure": "B+",
    --     "filler_words": "A",
    --     "speaking_pace": "C",
    --     "confidence_tone": "B",
    --     "content_specificity": "C+"
    --   },
    --   "metrics": {
    --     "words_per_minute": 150,
    --     "filler_count": 5,
    --     "filler_percentage": 2.5,
    --     "total_words": 200
    --   },
    --   "suggestions": [
    --     { "priority": 1, "category": "pace", "suggestion": "...", "impact": "..." }
    --   ],
    --   "structure_analysis": "STAR 분석...",
    --   "progressive_context_note": "이전 연습 대비..."
    -- }

    -- 개선안
    improved_text text,             -- 개선된 스크립트
    improvements text[],            -- 개선점 목록 (간단 버전)

    -- 점수 (0-100, 등급에서 변환)
    score int check (score >= 0 and score <= 100),

    -- 오디오 URL
    original_audio_url text,
    improved_audio_url text,

    -- 재요청 관리
    refinement_count int default 0 check (refinement_count <= 2),
    refinement_history jsonb default '[]'::jsonb,

    -- Voice Clone 사용 여부
    used_voice_clone boolean default false,

    -- 상태
    status attempt_status default 'processing',
    error_message text,

    -- 컨텐츠 모더레이션
    moderation_flags jsonb,
    is_flagged boolean default false,

    -- 메타데이터
    created_at timestamptz default now() not null,
    updated_at timestamptz default now() not null
);

create index idx_attempts_question on public.attempts(question_id);
create index idx_attempts_user on public.attempts(user_id);
create index idx_attempts_question_created on public.attempts(question_id, created_at desc);
create index idx_attempts_user_created on public.attempts(user_id, created_at desc);
create index idx_attempts_analysis on public.attempts using gin(analysis);

comment on table public.attempts is '질문별 연습 시도';
comment on column public.attempts.original_text is '원본 발화 텍스트 (STT 결과)';
comment on column public.attempts.improved_text is 'AI가 개선한 스크립트';
comment on column public.attempts.score is '0-100 점수 (등급 기반 환산)';


-- ============================================
-- 5. PROJECT_DOCUMENTS (컨텍스트 문서)
-- ============================================
-- 레주메, 발표자료 등

create table public.project_documents (
    id uuid primary key default gen_random_uuid(),
    project_id uuid not null references public.projects(id) on delete cascade,
    user_id uuid not null references public.users(id) on delete cascade,

    -- 파일 정보
    file_name text not null,
    file_type text,                 -- pdf, docx, pptx 등
    file_size int,                  -- bytes
    storage_path text not null,     -- Supabase Storage 경로

    -- AI 추출 데이터
    extracted_text text,            -- 전체 텍스트
    extracted_summary text,         -- 요약
    extracted_keywords text[],      -- 키워드

    -- 문서 타입
    document_type text default 'primary',  -- primary: 메인(레주메), additional: 추가자료

    -- 메타데이터
    created_at timestamptz default now() not null
);

create index idx_project_documents_project on public.project_documents(project_id);
create index idx_project_documents_user on public.project_documents(user_id);

comment on table public.project_documents is '프로젝트 컨텍스트 문서';
comment on column public.project_documents.document_type is 'primary: 메인 문서, additional: 추가 참고자료';


-- ============================================
-- 6. VOICE_CLONES (보이스 클론)
-- ============================================

create table public.voice_clones (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references public.users(id) on delete cascade,

    -- ElevenLabs Voice Clone ID
    elevenlabs_voice_id text unique,
    voice_name text not null,

    -- 상태
    status voice_clone_status default 'processing',
    error_message text,

    -- 샘플 오디오
    sample_audio_url text,
    sample_duration_seconds float,

    -- 메타데이터
    created_at timestamptz default now() not null,
    updated_at timestamptz default now() not null
);

create index idx_voice_clones_user on public.voice_clones(user_id);
create index idx_voice_clones_status on public.voice_clones(user_id, status);

comment on table public.voice_clones is '사용자 Voice Clone';


-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- updated_at 자동 갱신
create or replace function update_updated_at_column()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

-- 트리거 적용
create trigger users_updated_at
    before update on public.users
    for each row execute function update_updated_at_column();

create trigger projects_updated_at
    before update on public.projects
    for each row execute function update_updated_at_column();

create trigger attempts_updated_at
    before update on public.attempts
    for each row execute function update_updated_at_column();

create trigger voice_clones_updated_at
    before update on public.voice_clones
    for each row execute function update_updated_at_column();


-- ============================================
-- AUTH.USERS 연동: 자동 프로필 생성
-- ============================================

create or replace function public.handle_new_user()
returns trigger as $$
begin
    insert into public.users (id, email, display_name, avatar_url)
    values (
        new.id,
        new.email,
        coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
        new.raw_user_meta_data->>'avatar_url'
    );
    return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
    after insert on auth.users
    for each row execute function public.handle_new_user();


-- ============================================
-- 점수 변환 함수 (등급 → 숫자)
-- ============================================

create or replace function public.grade_to_score(grade text)
returns int as $$
begin
    return case grade
        when 'A' then 95
        when 'B+' then 87
        when 'B' then 80
        when 'C+' then 72
        when 'C' then 65
        when 'D' then 50
        else 70  -- 기본값
    end;
end;
$$ language plpgsql immutable;

comment on function public.grade_to_score is '등급(A/B+/B/C+/C/D)을 0-100 점수로 변환';


-- ============================================
-- 카테고리별 기본 질문 개수
-- ============================================

create or replace function public.get_questions_per_category(cat interview_category)
returns int as $$
begin
    return case cat
        when 'basic' then 1
        when 'motivation' then 2
        when 'competency' then 4
        when 'technical' then 4
        when 'situation' then 2
        when 'culture_fit' then 1
        else 1
    end;
end;
$$ language plpgsql immutable;

comment on function public.get_questions_per_category is '면접 카테고리별 기본 질문 개수';
