-- ============================================
-- Views & Utility Functions v2
-- ============================================
-- 프론트엔드 데이터 모델에 맞춰 재설계
-- Project → Questions[] → Attempts[]
--
-- 1. 사용자 대시보드용 뷰
-- 2. Progressive Context용 함수
-- 3. Admin 통계용 뷰 (service_role 전용)
-- 4. 데이터 정리 함수
-- ============================================


-- ============================================
-- 1. USER DASHBOARD VIEWS
-- ============================================

-- 프로젝트 + 통계 (질문 수, 시도 수, D-Day)
create or replace view public.projects_with_stats as
select
    p.id,
    p.user_id,
    p.type,
    p.title,
    p.company,
    p."position",
    p.target_date,
    p.context_summary,
    p.is_archived,
    p.created_at,
    p.updated_at,
    -- D-Day 계산
    case
        when p.target_date is not null
        then p.target_date - current_date
        else null
    end as d_day,
    -- 질문 수
    coalesce(q.question_count, 0) as question_count,
    -- 시도 수
    coalesce(a.attempt_count, 0) as attempt_count,
    -- 최근 시도 날짜
    a.last_attempt_at
from public.projects p
left join (
    select
        project_id,
        count(*) as question_count
    from public.questions
    group by project_id
) q on p.id = q.project_id
left join (
    select
        qu.project_id,
        count(at.*) as attempt_count,
        max(at.created_at) as last_attempt_at
    from public.questions qu
    join public.attempts at on at.question_id = qu.id
    where at.status = 'completed'
    group by qu.project_id
) a on p.id = a.project_id;

comment on view public.projects_with_stats is '프로젝트 목록 + 통계 (질문 수, 시도 수, D-Day)';


-- 질문 + 통계 (시도 수, 최고 점수)
create or replace view public.questions_with_stats as
select
    q.id,
    q.project_id,
    q.text,
    q.category,
    q."order",
    q.is_ai_generated,
    q.created_at,
    -- 시도 수
    coalesce(a.attempt_count, 0) as attempt_count,
    -- 최고 점수
    a.best_score,
    -- 최근 시도
    a.last_attempt_at
from public.questions q
left join (
    select
        question_id,
        count(*) as attempt_count,
        max(score) as best_score,
        max(created_at) as last_attempt_at
    from public.attempts
    where status = 'completed'
    group by question_id
) a on q.id = a.question_id;

comment on view public.questions_with_stats is '질문 목록 + 통계 (시도 수, 최고 점수)';


-- 시도 히스토리 (점수 포함)
create or replace view public.attempts_with_scores as
select
    a.id,
    a.question_id,
    a.user_id,
    q.text as question_text,
    q.category as question_category,
    a.status,
    a.created_at,
    a.used_voice_clone,
    a.refinement_count,
    a.score,
    -- 분석 점수 추출
    a.analysis->'scores' as scores,
    (a.analysis->'scores'->>'logic_structure') as logic_score,
    (a.analysis->'scores'->>'filler_words') as filler_score,
    (a.analysis->'scores'->>'speaking_pace') as pace_score,
    (a.analysis->'scores'->>'confidence_tone') as confidence_score,
    (a.analysis->'scores'->>'content_specificity') as specificity_score,
    -- 지표 추출
    (a.analysis->'metrics'->>'words_per_minute')::int as wpm,
    (a.analysis->'metrics'->>'filler_count')::int as filler_count,
    (a.analysis->'metrics'->>'filler_percentage')::float as filler_percentage
from public.attempts a
join public.questions q on a.question_id = q.id
where a.status = 'completed';

comment on view public.attempts_with_scores is '완료된 시도 + 분석 점수';


-- ============================================
-- 2. PROGRESSIVE CONTEXT FUNCTIONS
-- ============================================

-- 사용자의 최근 N개 시도 조회 (Short-term Memory용)
create or replace function public.get_recent_attempts_context(
    p_user_id uuid,
    p_project_id uuid default null,
    p_limit int default 3
)
returns table (
    attempt_id uuid,
    question_text text,
    original_text text,
    improved_text text,
    analysis jsonb,
    score int,
    created_at timestamptz
) as $$
begin
    return query
    select
        a.id,
        q.text,
        a.original_text,
        a.improved_text,
        a.analysis,
        a.score,
        a.created_at
    from public.attempts a
    join public.questions q on a.question_id = q.id
    where a.user_id = p_user_id
    and a.status = 'completed'
    and (p_project_id is null or q.project_id = p_project_id)
    order by a.created_at desc
    limit p_limit;
end;
$$ language plpgsql security definer;

comment on function public.get_recent_attempts_context is 'Progressive Context용 최근 시도 조회 (Short-term Memory)';


-- 사용자 성장 추이 계산
create or replace function public.calculate_growth_trend(
    p_user_id uuid,
    p_project_id uuid default null
)
returns jsonb as $$
declare
    result jsonb;
begin
    select jsonb_build_object(
        'total_attempts', count(*),
        'avg_score', round(avg(score)),
        'avg_wpm', round(avg((analysis->'metrics'->>'words_per_minute')::numeric)),
        'avg_filler_percentage', round(avg((analysis->'metrics'->>'filler_percentage')::numeric), 2),
        'first_attempt', min(a.created_at),
        'last_attempt', max(a.created_at),
        'improvement_note', case
            when count(*) < 3 then '분석을 위해 더 많은 연습이 필요합니다'
            else count(*) || '개 시도 기반 분석'
        end
    ) into result
    from public.attempts a
    join public.questions q on a.question_id = q.id
    where a.user_id = p_user_id
    and a.status = 'completed'
    and (p_project_id is null or q.project_id = p_project_id);

    return coalesce(result, '{}'::jsonb);
end;
$$ language plpgsql security definer;

comment on function public.calculate_growth_trend is '사용자 성장 추이 계산';


-- 프로젝트별 카테고리 성과 요약
create or replace function public.get_category_performance(
    p_user_id uuid,
    p_project_id uuid
)
returns table (
    category interview_category,
    attempt_count bigint,
    avg_score numeric,
    best_score int
) as $$
begin
    return query
    select
        q.category,
        count(a.id),
        round(avg(a.score), 1),
        max(a.score)
    from public.questions q
    left join public.attempts a on a.question_id = q.id and a.status = 'completed'
    where q.project_id = p_project_id
    and q.category is not null
    group by q.category
    order by q.category;
end;
$$ language plpgsql security definer;

comment on function public.get_category_performance is '면접 카테고리별 성과 요약';


-- ============================================
-- 3. ADMIN STATISTICS (Service Role Only)
-- ============================================
-- 이 뷰들은 Backend에서 service_key로 접근

-- 일일 통계
create or replace view public.admin_daily_stats as
select
    date_trunc('day', created_at)::date as date,
    count(*) as total_attempts,
    count(distinct user_id) as unique_users,
    count(*) filter (where status = 'completed') as completed_attempts,
    count(*) filter (where status = 'failed') as failed_attempts,
    count(*) filter (where used_voice_clone) as voice_clone_attempts,
    count(*) filter (where is_flagged) as flagged_attempts,
    round(avg(refinement_count), 2) as avg_refinements,
    round(avg(score), 1) as avg_score
from public.attempts
group by date_trunc('day', created_at)
order by date desc;

comment on view public.admin_daily_stats is '관리자용 일일 통계 (service_role 전용)';


-- 모더레이션 대기 시도
create or replace view public.admin_flagged_attempts as
select
    a.id,
    a.user_id,
    u.email,
    a.original_text,
    a.moderation_flags,
    a.created_at
from public.attempts a
join public.users u on a.user_id = u.id
where a.is_flagged = true
order by a.created_at desc;

comment on view public.admin_flagged_attempts is '모더레이션 플래그된 시도 (service_role 전용)';


-- 비용 추정 (시도당 ~$0.10 기준)
create or replace view public.admin_cost_estimate as
select
    date_trunc('month', created_at)::date as month,
    count(*) as total_attempts,
    -- 비용 추정 (시도당 $0.10)
    round(count(*) * 0.10, 2) as estimated_cost_usd,
    -- Voice Clone 시도 (추가 비용)
    count(*) filter (where used_voice_clone) as voice_clone_attempts,
    round(count(*) filter (where used_voice_clone) * 0.05, 2) as voice_clone_extra_cost
from public.attempts
where status = 'completed'
group by date_trunc('month', created_at)
order by month desc;

comment on view public.admin_cost_estimate is 'API 비용 추정 (service_role 전용)';


-- 프로젝트 타입별 통계
create or replace view public.admin_project_type_stats as
select
    p.type,
    count(distinct p.id) as project_count,
    count(distinct p.user_id) as user_count,
    count(a.id) as total_attempts,
    round(avg(a.score), 1) as avg_score
from public.projects p
left join public.questions q on q.project_id = p.id
left join public.attempts a on a.question_id = q.id and a.status = 'completed'
group by p.type
order by project_count desc;

comment on view public.admin_project_type_stats is '프로젝트 타입별 통계 (service_role 전용)';


-- ============================================
-- 4. DATA CLEANUP FUNCTIONS
-- ============================================

-- 동의 없는 사용자의 24시간 지난 오디오 정리
create or replace function public.cleanup_old_audio()
returns int as $$
declare
    deleted_count int;
begin
    with updated as (
        update public.attempts a
        set
            original_audio_url = null,
            improved_audio_url = null
        where a.created_at < now() - interval '24 hours'
        and exists (
            select 1 from public.users u
            where u.id = a.user_id
            and u.voice_clone_consent = false
        )
        and a.original_audio_url is not null
        returning a.id
    )
    select count(*) into deleted_count from updated;

    return deleted_count;
end;
$$ language plpgsql security definer;

comment on function public.cleanup_old_audio is '동의 없는 사용자의 24시간 지난 오디오 정리';


-- GDPR 삭제 요청 처리
create or replace function public.gdpr_delete_user_data(p_user_id uuid)
returns jsonb as $$
declare
    result jsonb;
    attempt_count int;
    question_count int;
    project_count int;
    document_count int;
    voice_clone_count int;
begin
    -- 시도 삭제
    delete from public.attempts where user_id = p_user_id;
    get diagnostics attempt_count = row_count;

    -- 문서 수 카운트
    select count(*) into document_count
    from public.project_documents where user_id = p_user_id;

    -- 질문 수 카운트 (projects cascade로 삭제됨)
    select count(*) into question_count
    from public.questions q
    join public.projects p on q.project_id = p.id
    where p.user_id = p_user_id;

    -- 프로젝트 삭제 (cascade로 questions, documents도 삭제됨)
    delete from public.projects where user_id = p_user_id;
    get diagnostics project_count = row_count;

    -- Voice Clone 삭제
    delete from public.voice_clones where user_id = p_user_id;
    get diagnostics voice_clone_count = row_count;

    -- 사용자 프로필 삭제
    delete from public.users where id = p_user_id;

    result := jsonb_build_object(
        'user_id', p_user_id,
        'attempts_deleted', attempt_count,
        'questions_deleted', question_count,
        'projects_deleted', project_count,
        'documents_deleted', document_count,
        'voice_clones_deleted', voice_clone_count,
        'deleted_at', now()
    );

    return result;
end;
$$ language plpgsql security definer;

comment on function public.gdpr_delete_user_data is 'GDPR 삭제 요청 처리 (72시간 내)';


-- ============================================
-- 5. INDEXES FOR COMMON QUERIES
-- ============================================

-- 프로젝트 목록 조회 최적화
create index if not exists idx_projects_user_archived_created
    on public.projects(user_id, is_archived, created_at desc);

-- 질문 목록 조회 최적화
create index if not exists idx_questions_project_order
    on public.questions(project_id, "order");

-- 시도 히스토리 조회 최적화
create index if not exists idx_attempts_question_status_created
    on public.attempts(question_id, status, created_at desc);

-- 사용자별 시도 조회 최적화
create index if not exists idx_attempts_user_status_created
    on public.attempts(user_id, status, created_at desc);

-- 일일 통계 조회 최적화 (created_at 범위 쿼리 지원)
create index if not exists idx_attempts_created_at
    on public.attempts(created_at desc);
