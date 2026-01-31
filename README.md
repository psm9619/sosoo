<h1 align="center">🎤 VoiceUp</h1>

<p align="center">
  <strong>AI가 분석하고, 나의 목소리로 들려주는 스피치 코치</strong>
</p>

<p align="center">
  <a href="#-핵심-가치">핵심 가치</a> •
  <a href="#-주요-기능">주요 기능</a> •
  <a href="#-기술-스택">기술 스택</a> •
  <a href="#-ai-파이프라인">AI 파이프라인</a> •
  <a href="#-시작하기">시작하기</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-15-black?logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-5.0-3178C6?logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/LangGraph-JS-FF6B6B" alt="LangGraph" />
  <img src="https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?logo=supabase" alt="Supabase" />
</p>

---

## 🎯 문제 인식

> **"면접/발표 준비, 왜 항상 혼자서 막막한가요?"**

| 기존 방식 | 문제점 |
|----------|--------|
| 거울 보며 혼자 연습 | 객관적 피드백 없음 |
| 전문 코칭 | 회당 10-30만원 비용 부담 |
| 영상 촬영 후 셀프 리뷰 | 민망함, 분석 어려움 |
| 친구에게 피드백 요청 | 전문성 부족, 솔직한 피드백 어려움 |

**결과**: 개선 방향을 몰라서 **같은 실수를 반복**

---

## 💡 핵심 가치

### 왜 "내 목소리"여야 할까요?

```
다른 사람 목소리로 들으면 → "저 사람은 잘하네" (관찰)
내 목소리로 들으면       → "내가 이렇게 말할 수 있구나" (체화)
```

VoiceUp은 개선된 스크립트를 **사용자 본인의 목소리**로 들려줍니다.
남의 목소리가 아닌 내 목소리이기 때문에, 듣고 따라하면서 **근육 기억**으로 체화됩니다.

---

## ✨ 주요 기능

### 1. AI 스피치 분석
녹음된 음성을 **4대 카테고리**로 정밀 분석:

| 카테고리 | 분석 항목 |
|---------|----------|
| **전달력** | 말 속도(WPM), 필러워드("음", "어", "그"), 명확성 |
| **구조력** | 논리적 흐름, STAR 프레임워크, 두괄식 여부 |
| **내용력** | 구체성, 숫자/성과 포함, 사례 제시 |
| **설득력** | 자신감, 톤, 감정 전달 |

### 2. Voice Cloning (핵심 차별점)
ElevenLabs Instant Voice Cloning으로 **30초 샘플만으로 목소리 복제**

#### Read-to-Consent 동의 수집 패턴
```
일반적인 동의 수집: "동의합니다" 체크박스 클릭
VoiceUp 동의 수집:  동의 문구를 직접 읽어서 녹음
```

사용자가 읽는 동의 문구:
> *"저는 이 음성 샘플이 오직 저 자신의 발화 연습을 위해서만 사용될 것임을 이해합니다..."*

**장점:**
- ✅ **행동 기반 동의** - 클릭이 아닌 능동적 참여
- ✅ **법적 증거** - 녹음 자체가 동의의 증거
- ✅ **자연스러운 샘플** - 30초 분량의 학습 데이터 자동 확보

### 3. 컨텍스트 기반 맞춤 질문
이력서/발표자료를 업로드하면 **AI가 맞춤 면접 질문 생성**

```
일반 질문: "자기소개 해주세요"
맞춤 질문: "00 프로젝트에서 겪은 기술적 어려움과 해결 방법은?"
```

### 4. Progressive Context (메모리 시스템)
| 메모리 유형 | 설명 |
|------------|------|
| **Long-term** | 업로드된 문서 컨텍스트 (이력서, 발표자료) |
| **Short-term** | 최근 3개 시도의 패턴 분석 |

→ 반복되는 실수 패턴을 추적하여 **개인화된 피드백** 제공

### 5. 콘텐츠 모더레이션
| 탐지 항목 | 처리 방식 |
|----------|----------|
| 비속어 | 마스킹 + 경고 |
| 차별적 표현 | 마스킹 + 경고 |
| 위협 콘텐츠 | 분석 차단 |
| 민감 정보 (전화번호, 주민번호 등) | 자동 마스킹 |

---

## 🏗 기술 스택

### Architecture
```
┌─────────────────────────────────────────────────────┐
│                     Vercel                          │
│  ┌──────────────────┐    ┌───────────────────────┐  │
│  │   Next.js 15     │    │    API Routes         │  │
│  │   + React 19     │◄──►│    (LangGraph JS)     │  │
│  │   + TypeScript   │    │                       │  │
│  └──────────────────┘    └───────────────────────┘  │
└─────────────────────────────────────────────────────┘
                           │
           ┌───────────────┼───────────────┐
           ▼               ▼               ▼
      ┌─────────┐    ┌──────────┐    ┌──────────┐
      │ Claude  │    │ Whisper  │    │ElevenLabs│
      │(분석/개선)│    │  (STT)   │    │(TTS/Clone)│
      └─────────┘    └──────────┘    └──────────┘
```

### Stack
| Layer | Technology |
|-------|------------|
| **Frontend** | Next.js 15 (App Router), React 19, TypeScript |
| **Styling** | Tailwind CSS v4, shadcn/ui |
| **State** | Zustand (client), TanStack Query (server) |
| **AI Orchestration** | LangGraph JS |
| **Database** | Supabase (PostgreSQL + Storage + Auth) |
| **AI APIs** | OpenAI Whisper, Anthropic Claude, ElevenLabs |
| **Deployment** | Vercel |

---

## 🤖 AI 파이프라인

### Main Flow (LangGraph)
```
Audio → STT → Analysis → Improvement → TTS
         │        │           │          │
      Whisper  Claude     Claude    ElevenLabs
               + Tools              (Clone Voice)
```

### 분석 도구 (Tools)
| 도구 | 기능 |
|------|------|
| `pace-analysis.ts` | WPM 계산 (목표: 120-170 WPM) |
| `filler-analysis.ts` | 한국어 필러워드 탐지 ("음", "어", "그", "약간") |
| `structure-analysis.ts` | STAR 프레임워크 분석 |
| `category-analyzer.ts` | 4대 카테고리 종합 분석 |
| `priority-tools.ts` | 상황별 가중치 동적 조정 |

### 상황별 우선순위 시스템
| 상황 | 우선 카테고리 |
|------|-------------|
| 기술 면접 | 내용력 > 구조력 |
| 인성 면접 | 설득력 > 전달력 |
| 피치/발표 | 설득력 > 전달력 |
| 자유 스피치 | 균등 가중치 |

---

## 📁 프로젝트 구조

```
frontend/src/
├── app/
│   ├── api/                    # AI API Routes
│   │   ├── analyze/            # 스피치 분석 (SSE)
│   │   ├── refine/             # 재요청 (SSE)
│   │   ├── context/            # 문서 분석
│   │   ├── questions/          # 질문 생성
│   │   ├── memory/             # Progressive Context
│   │   └── voice-clone/        # Voice Cloning
│   ├── studio/                 # 연습 스튜디오
│   ├── my/                     # 마이페이지
│   └── admin/                  # 관리자 대시보드
├── lib/
│   ├── ai/
│   │   ├── nodes/              # LangGraph 노드 (STT, Analysis, TTS...)
│   │   ├── tools/              # 분석 도구
│   │   ├── workflows/          # LangGraph 워크플로우
│   │   └── prompts.ts          # AI 프롬프트
│   ├── stores/                 # Zustand 스토어
│   └── supabase/               # DB 클라이언트
└── components/                 # React 컴포넌트
```

---

## 🚀 시작하기

### 요구사항
- Node.js 18+
- pnpm / npm / yarn

### 환경 변수
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# AI APIs
OPENAI_API_KEY=          # Whisper STT
ANTHROPIC_API_KEY=       # Claude Analysis
ELEVENLABS_API_KEY=      # TTS + Voice Clone
```

### 실행
```bash
cd frontend
npm install
npm run dev
```

---

## 📊 데이터 모델

```
Project → Questions[] → Attempts[]
```

| 테이블 | 설명 |
|--------|------|
| `projects` | 면접/발표/자유스피치 프로젝트 |
| `questions` | 프로젝트별 질문 (AI 생성 가능) |
| `attempts` | 질문별 연습 시도 (점수, 오디오, 분석 결과) |
| `voice_clones` | Voice Clone 상태 |
| `voice_clone_consents` | 동의 기록 (법적 증거) |

---

## 🔒 보안 & 프라이버시

- **Read-to-Consent**: 동의 문구를 직접 읽어 녹음 (법적 증거 확보)
- **동의 기록 저장**: IP, User-Agent, 녹음 시간, 동의 버전 기록
- **민감 정보 마스킹**: 전화번호, 주민번호, 이메일, 카드번호 자동 마스킹
- **서비스 내 재생만**: 클론 음성 다운로드 불가

---

## 📈 심사 기준 대응

| 기준 | VoiceUp |
|------|---------|
| **문제의 구체성** | 혼자 연습의 피드백 부재 + 체화 어려움 |
| **AI 사용의 필연성** | Voice Cloning으로만 가능한 "내 목소리 체화" |
| **실제 생산성 & 성장** | 즉각적 피드백 + 반복 학습으로 근육 기억 형성 |
| **구현의 완성도** | MVP 완성, Vercel 배포, 법적 리스크까지 해결 |

---

## 📝 License

MIT

---

<p align="center">
  <strong>🎤 AI로 혼자서도 프로처럼 연습하세요</strong>
</p>
