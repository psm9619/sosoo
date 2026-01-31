-- ============================================
-- Storage Buckets & Policies
-- ============================================
--
-- Buckets:
--   1. audio - 원본/개선 오디오 파일
--   2. documents - 컨텍스트 문서 (이력서, 자소서 등)
--   3. voice-samples - Voice Clone 샘플
--
-- 구조:
--   audio/{user_id}/original/{attempt_id}.webm
--   audio/{user_id}/improved/{attempt_id}.mp3
--   documents/{user_id}/{project_id}/{filename}
--   voice-samples/{user_id}/{clone_id}.webm
-- ============================================


-- ============================================
-- 1. AUDIO 버킷
-- ============================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
    'audio',
    'audio',
    false,  -- 비공개 (RLS로 접근 제어)
    52428800,  -- 50MB 제한
    array['audio/webm', 'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/m4a']
)
on conflict (id) do update set
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

-- 기존 정책 삭제 후 재생성
drop policy if exists "Users can view own audio" on storage.objects;
drop policy if exists "Users can upload own audio" on storage.objects;
drop policy if exists "Users can update own audio" on storage.objects;
drop policy if exists "Users can delete own audio" on storage.objects;

-- 자신의 오디오만 조회 (signed URL 생성 가능)
create policy "Users can view own audio"
    on storage.objects for select
    using (
        bucket_id = 'audio'
        and auth.uid()::text = (storage.foldername(name))[1]
    );

-- 자신의 폴더에만 오디오 업로드
create policy "Users can upload own audio"
    on storage.objects for insert
    with check (
        bucket_id = 'audio'
        and auth.uid()::text = (storage.foldername(name))[1]
    );

-- 자신의 오디오만 수정 (덮어쓰기)
create policy "Users can update own audio"
    on storage.objects for update
    using (
        bucket_id = 'audio'
        and auth.uid()::text = (storage.foldername(name))[1]
    )
    with check (
        bucket_id = 'audio'
        and auth.uid()::text = (storage.foldername(name))[1]
    );

-- 자신의 오디오만 삭제
create policy "Users can delete own audio"
    on storage.objects for delete
    using (
        bucket_id = 'audio'
        and auth.uid()::text = (storage.foldername(name))[1]
    );


-- ============================================
-- 2. DOCUMENTS 버킷
-- ============================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
    'documents',
    'documents',
    false,  -- 비공개
    10485760,  -- 10MB 제한
    array[
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain',
        'text/markdown'
    ]
)
on conflict (id) do update set
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

-- 기존 정책 삭제 후 재생성
drop policy if exists "Users can view own documents" on storage.objects;
drop policy if exists "Users can upload own documents" on storage.objects;
drop policy if exists "Users can delete own documents" on storage.objects;

-- 자신의 문서만 조회
create policy "Users can view own documents"
    on storage.objects for select
    using (
        bucket_id = 'documents'
        and auth.uid()::text = (storage.foldername(name))[1]
    );

-- 자신의 폴더에만 문서 업로드
create policy "Users can upload own documents"
    on storage.objects for insert
    with check (
        bucket_id = 'documents'
        and auth.uid()::text = (storage.foldername(name))[1]
    );

-- 자신의 문서만 삭제
create policy "Users can delete own documents"
    on storage.objects for delete
    using (
        bucket_id = 'documents'
        and auth.uid()::text = (storage.foldername(name))[1]
    );


-- ============================================
-- 3. VOICE_SAMPLES 버킷 (Voice Cloning 샘플)
-- ============================================
-- 별도 버킷으로 분리하여 더 엄격한 제어

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
    'voice-samples',
    'voice-samples',
    false,
    10485760,  -- 10MB (1분 샘플)
    array['audio/webm', 'audio/mpeg', 'audio/wav']
)
on conflict (id) do update set
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

-- 기존 정책 삭제 후 재생성
drop policy if exists "Verified users can view own voice samples" on storage.objects;
drop policy if exists "Verified users can upload voice samples" on storage.objects;
drop policy if exists "Users can delete own voice samples" on storage.objects;

-- Voice Clone 동의 + 본인인증 사용자만 조회
create policy "Verified users can view own voice samples"
    on storage.objects for select
    using (
        bucket_id = 'voice-samples'
        and auth.uid()::text = (storage.foldername(name))[1]
        and public.can_use_voice_clone()
    );

-- Voice Clone 동의 + 본인인증 사용자만 업로드
create policy "Verified users can upload voice samples"
    on storage.objects for insert
    with check (
        bucket_id = 'voice-samples'
        and auth.uid()::text = (storage.foldername(name))[1]
        and public.can_use_voice_clone()
    );

-- 자신의 샘플만 삭제
create policy "Users can delete own voice samples"
    on storage.objects for delete
    using (
        bucket_id = 'voice-samples'
        and auth.uid()::text = (storage.foldername(name))[1]
    );


-- ============================================
-- Storage Helper Functions
-- ============================================

-- 오디오 파일 경로 생성
create or replace function public.get_audio_path(
    p_user_id uuid,
    p_type text,  -- 'original', 'improved'
    p_attempt_id uuid
)
returns text as $$
begin
    return p_user_id::text || '/' || p_type || '/' || p_attempt_id::text;
end;
$$ language plpgsql immutable;

-- 문서 파일 경로 생성
create or replace function public.get_document_path(
    p_user_id uuid,
    p_project_id uuid,
    p_filename text
)
returns text as $$
begin
    return p_user_id::text || '/' || p_project_id::text || '/' || p_filename;
end;
$$ language plpgsql immutable;

comment on function public.get_audio_path is '오디오 파일 Storage 경로 생성';
comment on function public.get_document_path is '문서 파일 Storage 경로 생성';
