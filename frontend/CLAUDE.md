# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

VoiceUp - AI 발화 코칭 서비스 프론트엔드. 사용자가 면접/발표/자유스피치를 녹음하면 AI가 분석하고, ElevenLabs 보이스클로닝으로 개선된 버전을 **사용자 본인의 목소리**로 들려주는 서비스.

## Commands

```bash
npm run dev      # 개발 서버 (localhost:3000)
npm run build    # 프로덕션 빌드
npm run lint     # ESLint
```

## Tech Stack

- **Next.js 15** (App Router)
- **React 19**
- **TypeScript**
- **Tailwind CSS v4** (tw-animate-css)
- **Zustand** - 클라이언트 상태
- **React Query** - 서버 상태
- **Supabase** - 인증 (Google, Kakao, Email)
- **shadcn/ui** - UI 컴포넌트

## Architecture

### Data Model (핵심)

```
Project → Questions[] → Attempts[]
```

- **Project**: 면접/발표/자유스피치 프로젝트
- **Question**: 프로젝트 생성 시 고정되는 질문들 (category별 분류)
- **Attempt**: 각 질문에 대한 연습 기록 (타임스탬프, 원본/개선 텍스트, 점수)

타입 정의: `src/types/project.ts`

### Key Routes

| Route | 설명 |
|-------|------|
| `/` | 홈 랜딩 |
| `/studio` | 스튜디오 메인 (프로젝트 선택) |
| `/studio/[projectId]` | 프로젝트 상세 (질문 목록) |
| `/studio/[projectId]/q/[questionId]` | 녹음 및 결과 페이지 |
| `/my` | 마이페이지 (프로젝트 관리, 설정) |
| `/my/projects/[projectId]` | 연습 기록 히스토리 |

### State Management

- `src/lib/stores/project-store.ts` - 프로젝트/질문/시도 관리 (Zustand)
- `src/lib/stores/recording-store.ts` - 녹음 상태
- `src/lib/stores/session-store.ts` - 세션 상태

### Design System

- **Fonts**: Noto Sans KR (본문), Playfair Display (포인트)
- **Colors**: cream `#FDF8F3`, teal `#0D9488`, coral `#F97316`, charcoal `#1C1917`
- **CSS 변수**: `src/app/globals.css`

---

## AI Pipeline (lib/ai/)

백엔드 없이 Next.js API Routes에서 직접 AI 파이프라인 실행

### 파이프라인 흐름

```
Audio → STT (Whisper) → Analysis (Claude) → Improvement → TTS (ElevenLabs)
```

### API Routes

| Route | Method | Description |
|-------|--------|-------------|
| `/api/analyze` | POST (SSE) | 스피치 분석 + 개선 + TTS |
| `/api/refine` | POST (SSE) | 사용자 피드백 기반 재생성 |
| `/api/context/analyze` | POST | 문서 컨텍스트 분석 |
| `/api/questions/generate` | POST | 맞춤 질문 생성 |
| `/api/memory/build` | POST | Progressive Context 빌드 |

### lib/ai 구조

```
lib/ai/
├── index.ts                 # 메인 exports
├── state.ts                 # LangGraph 상태 타입
├── prompts.ts               # AI 프롬프트 (분석/개선/반성/재요청)
│
├── tools/                   # 분석 도구
│   ├── pace-analysis.ts     # WPM 계산 (목표: 120-170)
│   ├── filler-analysis.ts   # 필러워드 탐지 (어, 음, 그...)
│   └── structure-analysis.ts # STAR 프레임워크 분석
│
├── nodes/                   # 파이프라인 노드
│   ├── stt.ts               # OpenAI Whisper
│   ├── analysis.ts          # Claude 분석 + 도구 실행
│   ├── improvement.ts       # 스크립트 개선 + Self-Reflection
│   ├── tts.ts               # ElevenLabs TTS + Supabase 업로드
│   ├── context.ts           # 문서 컨텍스트 분석
│   ├── questions.ts         # 질문 생성 (면접/발표)
│   └── progressive-context.ts # 메모리 시스템
│
└── workflows/               # LangGraph 워크플로우
    ├── speech-coach.ts      # 메인 파이프라인
    └── refinement.ts        # 재요청 파이프라인
```

### Progressive Context (메모리 시스템)

| 메모리 | 내용 | 갱신 시점 |
|--------|------|----------|
| **Long-term** | 문서 요약, 키워드, 경험, 강점 | 새 문서 업로드 시 |
| **Short-term** | 성장 패턴, 지속적 약점, 최근 피드백 | 매 분석 전 |

### 면접 질문 카테고리

| Category | 설명 | 기본 개수 |
|----------|------|-----------|
| `basic` | 자기소개 | 1 |
| `motivation` | 지원동기 | 2 |
| `competency` | 역량/성과 | 4 |
| `technical` | 기술/프로젝트 | 4 |
| `situation` | 상황대처 | 2 |
| `culture_fit` | 컬쳐핏 | 1 |

---

## Environment Variables

`.env.local`:
```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx   # 서버 전용 (오디오 업로드)

# AI APIs
OPENAI_API_KEY=sk-xxx           # Whisper STT
ANTHROPIC_API_KEY=sk-ant-xxx    # Claude Analysis/Improvement
ELEVENLABS_API_KEY=sk_xxx       # TTS + Voice Clone
```

## Key Differentiator

보이스클로닝 기능이 핵심 차별점. "AI가 복제한" 같은 부정적 표현 대신 "나와 같은 목소리"로 부드럽게 표현. 보안/프라이버시 안심 문구 항상 포함.

## Language

- 코드: 영어
- UI 텍스트/주석: 한국어 (타겟 유저가 한국인)
