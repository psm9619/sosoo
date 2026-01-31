# CLAUDE.md - Supabase

VoiceUp 서비스의 Supabase 스키마 및 마이그레이션 파일

## Data Model

```
Project → Questions[] → Attempts[]
```

## Tables

| 테이블 | 설명 | 주요 필드 |
|--------|------|-----------|
| `users` | 사용자 프로필 | voice_clone_consent, identity_verified |
| `projects` | 프로젝트 | type, context_summary, context_keywords, context_experiences |
| `questions` | 질문 | category (interview_category), order, is_ai_generated |
| `attempts` | 연습 시도 | analysis (jsonb), score, original/improved_audio_url |
| `project_documents` | 컨텍스트 문서 | extracted_text, extracted_summary |
| `voice_clones` | Voice Clone | elevenlabs_voice_id, status |

## ENUM Types

```sql
project_type: 'interview' | 'presentation' | 'free_speech'
interview_category: 'basic' | 'motivation' | 'competency' | 'technical' | 'situation' | 'culture_fit'
attempt_status: 'processing' | 'completed' | 'failed'
voice_clone_status: 'processing' | 'ready' | 'failed'
```

## Storage Buckets

| 버킷 | 용도 | 제한 | 경로 구조 |
|------|------|------|-----------|
| `audio` | 녹음/TTS | 50MB | `{user_id}/original/{attempt_id}.webm` |
| `documents` | 이력서/발표자료 | 10MB | `{user_id}/{project_id}/{filename}` |
| `voice-samples` | Voice Clone 샘플 | 10MB | `{user_id}/{clone_id}.webm` |

## Views

| 뷰 | 용도 |
|----|------|
| `projects_with_stats` | 프로젝트 + 질문수/시도수/D-Day |
| `questions_with_stats` | 질문 + 시도수/최고점수 |
| `attempts_with_scores` | 시도 + 분석 점수 추출 |

## Key Functions

| 함수 | 용도 |
|------|------|
| `get_recent_attempts_context(user_id, project_id?, limit)` | Short-term Memory용 최근 시도 조회 |
| `calculate_growth_trend(user_id, project_id?)` | 성장 추이 계산 |
| `get_category_performance(user_id, project_id)` | 카테고리별 성과 |
| `can_use_voice_clone()` | Voice Clone 사용 가능 여부 (동의+인증) |
| `grade_to_score(grade)` | 등급(A/B+/B/C+/C/D) → 점수 변환 |

## RLS Policies

- 사용자는 자신의 데이터만 접근 가능
- Voice Clone은 동의 + 본인인증 사용자만 생성 가능
- Storage는 user_id 폴더 기반 접근 제어

## Migration Files

```
migrations/
├── 20260131000000_initial_schema.sql     # 테이블, ENUM, 트리거
├── 20260131000001_rls_policies.sql       # RLS 정책
├── 20260131000002_storage_buckets.sql    # Storage 버킷 + 정책
└── 20260131000003_views_and_functions.sql # 뷰, 함수, 인덱스
```

## CLI Commands

```bash
# Supabase CLI 설치
brew install supabase/tap/supabase

# 프로젝트 연결
supabase link --project-ref <project-ref>

# 마이그레이션 적용
supabase db push

# 마이그레이션 상태 확인
supabase migration list

# DB 리셋 (주의: 모든 데이터 삭제)
supabase db reset --linked
```

## Analysis JSONB Structure

`attempts.analysis` 필드 구조:
```json
{
  "scores": {
    "logic_structure": "B+",
    "filler_words": "A",
    "speaking_pace": "C",
    "confidence_tone": "B",
    "content_specificity": "C+"
  },
  "metrics": {
    "words_per_minute": 150,
    "filler_count": 5,
    "filler_percentage": 2.5,
    "total_words": 200
  },
  "suggestions": [
    { "priority": 1, "category": "pace", "suggestion": "...", "impact": "..." }
  ],
  "structure_analysis": "STAR 분석...",
  "progressive_context_note": "이전 연습 대비..."
}
```

## Context JSONB Structure

`projects.context_experiences` 필드 구조:
```json
[
  {
    "title": "프로젝트명",
    "role": "담당 역할",
    "achievements": ["성과1", "성과2"],
    "skills": ["기술1", "기술2"]
  }
]
```
