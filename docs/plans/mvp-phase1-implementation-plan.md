# Sosoo MVP 1차 수정 구현 계획

> **최종 수정**: 2026-02-01
> **목표**: MVP 필수 기능 완성 및 핵심 차별점 구현

---

## 1차 수정 목표 (사용자 확정)

### 필수 구현 항목
| 순서 | 기능 | 우선순위 | 복잡도 |
|------|------|----------|--------|
| **1** | Voice Cloning UI | 🔴 최우선 | L |
| 2 | Refinement UI | 🔴 필수 | M |
| 3 | 오디오 파일 업로드 | 🔴 필수 | S |
| 4 | D-Day 카운트다운 | 🔴 필수 | S |
| 5 | Before/After 비교 UI | 🔴 필수 | M |
| 6 | 진행 추적 (Score Tracking) | 🟡 추가 | M |
| 7 | 콘텐츠 모더레이션 | 🟡 추가 | M |
| 8 | Admin Metric 유저 트래킹 | 🟡 추가 | M |

---

## 현재 구현 상태 상세

### AI Pipeline (~95% 완료)

#### Nodes (lib/ai/nodes/)
| 파일 | 상태 | 기능 |
|------|------|------|
| `stt.ts` | ✅ 완료 | OpenAI Whisper STT, 포맷 감지, 5-300초 검증 |
| `analysis.ts` | ✅ 완료 | Claude 분석, 4대 카테고리, Priority Ranking |
| `improvement.ts` | ✅ 완료 | 스크립트 개선 + Self-Reflection QA |
| `tts.ts` | ✅ 완료 | ElevenLabs TTS, 클론 폴백, Supabase 업로드 |
| `context.ts` | ✅ 완료 | PDF/DOCX/TXT 문서 분석 |
| `questions.ts` | ✅ 완료 | 면접/발표 질문 생성, 품질 스코어링 |
| `progressive-context.ts` | ✅ 완료 | Long-term + Short-term 메모리 |

#### Tools (lib/ai/tools/)
| 파일 | 상태 | 기능 |
|------|------|------|
| `pace-analysis.ts` | ✅ 완료 | WPM 계산 (120-170 목표) |
| `filler-analysis.ts` | ✅ 완료 | 한국어 필러워드 탐지 |
| `structure-analysis.ts` | ✅ 완료 | STAR 프레임워크 분석 |
| `category-analyzer.ts` | ✅ 완료 | 전달력/구조력/내용력/설득력 분석 |
| `priority-tools.ts` | ✅ 완료 | 상황별 가중치 조정 (10개 상황 유형) |

#### Workflows (lib/ai/workflows/)
| 파일 | 상태 | 기능 |
|------|------|------|
| `speech-coach.ts` | ✅ 완료 | 메인 파이프라인 (STT→분석→개선→TTS) |
| `refinement.ts` | ✅ 완료 | 2단계 재요청 (프리뷰→최종) |

#### API Routes (app/api/)
| 라우트 | 상태 | 기능 |
|--------|------|------|
| `/api/analyze` | ✅ 완료 | SSE 스트리밍, Progressive Context 자동 로딩 |
| `/api/refine` | ✅ 완료 | SSE 스트리밍, 2단계 재요청 |
| `/api/context/analyze` | ✅ 완료 | 문서 업로드 + 분석 |
| `/api/questions/generate` | ✅ 완료 | 질문 생성 |
| `/api/memory/build` | ✅ 완료 | Progressive Context 조립 |

### UI/UX (~75% 완료)

#### 완료된 페이지
| 경로 | 상태 | 기능 |
|------|------|------|
| `/` | ✅ 완료 | 랜딩 (Hero, HowItWorks, Sample, CTA) |
| `/login` | ✅ 완료 | Google OAuth, Email 로그인/가입 |
| `/studio` | ✅ 완료 | 스튜디오 허브 |
| `/studio/quick` | ✅ 완료 | 빠른 연습 (기본 질문) |
| `/studio/new` | ✅ 완료 | 프로젝트 생성 (면접/발표) |
| `/studio/[projectId]` | ✅ 완료 | 프로젝트 상세 (질문 목록) |
| `/studio/[projectId]/q/[questionId]` | ✅ 완료 | 녹음 및 분석 결과 |
| `/my` | ✅ 완료 | 마이페이지 (프로젝트, 설정 탭) |
| `/my/projects/[projectId]` | ✅ 완료 | 연습 기록 히스토리 |

#### 완료된 컴포넌트
- `Header`, `Footer`, `GuestBanner`
- `Button`, `Card`, `Progress`
- `HeroSection`, `HowItWorks`, `SamplePreview`, `CTASection`
- `VoiceWave` (녹음 시각화)

#### Stores (lib/stores/)
| 파일 | 상태 | 기능 |
|------|------|------|
| `project-store.ts` | ✅ 완료 | 프로젝트/질문/시도 CRUD, localStorage 영속화 |
| `recording-store.ts` | ✅ 완료 | 녹음 상태 관리, WebM duration 수정 |
| `session-store.ts` | ✅ 완료 | 세션 상태 |

#### Supabase (lib/supabase/)
| 파일 | 상태 | 기능 |
|------|------|------|
| `client.ts` | ✅ 완료 | 브라우저 클라이언트 |
| `server.ts` | ✅ 완료 | 서버 클라이언트 |
| `projects.ts` | ✅ 완료 | 프로젝트 CRUD |
| `attempts.ts` | ✅ 완료 | 시도 CRUD |
| `types.ts` | ✅ 완료 | DB ↔ 앱 타입 매핑 |

---

## 기능별 상세 구현 계획

### 1. Voice Cloning UI (🔴 최우선)

#### PRD 요구사항 (FR30-35)
- 온보딩 샘플 녹음 (30초-1분)
- Content Policy & AI Defence 공지
- 스킵 옵션 (프로필에서 나중에 등록)
- 신원 확인 후 클로닝
- 서비스 내 재생만 (다운로드 금지)

#### 현재 상태
- **백엔드 타입 존재**: `VoiceCloneRequest`, `VoiceCloneResponse`, `VoiceCloneStatus`
- **TTS 노드 지원**: `tts.ts`에서 voiceCloneId 사용 가능
- **DB 필드**: `voice_clone_consent`, `voice_clone_id` 필드 정의됨
- **프론트엔드**: 없음

#### 구현 파일
```
src/
├── app/
│   ├── api/
│   │   └── voice-clone/
│   │       ├── route.ts              # ElevenLabs 음성 클론 생성
│   │       └── status/route.ts       # 클론 상태 조회
│   └── my/
│       └── page.tsx                  # 설정 탭에 음성 클론 섹션 추가
├── components/
│   └── voice-clone/
│       ├── VoiceCloneOnboarding.tsx  # 첫 로그인 온보딩 모달
│       ├── VoiceCloneRecorder.tsx    # 샘플 녹음 컴포넌트
│       ├── VoiceCloneStatus.tsx      # 상태 표시 (처리중/완료/실패)
│       └── VoiceClonePolicy.tsx      # 정책 동의 UI
├── lib/
│   ├── api/
│   │   └── voice-clone.ts            # 음성 클론 API 클라이언트
│   └── stores/
│       └── user-store.ts             # 사용자 설정 + 음성 클론 상태
└── types/
    └── api.ts                        # 기존 타입 활용
```

#### UI 플로우
```
1. 첫 로그인 감지
   ↓
2. VoiceCloneOnboarding 모달 표시
   - 기능 설명 (나의 목소리로 개선본 듣기)
   - Content Policy & AI Defence 공지
   - [시작하기] / [나중에 하기] 버튼
   ↓
3. VoiceCloneRecorder
   - 샘플 텍스트 표시 (30초-1분 분량)
   - 녹음 버튼 + 타이머
   - 녹음 완료 시 미리듣기
   - [제출] / [다시 녹음] 버튼
   ↓
4. VoiceCloneStatus
   - 처리 중: 예상 시간 표시
   - 완료: "사용 가능" 배지
   - 실패: 재시도 옵션
   ↓
5. 마이페이지 설정
   - 음성 클론 섹션
   - 상태 표시
   - [삭제] / [다시 녹음] 버튼
```

#### ElevenLabs API 연동
```typescript
// POST /api/voice-clone
// 1. 오디오 샘플을 ElevenLabs에 전송
// 2. voice_id 반환
// 3. Supabase에 저장 (user.voice_clone_id)

// GET /api/voice-clone/status
// ElevenLabs 클론 상태 조회
```

#### 기존 코드 참조
- `useAudioRecorder` 훅 재사용 (샘플 녹음)
- `lib/api/analyze.ts` SSE 패턴 참조
- `tts.ts`의 `voiceCloneId` 처리 로직 확인

---

### 2. Refinement UI

#### PRD 요구사항 (FR17-24)
- 사용자 의도 입력 (50-100자)
- 3단계 제한 (비용 통제)
- Stage 1: 방향 프리뷰 (TTS 없음)
- Stage 2: 최종 생성 (TTS 포함)

#### 현재 상태
- **API 완료**: `/api/refine` SSE 스트리밍
- **워크플로우 완료**: `refinement.ts`
- **타입 존재**: `RefineRequest`, `RefinePreviewResponse`, `RefineFinalResponse`
- **프론트엔드**: 없음

#### 구현 파일
```
src/
├── components/
│   └── feedback/
│       └── RefinementPanel.tsx       # 재요청 UI 패널
├── lib/
│   └── api/
│       └── refine.ts                 # SSE 클라이언트
├── app/
│   └── studio/
│       ├── [projectId]/q/[questionId]/page.tsx  # 수정
│       └── quick/page.tsx                        # 수정
```

#### UI 플로우
```
1. 분석 결과 화면
   ↓
2. "다시 생성" 버튼 클릭
   ↓
3. RefinementPanel 확장
   - 의도 입력 (50-100자)
   - 남은 횟수 표시 (3회 중 N회 남음)
   - [방향 확인] 버튼
   ↓
4. 프리뷰 표시 (Stage 1)
   - 변경 방향 요약
   - [확정] / [수정] 버튼
   ↓
5. 최종 생성 (Stage 2)
   - TTS 포함 결과
   - 기존 결과와 교체
```

---

### 3. 오디오 파일 업로드

#### PRD 요구사항 (FR54-55)
- 녹음 외 파일 업로드 지원
- 동일한 분석 플로우 적용

#### 구현 파일
```
src/
├── components/
│   └── audio/
│       └── AudioUpload.tsx           # 드래그앤드롭 업로드
├── app/
│   └── studio/
│       ├── [projectId]/q/[questionId]/page.tsx  # 수정
│       └── quick/page.tsx                        # 수정
```

#### UI
- Ready 상태에서 녹음/업로드 탭 선택
- 지원 포맷: webm, mp3, wav, m4a
- 최대 크기: 25MB
- 드래그앤드롭 + 클릭 업로드

---

### 4. D-Day 카운트다운

#### PRD 요구사항 (FR42-44)
- D-Day 카운트다운 표시
- 준비된 질문 체크리스트

#### 현재 상태
- DB: `target_date` 필드 존재
- UI: 미표시

#### 구현 파일
```
src/
├── components/
│   └── project/
│       ├── DDayBadge.tsx             # D-Day 배지
│       └── PrepChecklist.tsx         # 준비 체크리스트
├── app/
│   └── studio/
│       ├── new/page.tsx              # 목표일 입력 추가
│       └── [projectId]/page.tsx      # D-Day 배지 표시
```

---

### 5. Before/After 비교 UI

#### PRD 요구사항 (FR25-29)
- 직관적인 비교 UI
- 재생 컨트롤

#### 구현 파일
```
src/
├── components/
│   └── audio/
│       └── BeforeAfterComparison.tsx # 비교 컴포넌트
├── app/
│   └── studio/
│       ├── [projectId]/q/[questionId]/page.tsx  # 수정
│       └── quick/page.tsx                        # 수정
```

#### UI
- 토글: 원본 ↔ 개선 버전
- After-First UX 유지 (개선 버전 기본)
- 텍스트 diff 하이라이팅 (선택)

---

### 6. 진행 추적 (Score Tracking)

#### PRD 요구사항 (FR36-41)
- 점수/등급 변화 추적
- 성장 시각화

#### 구현 파일
```
src/
├── components/
│   └── analytics/
│       ├── ScoreChart.tsx            # 점수 트렌드 차트
│       └── GrowthSummary.tsx         # 성장 요약
├── app/
│   └── my/
│       └── projects/[projectId]/page.tsx  # 차트 추가
```

---

### 7. 콘텐츠 모더레이션

#### PRD 요구사항 (FR50-53)
- 비속어/부적절 언어 탐지
- 민감 정보 마스킹
- 위협 콘텐츠 플래깅

#### 구현 위치
- `lib/ai/nodes/analysis.ts` 프롬프트에 모더레이션 지시 추가
- 또는 별도 `moderation.ts` 노드 생성

---

### 8. Admin Metric 유저 트래킹

#### PRD 요구사항 (FR45-49)
- 세션 통계
- API 비용 모니터링
- 사용자별 세션 제한

#### 구현 파일
```
src/
├── app/
│   └── admin/
│       ├── page.tsx                  # 대시보드
│       ├── users/page.tsx            # 유저 목록
│       └── metrics/page.tsx          # 메트릭
├── lib/
│   └── supabase/
│       └── admin.ts                  # 관리자 쿼리
```

#### 트래킹 메트릭
- North Star: "5회 연습 후 20%+ 점수 향상 사용자 비율"
- DAU/MAU
- 세션당 비용
- 재요청 비율
- 만족도 (암묵적: 재요청 vs 다음질문)

---

## 타입 정의 (types/api.ts 기존)

```typescript
// Voice Cloning
export interface VoiceCloneRequest {
  sampleAudioUrls: string[];
  voiceName?: string;
  consentGiven: boolean;
}

export type VoiceCloneStatus = 'processing' | 'ready' | 'failed';

export interface VoiceCloneResponse {
  voiceCloneId: string;
  voiceName: string;
  status: VoiceCloneStatus;
  estimatedReadyTime?: string | null;
}

// Refinement
export interface RefineRequest {
  sessionId: string;
  userIntent: string; // 10-200자
  stage?: RefineStage;
}

export type RefineStage = 1 | 2;

export interface RefinePreviewResponse {
  sessionId: string;
  previewScript: string;
  changesSummary: string;
  stage: 1;
}

export interface RefineFinalResponse {
  sessionId: string;
  improvedScript: string;
  improvedAudioUrl: string;
  stage: 2;
  canRefine: false;
}
```

---

## 환경 변수

```env
# 기존
NEXT_PUBLIC_SITE_URL=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
ELEVENLABS_API_KEY=

# 추가 필요 없음 (ElevenLabs 키로 Voice Cloning 사용)
```

---

## 검증 체크리스트

### Voice Cloning
- [ ] 신규 가입 시 온보딩 모달 표시
- [ ] 정책 동의 체크박스 필수
- [ ] 30초-1분 샘플 녹음
- [ ] 처리 중 상태 표시
- [ ] 완료 후 TTS에서 클론 음성 사용
- [ ] 마이페이지에서 삭제/재녹음

### Refinement
- [ ] 결과 화면에 "다시 생성" 버튼
- [ ] 의도 입력 (50-100자 검증)
- [ ] Stage 1: 텍스트 프리뷰
- [ ] Stage 2: TTS 생성
- [ ] 3회 제한 동작

### Audio Upload
- [ ] 녹음/업로드 선택 UI
- [ ] 25MB 제한
- [ ] 동일 분석 플로우

### D-Day
- [ ] 프로젝트 생성 시 목표일 입력
- [ ] 프로젝트 상세에 D-Day 배지
- [ ] D-7 이내 체크리스트 표시

---

## 예상 일정

| 기능 | 예상 소요 |
|------|----------|
| Voice Cloning UI | 2-3일 |
| Refinement UI | 1-2일 |
| 오디오 업로드 | 0.5일 |
| D-Day 카운트다운 | 0.5일 |
| Before/After 비교 | 1일 |
| 진행 추적 | 1-2일 |
| 콘텐츠 모더레이션 | 1일 |
| Admin 메트릭 | 1-2일 |
| **총계** | **8-12일** |

---

## 참조 파일 위치

### 핵심 파일
- `/frontend/src/app/studio/[projectId]/q/[questionId]/page.tsx` - 녹음/결과 페이지
- `/frontend/src/app/studio/quick/page.tsx` - 빠른 연습 페이지
- `/frontend/src/app/my/page.tsx` - 마이페이지
- `/frontend/src/hooks/useAudioRecorder.ts` - 녹음 훅 (재사용)
- `/frontend/src/lib/api/analyze.ts` - SSE 클라이언트 패턴
- `/frontend/src/app/api/refine/route.ts` - 재요청 API (참조)
- `/frontend/src/lib/ai/nodes/tts.ts` - TTS 노드 (클론 ID 처리)
- `/frontend/src/types/api.ts` - 타입 정의
