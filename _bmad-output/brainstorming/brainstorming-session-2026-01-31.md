---
stepsCompleted: [1, 2, 3]
inputDocuments: []
session_topic: 'AI Speech Coaching Service - Speaking analysis + improved version voice cloning'
session_goals: 'Explore product concepts, features, user experience, and business viability for an AI that analyzes speech like a professional coach and demonstrates improvements using the users own cloned voice'
selected_approach: 'Progressive Technique Flow'
techniques_used: ['Role Playing', 'Six Thinking Hats', 'SCAMPER Method', 'Decision Tree Mapping']
ideas_generated: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23]
context_file: ''
current_phase: 3
---

# Brainstorming Session Results

**Facilitator:** sosoo
**Date:** 2026-01-31

## Session Overview

**Topic:** AI Speech Coaching Service - Speaking analysis + improved version voice cloning

**Goals:** Explore product concepts, features, user experience, and business viability for an AI that analyzes speech like a professional coach and demonstrates improvements using the user's own cloned voice

### Problem Statement

- **Surface Problem:** "I want to be good at presentations/interviews, but even when I practice, I don't know what's wrong"
- **Essential Problem:** Speaking is evaluated by listeners' ears, but we can only hear ourselves. Even when recording and listening back, we just feel "awkward" without understanding why or how to fix it.

### Solution Direction

"AI that analyzes your speaking with the ears of a professional speech coach and directly plays back a better version" - Enhanced with ElevenLabs voice cloning technology to play the improved version in the user's own voice.

### Core Value Propositions

1. **Analysis:** Specifically explains "why it sounds awkward"
2. **Demonstration:** Shows "how to fix it" by playing an improved version
3. **Empathy:** Hearing the improvement in YOUR OWN VOICE makes the difference tangible

### Session Setup

- **Approach Selected:** Progressive Technique Flow (start broad, systematically narrow focus)

## Technique Selection

**Approach:** Progressive Technique Flow
**Journey Design:** Systematic development from exploration to action

**Progressive Techniques:**

- **Phase 1 - Exploration:** Role Playing for maximum idea generation from multiple stakeholder perspectives
- **Phase 2 - Pattern Recognition:** Six Thinking Hats for organizing insights through 6 distinct lenses
- **Phase 3 - Development:** SCAMPER Method for refining concepts through 7 innovation prompts
- **Phase 4 - Action Planning:** Decision Tree Mapping for implementation pathway design

**Journey Rationale:** This progression mirrors natural creative development - starting with empathetic exploration of different user needs, then systematically analyzing, refining, and planning actionable next steps.

---

## Phase 1: Role Playing - Stakeholder Exploration

### Persona 1: Job Seeker Before Interview (취준생)

**Key Insights:**

#### Idea #1: The Frustration of Imitation Impossibility
- **Problem:** Traditional coaching shows "good speakers" but their voice/tone/breathing isn't mine
- **Solution:** This service shows "MY ideal version" not someone else's — discovering my own voice's potential

#### Idea #2: After-First UX Pattern
- **Concept:** Show improved version (After) BEFORE original (Before)
- **Why:** Hearing the "goal state" first makes the gap more tangible when hearing original
- **Implementation:** UI places After button above Before, naturally clicked first

#### Idea #3: Lyrics-Navigation Style Script UI
- **Concept:** Like YouTube Music lyrics, click any sentence in improved script to replay that segment
- **Why:** Non-linear audio exploration, focus practice on problem areas only
- **Example:** Click "안녕하세요, 저는..." → only that segment plays

#### Idea #4: Instant Practice Mode (Listen-Record-Compare Loop)
- **Concept:** Listen to improved version → Record yourself → Compare immediately
- **Why:** Complete learning-execution-feedback cycle in one flow
- **Feel:** Like having a coach right next to you in real-time

### Persona 2: Experienced Professional (경력직 이직/발표)

#### Idea #5: Context-Based Mock Interview Simulation
- **Concept:** Upload resume, project docs, design specs → AI becomes sharp interviewer from target company
- **Questions like:** "Why did you choose Redis in this architecture?"
- **Why:** Existing speech apps only cover "how to speak" — this covers "what to speak" + "handling unexpected questions"

#### Idea #6: True Source of Reduced Nervousness
- **Insight:** Nervousness isn't reduced by filtering filler words
- **Real source:** Relief from "I've practiced expanded scenarios beyond my preparation"
- **Reframe:** Goal shifts from "skill correction" to "situation readiness completion"

#### Idea #7: Category-Based Question Exploration System
- **Categories:**
  - 📂 Self-introduction
  - 📂 Nonsense/Creative questions (Google-style)
  - 📂 Previous job/Reason for leaving
  - 📂 Technical/Career deep-dive
  - 📂 [+ Add custom question]
- **Per category:** Show 1-3 questions, user can go deeper or add own
- **Why:** User controls practice direction, not AI dictating

#### Idea #8: Personal Question History/Collection
- **Concept:** Save practiced questions, favorited questions as personal history
- **Features:** "Questions I'm weak at", "Questions to re-practice"
- **Why:** Long-term growth tracking, not one-time use. Personal question bank accumulates through interview season.

#### Idea #9: Dual Feedback Layer
- **Immediate:** Right after each answer → quick improvement points
- **Comprehensive:** After full session (optional) → pattern analysis, strengths/weaknesses summary
- **Why:** Covers both micro (real-time coaching) and macro (strategic review) perspectives

### Speech Coach Research: What Real Coaches Analyze

#### Voice Delivery Elements
| Element | Description | Measurable Metric |
|---------|-------------|-------------------|
| Pacing | Speeds up when nervous | Words per minute (target: 130-170 WPM) |
| Filler words | 어, 음, 그... | % of total speech (target: <4%) |
| Pitch/Tone | Monotonous vs varied | Pitch variation range |
| Articulation | Mumbling, slurred speech | Recognition rate, clarity score |
| Pauses | Appropriate breaks | Silence length and placement |

#### Content Structure Elements
- Logical organization (topic-first vs conclusion-first)
- Core message clarity
- Storytelling ability
- Persuasiveness (emotional + logical)
- Audience-tailored language

#### Interview-Specific Elements
- Question comprehension
- Answer completeness (STAR method)
- Confidence in tone
- Authenticity (memorized vs natural)

### Feedback Feature Decisions

#### Idea #10: Quantitative Voice Analysis Dashboard
- **Status:** POST-MVP (v1.1 priority)
- **Concept:** Visualize WPM, filler %, pitch variation, pause frequency as numbers

#### Idea #11: Timestamp-Based Problem Marking
- **Status:** Conditional (2+ minute speeches only)
- **Concept:** "3:15 — filler word 'um' 3 times consecutively"

#### Idea #12: Full Criteria Scorecard + High-ROI Combination Recommendations
- **Status:** MVP INCLUDE ✅
- **Replaces:** Original "show only 1-3 points" approach
- **New approach:**
  ```
  📊 Your Speech Analysis Results
  ├─ Logic/Structure      B+
  ├─ Filler words         A
  ├─ Speaking pace        C
  ├─ Confidence/Tone      B
  ├─ Content specificity  C+
  └─ ...

  💡 Most Effective Improvement Combination:
  1. Intentionally slow down pace by 10%
  2. Use topic-first structure
  3. Express experiences with numbers
  → Much more persuasive answers
  ```
- **Why:** No homework feeling, immediately applicable tips, full transparency

#### Idea #13: Sandwich Feedback
- **Status:** REJECTED ❌
- **Reason:** Prefer logical, clean feedback over overly positive/emotional
- **Style:** "Logic B+, Pace C. Slowing down will increase persuasiveness." ✅

#### Idea #14: Content Structure Analysis (STAR)
- **Status:** MVP INCLUDE ✅
- **Note:** See Idea #18 for revised approach

### User Context & Design Principles

#### Idea #15: "Urgent Situation" User Persona
- **Core user:** Has interview TOMORROW or presentation NEXT WEEK
- **NOT:** Long-term learning program participant
- **Need:** Immediate improvement, not "this week's homework"
- **Product tone:** "Instant consulting" not "coaching program"

### Technical Decisions

#### Idea #16: Staged Input Expansion Strategy
- **MVP:** Audio only
- **Post-validation:** Add real-time video analysis
- **Privacy angle:** "We analyze video but never store it" as marketing strength

#### Idea #17: Technical Considerations for Video Expansion
- **Frontend:** Separate webcam permission logic (audio only → audio+video switch easy)
- **Backend:** Reserve `visualFeedback: null` field in analysis result schema
- **API:** Design `/analyze` endpoint with `includeVisual: boolean` parameter
- **Storage:** Include session ID in audio filename → link visual analysis results later

#### Idea #18: STAR Logic Feedback = Score ❌ → Restructuring Suggestion ✅
- **NOT:** "Logic score: B+"
- **INSTEAD:** Narrative feedback with reorganization example
  ```
  📝 Your Answer Flow Analysis:

  Current: Situation → Result → Action → Situation again...
           (Hard for listener to follow)

  💡 Restructuring Suggestion:
  "I faced [Situation] with [Task],
   took [Action], and achieved [Result]"

  Your answer reorganized:
  "In marketing team, we had conversion drop issue (S),
   Goal was 10% improvement in 3 weeks (T),
   Ran 5 A/B tests (A),
   Achieved 15% increase (R)"
  ```
- **Why:** Concrete Before/After example instead of abstract score

---

### Phase 1 Summary

**Total Ideas Generated:** 18
**Key Themes Emerged:**
1. **Self-voice discovery** over imitation of others
2. **Context-aware simulation** beyond speech mechanics
3. **Urgent user** needs immediate, not homework-style feedback
4. **Full transparency** with actionable combination recommendations
5. **Audio-first MVP** with video expansion path

---

## Phase 2: Six Thinking Hats - Pattern Recognition

### ⚪ White Hat: Data & Facts

**What We Know:**
| Area | Fact |
|------|------|
| Technology | ElevenLabs voice cloning API exists, Whisper for STT, Claude for analysis |
| Market | Speech coaching apps exist (Speacher, Yoodli), AI interview systems growing |
| Users | "Urgent situation" — interview tomorrow, presentation next week |
| Coaching Elements | WPM, filler %, pitch variation, STAR structure are measurable |

**To Validate:**
1. Does "hearing improved version in my voice" actually improve learning?
2. What price point will users pay?
3. Is differentiation clearly perceived vs competitors?
4. ElevenLabs API cost structure and margins?

### ❤️ Red Hat: Emotions & Intuition

| Feeling | sosoo | AI Facilitator |
|---------|-------|----------------|
| **Excitement/Confidence** | My voice improved version + context-based | Killer concept, mock interview feature |
| **Worry/Concern** | User journey becoming complex | First-use churn, cloning quality |

**Key Tension Identified:** "Powerful Features" vs "Simple Experience"

### 💛 Yellow Hat: Benefits & Value

| Strength | Description |
|----------|-------------|
| 🎯 Clear Differentiation | "Better version of MY voice" not someone else's example |
| 💰 High Willingness to Pay | Pre-interview/presentation = money-spending moment |
| 🔄 Natural Repeat Usage | Every interview season, presentation season |
| 📈 Expansion Potential | Job seekers → Experienced → Sales → YouTubers → ... |
| 🛡️ Entry Barrier | Voice cloning + Coaching AI combo = hard to copy |
| 📊 Data Accumulation | Per-user growth data → stronger personalization |

### 🖤 Black Hat: Risks & Problems

| Area | Risk | Severity |
|------|------|----------|
| Technology | ElevenLabs cloning quality may not feel like "my voice" | 🔴 High |
| Technology | Sample collection for cloning → longer onboarding | 🟡 Medium |
| Cost | ElevenLabs API costs high → margin pressure | 🔴 High |
| UX | More features = complex user journey | 🔴 High |
| Competition | Big tech (MS, Google) launches similar feature? | 🟡 Medium |
| Market | "Use once and done" — retention problem | 🟡 Medium |
| Legal | Voice cloning misuse concerns → regulation possible | 🟠 Medium |

#### Idea #19: ElevenLabs Cost is Main Bottleneck
- **Finding:** ElevenLabs credits deplete fastest among all APIs
- **Mitigation:** Optional cloning, free tier without cloning

#### Idea #20: Cloning Onboarding Complexity
- **Finding:** Separate voice sample submission adds friction
- **Mitigation:** See Idea #22 for natural collection flow

### 💚 Green Hat: Creative Alternatives

#### Cost Structure Analysis (Research Results)

**ElevenLabs:**
- Creator plan ($22/mo) required for pro-grade cloning
- ~1 credit per character, 100K credits/month on Creator
- Main cost driver for the service

**OpenAI Whisper:**
- $0.006 per minute — very affordable
- 1,000 minutes = $6

**Claude API (Haiku):**
- $1 input / $5 output per million tokens
- Sufficient for feedback generation

**Per-Session Cost Estimate:** ~$0.04 + ElevenLabs credits

#### Idea #21: Voice Cloning as Optional + Default Voice Options
- **Concept:** Cloning is user's choice, not required
- **Default voices:** Male/Female 2 options provided
- **Effect:**
  - Non-cloning users = massive ElevenLabs cost savings
  - Simplified onboarding = immediate usability
  - Cloning positioned as "premium experience"

#### Idea #22: Natural Voice Sample Collection Through Practice
- **Flow:**
  ```
  First use → "Please record 30+ seconds of self-introduction"
           → Analysis + feedback (with default voice)
           → "You have enough samples! Create your voice clone?" [Yes][No]
           → [Yes] → Clone created → Future sessions use your voice
           → [No] → Continue with default voice
  ```
- **Why it works:**
  - No separate onboarding step
  - Practice = sample collection (two birds, one stone)
  - User experiences value BEFORE cloning decision
  - Service usable even if cloning refused

### 💙 Blue Hat: Process Summary

#### Idea #23: Mode Separation for User Journey Simplicity
- **Quick Practice Mode:** Record → Instant feedback (1-min flow)
- **Deep Practice Mode:** Upload context (resume, docs) → Mock interview → Detailed analysis
- **Why:** User chooses depth, prevents feature overload

#### Decisions Confirmed in Phase 2

| Decision | Content |
|----------|---------|
| **Cloning** | Optional (default Male/Female voices provided) |
| **Onboarding** | Natural sample collection through practice → 30sec+ or 3 sessions → offer cloning |
| **Mode Structure** | Two modes: Quick Practice vs Deep Practice (context-based) |
| **Pricing Model** | Decide after MVP (subscription likely) |
| **MVP Priority** | Analysis + improved script is core, cloning is additive |

#### Open Issues for Phase 3/4

| Issue | Status | Next Step |
|-------|--------|-----------|
| User journey complexity | Direction TBD | Refine in Phase 3/4 |
| ElevenLabs cost optimization | Partially solved (optional) | Detail in implementation |
| Retention strategy | TBD | Future discussion |

---

### Phase 2 Summary

**New Ideas Generated:** 4 (#19-22)
**Total Ideas:** 22
**Key Decisions:**
1. Voice cloning = optional, default voices provided
2. Natural sample collection through practice flow
3. ElevenLabs is cost bottleneck → mitigate with optional cloning
4. Pricing model after MVP validation (subscription likely)

---

