-- ============================================
-- Row Level Security Policies v2
-- ============================================
-- 프론트엔드 데이터 모델에 맞춰 재설계
--
-- 원칙:
--   1. 사용자는 자신의 데이터만 접근 가능
--   2. 인증된 사용자만 데이터 생성 가능
--   3. Voice Clone은 동의 + 본인인증 사용자만
-- ============================================


-- ============================================
-- RLS 활성화
-- ============================================

alter table public.users enable row level security;
alter table public.projects enable row level security;
alter table public.questions enable row level security;
alter table public.attempts enable row level security;
alter table public.project_documents enable row level security;
alter table public.voice_clones enable row level security;


-- ============================================
-- 1. USERS 정책
-- ============================================

-- 자신의 프로필 조회
create policy "Users can view own profile"
    on public.users for select
    using (auth.uid() = id);

-- 자신의 프로필 수정
create policy "Users can update own profile"
    on public.users for update
    using (auth.uid() = id)
    with check (auth.uid() = id);


-- ============================================
-- 2. PROJECTS 정책
-- ============================================

-- 자신의 프로젝트 조회
create policy "Users can view own projects"
    on public.projects for select
    using (auth.uid() = user_id);

-- 자신의 프로젝트 생성
create policy "Users can create own projects"
    on public.projects for insert
    with check (auth.uid() = user_id);

-- 자신의 프로젝트 수정
create policy "Users can update own projects"
    on public.projects for update
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

-- 자신의 프로젝트 삭제
create policy "Users can delete own projects"
    on public.projects for delete
    using (auth.uid() = user_id);


-- ============================================
-- 3. QUESTIONS 정책
-- ============================================

-- 자신의 프로젝트 질문 조회
create policy "Users can view own project questions"
    on public.questions for select
    using (
        exists (
            select 1 from public.projects
            where projects.id = questions.project_id
            and projects.user_id = auth.uid()
        )
    );

-- 자신의 프로젝트에 질문 생성
create policy "Users can create questions in own projects"
    on public.questions for insert
    with check (
        exists (
            select 1 from public.projects
            where projects.id = project_id
            and projects.user_id = auth.uid()
        )
    );

-- 자신의 프로젝트 질문 수정
create policy "Users can update own project questions"
    on public.questions for update
    using (
        exists (
            select 1 from public.projects
            where projects.id = questions.project_id
            and projects.user_id = auth.uid()
        )
    );

-- 자신의 프로젝트 질문 삭제
create policy "Users can delete own project questions"
    on public.questions for delete
    using (
        exists (
            select 1 from public.projects
            where projects.id = questions.project_id
            and projects.user_id = auth.uid()
        )
    );


-- ============================================
-- 4. ATTEMPTS 정책
-- ============================================

-- 자신의 시도 조회
create policy "Users can view own attempts"
    on public.attempts for select
    using (auth.uid() = user_id);

-- 자신의 시도 생성
create policy "Users can create own attempts"
    on public.attempts for insert
    with check (auth.uid() = user_id);

-- 자신의 시도 수정
create policy "Users can update own attempts"
    on public.attempts for update
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

-- 자신의 시도 삭제
create policy "Users can delete own attempts"
    on public.attempts for delete
    using (auth.uid() = user_id);


-- ============================================
-- 5. PROJECT_DOCUMENTS 정책
-- ============================================

-- 자신의 문서 조회
create policy "Users can view own documents"
    on public.project_documents for select
    using (auth.uid() = user_id);

-- 자신의 프로젝트에 문서 업로드
create policy "Users can upload documents to own projects"
    on public.project_documents for insert
    with check (
        auth.uid() = user_id
        and exists (
            select 1 from public.projects
            where projects.id = project_id
            and projects.user_id = auth.uid()
        )
    );

-- 자신의 문서 삭제
create policy "Users can delete own documents"
    on public.project_documents for delete
    using (auth.uid() = user_id);


-- ============================================
-- 6. VOICE_CLONES 정책
-- ============================================

-- Voice Clone 사용 가능 여부 확인 함수
create or replace function public.can_use_voice_clone()
returns boolean as $$
begin
    return exists (
        select 1 from public.users
        where id = auth.uid()
        and voice_clone_consent = true
        and identity_verified = true
    );
end;
$$ language plpgsql security definer stable;

-- 자신의 Voice Clone 조회
create policy "Users can view own voice clones"
    on public.voice_clones for select
    using (auth.uid() = user_id);

-- Voice Clone 생성 (동의 + 본인인증 필요)
create policy "Verified users can create voice clones"
    on public.voice_clones for insert
    with check (
        auth.uid() = user_id
        and public.can_use_voice_clone()
    );

-- 자신의 Voice Clone 수정
create policy "Users can update own voice clones"
    on public.voice_clones for update
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

-- 자신의 Voice Clone 삭제
create policy "Users can delete own voice clones"
    on public.voice_clones for delete
    using (auth.uid() = user_id);


-- ============================================
-- 보조 함수
-- ============================================

-- 프로젝트 소유자 확인
create or replace function public.is_project_owner(project_uuid uuid)
returns boolean as $$
begin
    return exists (
        select 1 from public.projects
        where id = project_uuid
        and user_id = auth.uid()
    );
end;
$$ language plpgsql security definer stable;

comment on function public.is_project_owner is '현재 사용자가 프로젝트 소유자인지 확인';


-- 시도 제한 확인
create or replace function public.check_attempt_limit()
returns boolean as $$
declare
    user_record record;
    daily_count int;
    monthly_count int;
begin
    select daily_session_limit, monthly_session_limit
    into user_record
    from public.users
    where id = auth.uid();

    select count(*) into daily_count
    from public.attempts
    where user_id = auth.uid()
    and created_at >= current_date;

    select count(*) into monthly_count
    from public.attempts
    where user_id = auth.uid()
    and created_at >= date_trunc('month', current_date);

    return daily_count < user_record.daily_session_limit
       and monthly_count < user_record.monthly_session_limit;
end;
$$ language plpgsql security definer stable;

comment on function public.check_attempt_limit is '사용자의 시도 제한 초과 여부 확인';
