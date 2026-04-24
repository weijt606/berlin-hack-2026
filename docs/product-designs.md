# Product Designs — Big Berlin Hack 2026

[![中文](https://img.shields.io/badge/lang-中文-red)](product-designs.zh.md) [![English](https://img.shields.io/badge/lang-English-blue)](#)

> All product specs for hackathon. Pick based on track availability, team composition, and competition density.

---

## Overview

| Priority    | Track   | Product                      | One-liner                                                          | Prize                |
| ----------- | ------- | ---------------------------- | ------------------------------------------------------------------ | -------------------- |
| 🥇 Primary  | Peec AI | **Founder Visibility Agent** | GEO copilot: find & own AI-search opportunities before competitors | €2,500               |
| 🥈 Backup   | Qontext | **ContextSync**              | Multi-source data → structured context layer for any AI agent      | Gold bar + dinner    |
| 🥈 Backup   | Buena   | **PropertyMind**             | Property data → auto-updating Context Markdown File                | €2,500               |
| 🔄 Wildcard | Free    | **13 options**               | See [wildcard-designs.md](wildcard-designs.md)                     | Finals qualification |

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

# 🥇 Founder Visibility Agent (Peec AI Track) — PRIMARY

> **Full product design:** [founder-visibility-agent.md](founder-visibility-agent.md)
>
> **Peec AI integration guide:** [peec-ai-guide.md](peec-ai-guide.md)
>
> **Tagline:** From zero traffic to owned AI-search territory.

GEO execution copilot for founders. Input startup URL + competitors → AI-search opportunity map → 7-day growth plan with auto-generated content assets.

**Peec AI provides the visibility layer. We provide the founder execution layer.**

### Core Features

1. **Startup Profiler** — URL → AI extracts category, audience, use cases, positioning
2. **Prompt Discovery** — Generate 20+ queries users would ask AI about your product space
3. **Visibility Gap Analyzer** — Per query: do we have content? Are competitors there? Can we win?
4. **Content Action Generator** — Generate actual assets: landing pages, comparison pages, FAQ blocks, X threads
5. **Founder Execution Board** — Tasks split into Now / This Week / Later

### Hero Feature: AI Answer Hijack Map

Traditional SEO = rank on Google. GEO = get into AI answers. For each query, shows current AI answer, missing angle, recommended content, and suggested answer block.

---

# 🥈 ContextSync (Qontext Track)

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

_Context confidence: {score}% | Next sync: {next_sync_time}_
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

| Hours | Task                                        | Output                |
| ----- | ------------------------------------------- | --------------------- |
| 0-2   | Topic confirm + template boot + CLAUDE.md   | Project skeleton      |
| 2-5   | Data models + API endpoints + ingestion     | Backend receives data |
| 5-9   | AI extraction + Context Document generation | Core feature works    |
| 9-13  | Frontend Dashboard + Context preview        | UI takes shape        |
| 13-17 | Agent Chat + real-time updates              | Full flow demable     |
| 17-21 | Sleep 4h + breakfast                        | —                     |
| 21-25 | UI polish + demo data prep                  | Demo-ready            |
| 25-27 | Feature freeze + demo rehearsal             | Submit                |

---

# 🥈 PropertyMind (Buena Track)

> 80% tech overlap with ContextSync. Difference: vertical property domain.

## Problem

Property management data is scattered across ERPs, emails, Slack, and PDF contracts. AI agents need to pull from 5 systems to answer one property question.

## Solution

PropertyMind auto-generates and maintains a Context Markdown File per property — a living document any AI agent can read instantly.

## Pitch

> "We built a system that automatically creates a living Context File for every property — pulling from ERPs, emails, Slack, and PDFs — so any AI agent can instantly understand the full picture."

## Diff from ContextSync

| Dimension    | ContextSync (Qontext)    | PropertyMind (Buena)                    |
| ------------ | ------------------------ | --------------------------------------- |
| Scope        | Generic enterprise       | Vertical: property                      |
| Entity types | People, Projects, Issues | Properties, Tenants, Contracts, Repairs |
| Data sources | Email/CRM/tickets/chat   | ERP/email/Slack/PDF contracts           |
| Output       | Enterprise Context Layer | One Markdown File per property          |
| Demo data    | Mock enterprise data     | Mock Berlin property data               |

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

_Auto-generated by PropertyMind | Sources: ERP, Email, Slack, PDF_
_Last updated: 2 minutes ago_
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

# 🔄 Wildcard Options

> **Full specs for all 13 Wildcard projects:** [wildcard-designs.md](wildcard-designs.md)
