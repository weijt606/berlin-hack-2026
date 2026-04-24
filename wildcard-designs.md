# Wildcard Project Designs — Big Berlin Hack 2026

> Backup options for the Wildcard track (free theme). Pick based on venue energy, team chemistry, and competition landscape.

---

## Overview

| ID | Product | One-liner | Demo Impact | Difficulty | Rating |
|----|---------|-----------|-------------|------------|--------|
| W1 | **PitchCoach** | Record your pitch → AI scores and coaches you | Very High | Low | ⭐⭐⭐⭐⭐ |
| W2 | **AgentFlow** | Multi-agent task collaboration with live visualization | High | High | ⭐⭐⭐⭐ |
| W3 | **DataStory** | Upload CSV → AI narrative + interactive charts | High | Medium | ⭐⭐⭐⭐ |
| W4 | **ContextDocs** | GitHub repo → auto-generated CLAUDE.md | Medium | Low | ⭐⭐⭐ |
| W5 | **MeetingMind** | Live meeting → decisions, action items, context | High | Medium | ⭐⭐⭐⭐ |
| W6 | **FounderGPT** | AI co-pilot for solo founders: standup + priorities | High | Medium | ⭐⭐⭐⭐ |
| W7 | **BerlinLens** | Explore Berlin neighborhoods with AI insights | High | High | ⭐⭐⭐ |
| W8 | **ShipScope** | Paste URL → full competitive teardown | High | Medium | ⭐⭐⭐⭐ |
| W9 | **VibeCheck** | GitHub repo → AI vs human code detection + vibe score | Very High | Medium | ⭐⭐⭐⭐⭐ |
| W10 | **CostCutter** | Paste prompt → AI rewrites shorter, shows cost savings | High | Low | ⭐⭐⭐⭐ |
| W11 | **HalluciWatch** | Paste AI text → per-sentence fact-check + hallucination index | Very High | Medium | ⭐⭐⭐⭐⭐ |
| W12 | **MCPForge** | Describe API → auto-generate MCP Server + one-click install | Very High | Medium | ⭐⭐⭐⭐⭐ |
| W13 | **Agent Mirror** | Your data → personal context layer that makes AI sound like you | Very High | Medium | ⭐⭐⭐⭐⭐ |

---

## Team

| Role | Member | Focus |
|------|--------|-------|
| Product Manager | [@weijt606](https://github.com/weijt606) | Product design, Pitch |
| Developer | [@juhaodong](https://github.com/juhaodong) | Full-stack development (lead), Pitch |

## Common Tech Stack

```
Frontend:  Next.js 15 + TypeScript + Tailwind CSS + shadcn/ui
Backend:   FastAPI + Python 3.12
Database:  PostgreSQL 16 + Redis 7
AI:        Claude API (Opus 4.6) + Tavily API + Whisper API
Infra:     Docker Compose
```

---

# W1: PitchCoach ⭐⭐⭐⭐⭐

**Record your pitch, get AI coaching in real-time.**

## Why It Wins

- **Meta**: A hackathon tool that helps win hackathons — judges love the irony
- **Demo impact**: Record live on stage → instant AI feedback = wow moment
- **Tech simplicity**: Audio transcription + AI analysis, no complex infra
- **2-person friendly**: Dev builds recording + analysis pipeline, PM designs scoring rubric + demo flow

## Pitch

> "Every hackathon winner says the pitch matters more than the code. But no one practices. PitchCoach listens to your pitch and tells you exactly what to fix — in 30 seconds."

## Architecture

```
┌──────────────────────────────────────┐
│  Frontend (Next.js)                  │
│  ┌──────────┐  ┌──────────────────┐  │
│  │ Recorder  │  │ Analysis View   │  │
│  │ Web Audio │  │ Transcript +    │  │
│  │ Waveform  │  │ Scores + Tips   │  │
│  └─────┬─────┘  └──────┬──────────┘  │
└────────┼───────────────┼─────────────┘
         ▼               ▲
┌──────────────────────────────────────┐
│  Backend (FastAPI)                    │
│  ┌──────────┐  ┌──────────────────┐  │
│  │ Whisper   │  │ Claude API      │  │
│  │ API       │→ │ Pitch Analysis  │  │
│  │ (ASR)     │  │ Score + Coach   │  │
│  └──────────┘  └──────────────────┘  │
└──────────────────────────────────────┘
```

## Data Model

```sql
CREATE TABLE pitches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audio_url TEXT,
  transcript TEXT,
  duration_seconds INT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pitch_id UUID REFERENCES pitches(id),
  overall_score INT,  -- 0-100
  structure_score INT,
  pacing_score INT,
  hook_score INT,
  clarity_score INT,
  filler_word_count INT,
  suggestions JSONB,  -- [{section, issue, suggestion, rewrite}]
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## API Design

```
POST   /api/pitches              — Upload audio, trigger analysis
GET    /api/pitches/:id          — Get pitch + analysis
GET    /api/pitches/:id/analysis — Get detailed scoring
GET    /api/pitches/compare      — Before/After comparison
```

## Core Features (MVP: 3)

1. **Record & Transcribe** — Record via Web Audio API, transcribe with Whisper, show waveform + transcript
2. **AI Scoring** — Structure (8/10), Pacing (6/10), Hook (9/10), Clarity (7/10), filler word detection
3. **Coaching Suggestions** — Per-sentence improvement tips with AI-rewritten alternatives

## Pages (3)

### Page 1: Record
- Big red record button with timer
- Live waveform visualization
- Upload option for existing audio
- "Analyze My Pitch" CTA

### Page 2: Analysis Dashboard
- Overall score (large number, color-coded)
- 4 dimension radar chart (Structure / Pacing / Hook / Clarity)
- Transcript with color-coded highlights (green = strong, yellow = improve, red = weak)
- Filler word counter ("um": 7, "like": 4)

### Page 3: Coaching
- Per-section improvement suggestions
- Side-by-side: original vs AI-rewritten version
- "Key takeaway" summary at top
- Before/After comparison (if multiple recordings)

## Demo Script (90 seconds)

```
Wei & juhaodong 分工:

[0:00-0:15] Wei: Hook
"Every hackathon winner says: the pitch matters more than the code.
 But how do you actually practice? Who gives you honest feedback at 2am?"

[0:15-0:40] juhaodong: Live Demo
- Hit record on stage
- Deliver a 15-second sample pitch
- Stop recording → show real-time processing

[0:40-1:10] Wei: Analysis Walkthrough
- Show scores: "Structure 8/10, but your pacing dropped at the halfway point"
- Show filler words: "You said 'basically' 3 times"
- Show AI coaching: "Your opening is strong. Consider adding a specific 
  number to your problem statement — 'We save teams 40 hours/month'"

[1:10-1:30] Together
juhaodong: "We built this in 36 hours — using PitchCoach to practice 
            our own pitch."
Wei: "This is PitchCoach — your personal pitch trainer."
```

## Dev Timeline (36h)

```
Phase 1 (2h):   Project setup + Whisper API integration
Phase 2 (4h):   Recording UI + audio upload + transcription pipeline
Phase 3 (4h):   Claude API scoring prompt + analysis logic
Phase 4 (4h):   Analysis dashboard + radar chart + transcript highlights
Phase 5 (4h):   Coaching suggestions page + before/after comparison
Phase 6 (4h):   UI polish + demo data + edge cases
Phase 7 (4h):   Pitch prep + rehearsal × 5
Buffer (10h):   Sleep + meals + unexpected issues
```

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Whisper API latency | Demo delay | Pre-process backup audio, show loading animation |
| Scoring consistency | Credibility | Test with 10+ sample pitches, calibrate prompt |
| Live recording fails | Demo broken | Pre-recorded backup + "let me show you one we prepared" |

---

# W2: AgentFlow ⭐⭐⭐⭐

**Multi-agent task collaboration with real-time visualization.**

## Why It Wins

- Visual impact: React Flow real-time animation of agents working
- Matches AI agent trend — judges expect to see agentic systems
- Can use sponsor APIs (Tavily for search agent)

## Pitch

> "You give it one complex task. It splits the work across specialist AI agents — search, analyze, write — and you watch them collaborate in real-time. This is how AI teams will work."

## Architecture

```
┌──────────────────────────────────────┐
│  Frontend (Next.js)                  │
│  ┌──────────────────┐ ┌───────────┐  │
│  │ React Flow Canvas │ │ Task Log  │  │
│  │ Agent Graph +     │ │ Real-time │  │
│  │ Animations        │ │ Updates   │  │
│  └────────┬──────────┘ └─────┬─────┘  │
│           │   WebSocket      │        │
└───────────┼──────────────────┼────────┘
            ▼                  ▲
┌──────────────────────────────────────┐
│  Backend (FastAPI + WebSocket)       │
│  ┌────────────┐                      │
│  │Orchestrator│                      │
│  │  Agent     │                      │
│  └─┬───┬───┬─┘                      │
│    ▼   ▼   ▼                        │
│  ┌──┐ ┌──┐ ┌──┐                     │
│  │🔍│ │📊│ │📝│ Specialist Agents   │
│  └──┘ └──┘ └──┘                     │
│  Search Analyze Write               │
└──────────────────────────────────────┘
```

## Data Model

```sql
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  input_text TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  final_output TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE agent_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES tasks(id),
  agent_type VARCHAR(50),  -- orchestrator/search/analyze/write
  input_text TEXT,
  output_text TEXT,
  status VARCHAR(20),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);
```

## Core Features (MVP: 3)

1. **Task Decomposition** — Orchestrator splits complex task into subtasks for specialist agents
2. **Real-time Visualization** — React Flow canvas shows agent nodes, edges, status animation via WebSocket
3. **Merged Output** — Specialist results merged into coherent final report

## Pages (2)

### Page 1: Task Input + Canvas
```
┌──────────────────────────┬──────────────────┐
│                          │                  │
│  [React Flow Canvas]     │  Task Log:       │
│                          │  • Splitting...  │
│   Orchestrator           │  • Search found  │
│      ↓                   │    12 results    │
│   ┌──┬──┐                │  • Analyzing...  │
│   🔍 📊 📝               │                  │
│   ↓  ↓  ↓                │  Output:         │
│   [Final Output]         │  [Preview...]    │
│                          │                  │
├──────────────────────────┴──────────────────┤
│  [Enter your task...                  Send] │
└─────────────────────────────────────────────┘
```

### Page 2: Result
- Full merged report with section attributions
- Agent performance stats (time, tokens)
- "Run again with different agents" option

## Demo Script (90 seconds)

```
[0:00-0:15] Wei: Hook
"What if you could give one task to an AI team — and watch them 
 figure it out together?"

[0:15-0:50] juhaodong: Live Demo
- Type: "Research Berlin's AI startup ecosystem and create an 
  investment briefing"
- Orchestrator splits into 3 subtasks (animated on canvas)
- Search Agent finds 12 sources (Tavily)
- Analysis Agent processes data
- Writer Agent drafts briefing
- Watch nodes light up in real-time

[0:50-1:20] Wei: Result Walkthrough
- Show merged report: executive summary, key players, funding trends
- "3 agents, 12 sources, 1 coherent briefing — in 45 seconds"

[1:20-1:30] Together
"This is AgentFlow — task in, team out."
```

---

# W3: DataStory ⭐⭐⭐⭐

**Upload CSV → AI generates insight narrative with interactive charts.**

## Why It Wins

- Data science background = unique differentiator
- Strong demo: real data → instant charts + narrative
- Natural language follow-up questions
- Berlin datasets for local resonance

## Pitch

> "Data teams spend 80% of their time preparing data, 20% finding insights. DataStory flips that — upload a CSV, get insights in 30 seconds, and ask follow-up questions in plain English."

## Architecture

```
┌──────────────────────────────────────┐
│  Frontend (Next.js)                  │
│  ┌──────────┐  ┌──────────────────┐  │
│  │ Upload   │  │ Insight View     │  │
│  │ Dropzone │  │ Narrative +      │  │
│  │          │  │ Recharts         │  │
│  └──────────┘  └──────────────────┘  │
│  ┌──────────────────────────────────┐│
│  │ Follow-up Chat                   ││
│  │ "Why did revenue drop in Q3?"    ││
│  └──────────────────────────────────┘│
└──────────────────────────────────────┘
         ▼               ▲
┌──────────────────────────────────────┐
│  Backend (FastAPI)                    │
│  Pandas (parse + stats) → Claude API │
│  (narrative + chart selection)       │
└──────────────────────────────────────┘
```

## Data Model

```sql
CREATE TABLE datasets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  filename VARCHAR(500),
  row_count INT,
  column_count INT,
  columns JSONB,  -- [{name, type, stats}]
  raw_preview JSONB,  -- first 100 rows
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dataset_id UUID REFERENCES datasets(id),
  narrative TEXT,
  charts JSONB,  -- [{type, title, data_key, config}]
  key_findings JSONB,  -- [{finding, confidence, chart_ref}]
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE followups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dataset_id UUID REFERENCES datasets(id),
  question TEXT,
  answer TEXT,
  chart JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Core Features (MVP: 3)

1. **Smart Upload** — Drag & drop CSV/Excel, auto-detect types, distributions, anomalies
2. **Insight Narrative** — AI generates 3-5 key insights as readable story + auto-selected chart types (Recharts)
3. **Follow-up Q&A** — Ask natural language questions, get answers with new charts

## Pages (3)

### Page 1: Upload
- Drag & drop zone (CSV/Excel)
- Data preview table (first 10 rows)
- Column type detection summary
- "Generate Insights" CTA

### Page 2: Insights
- Narrative text with embedded interactive charts
- Key findings cards (insight + confidence + supporting chart)
- Column correlation heatmap

### Page 3: Chat
- Chat interface for follow-up questions
- Each answer comes with a chart if relevant
- Conversation history sidebar

## Demo Script (90 seconds)

```
[0:00-0:15] Wei: Hook
"Data teams spend 80% of their time cleaning data, 20% finding insights.
 What if you could skip straight to the insights?"

[0:15-0:45] juhaodong: Upload Demo
- Drag Berlin rent dataset (CSV) into DataStory
- Auto-detect: 12 columns, 5,000 rows, 3 numeric, 2 categorical
- Click "Generate Insights"

[0:45-1:10] Wei: Insights Walkthrough
- Show narrative: "Rents in Kreuzberg rose 12% YoY, outpacing Mitte by 4%..."
- 3 auto-generated charts: trend line, neighborhood comparison, distribution
- "Every chart is interactive — hover, filter, zoom"

[1:10-1:30] juhaodong: Follow-up
- Type: "Which neighborhood has the best price-to-transit ratio?"
- AI answers with new scatter plot
- "This is DataStory — from raw data to insights in 30 seconds."
```

## Demo Data

Use public Berlin datasets for local resonance with judges:
- Berlin rent prices by neighborhood (2020-2026)
- Berlin startup funding rounds
- Public transit station usage statistics

---

# W4: ContextDocs ⭐⭐⭐

**GitHub repo URL → auto-generated CLAUDE.md context file.**

## Why It Wins

- Developer tools are hackathon favorites
- Technically simple (GitHub API + AI)
- Directly related to CLAUDE.md / AI coding workflow expertise

## Pitch

> "Every AI coding agent needs context to be useful. ContextDocs reads any GitHub repo and generates a complete context file — so Claude, Copilot, or Cursor can understand your codebase instantly."

## Architecture

```
Frontend:  Next.js + Monaco Editor (edit/preview split view)
Backend:   FastAPI + GitHub API (repo analysis) + Claude API (generation)
```

## Core Features (MVP: 3)

1. **Repo Analysis** — Paste URL, auto-analyze: structure, README, dependencies, patterns, key files
2. **Context Generation** — AI generates structured CLAUDE.md: overview, architecture, conventions, key files
3. **Inline Editing** — Edit generated context in Monaco editor, copy/download

## Pages (2)

### Page 1: Input + Generation
- URL input field
- Real-time analysis progress (scanning files... analyzing patterns...)
- Generated context preview

### Page 2: Editor
- Monaco editor (left: edit, right: preview)
- Section toggles (include/exclude sections)
- One-click copy / download as .md
- "Regenerate section" per-section button

## Demo Script (60 seconds)

```
[0:00-0:10] Wei: Hook
"Your AI coding agent is only as good as the context you give it."

[0:10-0:35] juhaodong: Demo
- Paste a popular repo URL (e.g., fastapi/fastapi)
- 30 seconds → complete CLAUDE.md appears
- Show sections: overview, architecture, key files, conventions

[0:35-0:60] Wei: Value
- Edit a section inline
- Download the file
- "Any AI agent can now understand this codebase. This is ContextDocs."
```

---

# W5: MeetingMind ⭐⭐⭐⭐

**Live meeting → AI extracts decisions, action items, and structured context.**

## Why It Wins

- Universal pain point — everyone hates meeting notes
- Strong live demo: talk into mic → structured output appears
- Voice + AI = impressive tech combination

## Pitch

> "Last week your team had 12 meetings. How many had proper notes? MeetingMind listens to your meeting and extracts decisions, action items, and owners — automatically."

## Architecture

```
Frontend:  Next.js + Web Audio API + real-time transcript display
Backend:   FastAPI + Whisper API (streaming ASR) + Claude API (extraction)
Database:  PostgreSQL (meeting history)
```

## Data Model

```sql
CREATE TABLE meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(500),
  audio_url TEXT,
  transcript TEXT,
  duration_seconds INT,
  participant_count INT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE meeting_outputs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id UUID REFERENCES meetings(id),
  decisions JSONB,      -- [{decision, owner, deadline}]
  action_items JSONB,   -- [{action, assignee, due_date, status}]
  key_topics JSONB,     -- [{topic, summary, sentiment}]
  summary TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Core Features (MVP: 3)

1. **Live Transcription** — Record meeting, real-time transcript via Whisper API
2. **Smart Extraction** — AI identifies decisions, action items, key topics, participant roles
3. **Structured Output** — Meeting summary in Markdown with assignee tagging

## Output Format

```markdown
# Meeting: Q2 Planning
> Date: April 25, 2026 | Duration: 12 min | Participants: 3

## Decisions
1. Launch new feature by May 15 — Owner: Alice
2. Switch CI from Jenkins to GitHub Actions — Owner: Bob

## Action Items
- [ ] Alice: Draft feature spec by Monday
- [ ] Bob: Set up GitHub Actions pipeline
- [ ] Wei: Prepare demo data for investor meeting

## Key Discussion Points
- Budget approved for cloud migration (€5,000)
- Hiring frozen until Q3

## Unresolved
- Which cloud provider? (AWS vs GCP — decide next meeting)
```

## Demo Script (90 seconds)

```
[0:00-0:15] Wei: Hook
"Who actually enjoys writing meeting notes? No one.
 But who suffers when there are no notes? Everyone."

[0:15-0:50] Both: Live Meeting Simulation
- Start recording
- Wei + juhaodong have a 30-second mock meeting:
  "Let's launch the feature next Friday. I'll handle the backend,
   you do the frontend. Budget is approved — €5K for cloud."
- Real-time transcript appears on screen

[0:50-1:20] Wei: Result
- Stop recording → AI processes → structured output
- "2 decisions, 3 action items, 1 unresolved — all extracted automatically"
- Show assignee tags and deadlines

[1:20-1:30] juhaodong
"We built this in 36 hours. This is MeetingMind."
```

---

# W6: FounderGPT ⭐⭐⭐⭐

**AI co-pilot for solo founders: daily standup, priorities, and blockers.**

## Why It Wins

- Resonates with solo founder / indie hacker audience (many at hackathon)
- Personal and relatable — judges who are founders will connect
- Not a productivity tool, but a "co-founder replacement"

## Pitch

> "As a solo founder, there's no one to ask: am I working on the right thing? FounderGPT is the co-founder you don't have — it tracks your work, spots blind spots, and tells you when you're avoiding the hard stuff."

## Architecture

```
Frontend:  Next.js + chat UI + dashboard (priority matrix, burnout chart)
Backend:   FastAPI + PostgreSQL (standup history) + Claude API (analysis)
```

## Data Model

```sql
CREATE TABLE standups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  yesterday TEXT,
  today_plan TEXT,
  blockers TEXT,
  energy_level INT,  -- 1-5
  ai_response TEXT,
  ai_priorities JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE weekly_retros (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  week_start DATE,
  summary TEXT,
  patterns JSONB,  -- [{pattern, severity, suggestion}]
  burnout_score INT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Core Features (MVP: 3)

1. **Daily Standup** — Chat interface, AI asks questions, analyzes work patterns
2. **Priority Dashboard** — Urgent/Important matrix, burnout indicator, neglected areas
3. **Weekly Retro** — Auto-generated from week's standups, pattern detection

## Pages (3)

### Page 1: Daily Standup
- Chat interface: "What did you do yesterday?"
- AI follow-up questions based on patterns
- Energy level slider (1-5)

### Page 2: Dashboard
- Priority matrix (Urgent/Important quadrant)
- Burnout risk indicator (based on energy + work patterns)
- Area balance chart (Tech / Product / Marketing / Ops)
- "Neglected areas" alert

### Page 3: Weekly Retro
- Auto-generated summary
- Pattern insights ("You've spent 70% on backend, 0% on marketing")
- Suggested focus shifts
- Progress vs last week

## Demo Script (90 seconds)

```
[0:00-0:15] Wei: Hook
"As a solo founder, there's no one to ask: am I working on the right thing?
 No standup. No manager. No co-founder. Just you and your todo list."

[0:15-0:50] juhaodong: Live Demo
- Open daily standup
- Type yesterday's work and today's plan
- AI responds: "You've been on backend for 5 days straight. 
  Your landing page hasn't been touched. Consider: is backend 
  the bottleneck, or are you avoiding the hard marketing work?"
- Show energy level trending down

[0:50-1:20] Wei: Dashboard + Retro
- Show dashboard: burnout risk rising, marketing neglected
- Show weekly retro: "Pattern detected — scope creep on auth system"
- AI suggestion: "Ship the MVP auth. Perfect is the enemy of shipped."

[1:20-1:30] Together
"This is FounderGPT — the co-founder you don't have."
```

---

# W7: BerlinLens ⭐⭐⭐

**Explore Berlin neighborhoods with AI-powered local insights.**

## Why It Wins

- Local relevance: every judge lives in Berlin
- Visually appealing: map-based UI
- Fun to demo: pick any neighborhood, get instant analysis

## Pitch

> "Everyone in this room lives in Berlin. But do you really know your neighborhood? BerlinLens gives you AI-powered insights on any Berlin Kiez — rent, transit, vibe, and hidden gems."

## Architecture

```
Frontend:  Next.js + Mapbox/Leaflet (map) + Tailwind
Backend:   FastAPI + Tavily API (live data) + Claude API (analysis)
Data:      Public Berlin open data (rent, transit, demographics)
```

## Core Features (MVP: 3)

1. **Interactive Map** — Berlin map with clickable neighborhood boundaries, color-coded by metric
2. **AI Neighborhood Profile** — Click → AI-generated profile (vibe, rent, transit, food, nightlife score)
3. **"Where Should I Live?" Quiz** — Input preferences → AI recommendation with rationale

## Pages (2)

### Page 1: Map Explorer
- Full-screen Berlin map with neighborhood overlays
- Click neighborhood → side panel with AI profile
- Color mode toggle (by rent / transit score / vibe)
- Compare mode: select two neighborhoods side-by-side

### Page 2: Quiz
- 5-question preference quiz (budget, commute, lifestyle, noise, green space)
- AI recommendation: top 3 neighborhoods with scores and rationale
- "Surprise me" random recommendation option

## Demo Script (75 seconds)

```
[0:00-0:10] Wei: Hook
"Everyone in this room lives in Berlin. But do you really know your neighborhood?"

[0:10-0:40] juhaodong: Map Demo
- Click Kreuzberg → AI profile: rent trends, transit score, vibe
- Click Prenzlauer Berg → compare side by side
- Toggle color mode: rent → transit → nightlife

[0:40-1:05] Wei: Quiz
- "I want cheap rent, good coffee, and under 20min to Hauptbahnhof"
- AI recommends: "Wedding. Here's why..."
- Show score breakdown

[1:05-1:15] Together
"This is BerlinLens — your AI guide to Berlin."
```

---

# W8: ShipScope ⭐⭐⭐⭐

**Paste a landing page URL → AI generates full competitive teardown.**

## Why It Wins

- Immediately useful for every startup in the room
- Strong demo: paste ANY URL → instant analysis
- Combines web scraping + AI analysis + data science

## Pitch

> "Before you build, you need to understand who you're up against. Paste any competitor's URL — ShipScope gives you a full teardown in 30 seconds: value prop, pricing, tech stack, SEO, and where to differentiate."

## Architecture

```
Frontend:  Next.js + report viewer + comparison split view
Backend:   FastAPI + Playwright (scraper) + Claude API (analysis)
Search:    Tavily API (competitor research + market context)
```

## Data Model

```sql
CREATE TABLE teardowns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  url TEXT NOT NULL,
  brand_name VARCHAR(200),
  screenshot_url TEXT,
  raw_content TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE teardown_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teardown_id UUID REFERENCES teardowns(id),
  value_prop TEXT,
  pricing JSONB,
  target_audience TEXT,
  tech_stack JSONB,
  seo_analysis JSONB,
  differentiators JSONB,  -- [{opportunity, reasoning, priority}]
  overall_assessment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Core Features (MVP: 3)

1. **URL Scan** — Paste URL → scrape landing page + screenshot + tech detection
2. **AI Teardown** — Value prop analysis, pricing breakdown, audience signals, tech stack, SEO metrics
3. **Differentiation Engine** — AI identifies 3-5 specific opportunities to beat this competitor

## Output Format

```markdown
# Competitive Teardown: competitor.com

## Value Proposition
"AI-powered project management for remote teams"
Strength: Clear, specific. Weakness: Crowded category.

## Pricing Strategy
- Free: 3 projects | Pro: $12/user/mo | Enterprise: Custom
Analysis: Standard SaaS ladder. No annual discount visible.

## Target Audience
Primary: Remote-first startups (10-50 employees)
Signals: "remote", "async", "distributed" appear 14 times

## Tech Stack (detected)
Next.js, Vercel, Stripe, Intercom, Segment

## SEO Analysis
- Top keywords: "remote project management" (pos 7)
- Content strategy: Blog-heavy, 2 posts/week
- Missing: No comparison pages, no alternatives page

## Differentiation Opportunities
1. They lack AI features — position yourself as "AI-native"
2. No mobile app — mobile-first could win
3. No Slack integration — low-hanging fruit
```

## Pages (2)

### Page 1: Input + Scan
- URL input field (large, centered)
- Real-time scan progress (scraping... analyzing... generating...)
- Screenshot preview of target site

### Page 2: Report
- Full teardown report with sections
- Differentiation opportunities highlighted (green cards)
- "Compare with my product" mode (input your URL for side-by-side)
- Export as PDF / Markdown

## Demo Script (90 seconds)

```
[0:00-0:15] Wei: Hook
"Before you build, you need to know who you're up against.
 But competitive research takes days. What if it took 30 seconds?"

[0:15-0:45] juhaodong: Live Demo
- Paste a real startup URL (pick something judges might know)
- Loading: "Scanning... Analyzing... Generating..."
- Full teardown appears in ~30 seconds

[0:45-1:15] Wei: Report Walkthrough
- Value prop: "Clear, but crowded category"
- Pricing: "Standard SaaS ladder, no annual discount"
- Tech stack: "Next.js, Vercel, Stripe"
- Differentiation: "3 specific opportunities to beat them"

[1:15-1:30] Together
"This is ShipScope — competitive intelligence in 30 seconds."
```

---

# W9: VibeCheck ⭐⭐⭐⭐⭐

**GitHub repo → AI detects whether code is human-written or AI-generated.**

## Why It Wins

- **Topical**: Vibe coding is the hottest debate in dev culture right now
- **Entertaining**: Judges will want to scan their own repos — instant engagement
- **Provocative**: "Is your codebase more AI than human?" sparks conversation
- **Demo gold**: Scan a famous repo live → audience reacts to the score

## Pitch

> "Half the code being shipped today was written by AI. But nobody talks about it. VibeCheck scans any GitHub repo and tells you exactly how much was vibe-coded — line by line."

## Architecture

```
┌──────────────────────────────────────┐
│  Frontend (Next.js)                  │
│  ┌──────────┐  ┌──────────────────┐  │
│  │ URL Input │  │ Results View    │  │
│  │           │  │ Vibe Score +    │  │
│  │           │  │ File Heatmap +  │  │
│  │           │  │ Code Highlights │  │
│  └─────┬─────┘  └──────┬──────────┘  │
└────────┼───────────────┼─────────────┘
         ▼               ▲
┌──────────────────────────────────────┐
│  Backend (FastAPI)                    │
│  ┌──────────┐  ┌──────────────────┐  │
│  │ GitHub   │  │ Claude API      │  │
│  │ API      │→ │ Pattern Detect  │  │
│  │ (clone)  │  │ + Scoring       │  │
│  └──────────┘  └──────────────────┘  │
└──────────────────────────────────────┘
```

## Data Model

```sql
CREATE TABLE scans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  repo_url TEXT NOT NULL,
  repo_name VARCHAR(300),
  total_files INT,
  total_lines INT,
  vibe_score FLOAT,  -- 0-100, higher = more AI-generated
  language_breakdown JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE file_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_id UUID REFERENCES scans(id),
  file_path TEXT,
  language VARCHAR(50),
  line_count INT,
  ai_probability FLOAT,  -- 0-1
  signals JSONB,  -- [{line, signal_type, confidence, explanation}]
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## AI Detection Signals

| Signal | Description | Weight |
|--------|-------------|--------|
| Uniform comment style | AI tends to over-comment with consistent format | 0.15 |
| Variable naming patterns | AI prefers descriptive, long names consistently | 0.10 |
| Error handling uniformity | AI adds try/catch everywhere, same pattern | 0.15 |
| Code structure regularity | AI code has suspiciously consistent structure | 0.15 |
| Boilerplate ratio | High boilerplate-to-logic ratio | 0.10 |
| Import organization | AI alphabetizes, groups perfectly every time | 0.05 |
| Commit message patterns | "Add", "Update", "Fix" with consistent format | 0.10 |
| Documentation density | AI-generated code has higher doc-to-code ratio | 0.10 |
| Refactoring absence | AI code rarely refactors — it writes fresh | 0.10 |

## Core Features (MVP: 3)

1. **Repo Scanner** — Paste GitHub URL → clone, analyze file-by-file with Claude API pattern detection
2. **Vibe Score Dashboard** — Overall score (0-100), file heatmap (green=human, purple=AI), language breakdown
3. **Line-by-Line Evidence** — Click any file → highlighted lines with AI signal explanations

## Pages (3)

### Page 1: Scan
- GitHub URL input (large, centered)
- Scan progress: "Analyzing 47 files... 12/47"
- Quick stats preview during scan

### Page 2: Dashboard
- Large Vibe Score gauge (0-100)
- File tree heatmap (color = AI probability)
- Pie chart: estimated human% vs AI%
- Top 5 "most AI" files and "most human" files
- Language breakdown bar chart

### Page 3: File Detail
- Code viewer with line-by-line highlighting
- Side panel: detected AI signals per line
- "This looks AI because..." explanations
- Compare with repo average

## Demo Script (90 seconds)

```
[0:00-0:15] Wei: Hook
"Half the code shipped today was written by AI. Your repo, your 
 teammate's repo, maybe even this hackathon's submissions. 
 But how would you know? Let us show you."

[0:15-0:40] juhaodong: Live Scan
- Paste a well-known open-source repo URL
- Scan runs: "Analyzing 47 files..."
- Vibe Score appears: "73 — This repo is mostly vibe-coded"
- Audience reacts

[0:40-1:10] Wei: Deep Dive
- Show file heatmap: "These files are clearly AI-generated"
- Click a purple file → line-by-line highlights
- "See this? Uniform try/catch blocks, over-commented, 
  suspiciously perfect variable names"
- Click a green file → "This one? Messy, inconsistent, 
  clearly human. And probably the most important file."

[1:10-1:30] Together
juhaodong: "We scanned our own hackathon code — Vibe Score: 89."
Wei: "This is VibeCheck. How vibe-coded is YOUR repo?"
```

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Detection accuracy | Credibility | Focus on patterns, not certainty — "signals" not "proof" |
| Large repos slow | Demo timeout | Limit scan to top 50 files by recent commits |
| Controversial topic | Backlash | Frame as fun/educational, not judgmental |

---

# W10: CostCutter ⭐⭐⭐⭐

**Paste your AI prompt → AI rewrites it shorter, shows real-time cost savings.**

## Why It Wins

- **Universal pain point**: Everyone using AI APIs worries about cost
- **Instant gratification**: Paste → see money saved immediately
- **Technically simple**: Text processing + token counting + AI rewrite
- **Hackathon meta**: Judges are spending money on AI right now

## Pitch

> "Your last Claude call cost $0.47. CostCutter rewrites your prompt to get the same result for $0.08 — and shows you exactly how much you'll save per month."

## Architecture

```
┌──────────────────────────────────────┐
│  Frontend (Next.js)                  │
│  ┌──────────┐  ┌──────────────────┐  │
│  │ Prompt   │  │ Results View     │  │
│  │ Input    │  │ Original vs      │  │
│  │ (large)  │  │ Optimized +      │  │
│  │          │  │ Cost Comparison  │  │
│  └──────────┘  └──────────────────┘  │
└──────────────────────────────────────┘
         ▼               ▲
┌──────────────────────────────────────┐
│  Backend (FastAPI)                    │
│  ┌──────────┐  ┌──────────────────┐  │
│  │ tiktoken │  │ Claude API      │  │
│  │ (count)  │→ │ Rewrite +       │  │
│  │          │  │ Quality Check   │  │
│  └──────────┘  └──────────────────┘  │
└──────────────────────────────────────┘
```

## Data Model

```sql
CREATE TABLE optimizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  original_prompt TEXT NOT NULL,
  optimized_prompt TEXT,
  original_tokens INT,
  optimized_tokens INT,
  token_reduction_pct FLOAT,
  model VARCHAR(50),  -- claude-opus-4/gpt-4o/etc
  original_cost_usd FLOAT,
  optimized_cost_usd FLOAT,
  monthly_savings_usd FLOAT,  -- based on calls_per_month input
  quality_score FLOAT,  -- 0-1 how well optimized matches original intent
  techniques_applied JSONB,  -- [{technique, tokens_saved, description}]
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Optimization Techniques

| Technique | Typical Savings | Description |
|-----------|----------------|-------------|
| Remove redundancy | 15-30% | "Please" / "I want you to" / repeated instructions |
| Compress examples | 20-40% | Reduce few-shot examples to minimal form |
| System prompt extraction | 10-20% | Move static instructions to system prompt (cached) |
| Output format tightening | 5-15% | "Reply in JSON" vs verbose format instructions |
| Context pruning | 10-25% | Remove irrelevant context from the prompt |
| Instruction merging | 5-10% | Combine overlapping instructions |

## Core Features (MVP: 3)

1. **Token Counter** — Paste prompt → instant token count + cost for each model (Claude/GPT/Gemini pricing table)
2. **Smart Rewrite** — AI rewrites prompt applying all optimization techniques, shows before/after diff
3. **Savings Calculator** — Input calls/month → show monthly & yearly savings, with breakdown by technique

## Pages (2)

### Page 1: Input + Analysis
- Large text area for prompt
- Model selector (Claude Opus / Sonnet / Haiku / GPT-4o / Gemini)
- Calls per month input (for savings calc)
- "Optimize" button

### Page 2: Results
- Side-by-side: Original vs Optimized (diff highlighted)
- Token count comparison bar
- Cost comparison: per-call and monthly
- Techniques applied (expandable cards with explanation)
- Quality score: "99% — meaning preserved"
- "Copy optimized prompt" button

## Demo Script (75 seconds)

```
[0:00-0:10] Wei: Hook
"Your AI API bill last month? Probably higher than you expected.
 What if you could cut it by 60% — without changing the output?"

[0:10-0:35] juhaodong: Live Demo
- Paste a real, verbose system prompt (200+ tokens)
- Select "Claude Opus" + "1000 calls/month"
- Click "Optimize"
- Side-by-side appears: 847 tokens → 312 tokens

[0:35-1:00] Wei: Savings Walkthrough
- "Same prompt intent, 63% fewer tokens"
- Show techniques: "Removed 3 redundant instructions, 
  compressed 2 examples, tightened output format"
- Monthly savings: "$142/month → $1,704/year"
- Quality score: 0.98

[1:00-1:15] Together
"This is CostCutter — same output, 60% cheaper."
```

---

# W11: HalluciWatch ⭐⭐⭐⭐⭐

**Paste any AI-generated text → per-sentence fact-check with hallucination index.**

## Why It Wins

- **AI safety angle**: Judges reward responsibility-focused projects
- **Universal need**: Everyone who uses AI worries about hallucination
- **Visual demo**: Red/yellow/green highlighting is immediately understandable
- **Timely**: AI trust is THE topic of 2026

## Pitch

> "AI writes beautifully. But is it true? HalluciWatch checks every sentence against real sources and tells you exactly what's verified, what's questionable, and what's made up."

## Architecture

```
┌──────────────────────────────────────┐
│  Frontend (Next.js)                  │
│  ┌──────────┐  ┌──────────────────┐  │
│  │ Text     │  │ Results View     │  │
│  │ Input    │  │ Highlighted Text │  │
│  │ (paste)  │  │ + Source Cards   │  │
│  │          │  │ + Halluci Index  │  │
│  └──────────┘  └──────────────────┘  │
└──────────────────────────────────────┘
         ▼               ▲
┌──────────────────────────────────────┐
│  Backend (FastAPI)                    │
│  ┌──────────┐  ┌──────────────────┐  │
│  │ Claude   │  │ Tavily API      │  │
│  │ API      │← │ (fact search)   │  │
│  │ (split + │→ │                 │  │
│  │  judge)  │  │                 │  │
│  └──────────┘  └──────────────────┘  │
└──────────────────────────────────────┘
```

## Data Model

```sql
CREATE TABLE checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  input_text TEXT NOT NULL,
  hallucination_index FLOAT,  -- 0-100, higher = more hallucination
  total_claims INT,
  verified_count INT,
  unverified_count INT,
  false_count INT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  check_id UUID REFERENCES checks(id),
  sentence TEXT,
  claim_text TEXT,
  status VARCHAR(20),  -- verified / unverified / false / opinion
  confidence FLOAT,
  sources JSONB,  -- [{url, title, relevant_excerpt}]
  explanation TEXT,
  sentence_index INT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Verification Pipeline

```
Input Text
  ↓
Claude API: Split into claims
  → "Berlin has 3.7 million residents" (factual claim)
  → "It's a great city" (opinion — skip)
  → "The startup ecosystem grew 40% in 2025" (factual claim)
  ↓
Per claim: Tavily search for verification
  → Search: "Berlin population 2026"
  → Found: 3.85M → CLOSE BUT INACCURATE
  ↓
Claude API: Judge each claim
  → Verified ✅ / Unverified ⚠️ / False ❌ / Opinion 💭
  ↓
Calculate Hallucination Index
  → (false × 1.0 + unverified × 0.5) / total_claims × 100
```

## Core Features (MVP: 3)

1. **Claim Extraction** — AI splits text into individual factual claims, filters out opinions
2. **Source Verification** — Tavily searches each claim, Claude judges accuracy against found sources
3. **Hallucination Report** — Color-coded text (green/yellow/red), per-claim sources, overall index score

## Pages (2)

### Page 1: Input
- Large text area ("Paste AI-generated text here")
- "Check for hallucinations" button
- Example texts to try (pre-loaded)

### Page 2: Report
- Hallucination Index gauge (0-100)
- Stats bar: ✅ 12 verified / ⚠️ 3 unverified / ❌ 2 false
- Full text with inline color highlighting
- Click any sentence → expand with sources + explanation
- "Trust score" per paragraph

## Demo Script (90 seconds)

```
[0:00-0:15] Wei: Hook
"Ask any AI to write about your company. It'll sound perfect.
 But is it TRUE? 3 out of 10 facts in AI-generated text are 
 wrong or unverifiable. Let us show you."

[0:15-0:40] juhaodong: Live Demo
- Paste a ChatGPT-generated article about a real topic
- Click "Check for hallucinations"
- Processing: "Extracting claims... 14 found... Verifying..."
- Results appear: text lights up green/yellow/red

[0:40-1:10] Wei: Report Walkthrough
- Hallucination Index: 28 — "Nearly 1 in 3 claims are problematic"
- Click a red sentence: "This statistic doesn't exist in any source"
- Click a green sentence: "Verified by 3 independent sources"
- Click yellow: "Close but inaccurate — actual number is different"

[1:10-1:30] Together
juhaodong: "We fact-checked this text in 15 seconds."
Wei: "This is HalluciWatch — because AI should be trusted, 
      but verified."
```

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Tavily rate limits | Slow verification | Batch searches, cache results |
| Verification accuracy | Wrong judgments | Show confidence scores, let users override |
| Long texts slow | Demo delay | Limit to 500 words for demo, show progress |

---

# W12: MCPForge ⭐⭐⭐⭐⭐

**Describe any API in natural language → auto-generate a complete MCP Server.**

## Why It Wins

- **Perfect timing**: MCP is the infrastructure layer of 2026 AI — everyone's building MCP servers
- **Developer audience**: Every judge and participant uses Claude Code / Cursor
- **Technically impressive**: Code generation + working output in one step
- **Practical value**: People will want to use this AFTER the hackathon

## Pitch

> "There are 10,000 APIs in the world and only 200 MCP servers. MCPForge turns any API documentation into a working MCP server — in 60 seconds. Paste the docs, get the server, install it."

## Architecture

```
┌──────────────────────────────────────┐
│  Frontend (Next.js)                  │
│  ┌──────────┐  ┌──────────────────┐  │
│  │ API Desc │  │ Generated Code   │  │
│  │ Input    │  │ Monaco Editor +  │  │
│  │ (text or │  │ File Tree +      │  │
│  │  URL)    │  │ Install Command  │  │
│  └──────────┘  └──────────────────┘  │
└──────────────────────────────────────┘
         ▼               ▲
┌──────────────────────────────────────┐
│  Backend (FastAPI)                    │
│  ┌──────────┐  ┌──────────────────┐  │
│  │ Tavily   │  │ Claude API      │  │
│  │ (fetch   │→ │ Code Generation │  │
│  │  docs)   │  │ + Validation    │  │
│  └──────────┘  └──────────────────┘  │
└──────────────────────────────────────┘
```

## Data Model

```sql
CREATE TABLE generations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  api_name VARCHAR(200),
  input_type VARCHAR(20),  -- 'text' | 'url' | 'openapi'
  input_content TEXT,
  detected_endpoints JSONB,  -- [{method, path, description, params}]
  generated_code TEXT,
  tool_count INT,
  install_command TEXT,
  npm_package_name VARCHAR(200),
  status VARCHAR(20),  -- generating / validating / ready / error
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE generated_tools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  generation_id UUID REFERENCES generations(id),
  tool_name VARCHAR(100),
  description TEXT,
  parameters JSONB,
  source_endpoint TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Generation Pipeline

```
Input (API description / URL / OpenAPI spec)
  ↓
Step 1: Parse API structure
  → Claude API: Extract endpoints, params, auth, response formats
  ↓
Step 2: Generate MCP Server code
  → index.ts (MCP server entry point)
  → tools/ (one file per tool)
  → types.ts (TypeScript types from API responses)
  → package.json + tsconfig.json
  ↓
Step 3: Validate
  → TypeScript type check
  → MCP protocol compliance check
  ↓
Step 4: Package
  → Generate install command:
    claude mcp add --transport stdio {name} -- npx -y {package}
  → Download as zip / publish to npm (stretch goal)
```

## Core Features (MVP: 3)

1. **API Parser** — Paste docs URL, raw text, or OpenAPI spec → AI extracts all endpoints with params and auth
2. **Code Generator** — Auto-generate complete MCP server: index.ts, tools, types, package.json — viewable in Monaco editor
3. **One-Click Install** — Copy install command for Claude Code, download as zip, or test tools inline

## Pages (3)

### Page 1: Input
- Tab switch: "Paste Text" / "API URL" / "OpenAPI Spec"
- Large input area
- "Generate MCP Server" button
- Example APIs to try (Stripe, GitHub, Weather)

### Page 2: Code View
- File tree (left sidebar)
- Monaco editor (main area) with syntax highlighting
- Generated tool list with descriptions
- Install command (copyable)
- "Download ZIP" button

### Page 3: Test
- Tool selector dropdown
- Parameter inputs (auto-generated from tool schema)
- "Run Tool" button → show response
- Verify the generated server actually works

## Demo Script (90 seconds)

```
[0:00-0:15] Wei: Hook
"There are 10,000 APIs and only 200 MCP servers. Every time you 
 want AI to use a new API, someone has to build a server from 
 scratch. What if it took 60 seconds?"

[0:15-0:45] juhaodong: Live Demo
- Paste Hacker News API docs URL
- Click "Generate MCP Server"
- Watch: "Parsing... 5 endpoints found... Generating tools..."
- Code appears: index.ts, 5 tool files, types, package.json
- Show file tree: clean, professional structure

[0:45-1:10] Wei: Walkthrough + Test
- Show generated tool: "get_top_stories" with parameters
- Copy install command
- Click "Test" → run get_top_stories → real data returns
- "A working MCP server, from docs to install, in 60 seconds"

[1:10-1:30] Together
juhaodong: "We used MCPForge to build the Peec AI MCP server 
            integration for our other project."
Wei: "This is MCPForge — any API, one MCP server, 60 seconds."
```

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Generated code has bugs | Demo failure | Pre-test with 5 APIs, have backup generated servers |
| Complex auth (OAuth) | Can't handle | Focus on API key auth, note OAuth as "coming soon" |
| Large API specs | Slow generation | Limit to top 20 endpoints, let user select |

---

# W13: Agent Mirror ⭐⭐⭐⭐⭐

**A personal context layer that makes your AI agent sound, decide, and work like you.**

## Why It Wins

- **Deep insight**: Not another chatbot — it's about identity and AI personalization
- **Emotional demo**: Side-by-side "generic AI" vs "your AI" is immediately compelling
- **Philosophical edge**: Judges remember projects that make them think
- **Narrative fit**: Connects to the agent-as-extension-of-self trend in 2026

## Pitch

> "Your AI agent should not just know you. It should become more like you. Agent Mirror learns your writing style, decision patterns, and product taste — then generates a personal context layer that makes any AI agent sound like you."

## Architecture

```
┌──────────────────────────────────────┐
│  Frontend (Next.js)                  │
│  ┌──────────┐  ┌──────────────────┐  │
│  │ Data     │  │ Context Preview  │  │
│  │ Upload   │  │ + Side-by-Side   │  │
│  │ (posts,  │  │ Comparison       │  │
│  │  emails, │  │ Generic vs You   │  │
│  │  notes)  │  │                  │  │
│  └──────────┘  └──────────────────┘  │
└──────────────────────────────────────┘
         ▼               ▲
┌──────────────────────────────────────┐
│  Backend (FastAPI)                    │
│  ┌──────────┐  ┌──────────────────┐  │
│  │ Content  │  │ Claude API      │  │
│  │ Parser   │→ │ Style Analysis  │  │
│  │          │  │ + Context Gen   │  │
│  └──────────┘  └──────────────────┘  │
└──────────────────────────────────────┘
```

## Data Model

```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(200),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE input_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES profiles(id),
  source_type VARCHAR(50),  -- x_posts / email / notes / product_idea
  content TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE personal_contexts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES profiles(id),
  context_markdown TEXT,  -- the generated Personal Agent Context
  writing_style JSONB,
  decision_style JSONB,
  product_taste JSONB,
  risk_preference JSONB,
  communication_rules JSONB,
  version INT DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE comparisons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES profiles(id),
  task_prompt TEXT,
  generic_response TEXT,
  mirrored_response TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Input Sources

User provides a mix of personal data:

| Source | What it reveals |
|--------|----------------|
| X/Twitter posts | Public voice, opinions, humor style |
| Emails | Professional tone, decision-making |
| Product ideas / notes | Taste, priorities, thinking patterns |
| Personal notes / journal | Values, what they care about, what they hate |

## Output: Personal Agent Context

```markdown
# Personal Agent Context: Wei

## Writing Style
- Short, direct sentences. Rarely uses filler words.
- Prefers bullet points over paragraphs.
- Uses "→" for causation, not "therefore".
- Occasional dry humor. Never uses emojis in professional contexts.
- Default language: English for technical, Chinese for personal.

## Decision Style
- Bias toward action over analysis. "Ship it, then iterate."
- Values speed over perfection in early stages.
- Defaults to "what's the simplest thing that works?"
- Distrusts consensus — prefers one strong opinion.

## Product Taste
- Loves developer tools and infrastructure.
- Hates feature bloat. "If it needs a tutorial, it's too complex."
- Values sharp positioning over broad appeal.
- Believes distribution > product in early stage.

## Risk Preference
- High tolerance for technical risk, low for market risk.
- Will bet on unproven tech but not unproven demand.
- Prefers reversible decisions made fast.

## Communication Rules
- Reply within 24 hours, keep it under 5 sentences.
- Never start with "I hope this email finds you well."
- Use the person's first name. No "Dear Sir/Madam."
- If saying no, say it in the first sentence.

## Things I Care About
- Founder autonomy and self-reliance.
- Clean, fast user experiences.
- Honest communication without corporate speak.

## Things I Hate
- Unnecessary meetings.
- "Let's circle back" language.
- Products that require sales calls to try.
- Vague roadmaps.

## How to Reply Like Me
- Start with the answer, then explain if needed.
- Use concrete examples, not abstract principles.
- If you disagree, state it directly with reasoning.
- End with a clear next step, never "let me know your thoughts."
```

## Core Features (MVP: 3)

1. **Data Ingestion** — Paste X posts, emails, notes, product ideas → AI analyzes patterns across all sources
2. **Context Generation** — Generate structured Personal Agent Context (Markdown) with 8 dimensions
3. **Mirror Comparison** — Same task prompt → side-by-side: generic ChatGPT vs Agent Mirror response

## Pages (3)

### Page 1: Input
- 4 text areas: X Posts / Emails / Product Ideas / Personal Notes
- Drag & drop for files
- "Generate My Mirror" CTA
- Minimum: at least 2 sources with 3+ entries each

### Page 2: Personal Context
- Generated context document (full Markdown preview)
- Edit inline (adjust any section)
- "Copy as CLAUDE.md" / "Copy as system prompt" buttons
- Confidence indicators per section

### Page 3: Mirror Test
- Task input: "Reply to this investor email" / "Write a product announcement" / etc.
- Side-by-side comparison:
  - Left: Generic AI response
  - Right: Agent Mirror response (using your context)
- Difference highlights

## Demo Script (90 seconds)

```
[0:00-0:15] Wei: Hook
"Your AI assistant writes perfect emails. But they don't sound 
 like YOU. They sound like everyone else. What if your agent 
 could actually think and write like you?"

[0:15-0:35] juhaodong: Input Demo
- Paste 5 X posts, 2 emails, a product idea, personal notes
- Click "Generate My Mirror"
- Personal Agent Context appears

[0:35-0:55] Wei: Context Walkthrough
- "Writing style: short, direct, no filler"
- "Decision style: ship first, iterate later"
- "Things I hate: unnecessary meetings, vague roadmaps"
- "It captured ME — from just a few pieces of content"

[0:55-1:20] Both: The Mirror Test
- Task: "Reply to this investor email asking for a meeting"
- Left (Generic): "Thank you for reaching out. I would be delighted 
  to schedule a meeting at your earliest convenience..."
- Right (Mirror): "Hey [name], interested. Tuesday 3pm works. 
  Here's what I'm building: [one line]. If that's not your 
  thesis, no worries — happy to reconnect later."
- "Same task. One sounds like a template. One sounds like me."

[1:10-1:30] Together
"This is Agent Mirror. Your agent should not just know you.
 It should become more like you."
```

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Not enough input data | Weak context | Provide example templates, lower minimum to 2 sources |
| Context feels generic | Demo falls flat | Use real founder data for demo, show specific quirks |
| Privacy concerns | Audience pushback | Frame as local-only, no data stored, copy-paste your context |

---

# Decision Tree

```
At the venue, evaluate:

├── Want to ride the 2026 AI infrastructure wave?
│     └── W12 (MCPForge) — MCP is THE hot topic
│
├── Want maximum demo impact with minimal risk?
│     └── W1 (PitchCoach) — meta, simple tech
│         or W10 (CostCutter) — instant savings, simple build
│
├── Want AI safety / responsibility angle?
│     └── W11 (HalluciWatch) — judges reward responsible AI
│
├── Want viral / entertaining demo?
│     └── W9 (VibeCheck) — "scan your repo" = instant engagement
│
├── Want to showcase AI agent expertise?
│     └── W2 (AgentFlow) — impressive but complex
│
├── Want to leverage data science background?
│     └── W3 (DataStory) or W8 (ShipScope)
│
├── Want founder/startup angle?
│     └── W6 (FounderGPT) — personal, relatable
│
└── Want local Berlin appeal?
      └── W7 (BerlinLens) — every judge lives here
```

**Top Picks for 2-person team:**
1. **W12 (MCPForge)** — rides the MCP wave, every judge uses AI coding tools
2. **W11 (HalluciWatch)** — AI safety angle, strong visual demo
3. **W9 (VibeCheck)** — most entertaining, viral potential
