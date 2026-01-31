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
- **Question**: 프로젝트 생성 시 고정되는 질문들
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

## Key Differentiator

보이스클로닝 기능이 핵심 차별점. "AI가 복제한" 같은 부정적 표현 대신 "나와 같은 목소리"로 부드럽게 표현. 보안/프라이버시 안심 문구 항상 포함.

## Language

- 코드: 영어
- UI 텍스트/주석: 한국어 (타겟 유저가 한국인)
