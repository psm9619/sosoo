# Sosoo Backend

AI 기반 스피치 코칭 서비스의 백엔드입니다.

## 🎯 주요 기능

- **STT (Speech-to-Text)**: OpenAI Whisper로 음성을 텍스트로 변환
- **AI 분석**: Claude API로 스피치 분석 (구조, 필러워드, 속도, 자신감)
- **개선안 생성**: 원본의 개성을 유지하면서 전달력 개선
- **TTS (Text-to-Speech)**: ElevenLabs로 개선된 스크립트를 음성으로

## 🏗 기술 스택

- **Framework**: FastAPI + LangGraph
- **AI/ML**: OpenAI Whisper, Claude API, ElevenLabs
- **Database**: Supabase (PostgreSQL)
- **배포**: Railway

## 📁 프로젝트 구조

```
backend/
├── api/                    # FastAPI 레이어
│   ├── main.py            # 앱 진입점
│   ├── config.py          # 환경변수 설정
│   ├── dependencies.py    # JWT 검증, 의존성
│   ├── routes/            # API 라우트
│   │   ├── analyze.py     # POST /analyze (메인)
│   │   ├── refine.py      # POST /refine (재요청)
│   │   └── health.py      # Health check
│   └── schemas/           # Pydantic 스키마
│       ├── requests.py
│       └── responses.py
│
├── langgraph/             # AI 워크플로우
│   ├── state.py           # 워크플로우 상태 정의
│   ├── nodes/             # 그래프 노드 (작업 단위)
│   │   ├── stt.py         # Whisper STT
│   │   ├── analysis.py    # Claude 분석
│   │   ├── improvement.py # 개선 스크립트 생성
│   │   ├── tts.py         # ElevenLabs TTS
│   │   ├── context.py     # Progressive Context
│   │   └── moderation.py  # 콘텐츠 모더레이션
│   ├── tools/             # ReAct 패턴용 도구
│   │   ├── pace_analysis.py
│   │   ├── filler_analysis.py
│   │   └── structure_analysis.py
│   ├── workflows/         # 그래프 정의
│   │   ├── speech_coach.py
│   │   └── refinement.py
│   └── utils/
│       ├── prompts.py     # Claude 프롬프트
│       └── audio.py
│
└── tests/                 # 테스트
```

## 🚀 시작하기

### 환경 설정

```bash
# 가상환경 생성
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 의존성 설치
pip install -r requirements.txt

# 환경변수 설정
cp .env.example .env
# .env 파일을 열어 API 키 입력
```

### 로컬 실행

```bash
# 개발 서버 실행
uvicorn api.main:app --reload --port 8000

# 또는
python -m api.main
```

### 테스트

```bash
# 전체 테스트
pytest

# 특정 테스트
pytest tests/nodes/test_tools.py -v

# 커버리지
pytest --cov=langgraph --cov=api
```

## 📚 API 문서

서버 실행 후 접속:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

### 주요 엔드포인트

| Method | Endpoint | 설명 |
|--------|----------|------|
| POST | `/api/v1/analyze` | 스피치 분석 (SSE 스트리밍) |
| POST | `/api/v1/refine` | 개선안 재생성 |
| GET | `/health` | 서버 상태 확인 |
| GET | `/ping` | 간단한 생존 확인 |

## 🤖 AI 패턴

### ReAct (Reasoning + Action)
분석 단계에서 Claude가 도구를 사용하여 객관적 데이터를 수집합니다.
- `pace_analysis`: WPM 측정
- `filler_analysis`: 필러워드 감지
- `structure_analysis`: STAR 구조 분석

### Reflection
개선안 생성 후 자기 검토를 수행하여 품질을 보장합니다.

### RAG (Progressive Context)
유저의 과거 세션을 참조하여 연속성 있는 코칭을 제공합니다.

## 🔧 환경변수

| 변수 | 설명 | 필수 |
|------|------|------|
| SUPABASE_URL | Supabase 프로젝트 URL | ✅ |
| SUPABASE_SERVICE_KEY | Supabase 서비스 키 | ✅ |
| OPENAI_API_KEY | OpenAI API 키 (Whisper) | ✅ |
| ANTHROPIC_API_KEY | Anthropic API 키 (Claude) | ✅ |
| ELEVENLABS_API_KEY | ElevenLabs API 키 (TTS) | ✅ |
| ALLOWED_ORIGINS | CORS 허용 도메인 | ❌ |

## 📦 Docker

```bash
# 빌드
docker build -t sosoo-backend .

# 실행
docker run -p 8000:8000 --env-file .env sosoo-backend
```

## 📄 라이선스

MIT License