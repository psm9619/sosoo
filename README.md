# Sosoo - AI Speech Coach

AI 기반 스피치 코칭 서비스 - 말하기 분석 + 개선 버전 음성 클로닝

## Project Overview

"당신의 말하기를 전문 스피치 코치의 귀로 분석하고, 더 나은 버전을 직접 들려주는 AI"

### Core Value Propositions

1. **Analysis:** "왜 어색한지" 구체적으로 설명
2. **Demonstration:** "어떻게 고쳐야 하는지" 개선 버전으로 직접 시연
3. **Empathy:** 남의 목소리가 아닌 **내 목소리**로 개선판을 들려줌

## Project Status

- [x] Brainstorming Session (Phase 1-2 Complete)
- [ ] PRD Creation
- [ ] Architecture Design
- [ ] MVP Development

## Documentation

### Brainstorming Output

- `_bmad-output/brainstorming/brainstorming-session-2026-01-31.md` - 브레인스토밍 세션 결과 (23개 아이디어)
- `_bmad-output/brainstorming/langgraph-architecture.md` - LangGraph 아키텍처 다이어그램

### Key Decisions (from Brainstorming)

| Decision | Content |
|----------|---------|
| **Voice Cloning** | Optional (기본 남/녀 음성 제공) |
| **Onboarding** | 연습하며 자연스럽게 샘플 수집 → 30초+ or 3회 연습 후 클로닝 제안 |
| **Mode Structure** | Quick Practice vs Deep Practice (context-based) |
| **MVP Input** | Audio only (영상은 v1.1 이후) |
| **Pricing** | MVP 후 결정 (구독형 유력) |

## Tech Stack (Planned)

| Component | Technology |
|-----------|------------|
| STT | OpenAI Whisper |
| Analysis | Claude API (Haiku/Sonnet) |
| TTS | ElevenLabs |
| Voice Cloning | ElevenLabs |
| Workflow | LangGraph |
| Frontend | TBD |
| Backend | TBD |

## Cost Estimation (per session)

| Service | Cost |
|---------|------|
| Whisper | ~$0.012 (2min) |
| Claude | ~$0.03 |
| ElevenLabs | Credits-based |
| **Total** | ~$0.04 + ElevenLabs |

## Getting Started

TBD - MVP 개발 후 업데이트 예정

## Team

- sosoo

## License

TBD
