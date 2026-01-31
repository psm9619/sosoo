# VoiceUp Development Log

> AI 기반 스피치 코칭 서비스 개발 과정 기록

---

## 2025-01-31: 전체 백엔드 통합 완료

### 📋 개요

이 세션에서 Python 백엔드를 TypeScript로 완전히 마이그레이션하고, Supabase 스키마 및 AI 파이프라인을 완성했습니다.

### ✅ 완료된 작업

| 카테고리 | 작업 | 상태 |
|----------|------|------|
| **아키텍처** | Python → TypeScript 전환 | ✅ |
| **AI 파이프라인** | LangGraph JS 구현 (STT → Analysis → Improvement → TTS) | ✅ |
| **컨텍스트 분석** | 문서 분석 및 질문 생성 | ✅ |
| **Progressive Context** | Long-term + Short-term 메모리 시스템 | ✅ |
| **Supabase 스키마** | 테이블, RLS, Storage 버킷 | ✅ |
| **API Routes** | analyze, refine, context, questions, memory | ✅ |

---

## 1. Python LangGraph → TypeScript 리팩토링

### 🎯 리팩토링 목표

| 목표 | 이유 |
|------|------|
| **인프라 단순화** | Python 백엔드 별도 호스팅(Railway/Render) 불필요 |
| **배포 통합** | Vercel 단일 배포로 운영 복잡도 감소 |
| **타입 안정성** | 프론트엔드-백엔드 간 TypeScript 타입 공유 |
| **개발 속도** | 풀스택 TypeScript로 컨텍스트 스위칭 최소화 |
| **비용 절감** | 별도 백엔드 서버 비용 제거 |

### 🏗️ 아키텍처 변경

#### Before (Python 분리 구조)
```
┌─────────────┐     HTTP/SSE      ┌──────────────────┐
│   Next.js   │ ◄───────────────► │  FastAPI Server  │
│   Frontend  │                   │  (Python)        │
│   (Vercel)  │                   │  (Railway)       │
└─────────────┘                   └──────────────────┘
                                          │
                                          ▼
                                  ┌──────────────────┐
                                  │    LangGraph     │
                                  │  (Python SDK)    │
                                  └──────────────────┘
```

#### After (통합 구조)
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
```

### 🔄 AI 파이프라인 구조

```
Audio URL
    │
    ▼
┌─────────────────────────────────────────────────────────┐
│                   Speech Coach Pipeline                  │
│                                                          │
│  ┌─────┐   ┌──────────┐   ┌─────────────┐   ┌─────┐    │
│  │ STT │──►│ Analysis │──►│ Improvement │──►│ TTS │    │
│  └─────┘   └──────────┘   └─────────────┘   └─────┘    │
│  Whisper    Claude +       Claude           ElevenLabs  │
│             Tools          (+ Reflection)               │
│                                                          │
└─────────────────────────────────────────────────────────┘
    │
    ▼
{transcript, scores, suggestions, improvedScript, audioUrl}
```

#### 노드별 상세

| 노드 | 역할 | API | 특이사항 |
|------|------|-----|----------|
| **STT** | 음성→텍스트 | OpenAI Whisper | 한국어 최적화, 5초~5분 제한 |
| **Analysis** | 스피치 분석 | Claude Sonnet | 3개 도구 병렬 실행 |
| **Improvement** | 스크립트 개선 | Claude Sonnet | Deep 모드시 Self-Reflection |
| **TTS** | 텍스트→음성 | ElevenLabs | Voice Clone 지원 |

#### 분석 도구 (Tools)

```typescript
// 1. Pace Analysis - 발화 속도 분석
analyzePace(transcript, duration) → { wpm, score, recommendation }

// 2. Filler Analysis - 필러워드 탐지
analyzeFillers(transcript) → { count, percentage, score }

// 3. Structure Analysis - STAR 구조 분석
analyzeStructure(transcript) → { hasSTAR, score, feedback }
```

---

## 2. 컨텍스트 기반 질문 생성 파이프라인

### 🎯 주요 기능

| 기능 | 설명 |
|------|------|
| **컨텍스트 분석** | 문서에서 요약, 키워드, 경험, 강점, 질문 가능 영역 추출 |
| **면접 질문 생성** | 6개 카테고리별 맞춤 질문 생성 |
| **발표 Q&A 생성** | 청중 예상 질문 생성 |

### 🏗️ 파이프라인 구조

```
Document Upload
    │
    ▼
┌─────────────────────────────────────────────────────────┐
│                 Context Analysis Pipeline                │
│                                                          │
│  ┌────────────────┐   ┌───────────────────────────────┐ │
│  │ Text Extract   │──►│ Context Analyze (Claude)      │ │
│  │ (PDF/DOCX/TXT) │   │ → summary, keywords, exps     │ │
│  └────────────────┘   └───────────────────────────────┘ │
│                                │                         │
│                                ▼                         │
│                       ┌───────────────────────────────┐ │
│                       │ Question Generate (Claude)    │ │
│                       │ → category-based questions    │ │
│                       └───────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
    │
    ▼
{context, questions[]} → DB 저장 → 연습 시작
```

### 🔑 면접 카테고리별 기본 질문 수

| 카테고리 | 설명 | 기본 개수 |
|----------|------|-----------|
| `basic` | 자기소개 | 1 |
| `motivation` | 지원동기 | 2 |
| `competency` | 역량/성과 | 4 |
| `technical` | 기술/프로젝트 | 4 |
| `situation` | 상황대처 | 2 |
| `culture_fit` | 컬쳐핏 | 1 |
| **총합** | | **14개** |

---

## 3. Progressive Context (메모리 시스템)

### 🎯 메모리 타입

| 타입 | 설명 | 갱신 시점 | 저장 위치 |
|------|------|----------|-----------|
| **Long-term** | 프로젝트 컨텍스트 (이력서/발표자료 분석) | 새 문서 업로드 시 | `projects.context_*` |
| **Short-term** | 최근 3개 시도의 패턴 분석 | 매 분석 세션 전 | 실시간 생성 |

### 🏗️ 아키텍처

```
┌─────────────────────────────────────────────────────────────┐
│                    Memory System                             │
│                                                              │
│  ┌─────────────────────┐    ┌─────────────────────────────┐ │
│  │   Long-term Memory  │    │    Short-term Memory        │ │
│  │   (Project Context) │    │    (Recent 3 Attempts)      │ │
│  │                     │    │                             │ │
│  │  • 문서 요약         │    │  • 성장 패턴 (격려 포인트)   │ │
│  │  • 핵심 키워드       │    │  • 지속적 약점 (우선 피드백) │ │
│  │  • 경험/성과         │    │  • 최근 피드백 요약         │ │
│  │  • 강점             │    │                             │ │
│  └─────────────────────┘    └─────────────────────────────┘ │
│                    │                     │                   │
│                    └──────────┬──────────┘                   │
│                               ▼                              │
│                    ┌─────────────────────┐                   │
│                    │  Analysis Prompt    │                   │
│                    │  (Claude Sonnet)    │                   │
│                    └─────────────────────┘                   │
└─────────────────────────────────────────────────────────────┘
```

### 🔑 주요 타입

```typescript
// Long-term Memory (프로젝트에서 가져옴)
interface LongTermMemory {
  summary: string;
  keywords: string[];
  experiences: Experience[];
  strengths: string[];
  company?: string;
  position?: string;
}

// Short-term Memory (최근 3개 시도 분석)
interface ShortTermMemory {
  growthPatterns: string[];        // 성장 중인 영역
  persistentWeaknesses: string[];  // 개선 필요 영역
  recentFeedbackSummary: string;   // 최근 핵심 피드백
  analyzedAttemptCount: number;
}
```

---

## 4. Supabase 스키마 및 Storage

### 📊 데이터 모델

```
Project → Questions[] → Attempts[]
```

### 테이블 구조

| 테이블 | 설명 |
|--------|------|
| `users` | 사용자 프로필, Voice Clone 동의 |
| `projects` | 프로젝트 (type, context_*) |
| `questions` | 질문 (category, order, is_ai_generated) |
| `attempts` | 연습 시도 (analysis, score, audio URLs) |
| `project_documents` | 컨텍스트 문서 |
| `voice_clones` | Voice Clone 정보 |

### Storage 버킷

| 버킷 | 용도 | 제한 |
|------|------|------|
| `audio` | 녹음/TTS 오디오 | 50MB |
| `documents` | 이력서/발표자료 | 10MB |
| `voice-samples` | Voice Clone 샘플 | 10MB (동의+인증 필요) |

### 뷰 및 함수

| 뷰/함수 | 용도 |
|---------|------|
| `projects_with_stats` | 프로젝트 + 질문수/시도수/D-Day |
| `questions_with_stats` | 질문 + 시도수/최고점수 |
| `attempts_with_scores` | 시도 + 분석 점수 |
| `get_recent_attempts_context()` | Short-term Memory용 |
| `calculate_growth_trend()` | 성장 추이 계산 |
| `get_category_performance()` | 카테고리별 성과 |

---

## 5. 생성된 파일 구조

```
frontend/src/
├── app/api/
│   ├── analyze/route.ts        # POST - 스피치 분석 (SSE)
│   ├── refine/route.ts         # POST - 재요청 (SSE)
│   ├── context/
│   │   └── analyze/route.ts    # POST - 컨텍스트 분석
│   ├── questions/
│   │   └── generate/route.ts   # POST - 질문 생성
│   └── memory/
│       └── build/route.ts      # POST - Progressive Context 빌드
│
└── lib/ai/
    ├── index.ts                 # 메인 엔트리포인트
    ├── state.ts                 # LangGraph 상태 정의
    ├── prompts.ts               # AI 프롬프트
    │
    ├── tools/
    │   ├── pace-analysis.ts     # WPM 계산
    │   ├── filler-analysis.ts   # 필러워드 탐지
    │   └── structure-analysis.ts # STAR 분석
    │
    ├── nodes/
    │   ├── index.ts
    │   ├── stt.ts               # OpenAI Whisper
    │   ├── analysis.ts          # Claude 분석
    │   ├── improvement.ts       # 스크립트 개선
    │   ├── tts.ts               # ElevenLabs TTS
    │   ├── context.ts           # 컨텍스트 분석
    │   ├── questions.ts         # 질문 생성
    │   └── progressive-context.ts # 메모리 시스템
    │
    └── workflows/
        ├── index.ts
        ├── speech-coach.ts      # 메인 파이프라인
        └── refinement.ts        # 재요청 파이프라인

supabase/migrations/
├── 20260131000000_initial_schema.sql     # 테이블, ENUM
├── 20260131000001_rls_policies.sql       # RLS 정책
├── 20260131000002_storage_buckets.sql    # Storage 버킷
└── 20260131000003_views_and_functions.sql # 뷰, 함수, 인덱스
```

---

## 기술 스택 요약

### Frontend
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript 5.x
- **UI**: React 19, Tailwind CSS v4, shadcn/ui
- **State**: Zustand (UI), React Query (Server)

### AI Pipeline
- **Orchestration**: LangGraph JS (@langchain/langgraph)
- **STT**: OpenAI Whisper API
- **LLM**: Claude Sonnet (claude-sonnet-4-20250514)
- **TTS**: ElevenLabs (eleven_multilingual_v2)

### Infrastructure
- **Hosting**: Vercel (단일 배포)
- **Database**: Supabase PostgreSQL
- **Storage**: Supabase Storage
- **Auth**: Supabase Auth (Google, Kakao, Email)

---

---

## 2025-02-01: 컨텍스트 기반 질문 생성 파이프라인 구현

### 📋 개요

이 세션에서 PDF/DOCX 파일 업로드 → 컨텍스트 분석 → 맞춤 질문 생성 파이프라인을 완성했습니다.

### ✅ 완료된 작업

| 카테고리 | 작업 | 상태 |
|----------|------|------|
| **파일 파싱** | PDF/DOCX 텍스트 추출 구현 | ✅ |
| **컨텍스트 분석** | FormData 파일 업로드 지원 | ✅ |
| **질문 생성** | "더 많이 생성 → 베스트 선별" 전략 | ✅ |
| **타입 확장** | Project 타입에 Long-term Memory 필드 추가 | ✅ |
| **프론트엔드 연동** | studio/new 파일 업로드 플로우 통합 | ✅ |

---

### 1. PDF/DOCX 텍스트 추출 구현

#### 패키지 설치
```bash
npm install pdf-parse mammoth
```

#### 구현 파일: `lib/ai/nodes/context.ts`

```typescript
import { PDFParse } from 'pdf-parse';
import * as mammoth from 'mammoth';

// PDF 텍스트 추출
async function parsePdf(buffer: Buffer): Promise<{ text: string }> {
  const pdf = new PDFParse({ data: new Uint8Array(buffer) });
  const result = await pdf.getText();
  return { text: result.text };
}

// DOCX 텍스트 추출
async function parseDocx(buffer: Buffer): Promise<string> {
  const result = await mammoth.extractRawText({ buffer });
  return result.value;
}
```

#### 지원 파일 형식

| MIME Type | 파일 형식 | 파서 |
|-----------|----------|------|
| `application/pdf` | PDF | pdf-parse (PDFParse) |
| `application/vnd.openxmlformats-officedocument.wordprocessingml.document` | DOCX | mammoth |
| `application/msword` | DOC | mammoth |
| `text/plain` | TXT | TextDecoder |
| `text/markdown` | MD | TextDecoder |

---

### 2. Context Analyze API 업데이트

#### 파일: `app/api/context/analyze/route.ts`

**두 가지 입력 방식 지원:**

1. **JSON 방식** (기존)
```typescript
POST /api/context/analyze
Content-Type: application/json

{
  "documentText": "문서 텍스트...",
  "documentType": "resume",
  "projectType": "interview",
  "company": "회사명",
  "position": "포지션"
}
```

2. **FormData 방식** (신규)
```typescript
POST /api/context/analyze
Content-Type: multipart/form-data

FormData:
- file: File (PDF/DOCX)
- documentType: "resume" | "presentation"
- projectType: "interview" | "presentation"
- company?: string
- position?: string
```

#### 핵심 로직

```typescript
export async function POST(request: NextRequest) {
  const contentType = request.headers.get('content-type') || '';

  // FormData 방식 (파일 업로드)
  if (contentType.includes('multipart/form-data')) {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    // 파일에서 텍스트 추출
    const documentText = await extractTextFromFile(file);
    // ... 분석 진행
  }
  // JSON 방식
  else {
    const body = await request.json();
    // ... 기존 로직
  }
}
```

---

### 3. 질문 생성 품질 전략 구현

#### 파일: `lib/ai/nodes/questions.ts`

**"더 많이 생성 → 베스트 선별" 전략:**

```typescript
// 선별을 위해 더 많이 생성하는 비율
function getGenerationCount(selectCount: number): number {
  if (selectCount <= 1) return 2;   // 1개 → 2개 생성
  if (selectCount === 2) return 3;  // 2개 → 3개 생성
  if (selectCount === 3) return 5;  // 3개 → 5개 생성
  return selectCount + 2;           // 4개+ → +2개 생성
}
```

**카테고리별 생성/선별 수:**

| 카테고리 | 생성 | 선별 |
|---------|------|------|
| basic | 2 | 1 |
| motivation | 3 | 2 |
| competency | 6 | 4 |
| technical | 6 | 4 |
| situation | 3 | 2 |
| culture_fit | 2 | 1 |
| **총합** | **22** | **14** |

**프롬프트에 품질 기준 명시:**

```typescript
const QUESTION_GENERATION_SYSTEM_PROMPT = `
## 질문 품질 기준 (선별 시 적용)

좋은 질문의 조건:
1. **맞춤성**: 지원자의 구체적인 경험/프로젝트를 언급
2. **답변 용이성**: 지원자가 실제로 답할 수 있는 내용
3. **차별화**: 일반적인 질문이 아닌, 이 지원자만을 위한 질문
4. **깊이**: 표면적 확인이 아닌 사고 과정을 물을 수 있는 질문
5. **명확성**: 질문 의도가 명확하고 한 가지 주제에 집중

나쁜 질문의 조건:
- 너무 광범위하거나 모호한 질문
- 예/아니오로 답할 수 있는 닫힌 질문
- 컨텍스트와 무관한 일반적인 질문
- 여러 질문이 하나에 섞인 복합 질문
`;
```

**AI 응답 포맷:**

```typescript
interface AIQuestionResponse {
  text: string;
  category: InterviewCategory;
  generationContext: string;
  qualityScore: number;    // 1-10 품질 점수
  selected: boolean;       // 최종 선별 여부
}
```

---

### 4. Project 타입 확장

#### 파일: `types/project.ts`

```typescript
export interface Project {
  // ... 기존 필드

  // Long-term Memory (컨텍스트 분석 결과)
  contextSummary?: string;
  contextKeywords?: string[];
  contextExperiences?: {
    title: string;
    role: string;
    achievements: string[];
  }[];
  contextStrengths?: string[];
}
```

---

### 5. 프로젝트 생성 플로우 통합

#### 파일: `app/studio/new/page.tsx`

**변경 사항:**

1. `UploadedFile` 인터페이스에 실제 `File` 객체 저장
```typescript
interface UploadedFile {
  name: string;
  size: number;
  type: string;
  file: File;  // 추가
}
```

2. `handleAnalyzeAndCreate` 함수 업데이트
```typescript
const handleAnalyzeAndCreate = async () => {
  // Step 1: 컨텍스트 분석
  const formData = new FormData();
  formData.append('file', primaryFile.file);
  formData.append('documentType', isInterview ? 'resume' : 'presentation');
  formData.append('projectType', isInterview ? 'interview' : 'presentation');

  const contextResponse = await fetch('/api/context/analyze', {
    method: 'POST',
    body: formData,
  });
  const contextAnalysis = (await contextResponse.json()).data;

  // Step 2: 질문 생성 (컨텍스트 포함)
  const questionsResponse = await fetch('/api/questions/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      projectType: 'interview',
      context: contextAnalysis,  // 컨텍스트 전달
      company, position,
    }),
  });

  // Step 3: 프로젝트 생성 (Long-term Memory 저장)
  const project: Project = {
    // ... 기본 필드
    contextSummary: contextAnalysis.summary,
    contextKeywords: contextAnalysis.keywords,
    contextExperiences: contextAnalysis.experiences,
    contextStrengths: contextAnalysis.strengths,
  };
};
```

---

### 6. 전체 데이터 플로우

```
┌─────────────────────────────────────────────────────────────────────────┐
│                       프로젝트 생성 플로우                                │
│                                                                         │
│   ┌──────────────┐                                                      │
│   │  파일 업로드   │  PDF/DOCX/TXT                                       │
│   │  (브라우저)   │                                                      │
│   └──────┬───────┘                                                      │
│          │ FormData                                                     │
│          ▼                                                              │
│   ┌──────────────────────────────────────────────────────────────────┐ │
│   │  /api/context/analyze                                             │ │
│   │  ┌────────────────┐   ┌──────────────────────────────────────┐   │ │
│   │  │ extractText    │──▶│ analyzeContext (Claude Sonnet)       │   │ │
│   │  │ (pdf-parse,    │   │ → summary, keywords, experiences,    │   │ │
│   │  │  mammoth)      │   │   strengths, potentialQuestionAreas  │   │ │
│   │  └────────────────┘   └──────────────────────────────────────┘   │ │
│   └──────────────────────────────────────────────────────────────────┘ │
│          │ ContextAnalysisResult                                        │
│          ▼                                                              │
│   ┌──────────────────────────────────────────────────────────────────┐ │
│   │  /api/questions/generate                                          │ │
│   │  ┌────────────────────────────────────────────────────────────┐  │ │
│   │  │ generateQuestions (Claude Sonnet)                          │  │ │
│   │  │ 1. 카테고리별 후보 질문 22개 생성                             │  │ │
│   │  │ 2. 품질 점수(1-10) 부여                                      │  │ │
│   │  │ 3. 상위 14개 선별 (selected: true)                          │  │ │
│   │  └────────────────────────────────────────────────────────────┘  │ │
│   └──────────────────────────────────────────────────────────────────┘ │
│          │ GeneratedQuestion[]                                          │
│          ▼                                                              │
│   ┌──────────────────────────────────────────────────────────────────┐ │
│   │  Project 생성                                                     │ │
│   │  - Long-term Memory (contextSummary, contextKeywords, ...)       │ │
│   │  - Customized Questions (14개)                                   │ │
│   └──────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
```

---

### 7. 트러블슈팅

#### pdf-parse ESM 호환 이슈

**문제:**
```
Export default doesn't exist in target module 'pdf-parse'
```

**원인:**
- pdf-parse v2.x는 ESM 모듈이며 default export가 없음
- Named export `PDFParse` 클래스를 사용해야 함

**해결:**
```typescript
// 잘못된 방식 (X)
import pdf from 'pdf-parse';

// 올바른 방식 (O)
import { PDFParse } from 'pdf-parse';

const pdf = new PDFParse({ data: new Uint8Array(buffer) });
const result = await pdf.getText();
```

---

---

## 2026-02-01: MVP 1차 수정 - 8가지 핵심 기능 구현

### 📋 개요

MVP 필수 기능 8가지를 모두 구현 완료했습니다.

| 순서 | 기능 | 우선순위 | 복잡도 | 상태 |
|------|------|----------|--------|------|
| 1 | Voice Cloning UI | 🔴 최우선 | L | ✅ |
| 2 | Refinement UI | 🔴 필수 | M | ✅ |
| 3 | 오디오 파일 업로드 | 🔴 필수 | S | ✅ |
| 4 | D-Day 카운트다운 | 🔴 필수 | S | ✅ |
| 5 | Before/After 비교 UI | 🔴 필수 | M | ✅ |
| 6 | 진행 추적 (Score Tracking) | 🟡 추가 | M | ✅ |
| 7 | 콘텐츠 모더레이션 | 🟡 추가 | M | ✅ |
| 8 | Admin Metric 대시보드 | 🟡 추가 | M | ✅ |

---

### 1. Voice Cloning UI (🔴 최우선)

#### 개요
사용자가 자신의 목소리를 녹음하여 ElevenLabs에 등록하고, TTS 생성 시 복제된 목소리로 개선 버전을 들을 수 있는 기능.

#### 생성된 파일

```
src/
├── components/voice-clone/
│   ├── index.ts                    # exports
│   ├── VoiceCloneOnboarding.tsx    # 4단계 온보딩 모달 (설명→정책→녹음→완료)
│   ├── VoiceCloneRecorder.tsx      # 샘플 녹음 (20초-120초)
│   ├── VoiceCloneStatus.tsx        # 상태 표시 (처리중/완료/실패)
│   └── VoiceClonePolicy.tsx        # 데이터 보호 정책 동의
├── lib/
│   ├── api/voice-clone.ts          # API 클라이언트 (create, status, delete, poll)
│   └── stores/user-store.ts        # Zustand 스토어 (voiceCloneId, status, consent)
└── app/api/voice-clone/
    ├── route.ts                    # POST: 클론 생성, DELETE: 클론 삭제
    └── status/route.ts             # GET: 상태 조회
```

#### 주요 컴포넌트

**VoiceCloneOnboarding.tsx**
```typescript
// 4단계 온보딩 플로우
type OnboardingStep = 'intro' | 'policy' | 'recording' | 'complete';

// 각 단계:
// 1. intro: 기능 소개 ("나와 같은 목소리로 개선 버전 듣기")
// 2. policy: VoiceClonePolicy 컴포넌트로 동의 수집
// 3. recording: VoiceCloneRecorder로 20-120초 샘플 녹음
// 4. complete: 처리 중 상태 표시
```

**VoiceCloneRecorder.tsx**
```typescript
interface VoiceCloneRecorderProps {
  onComplete: (audioBlob: Blob, duration: number) => void;
  onCancel: () => void;
  minDuration?: number;  // 기본 20초
  maxDuration?: number;  // 기본 120초
}

// 녹음 가이드 텍스트 제공
const SAMPLE_TEXT = `안녕하세요, 저는 VoiceUp에서 스피치 연습을 하고 있습니다...`;
```

**API Routes**

```typescript
// POST /api/voice-clone
// ElevenLabs Instant Voice Cloning API 호출
const response = await fetch('https://api.elevenlabs.io/v1/voices/add', {
  method: 'POST',
  headers: {
    'xi-api-key': ELEVENLABS_API_KEY,
  },
  body: formData, // name, files[]
});

// 성공 시 Supabase voice_clones 테이블에 저장
await supabase.from('voice_clones').insert({
  user_id: user.id,
  elevenlabs_voice_id: voiceId,
  voice_name: voiceName,
  status: 'ready',
  sample_audio_url: audioUrl,
});
```

#### 마이페이지 연동

`app/my/page.tsx`의 설정 탭에 Voice Clone 섹션 추가:
- 등록된 음성이 없으면: "음성 등록하기" 버튼 → VoiceCloneOnboarding 모달
- 등록된 음성이 있으면: VoiceCloneStatus 표시 + 삭제/재녹음 버튼

---

### 2. Refinement UI (🔴 필수)

#### 개요
분석 완료 후 사용자가 피드백을 입력하여 개선 버전을 재생성하는 2단계 플로우.

#### 생성된 파일

```
src/
├── components/feedback/
│   ├── index.ts
│   └── RefinementPanel.tsx         # 재요청 패널 (의도 입력 → 프리뷰 → 최종)
└── lib/api/
    └── refine.ts                   # SSE 클라이언트 (refinePreview, refineFinal)
```

#### RefinementPanel 구성

```typescript
interface RefinementPanelProps {
  sessionId: string;
  originalTranscript: string;
  currentScript: string;
  analysisResult: AnalysisResult;
  refinementCount: number;        // 현재 사용 횟수
  maxRefinements: number;         // 최대 3회
  onRefinementComplete: (newScript: string, newAudioUrl: string) => void;
  onClose: () => void;
}

// 4단계 상태
type RefinementStep = 'input' | 'preview' | 'processing' | 'complete';
```

**2단계 재요청 플로우:**

```
1. Stage 1 (Preview)
   - 사용자 의도 입력 (50-200자)
   - API: /api/refine (stage=1)
   - 응답: 변경 방향 텍스트 프리뷰 (TTS 없음)

2. Stage 2 (Final)
   - 프리뷰 확인 후 "확정" 클릭
   - API: /api/refine (stage=2)
   - 응답: 최종 개선 스크립트 + TTS 오디오
```

**refine.ts API 클라이언트:**

```typescript
// SSE 스트리밍으로 진행 상황 실시간 수신
export async function refinePreview(
  params: RefineParams,
  callbacks: RefineCallbacks
): Promise<RefinePreviewResult>

export async function refineFinal(
  params: RefineParams & { refinedScript: string },
  callbacks: RefineCallbacks
): Promise<RefineFinalResult>
```

#### 연동 위치
- `app/studio/quick/page.tsx` - "다시 생성" 버튼 추가
- `app/studio/[projectId]/q/[questionId]/page.tsx` - 결과 화면에 재생성 기능

---

### 3. 오디오 파일 업로드 (🔴 필수)

#### 개요
녹음 대신 기존 오디오 파일을 업로드하여 분석하는 기능.

#### 생성된 파일

```
src/components/audio/
├── index.ts
├── AudioUpload.tsx                 # 드래그앤드롭 파일 업로드
└── BeforeAfterComparison.tsx       # (Task 5에서 추가)
```

#### AudioUpload 컴포넌트

```typescript
interface AudioUploadProps {
  onFileSelected: (file: File, audioUrl: string, duration: number) => void;
  onCancel: () => void;
  maxSizeMB?: number;      // 기본 25MB
  minDuration?: number;    // 기본 5초
  maxDuration?: number;    // 기본 300초(5분)
}

// 지원 포맷
const ACCEPTED_FORMATS = {
  'audio/webm': ['.webm'],
  'audio/mpeg': ['.mp3'],
  'audio/wav': ['.wav'],
  'audio/x-m4a': ['.m4a'],
  'audio/mp4': ['.m4a'],
};
```

**기능:**
- 드래그앤드롭 영역 + 클릭 업로드
- 파일 형식/크기/길이 검증
- 미리듣기 플레이어
- 오류 메시지 표시

#### Quick 페이지 연동

```typescript
// app/studio/quick/page.tsx
type InputMode = 'record' | 'upload';

// 탭 UI로 녹음/업로드 전환
<div className="flex gap-2 mb-6">
  <button onClick={() => setInputMode('record')}>녹음하기</button>
  <button onClick={() => setInputMode('upload')}>파일 업로드</button>
</div>

{inputMode === 'upload' && (
  <AudioUpload onFileSelected={handleFileSelected} ... />
)}
```

---

### 4. D-Day 카운트다운 (🔴 필수)

#### 개요
프로젝트 목표일(면접일/발표일) 설정 및 D-Day 카운트다운 표시.

#### 생성된 파일

```
src/components/project/
├── index.ts
├── DDayBadge.tsx                   # D-Day 배지 (긴급도별 색상)
└── PrepChecklist.tsx               # 준비 체크리스트 (D-7 이내)
```

#### DDayBadge 컴포넌트

```typescript
interface DDayBadgeProps {
  targetDate: string | null | undefined;  // YYYY-MM-DD
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

// 긴급도별 색상
// D-Day, D-1~3: bg-coral (긴급)
// D-4~7: bg-amber-500 (주의)
// D-8+: bg-teal (여유)
// D+N (지남): bg-gray-soft
```

#### PrepChecklist 컴포넌트

```typescript
interface PrepChecklistProps {
  questions: Question[];
  targetDate: string | null | undefined;
  onQuestionClick?: (questionId: string) => void;
}

// D-7 이내일 때만 표시
// 각 질문별 연습 완료 상태 체크
// 진행 바 + 완료/미완료 목록
```

#### 타입 확장

```typescript
// types/project.ts
interface Project {
  // ... 기존 필드
  targetDate?: string;  // 목표일 (YYYY-MM-DD) 추가
}
```

```typescript
// lib/supabase/types.ts
// dbProjectToProject 함수에 targetDate 매핑 추가
targetDate: dbProject.target_date || undefined,
```

#### 연동 위치
- `app/studio/new/page.tsx` - 면접/발표 예정일 입력 필드 추가
- `app/studio/[projectId]/page.tsx` - 헤더에 DDayBadge, Stats 아래 PrepChecklist

---

### 5. Before/After 비교 UI (🔴 필수)

#### 개요
원본과 개선 버전을 토글로 비교하는 UI.

#### 생성된 파일

```
src/components/audio/
└── BeforeAfterComparison.tsx       # 토글 비교 컴포넌트
```

#### BeforeAfterComparison 컴포넌트

```typescript
interface BeforeAfterComparisonProps {
  originalText: string;
  improvedText: string;
  originalAudioUrl?: string;
  improvedAudioUrl?: string;
  duration?: number;
  formatDuration?: (seconds: number) => string;
}

type ComparisonMode = 'improved' | 'original';
```

**기능:**
- 토글 스위치로 원본 ↔ 개선 버전 전환
- 커스텀 오디오 플레이어 (play/pause, progress bar, seek)
- 모드 전환 시 자동 정지
- "After-First UX" 유지 (개선 버전 기본 선택)

#### 연동 위치
- `app/studio/quick/page.tsx` - 결과 화면
- `app/studio/[projectId]/q/[questionId]/page.tsx` - 결과 화면

---

### 6. 진행 추적 - Score Tracking (🟡 추가)

#### 개요
연습 기록의 점수 변화를 시각화하고 성장 인사이트 제공.

#### 생성된 파일

```
src/components/analytics/
├── index.ts
├── ScoreChart.tsx                  # SVG 라인 차트
└── GrowthSummary.tsx               # 성장 통계 요약
```

#### ScoreChart 컴포넌트

```typescript
interface ScoreChartProps {
  attempts: Attempt[];
  height?: number;
  showGrid?: boolean;
  color?: 'teal' | 'coral';
}

// 2개 이상 시도가 있을 때만 표시
// SVG path로 라인 + 영역 그래프 렌더링
// 첫 점수 vs 마지막 점수 비교 배지 (+N점 상승/하락)
```

#### GrowthSummary 컴포넌트

```typescript
interface GrowthSummaryProps {
  project: Project;
}

// 통계 항목:
// - 처음 5회 vs 최근 5회 평균 점수 비교
// - 총 연습 횟수, 평균 점수, 최고 점수, 총 연습 시간
// - 질문 연습 진행률 (N/M)
// - 가장 성장한 질문
// - 가장 많이 연습한 질문
// - 연습한 날 수
```

#### 연동 위치
- `app/my/projects/[projectId]/page.tsx` - 기존 Stats 대신 GrowthSummary + ScoreChart

---

### 7. 콘텐츠 모더레이션 (🟡 추가)

#### 개요
부적절한 콘텐츠 탐지 및 민감 정보 자동 마스킹.

#### 생성된 파일

```
src/lib/ai/nodes/
└── moderation.ts                   # 모더레이션 모듈
```

#### 탐지 카테고리

| 카테고리 | 설명 | 심각도 |
|----------|------|--------|
| `profanity` | 비속어 | medium |
| `discrimination` | 차별적 표현 | high |
| `violence` | 폭력적 표현 | high |
| `sensitive_personal` | 민감한 개인정보 | medium~high |
| `threat` | 위협 | high |
| `hate_speech` | 혐오 발언 | high |

#### 민감 정보 자동 마스킹

```typescript
const SENSITIVE_INFO_PATTERNS = {
  phoneNumber: /01[0-9]-?\d{3,4}-?\d{4}/g,        // → ***-****-****
  residentNumber: /\d{6}-?[1-4]\d{6}/g,           // → ******-*******
  email: /[a-zA-Z0-9._%+-]+@...+/g,               // → abc***@domain.com
  creditCard: /\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}/g,  // → ****-****-****-****
};
```

#### Analysis 노드 연동

```typescript
// lib/ai/nodes/analysis.ts
export async function analyzeContent(...) {
  // 0. 콘텐츠 모더레이션
  const moderationResult = moderateContent(transcript);

  // 처리 불가능한 콘텐츠인 경우 에러
  if (!isContentProcessable(moderationResult)) {
    throw new Error('부적절한 콘텐츠가 감지되었습니다...');
  }

  // 마스킹된 텍스트로 분석 진행
  const processedTranscript = moderationResult.maskedText;

  // ... 분석 로직

  // 모더레이션 정보 결과에 포함
  if (moderationResult.flags.length > 0) {
    analysisResult.moderation = {
      isFlagged: moderationResult.isFlagged,
      warningMessage: getModerationWarningMessage(moderationResult),
      flagTypes: moderationResult.flags.map(f => f.type),
    };
  }
}
```

#### 타입 확장

```typescript
// types/api.ts
interface ModerationInfo {
  isFlagged: boolean;
  warningMessage: string | null;
  flagTypes: string[];
}

interface AnalysisResult {
  // ... 기존 필드
  moderation?: ModerationInfo | null;
}
```

---

### 8. Admin Metrics 대시보드 (🟡 추가)

#### 개요
관리자용 서비스 현황 대시보드.

#### 생성된 파일

```
src/
├── app/
│   ├── admin/
│   │   ├── page.tsx                # 대시보드 메인
│   │   └── users/page.tsx          # 사용자 목록
│   └── api/admin/
│       ├── metrics/route.ts        # GET: 전체 메트릭
│       └── users/route.ts          # GET: 사용자 목록
└── lib/supabase/
    └── admin.ts                    # 관리자 쿼리 함수
```

#### 대시보드 메트릭

```typescript
interface AdminMetrics {
  totalUsers: number;
  activeUsers: {
    daily: number;    // DAU
    weekly: number;   // WAU
    monthly: number;  // MAU
  };
  totalProjects: number;
  totalAttempts: number;
  avgAttemptsPerUser: number;
  scoreDistribution: { range: string; count: number; }[];
  topQuestionCategories: { category: string; count: number; }[];
  recentActivity: { date: string; attempts: number; uniqueUsers: number; }[];
}
```

#### 대시보드 UI 구성

1. **Key Metrics Cards** (4열)
   - 총 사용자
   - 월간 활성 사용자 (MAU)
   - 총 연습 횟수
   - 평균 연습/사용자

2. **활성 사용자 카드**
   - DAU, WAU, MAU
   - DAU/MAU 비율

3. **점수 분포 차트**
   - 90-100, 80-89, 70-79, 60-69, 0-59 구간별 비율

4. **최근 7일 활동 바 차트**
   - 일별 연습 횟수 + 고유 사용자 수

5. **인기 질문 카테고리**
   - 상위 5개 카테고리

#### 사용자 관리 페이지

```typescript
interface UserSummary {
  id: string;
  email: string;
  displayName: string | null;
  createdAt: string;
  projectCount: number;
  attemptCount: number;
  avgScore: number | null;
  lastActivityAt: string | null;
}
```

- 테이블 형태로 사용자 목록 표시
- 프로젝트 수, 연습 횟수, 평균 점수, 마지막 활동, 가입일
- 페이지네이션 지원

#### 권한 체크

```typescript
// 관리자 이메일 목록
const ADMIN_EMAILS = [
  process.env.ADMIN_EMAIL,
  'admin@voiceup.ai',
].filter(Boolean);

// API 라우트에서 권한 확인
if (!user.email || !ADMIN_EMAILS.includes(user.email)) {
  return NextResponse.json({ error: '관리자 권한이 필요합니다.' }, { status: 403 });
}
```

---

### 생성된 파일 요약

```
src/
├── app/
│   ├── admin/
│   │   ├── page.tsx                    # Admin 대시보드
│   │   └── users/page.tsx              # Admin 사용자 관리
│   └── api/
│       ├── admin/
│       │   ├── metrics/route.ts        # Admin 메트릭 API
│       │   └── users/route.ts          # Admin 사용자 API
│       └── voice-clone/
│           ├── route.ts                # Voice Clone 생성/삭제
│           └── status/route.ts         # Voice Clone 상태 조회
├── components/
│   ├── analytics/
│   │   ├── index.ts
│   │   ├── ScoreChart.tsx              # 점수 차트
│   │   └── GrowthSummary.tsx           # 성장 요약
│   ├── audio/
│   │   ├── index.ts
│   │   ├── AudioUpload.tsx             # 파일 업로드
│   │   └── BeforeAfterComparison.tsx   # 비교 UI
│   ├── feedback/
│   │   ├── index.ts
│   │   └── RefinementPanel.tsx         # 재요청 패널
│   ├── project/
│   │   ├── index.ts
│   │   ├── DDayBadge.tsx               # D-Day 배지
│   │   └── PrepChecklist.tsx           # 준비 체크리스트
│   └── voice-clone/
│       ├── index.ts
│       ├── VoiceCloneOnboarding.tsx    # 온보딩 모달
│       ├── VoiceCloneRecorder.tsx      # 샘플 녹음
│       ├── VoiceCloneStatus.tsx        # 상태 표시
│       └── VoiceClonePolicy.tsx        # 정책 동의
├── lib/
│   ├── ai/nodes/
│   │   └── moderation.ts               # 콘텐츠 모더레이션
│   ├── api/
│   │   ├── refine.ts                   # Refinement API 클라이언트
│   │   └── voice-clone.ts              # Voice Clone API 클라이언트
│   ├── stores/
│   │   └── user-store.ts               # Voice Clone 상태 스토어
│   └── supabase/
│       └── admin.ts                    # Admin 쿼리 함수
└── types/
    ├── api.ts                          # ModerationInfo 추가
    └── project.ts                      # targetDate 필드 추가
```

---

### 수정된 기존 파일

| 파일 | 변경 내용 |
|------|-----------|
| `app/studio/new/page.tsx` | 목표일 입력, target_date 저장 |
| `app/studio/quick/page.tsx` | 업로드 탭, RefinementPanel, BeforeAfterComparison |
| `app/studio/[projectId]/page.tsx` | DDayBadge, PrepChecklist |
| `app/studio/[projectId]/q/[questionId]/page.tsx` | BeforeAfterComparison |
| `app/my/page.tsx` | Voice Clone 섹션 추가 |
| `app/my/projects/[projectId]/page.tsx` | ScoreChart, GrowthSummary |
| `lib/ai/nodes/analysis.ts` | 모더레이션 통합 |
| `lib/supabase/types.ts` | dbProjectToProject에 targetDate 매핑 |
| `types/project.ts` | targetDate 필드 추가 |
| `types/api.ts` | ModerationInfo 인터페이스 추가 |

---

*Last updated: 2026-02-01*
