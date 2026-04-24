# Pitch to Video — GTM in 60 Seconds

[![中文](https://img.shields.io/badge/lang-中文-red)](pitch-to-video.zh.md) [![English](https://img.shields.io/badge/lang-English-blue)](#)

> **Track:** Peec AI — Marketer-in-a-Box
>
> **Tagline:** Paste your pitch. Get a marketing video optimized for AI-search visibility.
>
> **Status:** Exploring — product design discussion in progress.

---

## Problem

Vibe coding made building easy. But most solo founders still can't answer:

1. **What should I say?** — What messaging resonates with my audience?
2. **Where should I say it?** — Which channels and queries matter?
3. **How do I produce it?** — I can't afford a video team, a copywriter, or a marketing agency.

The result: founders ship products but never ship their story. They die in distribution.

## Insight

The next marketing battlefield is not Google ads — it's AI answers. When someone asks ChatGPT "what's the best tool for X?", your startup needs to be the answer. But most founders don't even know what "X" should be.

**Peec AI knows.** It tracks which brands appear in AI-generated answers, for which queries, on which models. We turn that data into action — and now, into video.

## Solution

Pitch to Video takes a founder's raw pitch (text or audio), optimizes it using Peec AI's visibility data, and generates a ready-to-publish 30-60s marketing video.

**Not a generic "text to video" tool. A GTM copilot that outputs video.**

```
Founder's Pitch (text/audio)
  ↓
┌─────────────────────────────────────┐
│  Step 1: Pitch Parser               │
│  Audio → Whisper transcription      │
│  Text → Claude: extract product,    │
│  audience, value prop, competitors  │
└──────────────┬──────────────────────┘
               ↓
┌─────────────────────────────────────┐
│  Step 2: Peec AI Visibility Layer   │
│  - What queries matter for you?     │
│  - What are competitors saying?     │
│  - What angle is MISSING in AI      │
│    answers right now?               │
│  → Keyword & messaging optimization │
└──────────────┬──────────────────────┘
               ↓
┌─────────────────────────────────────┐
│  Step 3: Script Generator           │
│  Claude: optimized video script     │
│  - Hook (3s)                        │
│  - Problem (5s)                     │
│  - Solution (10s)                   │
│  - Demo/proof (10s)                 │
│  - CTA (5s)                         │
│  + Scene descriptions per segment   │
└──────────────┬──────────────────────┘
               ↓
        ┌──────┴──────┐
        ↓             ↓
┌──────────────┐ ┌──────────────┐
│  Voiceover   │ │  Video Clips │
│  ElevenLabs  │ │  Kling 3.0   │
│  TTS API     │ │  via FAL.AI  │
└──────┬───────┘ └──────┬───────┘
       ↓                ↓
┌─────────────────────────────────────┐
│  Step 4: Compositor                 │
│  FFmpeg: stitch clips + voiceover   │
│  + text overlays + background music │
│  → 30-60s marketing video           │
└──────────────┬──────────────────────┘
               ↓
┌─────────────────────────────────────┐
│  Step 5: Output Package             │
│  - Video file (MP4)                 │
│  - Optimized script (Markdown)      │
│  - AI-search keywords & tags        │
│  - Suggested distribution channels  │
└─────────────────────────────────────┘
```

## Why This Wins at the Hackathon

| Factor | Why |
|--------|-----|
| **Demo impact** | Judge sees a real video generated live — nothing beats that |
| **Story simplicity** | "Paste your pitch, get a video in 60 seconds" — one sentence |
| **Peec AI integration** | Not just showing data — using data to optimize content |
| **Founder resonance** | Every founder in the room has this problem |
| **Technical depth** | Multi-API pipeline (Claude + Peec AI + ElevenLabs + Kling + FFmpeg) |

## Differentiation

| vs. What | Our Edge |
|----------|----------|
| HeyGen / Synthesia | They make generic avatar videos. We make **AI-search-optimized** marketing content. |
| Mootion | They convert pitch decks to video. We **optimize the pitch itself** using real visibility data. |
| Canva video | Template-based. We generate from scratch based on your product + market data. |
| Founder Visibility Agent (FVA) | FVA outputs text assets. This outputs **video** — higher demo impact, same GTM logic. |

## Core Features (MVP: 3)

### Feature 1: Pitch Input + Optimization

- Input: text box OR audio recording (Whisper transcription)
- Claude parses: product, audience, value prop, competitors
- Peec AI layer: "Your pitch mentions 'project management' but the winning AI-search angle is 'async team collaboration' — we'll optimize for that"
- Side-by-side: **Original pitch vs. AI-optimized pitch**

### Feature 2: Video Generation Pipeline

- Auto-generated storyboard (5-6 scenes with descriptions)
- Parallel generation: voiceover (ElevenLabs) + video clips (Kling 3.0)
- FFmpeg compositing: clips + voice + text overlays + background music
- Progress UI: real-time status of each generation step

### Feature 3: GTM Package Output

- Downloadable MP4 video (30-60s)
- Optimized script (copyable Markdown)
- AI-search keywords & suggested tags
- Distribution checklist: "Post this video on X, LinkedIn, Product Hunt with these captions"

## Data Model

```sql
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  startup_name VARCHAR(200),
  startup_url TEXT,
  original_pitch TEXT,
  optimized_pitch TEXT,
  competitors JSONB,
  target_audience TEXT,
  peec_keywords JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE video_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id),
  status VARCHAR(20) DEFAULT 'pending',  -- pending/scripting/generating/compositing/done/failed
  script JSONB,           -- [{scene_id, duration, narration, visual_prompt}]
  voiceover_url TEXT,
  clip_urls JSONB,        -- [{scene_id, url, status}]
  final_video_url TEXT,
  generation_time_ms INT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE gtm_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id),
  video_url TEXT,
  optimized_script TEXT,
  keywords JSONB,
  tags JSONB,
  distribution_plan JSONB,  -- [{channel, caption, best_time}]
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## API Design

```
POST   /api/projects                    — Submit pitch for analysis
GET    /api/projects/:id                — Get project details
POST   /api/projects/:id/optimize       — Run Peec AI optimization
POST   /api/projects/:id/generate       — Start video generation
GET    /api/projects/:id/status         — Poll generation status
GET    /api/projects/:id/video          — Get final video + GTM package
POST   /api/projects/:id/export         — Export full package (video + script + keywords)
```

## Pages (3)

### Page 1: Pitch Input

```
┌─────────────────────────────────────────────────┐
│  Pitch to Video                                 │
│  GTM in 60 seconds.                             │
├─────────────────────────────────────────────────┤
│                                                 │
│  How would you pitch your startup?              │
│                                                 │
│  ┌─────────────────────────────────────────┐    │
│  │                                         │    │
│  │  "TapInFlow is an AI-powered audience   │    │
│  │   interaction tool for speakers and     │    │
│  │   workshop hosts..."                    │    │
│  │                                         │    │
│  └─────────────────────────────────────────┘    │
│                                                 │
│  Or: [🎤 Record your pitch]                     │
│                                                 │
│  Startup URL: [tapinflow.com          ]         │
│  Competitors: [Mentimeter, Slido      ]         │
│                                                 │
│            [✨ Generate my video]                │
│                                                 │
└─────────────────────────────────────────────────┘
```

### Page 2: Optimization + Storyboard

```
┌─────────────────────────────────────────────────┐
│  Pitch Optimization          Powered by Peec AI │
├─────────────────────────────────────────────────┤
│                                                 │
│  Your Pitch              Optimized Pitch        │
│  ┌──────────────┐        ┌──────────────┐       │
│  │ "TapInFlow   │   →    │ "Most talks  │       │
│  │  is an AI    │        │  fail because│       │
│  │  audience    │        │  speakers ask│       │
│  │  tool..."    │        │  zero AI-gen │       │
│  └──────────────┘        │  questions.."│       │
│                          └──────────────┘       │
│                                                 │
│  💡 Peec AI Insight:                            │
│  "AI-generated audience questions" has HIGH     │
│  intent + LOW competition in AI answers.        │
│  Your competitors aren't using this angle.      │
│                                                 │
│  Storyboard:                                    │
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐      │
│  │ 3s  │ │ 5s  │ │ 10s │ │ 10s │ │ 5s  │      │
│  │Hook │ │Pain │ │Soln │ │Demo │ │CTA  │      │
│  └─────┘ └─────┘ └─────┘ └─────┘ └─────┘      │
│                                                 │
│  ⏳ Generating video... (Scene 2/5, ~40s left)  │
│  ████████████░░░░░░░░  60%                      │
│                                                 │
└─────────────────────────────────────────────────┘
```

### Page 3: Video + GTM Package

```
┌─────────────────────────────────────────────────┐
│  Your Marketing Video is Ready! 🎬              │
├─────────────────────────────────────────────────┤
│                                                 │
│  ┌─────────────────────────────────────┐        │
│  │                                     │        │
│  │         [▶ Video Player]            │        │
│  │         30s | 1080p                 │        │
│  │                                     │        │
│  └─────────────────────────────────────┘        │
│                                                 │
│  [📥 Download MP4]  [📋 Copy Script]            │
│                                                 │
│  GTM Package:                                   │
│  ┌─────────────────────────────────────┐        │
│  │ 🎯 AI-Search Keywords:              │        │
│  │ "AI audience questions", "workshop   │        │
│  │  engagement tool", "Mentimeter alt"  │        │
│  │                                      │        │
│  │ 📢 Distribution Plan:               │        │
│  │ □ Post on X with: "Most talks fail  │        │
│  │   because speakers ask zero          │        │
│  │   questions. We fixed that."         │        │
│  │ □ LinkedIn: use optimized script     │        │
│  │ □ Product Hunt: launch with video    │        │
│  └─────────────────────────────────────┘        │
│                                                 │
└─────────────────────────────────────────────────┘
```

## Tech Stack

```
Frontend:   Next.js 15 + TypeScript + Tailwind CSS + shadcn/ui
Backend:    FastAPI + Python 3.12
AI:         Claude API (script generation + pitch optimization)
Visibility: Peec AI MCP Server (keyword & messaging optimization)
Voice:      ElevenLabs API (text-to-speech)
Video:      Kling 3.0 via FAL.AI (text-to-video)
Compositing: FFmpeg (server-side video stitching)
Database:   PostgreSQL 16
Deploy:     Docker Compose
```

## Demo Script (90 seconds) — Using TapInFlow

```
[0:00-0:15] Wei: Hook
"Every founder can build a product in a weekend now.
 But can they ship their story? Most can't.
 We built a tool that does it in 60 seconds."

[0:15-0:30] juhaodong: Input
- Type pitch: "TapInFlow helps speakers engage audiences
  with AI-generated questions"
- Add URL: tapinflow.com
- Add competitors: Mentimeter, Slido
- Click "Generate my video"

[0:30-0:50] Wei: Optimization
- "Peec AI found that 'AI-generated audience questions'
   has high intent but zero competition in AI answers.
   Your competitors aren't using this angle."
- Show side-by-side: original pitch vs. optimized pitch
- Show storyboard generating in real-time

[0:50-1:10] juhaodong: Video Result
- Play the generated 30s marketing video
- "This video was generated in under 60 seconds.
   The script is optimized for AI search visibility."

[1:10-1:30] Together
Wei: "Peec AI tells you what to say.
      We help you say it — in video."
juhaodong: "This is Pitch to Video."
```

## Pitch Deck (6 slides)

1. **Problem** — Founders can build products. They can't ship their story.
2. **Insight** — The next marketing channel is AI answers. Peec AI knows which ones matter.
3. **Solution** — Paste your pitch → AI optimizes it for AI-search visibility → generates a marketing video.
4. **Demo** — TapInFlow pitch → optimized script → 30s video in 60 seconds.
5. **Why Peec AI** — Peec provides the visibility data. We turn it into ready-to-publish content.
6. **Vision** — The GTM copilot for every solo founder. From pitch to market in minutes.

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Video generation slow/fails | High | Storyboard-first UX: show script + scenes immediately, video renders in background. Pre-render backup video for demo. |
| Visual style inconsistency across clips | Medium | Consistent style prefix in all Kling prompts. Limit to 4-5 clips max. |
| Peec AI data not dramatic enough | Medium | Pre-create Peec project for TapInFlow 2 days before. Use mock data as fallback. |
| FFmpeg compositing bugs | Medium | Pre-build FFmpeg template before hackathon. Test with sample clips. |
| "Just another AI video tool" perception | High | Frame as GTM copilot, not video generator. Video is the output, Peec AI data is the brain. |
| ElevenLabs/Kling API rate limits | Medium | Cache generated assets. Have pre-generated backup clips for demo. |

## Dev Timeline (36h)

### Pre-event (before April 25)

| Task | Owner | Status |
|------|-------|--------|
| Register Peec AI + create TapInFlow project | Wei | ⬜ |
| Test Kling 3.0 API via FAL.AI (generate sample clips) | juhaodong | ⬜ |
| Test ElevenLabs TTS API | juhaodong | ⬜ |
| Build FFmpeg compositing template | juhaodong | ⬜ |
| Prepare prompt templates for script generation | Wei | ⬜ |
| Prepare backup demo video (pre-generated) | Wei | ⬜ |

### Hackathon

| Phase | Time | Wei | juhaodong |
|-------|------|-----|-----------|
| 1 | Sat 10:00-12:00 | Check in, talk to Peec AI reps, confirm API access | Project setup, env config, API key setup |
| 2 | Sat 12:00-16:00 | Pitch input UX, prompt engineering for script gen | Backend: pitch parser + Claude script generation |
| 3 | Sat 16:00-20:00 | Test scripts, iterate prompts, Peec integration | Video pipeline: FAL.AI + ElevenLabs + FFmpeg |
| 4 | Sat 20:00-00:00 | End-to-end testing, demo data | Frontend: storyboard UI, progress tracking |
| 5 | Sun 00:00-01:00 | Decision point: feature freeze scope | Bug fixes, fallback paths |
| — | Sun 01:00-07:00 | Sleep | Sleep |
| 6 | Sun 07:00-10:00 | Demo video prep, pitch script, rehearsal x5 | Final bug fixes, pre-render backup, feature freeze |
| 7 | Sun 10:00-15:00 | Joint pitch + live demo | Technical demo + backup switching |

## Relationship to Founder Visibility Agent

Pitch to Video shares the same GTM philosophy as FVA:

| Dimension | FVA | Pitch to Video |
|-----------|-----|----------------|
| Core idea | Find your AI-search opportunities | Ship your story optimized for AI-search |
| Peec AI role | Visibility analysis | Content optimization |
| Output | Text assets (landing pages, X threads) | Video + script + GTM package |
| Demo impact | Tables and action plans | **A real video plays on screen** |
| Complexity | 5 MVP features | 3 MVP features (more focused) |

**Pitch to Video is the more hackathon-friendly version of the same vision.**
