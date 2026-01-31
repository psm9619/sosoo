# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Sosoo is an AI-powered speech coaching SaaS that analyzes speech and provides improved versions using voice cloning. The key differentiator is hearing improvements in the user's own voice.

**Core Flow:** Audio Upload → STT (Whisper) → Analysis (Claude) → Script Improvement → TTS with Voice Clone (ElevenLabs)

## Architecture

**Separated Services:**
- **Frontend:** Next.js 15 + React 19 + TypeScript (Vercel)
- **Backend:** FastAPI + LangGraph (Railway/Render) - not in this repo yet
- **Database/Auth/Storage:** Supabase

**AI Pipeline:** Whisper (STT) → Claude API (Analysis) → ElevenLabs (TTS/Voice Clone)

## Development Commands

All commands run from the `frontend/` directory:

```bash
npm run dev      # Start dev server (port 3000)
npm run build    # Production build
npm run lint     # ESLint check
```

## Environment Setup

Copy `frontend/.env.example` to `frontend/.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
BACKEND_URL=http://localhost:8000
```

## Key Architecture Decisions

### API Communication
- Frontend proxies all backend calls through `/api/[...path]` route
- **Case transformation:** Backend uses snake_case, frontend uses camelCase
- Transform happens in `lib/api/transform.ts` via `toClient()` / `toServer()`
- Use `apiClient` from `lib/api/client.ts` for all API calls

### State Management
- **Zustand:** UI state (session, recording) in `lib/stores/`
- **TanStack Query:** Server state and caching

### SSE Streaming
- Long-running AI pipeline uses Server-Sent Events
- Event types: `progress`, `complete`, `error`, `heartbeat`
- Implementation in `lib/api/sse.ts`

### Audio Recording
- `useAudioRecorder` hook handles Web Audio API
- 5-minute max duration, pause/resume support
- Syncs state with Zustand store

## Code Organization

```
frontend/src/
├── app/                    # Next.js App Router
│   └── api/[...path]/      # Backend proxy
├── components/             # React components by feature
│   ├── audio/              # Recording, playback
│   ├── feedback/           # Analysis display
│   ├── layout/             # Navigation, shell
│   ├── project/            # Project management
│   └── ui/                 # Base UI primitives
├── hooks/                  # Custom React hooks
├── lib/
│   ├── api/                # HTTP client, SSE, transforms
│   ├── providers/          # React context providers
│   ├── stores/             # Zustand state stores
│   └── supabase/           # Supabase client (browser/server)
└── types/                  # TypeScript definitions
```

## Type Definitions

API types are in `types/api.ts`:
- `SessionState` - Main workflow state
- `SSEProgressEvent` / `SSECompleteEvent` / `SSEErrorEvent` - Stream events
- `Analysis` - Speech analysis result with scores and improvements

## Documentation

- `_bmad-output/planning-artifacts/prd.md` - Product requirements
- `_bmad-output/planning-artifacts/architecture.md` - System architecture with 55 functional requirements
