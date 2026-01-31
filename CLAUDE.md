# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**VoiceUp** - AI 기반 스피치 코칭 SaaS. 사용자가 면접/발표/자유스피치를 녹음하면 AI가 분석하고, **사용자 본인의 목소리**로 개선된 버전을 들려주는 서비스.

**핵심 차별점:** Voice Cloning - "AI가 복제한" 대신 "나와 같은 목소리"로 표현

## Architecture (통합 구조)

**Vercel 단일 배포** - Python 백엔드 없이 Next.js API Routes로 AI 파이프라인 통합

```
┌────────────────────────────────────────────────────┐
│                    Vercel                          │
│  ┌─────────────────┐    ┌───────────────────────┐  │
│  │    Next.js      │    │   API Routes          │  │
│  │    Frontend     │◄──►│   /api/analyze        │  │
│  │    (React 19)   │    │   /api/refine         │  │
│  └─────────────────┘    │   /api/context/*      │  │
│                         │   /api/questions/*    │  │
│                         │   /api/memory/*       │  │
│                         └───────────────────────┘  │
│                                    │               │
│                                    ▼               │
│                         ┌───────────────────────┐  │
│                         │   LangGraph JS        │  │
│                         │   (TypeScript)        │  │
│                         └───────────────────────┘  │
└────────────────────────────────────────────────────┘
         │
         ▼
    ┌─────────┐
    │Supabase │  PostgreSQL + Storage + Auth
    └─────────┘
```

## Core Data Model

```
Project → Questions[] → Attempts[]
```

- **Project**: 면접/발표/자유스피치 프로젝트 (context_* 필드에 AI 분석 결과 저장)
- **Question**: 프로젝트당 여러 질문 (category별 분류, AI 생성 가능)
- **Attempt**: 질문당 여러 연습 시도 (analysis, score, audio URLs)

## AI Pipeline

```
Audio → STT (Whisper) → Analysis (Claude + Tools) → Improvement (Claude) → TTS (ElevenLabs)
```

### 분석 도구
- **Pace Analysis**: WPM 계산 (목표: 120-170)
- **Filler Analysis**: 필러워드 탐지 (어, 음, 그...)
- **Structure Analysis**: STAR 프레임워크 분석

### Progressive Context (메모리 시스템)
- **Long-term Memory**: 문서 컨텍스트 (새 문서 업로드 시 갱신)
- **Short-term Memory**: 최근 3개 시도 패턴 (매 세션 전 갱신)

## Development Commands

```bash
cd frontend
npm run dev      # 개발 서버 (localhost:3000)
npm run build    # 프로덕션 빌드
npm run lint     # ESLint
```

## Environment Variables

`frontend/.env.local`:
```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx

# AI APIs
OPENAI_API_KEY=sk-xxx          # Whisper STT
ANTHROPIC_API_KEY=sk-ant-xxx   # Claude Analysis
ELEVENLABS_API_KEY=sk_xxx      # TTS + Voice Clone
```

## Key Directories

```
frontend/src/
├── app/api/          # AI API Routes (analyze, refine, context, questions, memory)
├── lib/ai/           # LangGraph JS 파이프라인
│   ├── nodes/        # STT, Analysis, Improvement, TTS, Context, Questions
│   ├── tools/        # Pace, Filler, Structure analysis
│   └── workflows/    # Speech Coach, Refinement
├── lib/stores/       # Zustand stores (project, recording, session)
└── components/       # React components

supabase/migrations/  # DB 스키마 (테이블, RLS, Storage, 뷰/함수)
```

## API Routes

| Route | Method | Description |
|-------|--------|-------------|
| `/api/analyze` | POST (SSE) | 스피치 분석 + 개선 + TTS |
| `/api/refine` | POST (SSE) | 사용자 피드백 기반 재생성 |
| `/api/context/analyze` | POST | 문서 컨텍스트 분석 |
| `/api/questions/generate` | POST | 맞춤 질문 생성 |
| `/api/memory/build` | POST | Progressive Context 빌드 |

## Supabase Schema

**Tables:** users, projects, questions, attempts, project_documents, voice_clones

**Storage Buckets:**
- `audio` (50MB): 녹음/TTS 오디오
- `documents` (10MB): 이력서/발표자료
- `voice-samples` (10MB): Voice Clone 샘플

**Views:** projects_with_stats, questions_with_stats, attempts_with_scores

## Documentation

- `DEVLOG.md` - 개발 과정 기록 (아키텍처 결정, 기술 스택)
- `_bmad-output/planning-artifacts/prd.md` - PRD
- `_bmad-output/planning-artifacts/architecture.md` - 초기 아키텍처 (참고용)

## Language Convention

- 코드: 영어
- UI 텍스트/주석: 한국어 (타겟 유저가 한국인)
