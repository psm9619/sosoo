---
stepsCompleted: [1, 2, 3, 4, 5, 6]
inputDocuments:
  - path: '_bmad-output/planning-artifacts/prd.md'
    type: 'prd'
    loaded: true
  - path: '_bmad-output/brainstorming/langgraph-architecture.md'
    type: 'architecture-draft'
    loaded: true
  - path: '_bmad-output/brainstorming/brainstorming-session-2026-01-31.md'
    type: 'brainstorming'
    loaded: true
workflowType: 'architecture'
project_name: 'sosoo'
user_name: 'sosoo'
date: '2026-01-31'
---

# Architecture Decision Document

_This document builds collaboratively through step-by-step discovery. Sections are appended as we work through each architectural decision together._

---

## Project Context Analysis

### Requirements Overview

**Functional Requirements (55개):**

| Category | FRs | Description |
|----------|-----|-------------|
| User Account & Auth | FR1-5 | 소셜 로그인, 본인인증, 프로필 관리 |
| Project Management | FR6-11 | 프로젝트 CRUD, D-Day, 문서 업로드 |
| Voice Recording | FR12-16 | 웹 녹음, 파일 업로드, STT 변환 |
| AI Analysis | FR17-24 | 분석, 개선안, Progressive Context, 3단계 재요청 |
| Voice Generation | FR25-35 | TTS, Voice Cloning, Before/After 비교 |
| Session & Practice | FR36-41 | 세션 관리, 암묵적 만족도 추적 |
| Admin & Ops | FR45-49 | 대시보드, 비용 모니터링, 모더레이션 |
| Content Safety | FR50-53 | 욕설/민감정보 감지, 자동 마스킹 |
| Audio Input | FR54-55 | 파일 업로드, 모더레이션 적용 |

**Non-Functional Requirements (28개):**

| Category | Key Targets |
|----------|-------------|
| Performance | STT 10초, 분석 20초, TTS 15초, 전체 30초 이내 |
| Security | TLS 1.3, AES-256, JWT 24h 만료 |
| Scalability | 90명 동시접속, 일일 5,000 세션 |
| Accessibility | WCAG 2.1 AA, 키보드 내비게이션 |
| Cost | 세션당 ≤$0.10 |

**Scale & Complexity:**

- Primary domain: Full-Stack Web + AI Pipeline
- Complexity level: Medium-High
- External API dependencies: 3 (Whisper, Claude, ElevenLabs)
- Estimated architectural components: 8-10

### Technical Constraints & Dependencies

| Constraint | Impact |
|------------|--------|
| ElevenLabs 비용 | 클로닝 선택적, 기본 음성 fallback |
| 30초 응답 제한 | 병렬 처리 + 프로그레스 UX 필요 |
| 90명 동시접속 | Rate limiting + 큐잉 필요 |
| 본인인증 요구 | 휴대폰/이메일 인증 통합 |
| GDPR 준수 | 삭제 요청 72시간 처리, 동의 관리 |

### Tiered User Access & Data Retention

| User Type | Voice Clone | Context | Audio Retention |
|-----------|-------------|---------|-----------------|
| **Guest** | ❌ 불가 | ❌ 불가 | 24시간 후 삭제 |
| **Auth (no consent)** | ❌ 불가 | ✅ 가능 | 24시간 후 삭제 |
| **Auth (consent)** | ✅ 가능 | ✅ 가능 | **유저 삭제 전까지 유지** |

**Guest Mode Limitations:**
- Quick Mode only (빠른 분석)
- Default M/F TTS voices only
- No projects, no context upload
- No identity verification → no cloning

**Authenticated + Consent:**
- Persistent audio storage (until user deletion)
- Before/After replay anytime
- Full session history comparison

### Cross-Cutting Concerns Identified

1. **API Orchestration Layer**: Whisper → Claude → ElevenLabs 순차/병렬 호출 + 에러 처리 + fallback
2. **Cost Control System**: 세션당 제한, 방향 프리뷰 (TTS 없이), 유저별 quota, 비용 추적
3. **Progressive Context Engine**: 유저별 세션 히스토리 기반 개인화 코칭
4. **Content Moderation Pipeline**: Claude 분석 프롬프트 내 통합 모더레이션
5. **Voice Clone Security Layer**: 본인인증, 모델 격리, 다운로드 차단
6. **Tiered Access Control**: Guest vs Auth vs Auth+Consent 기능/데이터 분리

---

## Starter Template & Tech Stack

### Primary Technology Domain

Full-Stack Web + AI Pipeline:
- **Backend**: Python (FastAPI + LangGraph)
- **Frontend**: TypeScript (Next.js + Supabase)
- **Deployment**: Vercel (Frontend) + Railway/Render (Backend)

### Selected Approach: Separated Services

| Layer | Technology | Deployment |
|-------|------------|------------|
| Frontend | Next.js 15 + Supabase Auth | Vercel |
| Backend API | FastAPI | Railway/Render |
| AI Workflow | LangGraph (Python) | Same as Backend |
| Database | Supabase PostgreSQL | Supabase Cloud |
| Storage | Supabase Storage | Supabase Cloud |

### Initialization Commands

**Frontend:**
```bash
npx create-next-app@latest frontend -e with-supabase
```

**Backend:**
```bash
mkdir backend && cd backend
python -m venv venv
pip install fastapi uvicorn langgraph langchain-anthropic openai httpx
```

---

## Team Structure & Division of Work

### Two-Person Team Setup

| Role | Developer A | Developer B |
|------|-------------|-------------|
| **Focus** | LangGraph + AI Workflow | Frontend + Auth + Data |
| **Folder** | `backend/` | `frontend/` |
| **Language** | Python | TypeScript |
| **Framework** | FastAPI + LangGraph | Next.js + Supabase |
| **Testing** | pytest | Jest/Playwright |
| **Deploy** | Railway/Render | Vercel |

### Project Structure

```
sosoo/
├── backend/                        # 👤 Developer A
│   ├── langgraph/
│   │   ├── state.py               # SpeechCoachState
│   │   ├── nodes/                 # Node functions
│   │   │   ├── stt.py             # Whisper STT
│   │   │   ├── analysis.py        # Claude analysis
│   │   │   ├── improvement.py     # Script improvement
│   │   │   ├── tts.py             # ElevenLabs TTS
│   │   │   ├── moderation.py      # Content moderation
│   │   │   └── context.py         # Progressive Context
│   │   ├── tools/                 # Claude Tools
│   │   ├── workflows/             # Graph definitions
│   │   │   ├── speech_coach.py
│   │   │   └── refinement.py
│   │   └── utils/
│   │       └── prompts.py
│   ├── api/                       # FastAPI
│   │   ├── routes/
│   │   ├── schemas/               # Pydantic (API contract)
│   │   └── main.py
│   └── tests/
│
├── frontend/                      # 👤 Developer B
│   ├── app/
│   │   ├── (auth)/
│   │   ├── (main)/
│   │   ├── (guest)/
│   │   └── api/                   # Proxy to backend
│   ├── components/
│   │   ├── ui/
│   │   ├── audio/
│   │   └── feedback/
│   ├── lib/
│   │   ├── supabase/
│   │   └── api/
│   └── types/
│
├── shared/                        # 🤝 Shared (API Contract)
│   └── api-spec.yaml
│
└── docker-compose.yml
```

### API Contract Process

```
Developer B (Frontend)           Developer A (LangGraph)
        │                               │
        ▼                               ▼
"UI needs this data"            "Workflow can provide this"
        │                               │
        └───────────┬───────────────────┘
                    ▼
             🤝 API Spec Agreement
            (shared/api-spec.yaml)
```

**Kickoff Meeting Agenda (1-2 hours):**
1. PRD review - shared understanding
2. UI wireframe sketch - what data needed
3. API spec draft - request/response structure
4. Mock data - for parallel development

### Core API Endpoints

| Endpoint | Method | Description | Owner |
|----------|--------|-------------|-------|
| `/analyze` | POST | 음성 분석 요청 | Dev A |
| `/refine` | POST | 개선안 재요청 | Dev A |
| `/health` | GET | 서버 상태 확인 | Dev A |

### API Schema (Pydantic)

```python
# backend/api/schemas/requests.py
class AnalyzeRequest(BaseModel):
    audio_url: str
    project_id: str
    user_id: str
    context: Optional[str] = None

# backend/api/schemas/responses.py
class AnalyzeResponse(BaseModel):
    session_id: str
    transcript: str
    analysis: AnalysisResult
    improved_script: str
    improved_audio_url: str
    refinement_count: int  # 0, 1, 2 (max 2)

class RefineRequest(BaseModel):
    session_id: str
    user_intent: str  # 50-100 chars
    stage: int        # 1=preview, 2=final
```

---

## Core Architectural Decisions

### Decision Summary

| # | Category | Decision | Choice | Rationale |
|---|----------|----------|--------|-----------|
| 1.1 | Data | DB Schema Approach | **SQL Migrations** | 2인 협업 시 스키마 변경 추적 필수 |
| 1.2 | Data | Caching Strategy | **None (MVP)** | 복잡도 최소화, 필요 시 추가 |
| 2.1 | Auth | FE↔BE Authentication | **Supabase JWT 전달** | 별도 인증 시스템 불필요 |
| 2.2 | Auth | Guest Session | **Temporary Session ID** | BE에서 독립 관리, 24h TTL |
| 3.1 | API | FE→BE Communication | **Next.js Proxy** | BE URL 숨김, CORS 회피 |
| 3.2 | API | Long Processing | **SSE (Server-Sent Events)** | 실시간 프로그레스 표시 |
| 4.1 | Frontend | State Management | **React Query + Zustand** | 서버상태 + UI상태 분리 |
| 4.2 | Frontend | Audio Recording | **MediaRecorder API** | 의존성 없음, 모던 브라우저 |
| 5.1 | Infra | CI/CD | **Vercel/Railway 내장** | 자동 배포로 충분 |
| 5.2 | Infra | Error Tracking | **None (MVP)** | MVP 이후 Sentry 추가 예정 |
| 5.3 | Infra | Environment Variables | **.env 파일** | MVP에서 심플하게 |

### Data Architecture

**Database Schema Management:**
- Supabase SQL Migrations 사용
- `supabase/migrations/` 폴더에 버전 관리
- 두 개발자가 스키마 변경 시 충돌 방지

**Caching:**
- MVP에서는 캐싱 없이 시작
- Growth 단계에서 Redis 도입 검토 (Progressive Context용)

### Authentication & Security

**Frontend ↔ Backend Flow:**
```
[Browser] → [Next.js] → [Supabase Auth]
                ↓
         JWT Token 획득
                ↓
[Next.js API Proxy] → [FastAPI Backend]
                           ↓
                    JWT 검증 (supabase-py)
```

**Guest Session Flow:**
```
[Guest User] → [Backend]
                  ↓
         Temporary Session ID 발급
         (UUID, 24h TTL, Redis/Memory)
                  ↓
         Quick Mode만 허용
```

### API & Communication Patterns

**Next.js Proxy Pattern:**
```typescript
// frontend/app/api/analyze/route.ts
export async function POST(request: Request) {
  const body = await request.json();
  const response = await fetch(`${BACKEND_URL}/analyze`, {
    method: 'POST',
    headers: {
      'Authorization': request.headers.get('Authorization'),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  return response;
}
```

**SSE for Long Processing:**
```python
# backend/api/routes/analyze.py
@router.post("/analyze")
async def analyze(request: AnalyzeRequest):
    async def event_generator():
        yield {"event": "progress", "data": {"step": "stt", "progress": 0}}
        # ... STT 처리
        yield {"event": "progress", "data": {"step": "stt", "progress": 100}}
        yield {"event": "progress", "data": {"step": "analysis", "progress": 0}}
        # ... 분석 처리
        yield {"event": "complete", "data": result}

    return EventSourceResponse(event_generator())
```

**Progress Events:**
| Event | Data |
|-------|------|
| `progress` | `{step: "stt"|"analysis"|"tts", progress: 0-100}` |
| `complete` | `AnalyzeResponse` |
| `error` | `{code: string, message: string}` |

### Frontend Architecture

**State Management Split:**

| Library | 용도 | 예시 |
|---------|------|------|
| **React Query** | 서버 상태 | API 응답 캐싱, 리페치 |
| **Zustand** | UI 상태 | 녹음 상태, 모달, 로딩 |

```typescript
// React Query - 서버 상태
const { data: analysis } = useQuery({
  queryKey: ['analysis', sessionId],
  queryFn: () => fetchAnalysis(sessionId),
});

// Zustand - UI 상태
const useRecordingStore = create((set) => ({
  isRecording: false,
  duration: 0,
  startRecording: () => set({ isRecording: true }),
  stopRecording: () => set({ isRecording: false }),
}));
```

**Audio Recording:**
```typescript
// MediaRecorder API 사용
const mediaRecorder = new MediaRecorder(stream, {
  mimeType: 'audio/webm;codecs=opus'
});
```

### Infrastructure & Deployment

**Deployment Architecture:**
```
┌─────────────────┐     ┌─────────────────┐
│     Vercel      │     │    Railway      │
│  (Frontend)     │────▶│   (Backend)     │
│  Next.js 15     │     │   FastAPI       │
└────────┬────────┘     └────────┬────────┘
         │                       │
         ▼                       ▼
┌─────────────────────────────────────────┐
│              Supabase                    │
│  PostgreSQL + Auth + Storage             │
└─────────────────────────────────────────┘
```

**Environment Variables:**

| Service | Variables |
|---------|-----------|
| Frontend | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `BACKEND_URL` |
| Backend | `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `ELEVENLABS_API_KEY` |

### Deferred Decisions (Post-MVP)

| Decision | Timing | Notes |
|----------|--------|-------|
| Error Tracking (Sentry) | v1.1 | 무료 티어 활용 |
| Redis Caching | Growth | Progressive Context 최적화 |
| CDN for Audio | Growth | 오디오 파일 캐싱 |
| Rate Limiting | Growth | 현재는 유저별 세션 제한으로 대체 |

---

## Implementation Patterns & Consistency Rules

### Pattern Summary

| # | Category | Pattern | Rule |
|---|----------|---------|------|
| 1 | API Naming | Field Convention | API: `snake_case` / FE 내부: `camelCase` |
| 2 | API Format | Response Wrapper | `{success, data, error}` + SSE |
| 3 | Error Code | Format | `CATEGORY_SPECIFIC` (예: `AUTH_INVALID_TOKEN`) |
| 4 | DB Naming | Tables/Columns | 복수형 `snake_case` (예: `users`, `user_id`) |
| 5 | File Naming | By Language | Python: `snake_case` / TS: `PascalCase`(컴포넌트), `kebab-case`(파일) |
| 6 | Date Format | API Exchange | ISO 8601 (`2026-01-31T12:00:00Z`) |
| 7 | Transform | Layer Location | 단일 변환 레이어: `frontend/lib/api/transform.ts` |
| 8 | SSE | Reconnection | `EventSource` 자동 재연결 + 세션 상태 복구 |
| 9 | Error Code | HTTP Mapping | `AUTH_*`→401, `RATE_*`→429, `AUDIO_*`→400, `ANALYSIS_*`→500 |
| 10 | Test Files | Location | Python: `tests/` 분리 / TS: co-location (`*.test.tsx`) |
| 11 | Case Convert | Library | Python: `humps` / TS: `camelcase-keys` |
| 12 | Env Vars | Validation | 시작 시 필수 변수 검증 |
| 13 | UI State | Naming | `idle` → `recording` → `processing` → `complete` / `error` |
| 14 | Audio Player | Keyboard | `Space`: 재생/일시정지, `←/→`: 5초 이동 |

### Naming Patterns

**API Response Fields (snake_case):**
```json
{
  "success": true,
  "data": {
    "session_id": "abc-123",
    "improved_script": "...",
    "improved_audio_url": "..."
  }
}
```

**Frontend Internal (camelCase):**
```typescript
interface AnalysisResult {
  sessionId: string;
  improvedScript: string;
  improvedAudioUrl: string;
}
```

**Transform Layer:**
```typescript
// frontend/lib/api/transform.ts
import camelcaseKeys from 'camelcase-keys';
import snakecaseKeys from 'snakecase-keys';

export const toClient = <T>(data: unknown): T =>
  camelcaseKeys(data as Record<string, unknown>, { deep: true }) as T;

export const toServer = <T>(data: T): unknown =>
  snakecaseKeys(data as Record<string, unknown>, { deep: true });
```

### Database Naming

| Type | Convention | Example |
|------|------------|---------|
| Table | 복수형 snake_case | `users`, `projects`, `sessions` |
| Column | snake_case | `user_id`, `created_at`, `audio_url` |
| Foreign Key | `{table}_id` | `user_id`, `project_id` |
| Index | `idx_{table}_{columns}` | `idx_sessions_user_id` |
| Enum | UPPER_SNAKE_CASE | `SESSION_STATUS`, `USER_TYPE` |

### Error Handling Pattern

**Error Code → HTTP Status Mapping:**
```python
ERROR_STATUS_MAP = {
    "AUTH_": 401,
    "FORBIDDEN_": 403,
    "NOT_FOUND_": 404,
    "AUDIO_": 400,
    "VALIDATION_": 400,
    "RATE_LIMIT_": 429,
    "ANALYSIS_": 500,
    "TTS_": 503,
}
```

**Standard Error Response:**
```json
{
  "success": false,
  "error": {
    "code": "AUDIO_TOO_SHORT",
    "message": "Audio must be at least 5 seconds long"
  }
}
```

### SSE Pattern with Reconnection

**Backend Event Types:**
```python
# Event types
"progress"  # {"step": "stt", "progress": 50}
"complete"  # Full AnalyzeResponse
"error"     # {"code": "...", "message": "..."}
"heartbeat" # Keep connection alive
```

**Frontend Reconnection:**
```typescript
// frontend/lib/api/sse.ts
export function createSSEConnection(url: string, sessionId: string) {
  const eventSource = new EventSource(`${url}?session=${sessionId}`);

  eventSource.onerror = () => {
    // EventSource auto-reconnects
    // On reconnect, server resumes from last known state
  };

  return eventSource;
}
```

### File Organization

**Backend (Python):**
```
backend/
├── langgraph/
│   ├── nodes/
│   │   └── stt.py              # snake_case
│   └── workflows/
│       └── speech_coach.py
├── api/
│   └── routes/
│       └── analyze.py
└── tests/                      # 테스트 분리
    ├── nodes/
    │   └── test_stt.py
    └── api/
        └── test_analyze.py
```

**Frontend (TypeScript):**
```
frontend/
├── components/
│   └── audio/
│       ├── Recorder.tsx           # PascalCase (컴포넌트)
│       ├── Recorder.test.tsx      # co-located 테스트
│       └── use-recorder.ts        # kebab-case (hooks)
├── lib/
│   └── api/
│       ├── speech-coach.ts        # kebab-case
│       └── transform.ts
```

### UI State Machine

```typescript
// frontend/lib/stores/session-store.ts
type SessionStatus = 'idle' | 'recording' | 'processing' | 'complete' | 'error';

interface SessionState {
  status: SessionStatus;
  progress: { step: string; percent: number } | null;
  result: AnalysisResult | null;
  error: ErrorInfo | null;
}
```

**State Transitions:**
```
idle → recording (녹음 시작)
recording → processing (녹음 완료, 분석 시작)
processing → complete (분석 완료)
processing → error (에러 발생)
error → idle (재시도)
complete → idle (새 세션)
```

### Environment Variable Validation

```python
# backend/api/config.py
import os
from typing import List

REQUIRED_VARS: List[str] = [
    "SUPABASE_URL",
    "SUPABASE_SERVICE_KEY",
    "OPENAI_API_KEY",
    "ANTHROPIC_API_KEY",
    "ELEVENLABS_API_KEY",
]

def validate_env():
    missing = [var for var in REQUIRED_VARS if not os.getenv(var)]
    if missing:
        raise ValueError(f"Missing required environment variables: {missing}")

# Call on startup
validate_env()
```

### Audio Player Keyboard Shortcuts

```typescript
// frontend/components/audio/Player.tsx
const KEYBOARD_SHORTCUTS = {
  ' ': 'togglePlay',      // Space: 재생/일시정지
  'ArrowLeft': 'seekBack',  // ←: 5초 뒤로
  'ArrowRight': 'seekForward', // →: 5초 앞으로
  'ArrowUp': 'volumeUp',    // ↑: 볼륨 증가
  'ArrowDown': 'volumeDown', // ↓: 볼륨 감소
};
```

### Enforcement Guidelines

**All AI Agents MUST:**
1. 새 파일 생성 시 해당 언어의 네이밍 컨벤션 준수
2. API 응답 필드는 반드시 `snake_case` 사용
3. 에러 코드는 `CATEGORY_SPECIFIC` 형식 준수
4. DB 스키마 변경 시 마이그레이션 파일 생성
5. 환경변수 추가 시 `REQUIRED_VARS` 리스트 업데이트

**Pattern Violations:**
- PR 리뷰 시 패턴 준수 여부 체크
- 린터/포매터로 자동 검증 (ESLint, Ruff)

---

## Project Structure

### Complete Directory Structure

```
sosoo/
├── README.md
├── docker-compose.yml
├── Makefile
│
├── shared/                         # 🤝 API 계약
│   ├── api-spec.yaml
│   └── README.md
│
├── backend/                        # 👤 Developer A
│   ├── pyproject.toml
│   ├── requirements.txt
│   ├── .env.example
│   │
│   ├── api/
│   │   ├── main.py                 # FastAPI 엔트리포인트
│   │   ├── config.py               # 환경변수 검증
│   │   ├── dependencies.py         # JWT 검증
│   │   ├── routes/
│   │   │   ├── analyze.py          # POST /analyze (SSE)
│   │   │   ├── refine.py           # POST /refine
│   │   │   └── health.py
│   │   └── schemas/
│   │       ├── requests.py
│   │       └── responses.py
│   │
│   ├── langgraph/
│   │   ├── state.py                # SpeechCoachState
│   │   ├── nodes/
│   │   │   ├── stt.py              # Whisper STT
│   │   │   ├── analysis.py         # Claude 분석
│   │   │   ├── improvement.py      # 개선안 생성
│   │   │   ├── tts.py              # ElevenLabs TTS
│   │   │   ├── moderation.py       # 컨텐츠 모더레이션
│   │   │   └── context.py          # Progressive Context
│   │   ├── tools/
│   │   │   ├── pace_analysis.py
│   │   │   ├── filler_analysis.py
│   │   │   └── structure_analysis.py
│   │   ├── workflows/
│   │   │   ├── speech_coach.py     # 메인 워크플로우
│   │   │   └── refinement.py       # 3단계 재요청
│   │   └── utils/
│   │       ├── prompts.py
│   │       └── audio.py
│   │
│   └── tests/
│       ├── conftest.py
│       ├── nodes/
│       ├── workflows/
│       └── api/
│
├── frontend/                       # 👤 Developer B
│   ├── package.json
│   ├── next.config.ts
│   ├── app/
│   │   ├── (auth)/
│   │   ├── (guest)/
│   │   ├── (main)/
│   │   └── api/                    # Proxy to backend
│   ├── components/
│   │   ├── ui/
│   │   ├── audio/
│   │   ├── feedback/
│   │   └── project/
│   ├── lib/
│   │   ├── supabase/
│   │   ├── api/
│   │   ├── stores/
│   │   └── hooks/
│   └── types/
│
└── supabase/
    └── migrations/
```

### Service Boundaries

```
┌─────────────────────────────────────────────────────────────┐
│                        Browser                               │
│   Next.js Frontend (Vercel)                                  │
│   - React Components                                         │
│   - Zustand (UI State)                                       │
│   - React Query (Server State)                               │
└─────────────────────────┬───────────────────────────────────┘
                          │ HTTP/SSE (via Next.js Proxy)
┌─────────────────────────┴───────────────────────────────────┐
│                  FastAPI Backend (Railway)                   │
│   ┌─────────────────────────────────────────────────────┐   │
│   │                    LangGraph                         │   │
│   │   ┌─────┐   ┌──────────┐   ┌───────────┐   ┌─────┐  │   │
│   │   │ STT │ → │ Analysis │ → │Improvement│ → │ TTS │  │   │
│   │   └─────┘   └──────────┘   └───────────┘   └─────┘  │   │
│   │   Whisper     Claude          Claude      ElevenLabs │   │
│   └─────────────────────────────────────────────────────┘   │
└─────────────────────────┬───────────────────────────────────┘
                          │
┌─────────────────────────┴───────────────────────────────────┐
│                   Supabase (Cloud)                           │
│   - PostgreSQL (users, projects, sessions)                   │
│   - Auth (JWT)                                               │
│   - Storage (audio files)                                    │
└─────────────────────────────────────────────────────────────┘
```

