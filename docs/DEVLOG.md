# VoiceUp 개발 로그 (DEVLOG)

이 문서는 VoiceUp 서비스의 개발 관련 변경 사항, 아키텍처 결정, 기술적 이슈 해결 등을 기록합니다.

---

## 2026-02-01: Voice Cloning 동의 시스템 구현

### 배경
Voice Cloning 기능의 법적 안전성과 사용자 동의 확보를 위한 시스템 구현.

### 핵심 설계: Read-to-Consent 패턴

사용자가 동의 내용이 포함된 스크립트를 직접 읽어 녹음함으로써:
1. **행동 기반 동의**: 단순 클릭이 아닌 능동적 참여
2. **법적 증거 확보**: 녹음된 음성 자체가 동의의 증거
3. **자연스러운 샘플**: 30초-2분 분량의 자연스러운 음성 확보

### 구현 파일

```
frontend/src/
├── lib/constants/
│   └── voice-clone-consent.ts    # 동의 텍스트, 버전 관리
├── components/voice-clone/
│   ├── VoiceClonePolicy.tsx      # 정책 안내 UI
│   ├── VoiceCloneRecorder.tsx    # 녹음 + 동의 데이터 생성
│   ├── VoiceCloneStatus.tsx      # 상태 표시
│   └── VoiceCloneOnboarding.tsx  # 온보딩 모달
└── app/api/voice-clone/
    ├── route.ts                  # POST: 클론 생성, DELETE: 삭제
    └── status/route.ts           # GET: 상태 조회
```

### 동의 스크립트 설계

`CONSENT_SAMPLE_TEXT`에 다음 문구 포함:
> "저는 이 음성 샘플이 오직 저 자신의 발화 연습을 위해서만 사용될 것임을 이해합니다. 제 목소리는 다른 사람을 사칭하거나 부적절한 콘텐츠를 만드는 데 절대 사용되지 않을 것입니다."

### DB 저장 구조

1. **voice_clones**: 클론 상태 및 ElevenLabs voice_id
2. **voice_clone_consents**: 법적 증거용 동의 기록 (IP, User-Agent, 녹음 시간 등)
3. **users.voice_clone_consent**: 동의 여부 플래그

### 정책 버전 관리

```typescript
export const CONSENT_VERSION = 'v1.0';
```
정책 변경 시 버전을 증가시키고, 기존 동의 기록은 보존.

---

## 2026-02-01: 우선순위 랭킹 시스템 구현

### 배경
동료 개발자가 Python/LangChain으로 구현한 우선순위 랭킹 시스템을 TypeScript로 리팩토링하여 프론트엔드에 통합.

### 구현 내용

#### 1. Category Analyzer (`lib/ai/tools/category-analyzer.ts`)

4가지 카테고리별 스피치 분석 도구:

```typescript
// 전달력 분석
analyzeDelivery(transcript: string, durationSeconds: number): DeliveryResult

// 구조력 분석
analyzeStructure(transcript: string): StructureResult

// 내용력 분석
analyzeContent(transcript: string): ContentResult

// 설득력 분석
analyzePersuasion(transcript: string): PersuasionResult

// 통합 분석
analyzeAllCategories(transcript: string, durationSeconds: number): AllCategoryResults
```

**측정 항목:**
- 전달력: WPM, 필러워드 비율, 문장 완결성
- 구조력: STAR 구조, 두괄식, 연결어
- 내용력: 숫자/성과, 사례, 전문성
- 설득력: 자신감, 겸양, 강조

#### 2. Priority Tools (`lib/ai/tools/priority-tools.ts`)

상황별 우선순위 조정 시스템:

```typescript
// 상황 분류
classifySituation(
  transcript: string,
  question?: string,
  projectType?: 'interview' | 'presentation' | 'free_speech'
): SituationContext

// 가중치 계산
getPriorityWeights(situation: SituationContext): CategoryWeight[]

// 가중치 적용 점수
calculateWeightedScores(
  categoryResults: AllCategoryResults,
  weights: CategoryWeight[]
): WeightedCategoryScore[]

// 통합 우선순위 분석
analyzePriority(
  transcript: string,
  categoryResults: AllCategoryResults,
  options?: { question?: string; projectType?: string }
): PriorityRankingResult
```

**상황 유형:**
- `interview_technical`: 기술 면접
- `interview_behavioral`: 인성 면접
- `interview_general`: 일반 면접
- `presentation_pitch`: 피치/발표
- `presentation_report`: 보고/브리핑
- `free_speech`: 자유 스피치

### 파일 구조

```
frontend/src/lib/ai/
├── tools/
│   ├── category-analyzer.ts    # NEW: 4가지 카테고리 분석
│   ├── priority-tools.ts       # NEW: 우선순위 랭킹 시스템
│   ├── index.ts                # UPDATED: 새 도구 export
│   ├── pace-analysis.ts
│   ├── filler-analysis.ts
│   └── structure-analysis.ts
├── state.ts                    # UPDATED: PriorityRankingResult 타입 추가
└── ...
```

### 기술적 결정

1. **Pure TypeScript 구현**: 외부 라이브러리 없이 정규식 기반 분석
2. **키워드 기반 상황 분류**: ML 모델 없이 빠른 분류 가능
3. **가중치 매트릭스**: 하드코딩된 가중치로 시작, 추후 학습 기반 조정 가능

### 향후 작업

- [ ] 분석 노드에 우선순위 시스템 통합
- [ ] UI에서 상황별 피드백 우선순위 표시
- [ ] 사용자 피드백 기반 가중치 튜닝

---

## 2026-02-01: AI 환각 (Hallucination) 방지

### 문제
AI가 개선안을 생성할 때 원본에 없는 정보(학교, 전공, 경험 등)를 임의로 추가.

### 해결

1. **IMPROVEMENT_SYSTEM_PROMPT 강화** (`lib/ai/prompts.ts:51-74`)
   - 절대 금지 사항 명시
   - 내용 부족 시 에러 JSON 반환 지시

2. **내용 검증 로직** (`lib/ai/nodes/improvement.ts:31-57`)
   - 5단어 미만 즉시 거부
   - AI 응답에서 `INSUFFICIENT_CONTENT` 에러 감지

3. **프롬프트 빌더 경고** (`lib/ai/prompts.ts:315`)
   - 매 요청 시작 시 경고 문구 삽입

### 관련 문서
- `docs/product/PRODUCT.md` - Case 001: AI 환각 상세 기록

---

## 2026-02-01: WebM 오디오 duration 메타데이터 수정

### 문제
MediaRecorder로 녹음한 WebM 파일의 duration이 파일 헤더가 아닌 끝에 기록되어, 오디오 플레이어의 진행률 표시가 잘못됨.

### 해결

```typescript
// lib/stores/recording-store.ts
import fixWebmDuration from 'fix-webm-duration';

stopRecording: async (blob, duration) => {
  const durationMs = duration * 1000;
  let fixedBlob = blob;

  if (blob.type.includes('webm')) {
    fixedBlob = await fixWebmDuration(blob, durationMs);
  }

  const url = URL.createObjectURL(fixedBlob);
  set({ audioBlob: fixedBlob, audioUrl: url });
}
```

### 의존성
```bash
npm install fix-webm-duration
```

---

## 2026-02-01: Supabase Storage 버킷 공개 설정

### 문제
TTS 생성된 오디오가 재생되지 않음 - 'audio' 버킷이 비공개 설정.

### 해결
Supabase API로 버킷을 공개로 변경:

```bash
curl -X PUT 'https://[project].supabase.co/storage/v1/bucket/audio' \
  -H 'Authorization: Bearer [service_role_key]' \
  -H 'Content-Type: application/json' \
  -d '{"public": true}'
```

### 보안 고려사항
- 오디오 파일은 세션 ID 기반 난수 경로에 저장
- 별도의 private 버킷에 원본 저장 (향후)

---

## 2026-02-01: LangGraph 노드명 충돌 해결

### 문제
`error`라는 이름이 상태 속성과 노드 이름으로 동시에 사용되어 충돌.

### 해결

```typescript
// lib/ai/workflows/speech-coach.ts

// Before
.addNode('error', errorNode)

// After
.addNode('handleError', errorNode)

// Routing functions도 수정
function routeAfterStt(state: SpeechCoachState): 'handleError' | 'analysis' {
  return state.error ? 'handleError' : 'analysis';
}
```

---

## 코드 스타일 가이드

### TypeScript
- 인터페이스는 PascalCase
- 함수는 camelCase
- 상수는 UPPER_SNAKE_CASE
- 타입 export는 `export type { ... }`

### 파일 구조
```
lib/ai/
├── tools/       # 개별 분석 도구 (순수 함수)
├── nodes/       # LangGraph 노드 (상태 변환)
├── workflows/   # LangGraph 워크플로우
├── prompts.ts   # AI 프롬프트 정의
└── state.ts     # 상태 타입 정의
```

### 주석
- 파일 상단에 Python 원본 경로 명시
- 공개 함수에 JSDoc 주석
- 복잡한 로직에 인라인 주석

---

## 참고 자료

- [LangGraph.js 문서](https://langchain-ai.github.io/langgraphjs/)
- [Anthropic Claude API](https://docs.anthropic.com/)
- [ElevenLabs Voice Cloning](https://elevenlabs.io/docs)
- [OpenAI Whisper API](https://platform.openai.com/docs/guides/speech-to-text)
