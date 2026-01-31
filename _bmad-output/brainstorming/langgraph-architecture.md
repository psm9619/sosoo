# AI Speech Coach - LangGraph Architecture

## Flow Diagram (Mermaid)

```mermaid
%%{init: {'theme': 'base', 'themeVariables': { 'primaryColor': '#4F46E5', 'primaryTextColor': '#fff', 'primaryBorderColor': '#4338CA', 'lineColor': '#6366F1', 'secondaryColor': '#E0E7FF', 'tertiaryColor': '#F5F3FF'}}}%%

stateDiagram-v2
    [*] --> ModeSelection: START

    ModeSelection --> QuickPractice: quick_mode
    ModeSelection --> DeepPractice: deep_mode

    state QuickPractice {
        [*] --> RecordAudio_Quick
        RecordAudio_Quick --> STT_Quick: audio_file
        STT_Quick --> AnalyzeContent_Quick: transcript
        AnalyzeContent_Quick --> GenerateImprovedScript_Quick: analysis
        GenerateImprovedScript_Quick --> VoiceSelection_Quick: improved_script
        VoiceSelection_Quick --> GenerateTTS_Quick: voice_config
        GenerateTTS_Quick --> [*]: audio_result
    }

    state DeepPractice {
        [*] --> UploadContext
        UploadContext --> AnalyzeContext: documents
        AnalyzeContext --> GenerateQuestions: context_analysis
        GenerateQuestions --> SelectQuestion: questions
        SelectQuestion --> RecordAudio_Deep: selected_question
        RecordAudio_Deep --> STT_Deep: audio_file
        STT_Deep --> AnalyzeWithContext: transcript
        AnalyzeWithContext --> GenerateImprovedScript_Deep: analysis
        GenerateImprovedScript_Deep --> VoiceSelection_Deep: improved_script
        VoiceSelection_Deep --> GenerateTTS_Deep: voice_config
        GenerateTTS_Deep --> [*]: audio_result
    }

    QuickPractice --> PresentResults
    DeepPractice --> PresentResults

    PresentResults --> CheckCloneSamples: results_displayed

    CheckCloneSamples --> OfferCloning: samples_sufficient
    CheckCloneSamples --> PracticeLoop: samples_insufficient

    OfferCloning --> CreateVoiceClone: user_accepts
    OfferCloning --> PracticeLoop: user_declines

    CreateVoiceClone --> PracticeLoop: clone_created

    PracticeLoop --> RecordPractice: continue_practice
    PracticeLoop --> SessionEnd: end_session

    RecordPractice --> CompareFeedback: practice_audio
    CompareFeedback --> PracticeLoop: feedback_shown

    SessionEnd --> [*]: END
```

## Simplified Flow Diagram

```mermaid
flowchart TD
    START([START]) --> MODE{Mode Selection}

    MODE -->|Quick| RECORD1[Record Audio]
    MODE -->|Deep| UPLOAD[Upload Context<br/>Resume, Docs]

    UPLOAD --> CONTEXT[Analyze Context<br/>Claude]
    CONTEXT --> QUESTIONS[Generate Questions<br/>Claude]
    QUESTIONS --> SELECT[Select Question]
    SELECT --> RECORD2[Record Answer]

    RECORD1 --> STT1[Speech-to-Text<br/>Whisper]
    RECORD2 --> STT2[Speech-to-Text<br/>Whisper]

    STT1 --> ANALYZE1[Analyze Content<br/>Claude]
    STT2 --> ANALYZE2[Analyze with Context<br/>Claude]

    ANALYZE1 --> IMPROVE1[Generate Improved Script<br/>Claude]
    ANALYZE2 --> IMPROVE2[Generate Improved Script<br/>Claude]

    IMPROVE1 --> VOICE{Voice Selection}
    IMPROVE2 --> VOICE

    VOICE -->|Default Male| TTS1[Generate TTS<br/>ElevenLabs]
    VOICE -->|Default Female| TTS1
    VOICE -->|My Clone| TTS2[Generate Cloned TTS<br/>ElevenLabs]

    TTS1 --> RESULTS[Present Results<br/>Scorecard + Audio]
    TTS2 --> RESULTS

    RESULTS --> SAMPLES{Enough Samples<br/>for Clone?}

    SAMPLES -->|Yes & No Clone| OFFER{Offer Voice<br/>Cloning?}
    SAMPLES -->|No| PRACTICE{Continue<br/>Practice?}

    OFFER -->|Accept| CLONE[Create Voice Clone<br/>ElevenLabs]
    OFFER -->|Decline| PRACTICE

    CLONE --> PRACTICE

    PRACTICE -->|Yes| LOOP[Practice Mode<br/>Listen-Record-Compare]
    PRACTICE -->|No| ENDING([END])

    LOOP --> RECORD3[Record Practice]
    RECORD3 --> COMPARE[Compare & Feedback]
    COMPARE --> PRACTICE

    style START fill:#10B981,stroke:#059669,color:#fff
    style ENDING fill:#EF4444,stroke:#DC2626,color:#fff
    style CLONE fill:#8B5CF6,stroke:#7C3AED,color:#fff
    style RESULTS fill:#F59E0B,stroke:#D97706,color:#fff
```

## LangGraph Python Implementation

```python
from typing import TypedDict, Literal, Annotated, List, Optional
from langgraph.graph import StateGraph, START, END
from langgraph.checkpoint.memory import MemorySaver
import operator

# ============================================
# STATE DEFINITION
# ============================================

class SpeechCoachState(TypedDict):
    # Session info
    session_id: str
    user_id: str
    mode: Literal["quick", "deep"]

    # Context (Deep mode only)
    uploaded_documents: List[str]
    context_analysis: Optional[str]
    generated_questions: List[str]
    selected_question: Optional[str]

    # Audio processing
    audio_file_path: str
    transcript: str

    # Analysis results
    analysis_result: dict  # Contains scores, feedback, etc.
    improved_script: str

    # Voice settings
    voice_type: Literal["default_male", "default_female", "cloned"]
    voice_clone_id: Optional[str]

    # TTS output
    original_audio_url: str
    improved_audio_url: str

    # Clone sampling
    sample_count: int
    samples_sufficient: bool
    clone_offered: bool
    clone_accepted: bool

    # Practice loop
    practice_attempts: Annotated[List[dict], operator.add]
    continue_practice: bool

    # Messages for UI
    messages: Annotated[List[str], operator.add]


# ============================================
# NODE FUNCTIONS
# ============================================

def mode_selection(state: SpeechCoachState) -> dict:
    """Route based on selected mode"""
    return {"messages": [f"Mode selected: {state['mode']}"]}


def upload_context(state: SpeechCoachState) -> dict:
    """Handle document uploads (Deep mode)"""
    # TODO: Implement S3 upload, document parsing
    return {
        "messages": ["Documents uploaded successfully"],
        "uploaded_documents": state.get("uploaded_documents", [])
    }


def analyze_context(state: SpeechCoachState) -> dict:
    """Analyze uploaded documents with Claude"""
    # TODO: Call Claude API to analyze resume, project docs
    # Extract key skills, experiences, potential interview topics
    context_analysis = "Analyzed: Senior backend engineer, 5 years experience..."
    return {
        "context_analysis": context_analysis,
        "messages": ["Context analyzed"]
    }


def generate_questions(state: SpeechCoachState) -> dict:
    """Generate interview questions based on context"""
    # TODO: Call Claude API with context to generate questions
    questions = [
        "자기소개를 해주세요",
        "이 프로젝트에서 가장 어려웠던 기술적 도전은?",
        "왜 이직을 결심하셨나요?",
        "5년 후 커리어 목표는?"
    ]
    return {
        "generated_questions": questions,
        "messages": ["Questions generated based on your profile"]
    }


def record_audio(state: SpeechCoachState) -> dict:
    """Handle audio recording"""
    # Audio recording happens on frontend
    # This node receives the audio file path
    return {
        "messages": ["Audio recorded"],
        "sample_count": state.get("sample_count", 0) + 1
    }


def speech_to_text(state: SpeechCoachState) -> dict:
    """Convert audio to text using Whisper"""
    # TODO: Call OpenAI Whisper API
    transcript = "안녕하세요, 저는 5년차 백엔드 개발자입니다..."
    return {
        "transcript": transcript,
        "messages": ["Transcription complete"]
    }


def analyze_content(state: SpeechCoachState) -> dict:
    """Analyze speech content with Claude"""
    # TODO: Call Claude API for analysis
    # Analyze: STAR structure, filler words, pace, logic flow
    analysis = {
        "scores": {
            "logic_structure": "B+",
            "filler_words": "A",
            "speaking_pace": "C",
            "confidence_tone": "B",
            "content_specificity": "C+"
        },
        "filler_word_count": 5,
        "filler_word_percentage": 3.2,
        "words_per_minute": 185,
        "structure_flow": ["situation", "result", "action", "situation"],
        "improvement_suggestions": [
            "말 속도를 10% 낮추세요",
            "두괄식으로 핵심을 먼저 말하세요",
            "경험을 수치로 표현하세요"
        ]
    }
    return {
        "analysis_result": analysis,
        "messages": ["Analysis complete"]
    }


def analyze_with_context(state: SpeechCoachState) -> dict:
    """Analyze speech with uploaded context (Deep mode)"""
    # TODO: Enhanced analysis using context
    # Compare answer against uploaded documents
    # Check for consistency, depth, relevance
    analysis = analyze_content(state)["analysis_result"]
    analysis["context_relevance"] = "B+"
    analysis["depth_score"] = "B"
    return {
        "analysis_result": analysis,
        "messages": ["Context-aware analysis complete"]
    }


def generate_improved_script(state: SpeechCoachState) -> dict:
    """Generate improved version of the script"""
    # TODO: Call Claude API to rewrite script
    # Apply STAR structure, remove filler words, improve flow
    improved = """안녕하세요, 저는 5년차 백엔드 개발자 홍길동입니다.

현재 ABC 회사에서 하루 1천만 트랜잭션을 처리하는 결제 시스템을 설계하고 있습니다.

가장 큰 성과는 레거시 시스템 마이그레이션 프로젝트에서
다운타임 제로로 전환을 완료하여 연간 운영비용을 40% 절감한 것입니다."""

    return {
        "improved_script": improved,
        "messages": ["Improved script generated"]
    }


def select_voice(state: SpeechCoachState) -> dict:
    """Determine which voice to use for TTS"""
    voice_type = state.get("voice_type", "default_male")
    voice_clone_id = state.get("voice_clone_id")

    if voice_type == "cloned" and voice_clone_id:
        return {"messages": ["Using your cloned voice"]}
    else:
        return {
            "voice_type": voice_type,
            "messages": [f"Using {voice_type} voice"]
        }


def generate_tts(state: SpeechCoachState) -> dict:
    """Generate TTS audio using ElevenLabs"""
    # TODO: Call ElevenLabs API
    # Use appropriate voice (default or cloned)
    return {
        "improved_audio_url": "https://storage.example.com/improved_audio.mp3",
        "messages": ["TTS audio generated"]
    }


def present_results(state: SpeechCoachState) -> dict:
    """Prepare results for presentation"""
    return {
        "messages": [
            "Results ready",
            f"Scores: {state['analysis_result']['scores']}",
            "Improved audio available"
        ]
    }


def check_clone_samples(state: SpeechCoachState) -> dict:
    """Check if enough samples collected for voice cloning"""
    sample_count = state.get("sample_count", 0)
    # Need 30+ seconds or 3+ recordings
    samples_sufficient = sample_count >= 3

    return {
        "samples_sufficient": samples_sufficient,
        "messages": [f"Sample count: {sample_count}, Sufficient: {samples_sufficient}"]
    }


def offer_cloning(state: SpeechCoachState) -> dict:
    """Offer voice cloning to user"""
    return {
        "clone_offered": True,
        "messages": ["Voice cloning available! Would you like to create your voice clone?"]
    }


def create_voice_clone(state: SpeechCoachState) -> dict:
    """Create voice clone using ElevenLabs"""
    # TODO: Call ElevenLabs voice cloning API
    clone_id = "voice_clone_12345"
    return {
        "voice_clone_id": clone_id,
        "voice_type": "cloned",
        "messages": ["Voice clone created successfully!"]
    }


def practice_loop(state: SpeechCoachState) -> dict:
    """Handle practice mode continuation"""
    return {"messages": ["Ready for practice mode"]}


def record_practice(state: SpeechCoachState) -> dict:
    """Record practice attempt"""
    return {"messages": ["Practice recording captured"]}


def compare_feedback(state: SpeechCoachState) -> dict:
    """Compare practice with improved version"""
    # TODO: Analyze practice recording
    # Compare with improved version
    practice_result = {
        "attempt_number": len(state.get("practice_attempts", [])) + 1,
        "improvement_percentage": 15,
        "feedback": "말 속도가 개선되었습니다!"
    }
    return {
        "practice_attempts": [practice_result],
        "messages": ["Practice feedback generated"]
    }


# ============================================
# ROUTING FUNCTIONS
# ============================================

def route_by_mode(state: SpeechCoachState) -> Literal["quick_flow", "deep_flow"]:
    """Route to appropriate flow based on mode"""
    if state.get("mode") == "deep":
        return "deep_flow"
    return "quick_flow"


def route_clone_check(state: SpeechCoachState) -> Literal["offer_cloning", "practice_loop"]:
    """Check if should offer cloning"""
    if state.get("samples_sufficient") and not state.get("voice_clone_id"):
        return "offer_cloning"
    return "practice_loop"


def route_clone_decision(state: SpeechCoachState) -> Literal["create_clone", "practice_loop"]:
    """Route based on user's cloning decision"""
    if state.get("clone_accepted"):
        return "create_clone"
    return "practice_loop"


def route_practice_decision(state: SpeechCoachState) -> Literal["record_practice", "end"]:
    """Route based on practice continuation decision"""
    if state.get("continue_practice"):
        return "record_practice"
    return "end"


# ============================================
# GRAPH CONSTRUCTION
# ============================================

def build_speech_coach_graph():
    """Build the complete LangGraph"""

    graph = StateGraph(SpeechCoachState)

    # Add all nodes
    graph.add_node("mode_selection", mode_selection)

    # Quick mode nodes
    graph.add_node("record_audio_quick", record_audio)
    graph.add_node("stt_quick", speech_to_text)
    graph.add_node("analyze_quick", analyze_content)
    graph.add_node("improve_quick", generate_improved_script)
    graph.add_node("voice_quick", select_voice)
    graph.add_node("tts_quick", generate_tts)

    # Deep mode nodes
    graph.add_node("upload_context", upload_context)
    graph.add_node("analyze_context", analyze_context)
    graph.add_node("generate_questions", generate_questions)
    graph.add_node("record_audio_deep", record_audio)
    graph.add_node("stt_deep", speech_to_text)
    graph.add_node("analyze_deep", analyze_with_context)
    graph.add_node("improve_deep", generate_improved_script)
    graph.add_node("voice_deep", select_voice)
    graph.add_node("tts_deep", generate_tts)

    # Shared nodes
    graph.add_node("present_results", present_results)
    graph.add_node("check_samples", check_clone_samples)
    graph.add_node("offer_cloning", offer_cloning)
    graph.add_node("create_clone", create_voice_clone)
    graph.add_node("practice_loop", practice_loop)
    graph.add_node("record_practice", record_practice)
    graph.add_node("compare_feedback", compare_feedback)

    # Entry edge
    graph.add_edge(START, "mode_selection")

    # Mode routing
    graph.add_conditional_edges(
        "mode_selection",
        route_by_mode,
        {
            "quick_flow": "record_audio_quick",
            "deep_flow": "upload_context"
        }
    )

    # Quick mode flow
    graph.add_edge("record_audio_quick", "stt_quick")
    graph.add_edge("stt_quick", "analyze_quick")
    graph.add_edge("analyze_quick", "improve_quick")
    graph.add_edge("improve_quick", "voice_quick")
    graph.add_edge("voice_quick", "tts_quick")
    graph.add_edge("tts_quick", "present_results")

    # Deep mode flow
    graph.add_edge("upload_context", "analyze_context")
    graph.add_edge("analyze_context", "generate_questions")
    graph.add_edge("generate_questions", "record_audio_deep")
    graph.add_edge("record_audio_deep", "stt_deep")
    graph.add_edge("stt_deep", "analyze_deep")
    graph.add_edge("analyze_deep", "improve_deep")
    graph.add_edge("improve_deep", "voice_deep")
    graph.add_edge("voice_deep", "tts_deep")
    graph.add_edge("tts_deep", "present_results")

    # Results to clone check
    graph.add_edge("present_results", "check_samples")

    # Clone routing
    graph.add_conditional_edges(
        "check_samples",
        route_clone_check,
        {
            "offer_cloning": "offer_cloning",
            "practice_loop": "practice_loop"
        }
    )

    graph.add_conditional_edges(
        "offer_cloning",
        route_clone_decision,
        {
            "create_clone": "create_clone",
            "practice_loop": "practice_loop"
        }
    )

    graph.add_edge("create_clone", "practice_loop")

    # Practice loop
    graph.add_conditional_edges(
        "practice_loop",
        route_practice_decision,
        {
            "record_practice": "record_practice",
            "end": END
        }
    )

    graph.add_edge("record_practice", "compare_feedback")
    graph.add_edge("compare_feedback", "practice_loop")

    return graph


# ============================================
# COMPILE AND RUN
# ============================================

def create_speech_coach():
    """Create compiled speech coach graph with memory"""
    graph = build_speech_coach_graph()
    memory = MemorySaver()
    return graph.compile(checkpointer=memory)


# Example usage
if __name__ == "__main__":
    app = create_speech_coach()

    # Quick mode example
    initial_state = {
        "session_id": "session_001",
        "user_id": "user_001",
        "mode": "quick",
        "audio_file_path": "/tmp/recording.webm",
        "voice_type": "default_female",
        "sample_count": 0,
        "continue_practice": False,
        "messages": [],
        "practice_attempts": []
    }

    config = {"configurable": {"thread_id": "session_001"}}
    result = app.invoke(initial_state, config)
    print(result)
```

## Node Descriptions

| Node | Description | External API |
|------|-------------|--------------|
| `mode_selection` | Route to Quick or Deep mode | - |
| `upload_context` | Handle document uploads | S3 |
| `analyze_context` | Analyze uploaded docs | Claude |
| `generate_questions` | Create interview questions | Claude |
| `record_audio` | Capture user's audio | Frontend |
| `speech_to_text` | Convert audio to text | Whisper |
| `analyze_content` | Analyze speech quality | Claude |
| `generate_improved_script` | Rewrite with improvements | Claude |
| `select_voice` | Choose TTS voice | - |
| `generate_tts` | Create audio from script | ElevenLabs |
| `present_results` | Display scorecard + audio | - |
| `check_clone_samples` | Verify sample count | - |
| `offer_cloning` | Prompt for voice clone | - |
| `create_voice_clone` | Create voice clone | ElevenLabs |
| `practice_loop` | Handle practice mode | - |
| `compare_feedback` | Compare practice vs improved | Claude |

## State Flow Summary

```
START
  │
  ▼
┌─────────────────┐
│ Mode Selection  │
└────────┬────────┘
         │
    ┌────┴────┐
    ▼         ▼
 Quick      Deep
  Mode      Mode
    │         │
    │    Upload Context
    │         │
    │    Analyze Context
    │         │
    │    Generate Questions
    │         │
    ▼         ▼
 Record ◄────┘
    │
    ▼
 Whisper STT
    │
    ▼
 Claude Analysis
    │
    ▼
 Claude Improve Script
    │
    ▼
 Voice Selection
    │
    ▼
 ElevenLabs TTS
    │
    ▼
 Present Results
    │
    ▼
 Check Clone Samples ──► Offer Cloning ──► Create Clone
    │                         │                  │
    └─────────────────────────┴──────────────────┘
                              │
                              ▼
                       Practice Loop ◄──┐
                              │         │
                      ┌───────┴───────┐ │
                      ▼               ▼ │
                    END          Record Practice
                                      │
                                Compare Feedback
                                      │
                                      └─┘
```
