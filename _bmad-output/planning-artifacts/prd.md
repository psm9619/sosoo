---
stepsCompleted: ['step-01-init', 'step-02-discovery', 'step-03-success', 'step-04-journeys', 'step-05-domain', 'step-06-innovation', 'step-07-project-type', 'step-08-scoping', 'step-09-functional', 'step-10-nonfunctional', 'step-11-polish']
inputDocuments:
  - path: '_bmad-output/brainstorming/brainstorming-session-2026-01-31.md'
    type: 'brainstorming'
    loaded: true
  - path: '_bmad-output/brainstorming/langgraph-architecture.md'
    type: 'architecture'
    loaded: true
workflowType: 'prd'
classification:
  projectType: 'saas_b2b'
  domain: 'edtech'
  complexity: 'medium'
  projectContext: 'greenfield'
---

# Product Requirements Document - Sosoo

**Author:** sosoo
**Date:** 2026-01-31
**Version:** 1.0 (MVP)

---

## Executive Summary

### Product Vision

**Sosoo**는 AI 기반 스피치 코칭 서비스입니다.

> "당신의 말하기를 전문 스피치 코치의 귀로 분석하고, 더 나은 버전을 **당신의 목소리**로 직접 들려주는 AI"

### Core Value Propositions

| Value | Description |
|-------|-------------|
| **Analysis** | "왜 어색한지" 구체적으로 설명 |
| **Demonstration** | "어떻게 고쳐야 하는지" 개선 버전으로 직접 시연 |
| **Empathy** | 남의 목소리가 아닌 **내 목소리**로 개선판을 들려줌 |

### Key Differentiators

- **Voice Clone Coaching**: 개선안을 본인 목소리로 시연 (경쟁사 대비 유일)
- **After-First UX**: 개선 버전 먼저 제시 → 학습 효율 극대화
- **Progressive Context**: AI가 유저 성장 패턴 학습 → 개인화 코칭
- **3-Stage Refinement**: Human-in-the-Loop 개선안 수정 → 유저 의도 반영

### Target Users (MVP)

**Urgent Performance**: 당장 면접/발표가 있는 사람
- D-Day 카운트다운, 핵심 개선점 집중, 체크리스트

### Tech Stack

| Component | Technology |
|-----------|------------|
| STT | OpenAI Whisper |
| Analysis | Claude API (Haiku/Sonnet) |
| TTS | ElevenLabs |
| Voice Cloning | ElevenLabs |
| Workflow | LangGraph |
| Auth | Supabase Auth |

---

## Success Criteria

### User Success

| Milestone | Target |
|-----------|--------|
| Early Value | 동일 질문 3회차부터 AI 점수 개선 시작 |
| Skill Development | 5회 이내 측정 가능한 개선 |
| Confidence | 10회 이내 자신감 형성 |
| Real-World | 실제 면접/발표에서 "연습이 도움 됐다" 피드백 |

### Business Success (MVP 출시 후 3개월)

| Metric | Target |
|--------|--------|
| MAU | 1,000명 |
| D7 Retention | >35% |
| D30 Retention | >15% |
| 세션 빈도 | 2회+/주 (활성 유저) |
| NPS | >40 |
| Organic Growth | 30%+ |

### North Star Metric

> "동일 질문 5회 연습 후 AI 점수 20%+ 개선된 사용자 비율"

---

## Product Scope

### MVP (Phase 1)

**Core Flow:**
```
음성 녹음/업로드 → STT → AI 분석 → 개선 스크립트 → TTS 재생
```

**Must-Have Features:**

| Category | Features |
|----------|----------|
| **Project** | 프로젝트 생성, 문서 업로드, D-Day 카운트다운 |
| **Recording** | 웹 녹음 (모바일 친화적), 파일 업로드 |
| **Analysis** | 스피치 분석, 개선안 생성, Progressive Context |
| **TTS** | 기본 남/녀 음성, Voice Cloning (선택적) |
| **UX** | Before/After 비교, 3단계 재요청, 로딩 중 Quote 표시 |
| **Admin** | 통계 대시보드, 비용 모니터링, 컨텐츠 모더레이션 |

### Growth (Phase 2)

| Feature | Description |
|---------|-------------|
| Regular Practice | 스트릭/레벨/배지, 성장 그래프, 주간 리포트 |
| 프로젝트별 히스토리 통계 | 질문별 점수 변화, 성장 곡선 |
| 연습 모드 | 개선 버전 따라하기 + 비교 |
| Subscription Tiers | Free / Pro 구분 |
| 오디오 디노이징 | 노이즈 제거 (ElevenLabs) |

### Vision (Phase 3)

- 팀/기업용 멀티테넌트
- 영상 분석 (표정, 제스처)
- AI 면접관 시뮬레이션
- 실시간 발표 중 피드백
- 다국어 지원

---

## User Journeys

### Journey 1: Urgent Performance - 민지의 이야기

**Persona:** 김민지 (29세, 마케팅 매니저)

| Stage | Description |
|-------|-------------|
| **Situation** | 3일 후 대기업 이직 면접. "성과 설명" 질문이 걱정. |
| **Goal** | 핵심 질문 3개 답변을 자연스럽게 만들고 싶다. |
| **Obstacle** | 객관적 피드백 받을 곳 없음. 전문 코칭은 비싸고 시간 없음. |

**Journey:**
1. 프로젝트 생성 → 이력서/성과자료 업로드
2. 첫 녹음 → AI 분석 ("결론이 먼저 나오지 않습니다...")
3. 개선 버전 청취 → "이렇게 말하면 명확하네!"
4. 마음에 안 들면 → 의도 입력 → 방향 확인 → 최종 개선안
5. 반복 연습 → 3회차에 B+ 달성
6. D-1 체크리스트 완료 → 면접 합격

### Journey 2: Regular Practice - 준혁의 이야기 (Growth)

**Persona:** 이준혁 (35세, 스타트업 CTO)

| Stage | Description |
|-------|-------------|
| **Situation** | 투자자 미팅, 채용 면접 잦음. "어..."가 많고 말이 빠름. |
| **Goal** | 장기적으로 "말 잘하는 CTO"가 되고 싶다. |
| **Obstacle** | 바쁜 일상에서 꾸준히 연습하기 어려움. |

**Journey:**
- 매일 아침 15분 연습 → 스트릭 시작
- Progressive Context: "속도 조절 중, 필러 감소 추세"
- 1개월 후 40% 점수 상승 확인
- 투자자 미팅 성공

### Journey 3: Onboarding - Voice Cloning 동의

**Flow:**
1. 첫 가입 시 Voice Cloning 안내 화면
2. Content Policy + AI Defence 설명 ("목소리 절대 유출 안 됨")
3. 영감 주는 글귀 포함 샘플 텍스트 (30초~1분)
4. [녹음] 또는 [나중에 하기] 선택
5. 마이페이지에서 언제든 등록 가능

### Journey 4: Admin/Ops

**Capabilities:**
- 세션 통계 모니터링
- API 비용 대시보드 (Whisper/Claude/ElevenLabs)
- 컨텐츠 모더레이션 (분석 프롬프트 통합)
- 유저당 세션 횟수 제한
- 암묵적 만족도 추적 (재요청 vs 진행)

---

## Core Feature: 개선안 재생성 Flow

**3단계 제한으로 무한 루프 방지 + 비용 효율화**

```
[LOOP 1: 최초 풀 생성]
Whisper STT → Claude 분석 → Claude 개선안 → ElevenLabs TTS
    ↓
[개선안 제시]
    ├── "연습하기" / "다음 질문" → ✅ 완료 (암묵적 만족)
    └── "다시 생성" → LOOP 2

[LOOP 2: 방향 확인 (저비용 - TTS 없음)]
유저 의도 입력 (50~100자) → Claude 재분석 → 방향 프리뷰
    ├── "OK" → LOOP 3
    └── "NO" → 추가 인풋 → LOOP 3

[LOOP 3: 최종 풀 생성]
Claude 개선안 → ElevenLabs TTS → ✅ 완료 (재생성 불가)
```

| Loop | Cost | Description |
|------|------|-------------|
| 1 | Full | STT + Claude + TTS |
| 2 | Low | Claude만 (TTS 없음) |
| 3 | Full | Claude + TTS |

---

## Domain-Specific Requirements

### Data Privacy & Security

| Requirement | Description |
|-------------|-------------|
| 음성 데이터 보호 | 암호화 저장, 처리 후 24시간 내 원본 삭제 |
| Voice Clone 격리 | 유저별 모델 격리, 타인 접근 불가 |
| GDPR 준수 | 데이터 삭제 요청 72시간 내 처리 |

### Voice Clone Security

| Requirement | Description |
|-------------|-------------|
| 본인 인증 | 클로닝 전 이메일/휴대폰 인증 |
| 본인 목소리만 | 타인 클로닝 시도 감지 및 차단 |
| 다운로드 불가 | 서비스 내 재생만 허용 |

### Content Moderation (분석 프롬프트 통합)

| Detection | Action |
|-----------|--------|
| 욕설/비속어 | 플래그 + 관리자 알림 |
| 민감 개인정보 | 자동 마스킹 + 경고 |
| 위협/폭력 | 세션 중단 + 관리자 알림 |

### Accessibility

- WCAG 2.1 AA 준수
- 키보드 내비게이션 (녹음/재생 컨트롤)
- 스크린 리더 지원
- 반응형 웹 (Mobile-Friendly)

---

## Innovation & Competitive Landscape

### Market Context

| Player | Offering | Gap |
|--------|----------|-----|
| 전문 코치 | 고품질 피드백 | $100+/시간, 시간 제약 |
| Orai, Speeko | 점수/피드백 | 개선안 시연 없음 |
| Yoodli | AI 면접 분석 | 클로닝 없음 |

### Sosoo's Unique Position

> "분석 + 시연 + 내 목소리" 삼박자를 모두 갖춘 유일한 서비스

### Validation Approach

| Innovation | Method |
|------------|--------|
| Voice Clone 효과 | A/B 테스트: 클로닝 유/무 학습 효과 비교 |
| After-First UX | 사용성 테스트: Before-First vs After-First |
| Progressive Context | 장기 리텐션: 컨텍스트 유/무 D30 비교 |

---

## SaaS B2B Configuration

| Item | MVP | Future |
|------|-----|--------|
| Tenant Model | 개인 유저 | 팀/기업 멀티테넌트 |
| Permission | 유저/Admin 2단계 | 팀 역할 (Owner/Member/Viewer) |
| Subscription | Free (제한적) | Pro / Enterprise |
| Integrations | Whisper, Claude, ElevenLabs | 캘린더, Notion, Slack |

**설계 고려:**
- DB 스키마: team_id 추가 가능하도록
- API: 개인/팀 엔드포인트 분리 가능 구조

---

## Functional Requirements

### User Account & Authentication (FR1-5)

- FR1: 이메일/소셜 로그인 회원가입
- FR2: 로그인/로그아웃
- FR3: Voice Cloning용 본인 인증 (이메일/휴대폰)
- FR4: 비밀번호 재설정
- FR5: 프로필 설정 조회/수정

### Project Management (FR6-11)

- FR6: 프로젝트 생성 (이름, 목적)
- FR7: D-Day 설정
- FR8: 컨텍스트 문서 업로드
- FR9: 프로젝트 목록 조회
- FR10: 프로젝트 보관/삭제
- FR11: 연습 질문 추가

### Voice Recording & Processing (FR12-16)

- FR12: 웹 브라우저 녹음 (데스크톱/모바일)
- FR13: 재녹음
- FR14: 녹음 시간 실시간 표시
- FR15: 오디오 품질 감지 및 재녹음 안내
- FR16: STT 변환

### AI Analysis & Coaching (FR17-24)

- FR17: 구조/명확성/속도/필러 분석
- FR18: 구체적 개선점 피드백
- FR19: 개선 스크립트 생성
- FR20: 컨텍스트 문서 반영 분석
- FR21: Progressive Context 유지
- FR22: 의도 기반 재요청 (50-100자)
- FR23: 방향 프리뷰 표시
- FR24: 재생성 3회 제한

### Voice Generation - TTS (FR25-29)

- FR25: 기본 남/녀 음성 생성
- FR26: 클로닝 음성 생성
- FR27: 재생/일시정지/반복
- FR28: Before/After 비교 청취
- FR29: 직관적 비교 UI

### Voice Cloning (FR30-35)

- FR30: 온보딩 샘플 녹음
- FR31: Content Policy + AI Defence 표시
- FR32: 샘플 텍스트 생성 (30초~1분)
- FR33: 클로닝 스킵 → 마이페이지 등록
- FR34: 본인 인증 후에만 클로닝
- FR35: 서비스 내 재생만 (다운로드 불가)

### Session & Practice (FR36-41)

- FR36: 질문별 연습 세션 시작
- FR37: 프로젝트 내 세션 히스토리
- FR38: 점수/등급 변화 표시
- FR39: "연습하기" 진행
- FR40: "다음 질문" 진행
- FR41: 암묵적 만족도 추적

### Onboarding & Guidance (FR42-44)

- FR42: Voice Cloning 옵트인 가이드
- FR43: D-Day 카운트다운 표시
- FR44: 준비된 질문 체크리스트

### Admin & Operations (FR45-49)

- FR45: 세션 통계 대시보드
- FR46: API 비용 모니터링
- FR47: 모더레이션 플래그 세션 조회
- FR48: 유저별 세션 제한 설정
- FR49: 암묵적 만족도 지표

### Content Safety (FR50-53)

- FR50: 욕설/부적절 언어 감지
- FR51: 민감 개인정보 감지
- FR52: 위협 컨텐츠 플래그 + 알림
- FR53: 민감정보 자동 마스킹

### Audio Input (FR54-55)

- FR54: 녹음 파일 업로드
- FR55: 업로드 파일 모더레이션 적용

---

## Non-Functional Requirements

### Performance

| ID | Requirement | Target |
|----|-------------|--------|
| NFR-P1 | STT 처리 | 2분 오디오 → 10초 이내 |
| NFR-P2 | AI 분석 | 20초 이내 |
| NFR-P3 | TTS 생성 | 15초 이내 |
| NFR-P4 | 전체 응답 | 30초 이내 |
| NFR-P5 | 페이지 로드 | 3초 이내 |
| NFR-P6 | 컨텍스트 요약 | 3초 이내 |
| NFR-P7 | 로딩 UX | 프로그레스 + Quote 표시 |

### Security

| ID | Requirement | Target |
|----|-------------|--------|
| NFR-S1 | 암호화 | TLS 1.3 (전송), AES-256 (저장) |
| NFR-S2 | 음성 원본 | 처리 후 24시간 내 삭제 |
| NFR-S3 | Voice Clone | 본인 인증 후에만 |
| NFR-S4 | 클로닝 음성 | 다운로드 불가 |
| NFR-S5 | 세션 인증 | JWT, 24시간 만료 |
| NFR-S6 | GDPR | 삭제 요청 72시간 처리 |

### Scalability

| ID | Requirement | Target |
|----|-------------|--------|
| NFR-SC1 | 동시 사용자 | 90명+ (MVP 시연) |
| NFR-SC2 | 일일 세션 | 5,000+ |
| NFR-SC3 | 스토리지 | 유저별 무제한 |
| NFR-SC4 | API 분산 | Rate Limit 큐잉 |
| NFR-SC5 | 버스트 트래픽 | 90명 동시 접속 정상 |

### Accessibility

| ID | Requirement | Target |
|----|-------------|--------|
| NFR-A1 | 웹 표준 | WCAG 2.1 AA |
| NFR-A2 | 키보드 | 전 기능 접근 |
| NFR-A3 | 스크린 리더 | 피드백 텍스트 지원 |
| NFR-A4 | 색상 대비 | 4.5:1 이상 |

### Integration

| ID | Requirement | Target |
|----|-------------|--------|
| NFR-I1 | Whisper API | 99% 성공, 5초 타임아웃 |
| NFR-I2 | Claude API | 99% 성공, 30초 타임아웃 |
| NFR-I3 | ElevenLabs API | 99% 성공, 15초 타임아웃 |
| NFR-I4 | Fallback | 재시도 3회 + 알림 |
| NFR-I5 | Clone Fallback | 기본 음성 자동 전환 |

### Reliability

| ID | Requirement | Target |
|----|-------------|--------|
| NFR-R1 | Uptime | 99.5% |
| NFR-R2 | 백업 | 일일, 7일 보관 |
| NFR-R3 | 에러 복구 | 마지막 상태 복원 |

### Cost Efficiency

| ID | Requirement | Target |
|----|-------------|--------|
| NFR-C1 | 세션당 비용 | ≤$0.10 |
| NFR-C2 | 세션 제한 | 일일/월간 설정 가능 |

---

## Resource Requirements

| Role | Count | Stack |
|------|-------|-------|
| Frontend | 1 | React/Next.js |
| Backend | 1 | Node.js + LangGraph |
| AI/ML | - | API 연동 (자체 모델 없음) |

---

## Risk Mitigation

| Category | Risk | Mitigation |
|----------|------|------------|
| Technical | ElevenLabs 한계 | 기본 음성 fallback |
| Technical | 높은 API 비용 | 세션 제한 + 방향 프리뷰 |
| Technical | 처리 지연 | 배치 처리 + 로딩 UX |
| Market | AI 피드백 불신 | 3단계 재요청 + 의도 반영 |
| Market | 경쟁사 진입 | Voice Clone + After-First 차별화 |
| Resource | 리소스 부족 | API 중심 아키텍처 |
| Resource | 범위 초과 | Growth 명확 분리 |

---

## Appendix: Journey Requirements Matrix

| Journey | MVP | Growth |
|---------|-----|--------|
| **Onboarding** | Voice Cloning 동의 + 샘플 녹음, 마이페이지 등록 | - |
| **Urgent Performance** | 프로젝트, 문서 업로드, D-Day, 녹음, 분석, 3단계 재요청, TTS, Before/After, 체크리스트, Progressive Context | 히스토리 통계 |
| **Regular Practice** | 세션, Progressive Context, 재요청, Before/After | 스트릭/레벨/배지, 성장 그래프, 리포트, 통계 |
| **Admin/Ops** | 대시보드, 비용, 모더레이션, 세션 제한, 만족도 추적 | 재요청 패턴 분석 |

---

**End of PRD v1.0**
