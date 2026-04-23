# Product Designs — Big Berlin Hack 2026

> All product specs for hackathon. Pick based on track availability, team composition, and competition density.

---

## Overview

| Priority | Track | Product | One-liner | Prize |
|----------|-------|---------|-----------|-------|
| 🥇 Primary | Qontext | **ContextSync** | Multi-source data → structured context layer for any AI agent | Gold bar + dinner |
| 🥇 Primary | Buena | **PropertyMind** | Property data → auto-updating Context Markdown File | €2,500 |
| 🥉 Backup | Peec AI | **GrowthRadar** | Competitive visibility → SEO & AI search growth opportunities | €2,500 |
| 🔄 Wildcard 1 | Free | **PitchCoach** | Record your pitch → AI scores and coaches you in real-time | Finals qualification |
| 🔄 Wildcard 2 | Free | **AgentFlow** | Multi-agent task collaboration with real-time visualization | Finals qualification |
| 🔄 Wildcard 3 | Free | **DataStory** | Upload CSV → AI generates insight narrative with charts | Finals qualification |
| 🔄 Wildcard 4 | Free | **ContextDocs** | GitHub repo URL → auto-generated CLAUDE.md context file | Finals qualification |
| 🔄 Wildcard 5 | Free | **MeetingMind** | Live meeting → AI extracts decisions, action items, context | Finals qualification |
| 🔄 Wildcard 6 | Free | **FounderGPT** | AI co-pilot for solo founders: daily standup, priorities, blockers | Finals qualification |
| 🔄 Wildcard 7 | Free | **BerlinLens** | Explore Berlin neighborhoods with AI-powered local insights | Finals qualification |
| 🔄 Wildcard 8 | Free | **ShipScope** | Paste a landing page URL → AI generates full competitive teardown | Finals qualification |

---

## Common Tech Stack

```
Frontend:  Next.js 15 + TypeScript + Tailwind CSS + shadcn/ui
Backend:   FastAPI + Python 3.12
Database:  PostgreSQL 16 + Redis 7
AI:        Claude API (Opus 4.6)
Deploy:    Docker Compose
```

---

# 🥇 ContextSync (Qontext Track)

## Problem

AI systems reconstruct company reality at runtime — pulling scattered facts from email, CRM, policies, tickets, docs, and chat. This doesn't scale.

## Solution

ContextSync continuously extracts, structures, and updates enterprise context from multiple data sources into a standardized Context Layer that any AI agent can consume instantly.

## Pitch (15 sec)

> "We built a context layer that turns your company's scattered data — emails, CRM, tickets, docs — into a single, structured context that any AI agent can use instantly."

## Architecture

```
┌─────────────┐   ┌─────────────┐   ┌─────────────┐
│  Email API  │   │   CRM API   │   │  PDF Upload  │
│  (mock data)│   │  (mock data)│   │  (real file) │
└──────┬──────┘   └──────┬──────┘   └──────┬──────┘
       │                 │                 │
       ▼                 ▼                 ▼
┌──────────────────────────────────────────────┐
│           Data Ingestion Layer               │
│    FastAPI endpoints + file parsing (PyPDF2) │
└──────────────────────┬───────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────┐
│           AI Context Extraction              │
│    Claude API: entity + relation + timeline  │
└──────────────────────┬───────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────┐
│           Context Store (PostgreSQL)          │
│    entities + relations + timeline + refs     │
└──────────────────────┬───────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────┐
│         Context Document Generator           │
│    Structured Markdown / JSON output         │
└──────────────────────┬───────────────────────┘
                       │
            ┌──────────┴──────────┐
            ▼                     ▼
    ┌──────────────┐     ┌──────────────┐
    │  Web UI View │     │  Agent Chat  │
    │  (Next.js)   │     │  (Demo)      │
    └──────────────┘     └──────────────┘
```

## API Design

```
POST   /api/sources              # Add data source (email/CRM/PDF)
GET    /api/sources              # List connected sources
POST   /api/sources/{id}/sync    # Trigger sync
POST   /api/upload               # Upload PDF/doc file

GET    /api/context              # Full context (Markdown/JSON)
GET    /api/context/entities     # Extracted entities
GET    /api/context/timeline     # Event timeline
GET    /api/context/relations    # Entity relationship graph

POST   /api/chat                 # Agent query (answers using context)
GET    /api/health               # Health check
```

## Data Model

```python
class DataSource(Base):
    id: int
    name: str              # "Company Email", "Salesforce CRM"
    type: str              # "email" | "crm" | "document" | "chat"
    status: str            # "connected" | "syncing" | "error"
    last_synced: datetime
    record_count: int

class RawRecord(Base):
    id: int
    source_id: int         # FK → DataSource
    content: str
    metadata: dict
    ingested_at: datetime

class Entity(Base):
    id: int
    name: str              # "Alice Chen", "Project Alpha"
    type: str              # "person" | "project" | "company" | "product"
    attributes: dict       # {"role": "CTO", "email": "..."}
    first_seen: datetime
    last_updated: datetime

class Relation(Base):
    id: int
    source_entity_id: int
    target_entity_id: int
    relation_type: str     # "works_on" | "reports_to" | "owns"
    confidence: float
    evidence_record_id: int

class TimelineEvent(Base):
    id: int
    entity_id: int
    event_type: str        # "created" | "updated" | "mentioned"
    description: str
    occurred_at: datetime
    source_record_id: int
```

## Pages (3)

### Page 1: Dashboard

```
┌─────────────────────────────────────────────┐
│  ContextSync                   [+ Add Source]│
├─────────────────────────────────────────────┤
│                                             │
│  Connected Sources          Context Health  │
│  ┌───────┐ ┌───────┐       ┌────────────┐  │
│  │📧Email│ │📊 CRM │       │ Entities: 47│  │
│  │ 156rec│ │ 89 rec│       │ Relations:23│  │
│  │ ✅Sync│ │ ✅Sync│       │ Events: 112 │  │
│  └───────┘ └───────┘       │ Updated: 2m │  │
│  ┌───────┐ ┌───────┐       │    ago      │  │
│  │📄 PDFs│ │💬 Chat│       └────────────┘  │
│  │ 12 doc│ │234 msg│                       │
│  │ ✅Sync│ │ ⏳Sync│                       │
│  └───────┘ └───────┘                       │
│                                             │
│  Recent Timeline                            │
│  • 10:30 - Alice mentioned Project Alpha    │
│  • 10:15 - New ticket #234 created          │
│  • 09:45 - Contract PDF uploaded            │
└─────────────────────────────────────────────┘
```

### Page 2: Context Document

```
┌─────────────────────────────────────────────┐
│  Context Document   [Markdown] [JSON] [Copy]│
├─────────────────────────────────────────────┤
│                                             │
│  # Company Context                          │
│                                             │
│  ## People                                  │
│  - **Alice Chen** (CTO) — leads Project     │
│    Alpha, last active 2h ago                │
│  - **Bob Mueller** (Sales) — owns 3 deals   │
│                                             │
│  ## Active Projects                         │
│  - **Project Alpha**: Backend migration,    │
│    deadline May 15, 3 open tickets          │
│                                             │
│  ## Recent Decisions                        │
│  - Switched from AWS to GCP (April 20)      │
│  - Hired 2 new engineers (April 18)         │
│                                             │
│  ## Open Issues                             │
│  - Ticket #234: API timeout (P1)            │
│  - Ticket #231: UI bug on mobile (P2)       │
│                                             │
│  *Auto-generated by ContextSync*            │
│  *Last updated: 2 minutes ago*              │
└─────────────────────────────────────────────┘
```

### Page 3: Agent Chat

```
┌─────────────────────────────────────────────┐
│  Ask your Context             Powered by 🤖 │
├─────────────────────────────────────────────┤
│                                             │
│  User: Who is working on Project Alpha?     │
│                                             │
│  Agent: Alice Chen (CTO) is leading Project │
│  Alpha. The project is a backend migration  │
│  with a deadline of May 15. There are 3     │
│  open tickets including a P1 API timeout.   │
│  📎 Sources: Email #45, Ticket #234, CRM   │
│                                             │
│  ┌─────────────────────────────────┐        │
│  │ Type your question...     [Send]│        │
│  └─────────────────────────────────┘        │
└─────────────────────────────────────────────┘
```

## Context Document Output Format

```markdown
# [Company Name] Context
> Auto-generated by ContextSync | Last updated: {timestamp}
> Sources: {source_count} sources, {record_count} records

## People
- **{name}** ({role}) — {summary}, last active {time_ago}

## Active Projects
- **{project}**: {description}, deadline {date}, {tickets} open tickets

## Recent Decisions
- {description} ({date})

## Open Issues
- {ticket_id}: {title} ({priority})

## Timeline (Last 7 Days)
- {date} — {event}

---
*Context confidence: {score}% | Next sync: {next_sync_time}*
```

## Demo Script (90 sec)

```
[0:00]  Open Dashboard → "This is ContextSync. We've connected
        4 data sources for a demo company."

[0:15]  Click "Sync All" → show data being pulled and processed
        (pre-loaded, already complete)

[0:25]  Switch to Context Document → "In seconds, we generated
        a structured context document from scattered company data."

[0:40]  Scroll through People/Projects/Decisions/Issues →
        "Every entity, relationship, and timeline — extracted
        and structured automatically."

[0:55]  Switch to Agent Chat → type "Who is working on Project
        Alpha and what's blocking them?"

[1:05]  Agent answers → "The agent uses our context layer to
        answer instantly — no runtime data reconstruction."

[1:20]  Upload a new PDF → Context Document auto-updates →
        "When new data comes in, the context updates automatically."

[1:30]  End → "This is ContextSync — the context layer that
        fixes AI's runtime data problem."
```

## Dev Timeline (36h)

| Hours | Task | Output |
|-------|------|--------|
| 0-2 | Topic confirm + template boot + CLAUDE.md | Project skeleton |
| 2-5 | Data models + API endpoints + ingestion | Backend receives data |
| 5-9 | AI extraction + Context Document generation | Core feature works |
| 9-13 | Frontend Dashboard + Context preview | UI takes shape |
| 13-17 | Agent Chat + real-time updates | Full flow demable |
| 17-21 | Sleep 4h + breakfast | — |
| 21-25 | UI polish + demo data prep | Demo-ready |
| 25-27 | Feature freeze + demo rehearsal | Submit |

---

# 🥇 PropertyMind (Buena Track)

> 80% tech overlap with ContextSync. Difference: vertical property domain.

## Problem

Property management data is scattered across ERPs, emails, Slack, and PDF contracts. AI agents need to pull from 5 systems to answer one property question.

## Solution

PropertyMind auto-generates and maintains a Context Markdown File per property — a living document any AI agent can read instantly.

## Pitch

> "We built a system that automatically creates a living Context File for every property — pulling from ERPs, emails, Slack, and PDFs — so any AI agent can instantly understand the full picture."

## Diff from ContextSync

| Dimension | ContextSync (Qontext) | PropertyMind (Buena) |
|-----------|----------------------|---------------------|
| Scope | Generic enterprise | Vertical: property | 
| Entity types | People, Projects, Issues | Properties, Tenants, Contracts, Repairs |
| Data sources | Email/CRM/tickets/chat | ERP/email/Slack/PDF contracts |
| Output | Enterprise Context Layer | One Markdown File per property |
| Demo data | Mock enterprise data | Mock Berlin property data |

## Context File Example

```markdown
# Kastanienallee 42, 10435 Berlin

## Property Overview
- **Type**: Residential, 3-bedroom apartment
- **Size**: 85 m² | **Floor**: 3rd | **Built**: 1920
- **Monthly Rent**: €1,200 (cold) + €200 (utilities)
- **Status**: Occupied

## Current Tenant
- **Name**: Maria Schmidt
- **Since**: 2024-03-01
- **Contract**: Unlimited, 3-month notice
- **Payment Status**: ✅ All payments on time

## Maintenance History
- 2026-04-10: Heating repair (completed, €340)
- 2026-02-15: Window replacement (pending)
- 2025-11-20: Kitchen renovation (completed, €2,100)

## Recent Communications
- 2026-04-18: Tenant email — noise complaint
- 2026-04-05: ERP — rent increase notice sent
- 2026-03-20: Slack — window replacement timeline

## Open Actions
- [ ] Window replacement — contractor booked May 5
- [ ] Noise complaint — pending response

## Financial Summary (2026 YTD)
- Rental Income: €4,800 | Maintenance: €340 | Net: €4,460

---
*Auto-generated by PropertyMind | Sources: ERP, Email, Slack, PDF*
*Last updated: 2 minutes ago*
```

## Pages (3)

1. **Properties List** — Property cards with status, search/filter
2. **Property Context** — Single property Context File preview + source tracing
3. **Agent Chat** — "Ask about any property"

## Demo Script Diff

Same structure as ContextSync, but with Berlin property data:
- "This property at Kastanienallee 42 has data scattered across ERP, email, and Slack..."
- Upload a PDF lease contract → auto-extract tenant, rent, contract terms
- Agent: "When is the next maintenance scheduled for this property?"

---

# 🥉 GrowthRadar (Peec AI Track)

## Problem

Early-stage startups don't know which keywords they can win — competitors already occupy positions, and there's no clear attack direction.

## Solution

GrowthRadar uses Peec AI's competitive visibility data to auto-generate SEO and AI search growth opportunity reports.

## Pitch

> "We built a growth radar that analyzes your competitors' search visibility and finds the exact organic and AI search opportunities you should own — from zero to first page."

## Architecture

```
┌──────────────────┐
│  User Input      │
│  - Own domain    │
│  - Competitors   │
│  - Industry      │
└────────┬─────────┘
         ▼
┌──────────────────┐
│  Peec AI API     │
│  - Keyword ranks │
│  - Search volume │
│  - Competition   │
└────────┬─────────┘
         ▼
┌──────────────────┐
│  AI Analysis     │
│  Claude API      │
│  - Opportunities │
│  - Prioritization│
│  - Strategy gen  │
└────────┬─────────┘
         ▼
    ┌────┴────┐
    ▼         ▼
┌────────┐ ┌────────┐
│Dashboard│ │ Action │
│   UI   │ │  Plan  │
└────────┘ └────────┘
```

## Core Features (MVP: 3)

1. **Competitor Gap Analysis** — Your domain vs competitors, keyword gap visualization
2. **Opportunity Finder** — AI identifies low-competition, high-volume keywords
3. **Action Plan Generator** — Specific content strategy per opportunity

## Pages (3)

### Page 1: Setup
- Input: own domain, up to 3 competitor domains, industry dropdown
- One big "Analyze" button

### Page 2: Opportunity Dashboard
- Quick Wins (green) / Growth Opportunities (yellow) / Competitive (red)
- Bar chart: You vs Competitors keyword coverage
- Score: overall opportunity rating

### Page 3: Action Plan
- Week-by-week content strategy
- Per-keyword: target position, content type, estimated traffic gain
- Export as PDF / Markdown

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Unfamiliar Peec AI API | Dev time increase | Must pre-research API before event |
| Data quality unknown | Poor demo | Prepare mock data as fallback |
| Track competition | Others build SEO tools too | Emphasize AI insights over dashboards |

---

# 🔄 Wildcard Options

## W1: PitchCoach ⭐⭐⭐⭐⭐

**Record your pitch, get AI coaching in real-time.**

### Why It Wins
- **Meta**: A hackathon tool that helps win hackathons — judges love the irony
- **Demo impact**: Record live on stage → instant AI feedback = wow moment
- **Tech simplicity**: Audio transcription + AI analysis, no complex infra

### Core Features
1. Record or upload pitch audio/video
2. AI transcribes + analyzes (pacing, structure, keywords, emotion, filler words)
3. Per-sentence scoring + improvement suggestions
4. Before/After comparison view
5. Pitch timer with visual pacing guide

### Architecture
```
Frontend:  Next.js + Web Audio API (recording) + waveform visualization
Backend:   FastAPI + Whisper API (transcription) + Claude API (analysis)
```

### Pages
1. **Record** — Big record button, timer, waveform
2. **Analysis** — Transcript with highlights, scores (Structure 8/10, Pacing 6/10, Hook 9/10)
3. **Suggestions** — Per-section improvement tips, rewritten alternatives

### Demo Script
```
"Every hackathon winner says: the pitch matters more than the code.
But how do you practice?"
→ Record 30-sec pitch on stage
→ AI analysis appears: scores, highlights, suggestions
→ "Your opening is strong, but slow down at 0:15. Consider adding
   a specific number to your problem statement."
→ "This is PitchCoach — your personal pitch trainer."
```

---

## W2: AgentFlow ⭐⭐⭐⭐

**Multi-agent task collaboration with real-time visualization.**

### Why It Wins
- Matches my daily experience (multi-agent workflows)
- Visual impact: React Flow real-time animation of agents working
- Uses sponsor APIs: Tavily (Search Agent), Entire (collaboration protocol)

### Core Features
1. User inputs complex task ("Research Berlin's AI startup ecosystem")
2. Orchestrator Agent decomposes into subtasks
3. Specialist Agents execute in parallel (search, analyze, summarize)
4. React Flow visualizes agent communication and progress in real-time
5. Final output: merged report

### Architecture
```
Frontend:  Next.js + React Flow (agent graph) + WebSocket (real-time)
Backend:   FastAPI + WebSocket + async task queue
AI:        Claude API (Orchestrator + Analysis)
           Tavily API (Search Agent)
```

### Page Layout
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

---

## W3: DataStory ⭐⭐⭐⭐

**Upload CSV → AI generates insight narrative with interactive charts.**

### Why It Wins
- Data science background = unique differentiator
- Strong demo: real data → instant charts + narrative
- Natural language follow-up questions

### Core Features
1. Upload CSV/Excel
2. AI auto-detects structure, distributions, anomalies
3. Generates 3-5 key insights (natural language narrative)
4. Auto-selects best chart types and renders interactively
5. Follow-up Q&A ("Why did revenue drop in Q3?")

### Architecture
```
Frontend:  Next.js + Recharts (interactive charts) + Tailwind
Backend:   FastAPI + Pandas (data processing) + Claude API (insights)
```

### Demo Data
Use public Berlin datasets (rent prices, population, startups) — local resonance with judges.

### Demo Script
```
"Data teams spend 80% of their time preparing data, 20% finding insights."
→ Upload Berlin rent dataset (CSV)
→ AI generates: "Rents in Kreuzberg rose 12% YoY, outpacing Mitte..."
→ 3 auto-generated charts appear
→ Ask: "Which neighborhood has the best price-to-transit ratio?"
→ AI answers with new chart
→ "This is DataStory — from raw data to insights in 30 seconds."
```

---

## W4: ContextDocs ⭐⭐⭐

**GitHub repo URL → auto-generated CLAUDE.md context file.**

### Why It Wins
- Directly related to CLAUDE.md design expertise
- Developer tools are hackathon favorites
- Technically simple (GitHub API + AI analysis)

### Core Features
1. Input GitHub repo URL
2. Auto-analyze: directory structure, README, main files, dependencies, patterns
3. Generate structured Context Document (CLAUDE.md format)
4. Customize and edit inline
5. One-click copy/download

### Architecture
```
Frontend:  Next.js + Monaco Editor (edit/preview)
Backend:   FastAPI + GitHub API + Claude API
```

### Demo Script
```
→ Paste a popular open-source repo URL (e.g., fastapi/fastapi)
→ 30 seconds → complete CLAUDE.md generated
→ Show sections: project overview, architecture, key files, conventions
→ "Any AI coding agent can now understand this codebase instantly."
```

---

## W5: MeetingMind ⭐⭐⭐⭐

**Live meeting audio → AI extracts decisions, action items, and structured context.**

### Why It Wins
- Universal pain point — everyone hates meeting notes
- Strong live demo: talk into mic → structured output appears
- Combines voice transcription + AI structuring (similar to Qontext approach)

### Core Features
1. Record meeting audio (live or upload)
2. Real-time transcription (Whisper API)
3. AI extracts: decisions, action items, key topics, participant roles
4. Generates structured meeting summary (Markdown)
5. Auto-assigns action items to participants

### Architecture
```
Frontend:  Next.js + Web Audio API + real-time transcript display
Backend:   FastAPI + Whisper API (transcription) + Claude API (extraction)
```

### Output Format
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
- Customer feedback on pricing: "too expensive for startups"

## Unresolved
- Which cloud provider? (AWS vs GCP — decide next meeting)
```

### Demo Script
```
→ "Who actually enjoys writing meeting notes?"
→ Start recording, have a 60-second mock meeting conversation
→ Real-time transcript appears
→ Stop recording → AI processes → structured summary appears
→ "Decisions, action items, owners — all extracted automatically."
→ "This is MeetingMind."
```

---

## W6: FounderGPT ⭐⭐⭐⭐

**AI co-pilot for solo founders: daily standup, priorities, and blockers.**

### Why It Wins
- Resonates with solo founder / OPC audience (many at hackathon)
- Personal and relatable — judges who are founders will connect
- Unique angle: not a productivity tool, but a "co-founder replacement"

### Core Features
1. Daily standup prompt: "What did you do yesterday? What's today's plan?"
2. AI analyzes patterns: burnout risk, scope creep, neglected areas
3. Priority matrix: Urgent/Important with AI recommendations
4. Weekly retrospective auto-generated
5. Context memory: remembers past standups and decisions

### Architecture
```
Frontend:  Next.js + chat UI + dashboard
Backend:   FastAPI + PostgreSQL (standup history) + Claude API
```

### Pages
1. **Daily Standup** — Chat interface, AI asks questions, suggests priorities
2. **Dashboard** — Priority matrix, burnout indicator, progress trends
3. **Weekly Retro** — Auto-generated from week's standups

### Demo Script
```
→ "As a solo founder, there's no one to ask: am I working on the right thing?"
→ Open daily standup → type yesterday's work and today's plan
→ AI responds: "You've been on backend for 5 days straight. 
   Your landing page hasn't been touched. Consider: is backend 
   the bottleneck, or are you avoiding the hard marketing work?"
→ Show dashboard: burnout risk rising, marketing neglected
→ "This is FounderGPT — the co-founder you don't have."
```

---

## W7: BerlinLens ⭐⭐⭐

**Explore Berlin neighborhoods with AI-powered local insights.**

### Why It Wins
- Local relevance: every judge lives in Berlin
- Visually appealing: map-based UI
- Fun to demo: pick any neighborhood, get instant AI analysis

### Core Features
1. Interactive Berlin map with neighborhood boundaries
2. Click a neighborhood → AI-generated profile (vibe, rent, transit, food, nightlife)
3. Compare two neighborhoods side by side
4. "Where should I live?" quiz → AI recommendation
5. Data sources: public Berlin data + Tavily web search

### Architecture
```
Frontend:  Next.js + Mapbox/Leaflet (map) + Tailwind
Backend:   FastAPI + Tavily API (live data) + Claude API (analysis)
Data:      Public Berlin datasets (rent, transit, demographics)
```

### Demo Script
```
→ "Everyone in this room lives in Berlin. But do you really know your neighborhood?"
→ Click on Kreuzberg → AI profile appears: rent trends, transit score, vibe description
→ Compare Kreuzberg vs Prenzlauer Berg side by side
→ Take the quiz: "I want cheap rent, good coffee, and under 20min to Hauptbahnhof"
→ AI recommends: "Wedding. Here's why..."
→ "This is BerlinLens."
```

---

## W8: ShipScope ⭐⭐⭐⭐

**Paste a landing page URL → AI generates full competitive teardown.**

### Why It Wins
- Immediately useful for every startup in the room
- Strong demo: paste ANY URL → instant analysis
- Combines web scraping + AI analysis + data science

### Core Features
1. Paste any landing page URL
2. AI scrapes and analyzes: value prop, pricing, target audience, tech stack, SEO
3. Generates competitive teardown report
4. Compares against your own product (optional)
5. Suggests differentiation strategies

### Architecture
```
Frontend:  Next.js + report viewer + comparison UI
Backend:   FastAPI + web scraper (BeautifulSoup/Playwright) + Claude API
Search:    Tavily API (competitor research)
```

### Output Format
```markdown
# Competitive Teardown: competitor.com

## Value Proposition
"AI-powered project management for remote teams"
Strength: Clear, specific. Weakness: Crowded category.

## Pricing Strategy
- Free tier: 3 projects
- Pro: $12/user/mo
- Enterprise: Custom
Analysis: Standard SaaS ladder. No annual discount visible.

## Target Audience
Primary: Remote-first startups (10-50 employees)
Signals: "remote", "async", "distributed" appear 14 times

## Tech Stack (detected)
Next.js, Vercel, Stripe, Intercom, Segment

## SEO Analysis
- Domain authority: 35
- Top keywords: "remote project management" (pos 7)
- Content strategy: Blog-heavy, 2 posts/week

## Differentiation Opportunities
1. They lack AI features — position yourself as "AI-native"
2. No mobile app — mobile-first could win
3. No integration with Slack — low-hanging fruit
```

### Demo Script
```
→ "Before you build, you need to understand who you're up against."
→ Paste a real startup URL (pick something judges might know)
→ 30 seconds → full teardown appears
→ Scroll through: value prop, pricing, tech stack, SEO
→ Show differentiation suggestions
→ "This is ShipScope — competitive intelligence in 30 seconds."
```

---

## Wildcard Decision Tree

```
At the venue, evaluate:

├── Found a strong frontend/design teammate?
│     ├── Yes → W2 (AgentFlow — needs good UI)
│     │         or W7 (BerlinLens — map UI)
│     └── No  → W1 (PitchCoach) or W8 (ShipScope)
│
├── Want maximum demo impact?
│     ├── Live interaction → W1 (PitchCoach — record on stage)
│     │                      or W5 (MeetingMind — talk live)
│     └── Instant result   → W8 (ShipScope — paste URL, get report)
│                            or W3 (DataStory — upload CSV, get charts)
│
├── Want to leverage data science background?
│     └── W3 (DataStory) or W8 (ShipScope)
│
├── Want founder/startup angle?
│     └── W6 (FounderGPT) or W8 (ShipScope)
│
└── Want to stay close to main track theme (context)?
      └── W4 (ContextDocs) or W5 (MeetingMind)
```
