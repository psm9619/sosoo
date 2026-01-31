-- ============================================
-- Voice Clone Consent Records
-- ============================================
-- 법적 효력을 위한 동의 기록 테이블
-- 동의 버전, 텍스트, 시점, 메타데이터 저장
-- ============================================

-- 동의 기록 테이블
create table public.voice_clone_consents (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references public.users(id) on delete cascade,

    -- 동의 버전 (정책 변경 시 증가)
    consent_version text not null default 'v1.0',

    -- 동의 시 읽은 텍스트 (전체 저장)
    consent_text text not null,

    -- 동의 체크박스 문구
    consent_checkbox_text text not null default '위 내용을 읽었으며, 음성 클론 정책에 동의합니다.',

    -- 동의 상태
    is_active boolean default true,  -- 철회 시 false
    revoked_at timestamptz,          -- 철회 시점

    -- 메타데이터 (법적 증거용)
    ip_address inet,
    user_agent text,

    -- 동의 시점
    consented_at timestamptz default now() not null,

    -- 녹음 시간 (동의 증거)
    sample_duration_seconds float,

    -- 메타데이터
    created_at timestamptz default now() not null
);

create index idx_voice_clone_consents_user on public.voice_clone_consents(user_id);
create index idx_voice_clone_consents_user_active on public.voice_clone_consents(user_id) where is_active = true;
create index idx_voice_clone_consents_version on public.voice_clone_consents(consent_version);

comment on table public.voice_clone_consents is '음성 클론 동의 기록 (법적 증거용)';
comment on column public.voice_clone_consents.consent_version is '동의 정책 버전 (정책 변경 시 증가)';
comment on column public.voice_clone_consents.consent_text is '동의 시 사용자가 읽은 전체 텍스트';
comment on column public.voice_clone_consents.is_active is '현재 유효한 동의인지 여부 (철회 시 false)';


-- RLS 정책
alter table public.voice_clone_consents enable row level security;

-- 사용자는 자신의 동의 기록만 조회 가능
create policy "Users can view own consent records"
    on public.voice_clone_consents for select
    using (auth.uid() = user_id);

-- 서비스 역할만 삽입 가능 (API를 통해서만)
create policy "Service role can insert consent records"
    on public.voice_clone_consents for insert
    with check (true);  -- Service role key 사용 시에만 동작

-- 서비스 역할만 업데이트 가능 (철회 처리)
create policy "Service role can update consent records"
    on public.voice_clone_consents for update
    using (true);


-- 활성 동의 기록 조회 함수
create or replace function public.get_active_voice_consent(p_user_id uuid)
returns table (
    consent_id uuid,
    consent_version text,
    consented_at timestamptz
) as $$
begin
    return query
    select
        c.id as consent_id,
        c.consent_version,
        c.consented_at
    from public.voice_clone_consents c
    where c.user_id = p_user_id
      and c.is_active = true
    order by c.consented_at desc
    limit 1;
end;
$$ language plpgsql security definer;

comment on function public.get_active_voice_consent is '사용자의 활성 음성 클론 동의 기록 조회';


-- 동의 철회 함수
create or replace function public.revoke_voice_consent(p_user_id uuid)
returns void as $$
begin
    -- 모든 활성 동의를 비활성화
    update public.voice_clone_consents
    set
        is_active = false,
        revoked_at = now()
    where user_id = p_user_id
      and is_active = true;

    -- users 테이블도 업데이트
    update public.users
    set voice_clone_consent = false
    where id = p_user_id;
end;
$$ language plpgsql security definer;

comment on function public.revoke_voice_consent is '음성 클론 동의 철회';
