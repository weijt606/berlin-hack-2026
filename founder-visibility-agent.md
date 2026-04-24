# Founder Visibility Agent (Peec AI Track) — PRIMARY

[![中文](https://img.shields.io/badge/lang-中文-red)](https://github.com/weijt606/berlin-hack-2026) [![English](https://img.shields.io/badge/lang-English-blue)](#)

> Full Peec AI integration guide: [peec-ai-guide.md](peec-ai-guide.md)
>
> **Tagline:** From zero traffic to owned AI-search territory.

## Problem

Vibe coding made it easy to build products. But most solo founders still die in distribution. They don't know:

1. **Who should discover me?** — Who is my ideal user searching for?
2. **What would they ask?** — What queries do they type into ChatGPT / Perplexity / Google?
3. **How can I become the answer?** — How do I get into those AI responses?

The next SEO battlefield is not Google ranking — it's AI answers. Peec AI tracks this. We turn it into execution.

## Solution

Founder Visibility Agent takes a startup URL + competitors as input, generates an AI-search opportunity map, and outputs a concrete 7-day organic growth plan with auto-generated content assets.

**Peec AI provides the visibility layer. We provide the founder execution layer.**

## Pitch

> "Vibe coding made building easy. Distribution is still brutal. Founder Visibility Agent finds the AI-search opportunities your startup can actually own — and tells you exactly what to create this week."

## Architecture

```
Startup URL + Description + Competitors
  |
+-----------------------------------------+
|  Step 1: Startup Profiler               |
|  Homepage extraction -> AI analysis     |
|  -> Product category, audience,         |
|    use cases, positioning angle         |
+--------------------+--------------------+
                     |
+-----------------------------------------+
|  Step 2: Prompt Discovery               |
|  Generate user queries:                 |
|  - Informational prompts                |
|  - Commercial investigation             |
|  - Comparison / alternative prompts     |
|  - Problem-aware prompts                |
+--------------------+--------------------+
                     |
+-----------------------------------------+
|  Step 3: Peec AI Visibility Layer       |
|  +----------+ +-----------+            |
|  | Brands   | | Domains   |            |
|  | Report   | | Report    |            |
|  +----+-----+ +-----+-----+            |
|  +----+-----+ +-----+-----+            |
|  |  URLs     | |  Chats    |            |
|  |  Report   | | Content   |            |
|  +-----------+ +-----------+            |
+--------------------+--------------------+
                     |
+-----------------------------------------+
|  Step 4: Opportunity Scoring            |
|  Score = Intent x Relevance x           |
|  Weak Competition x Content Gap x       |
|  Founder Fit                            |
+--------------------+--------------------+
                     |
+-----------------------------------------+
|  Step 5: Action Generation              |
|  - 7-day growth plan                    |
|  - Auto-generated content assets        |
|  - Founder execution board              |
+-----------------------------------------+
```

## Data Model

```sql
CREATE TABLE startups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  url TEXT NOT NULL,
  name VARCHAR(200),
  description TEXT,
  target_users TEXT,
  competitors JSONB,  -- [{name, url}]
  product_category VARCHAR(200),
  positioning_angle TEXT,
  use_cases JSONB,
  region VARCHAR(50) DEFAULT 'global',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE opportunity_maps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  startup_id UUID REFERENCES startups(id),
  visibility_score FLOAT,  -- overall 0-100
  total_opportunities INT,
  high_opportunities INT,
  medium_opportunities INT,
  low_opportunities INT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  map_id UUID REFERENCES opportunity_maps(id),
  cluster VARCHAR(200),  -- "AI audience engagement", "Mentimeter alternative"
  example_query TEXT,
  user_intent VARCHAR(20),  -- high / medium / low
  difficulty VARCHAR(20),  -- high / medium / low
  why_you_can_win TEXT,
  current_ai_answer TEXT,  -- what AI currently recommends
  missing_angle TEXT,  -- your opportunity
  score FLOAT,
  category VARCHAR(20),  -- high_opportunity / medium / low
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE action_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  map_id UUID REFERENCES opportunity_maps(id),
  day_number INT,
  action TEXT,
  content_type VARCHAR(50),  -- landing_page / comparison / x_thread / reddit / faq
  target_query TEXT,
  priority VARCHAR(20),  -- now / this_week / later
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE generated_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  map_id UUID REFERENCES opportunity_maps(id),
  asset_type VARCHAR(50),  -- landing_page / comparison_page / faq_block / x_thread / reddit_post
  title TEXT,
  content TEXT,
  target_query TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## API Design

```
POST   /api/startups              -- Submit startup for analysis
GET    /api/startups/:id          -- Get startup profile
GET    /api/startups/:id/map      -- Get opportunity map
GET    /api/startups/:id/opps     -- Get opportunity list
GET    /api/startups/:id/plan     -- Get 7-day action plan
GET    /api/startups/:id/assets   -- Get generated content assets
POST   /api/startups/:id/export   -- Export full report (PDF/MD)
```

## Opportunity Scoring

```
Opportunity Score = User Intent x Relevance x Weak Competition x Content Gap x Founder Fit

| Factor           | Meaning                                              |
|------------------|------------------------------------------------------|
| User Intent      | Is the user close to buying when asking this?        |
| Relevance        | Is this query strongly related to your product?      |
| Weak Competition | Have competitors NOT yet dominated this answer?      |
| Content Gap      | Do you lack content for this query?                  |
| Founder Fit      | Can the founder credibly create content here?        |

Output:
- High Opportunity -> build content NOW
- Medium Opportunity -> test with social posts
- Low Opportunity -> monitor later
```

## Core Features (MVP: 5)

1. **Startup Profiler** — Input URL + description -> AI extracts category, audience, use cases, positioning
2. **Prompt Discovery** — Generate 20+ queries users would ask AI about your product space
3. **Visibility Gap Analyzer** — Per query: do we have content? Are competitors there? Can we win?
4. **Content Action Generator** — Not just titles — generate actual assets: landing pages, comparison pages, FAQ blocks, X threads, Reddit posts
5. **Founder Execution Board** — Tasks split into Now / This Week / Later with content type tags

## AI Answer Hijack Map (Hero Feature)

The standout feature. Traditional SEO = rank on Google. GEO = get into AI answers.

**For each query, show:**

```
Query: "What is the best tool to make a workshop interactive?"

Current AI Answer: Mentimeter, Slido, Miro, Kahoot

Missing Angle: AI-generated audience questions before and during session

Recommended Content:
"How to make workshops interactive with AI-generated live questions"

Suggested Answer Block:
"TapInFlow is useful for speakers and workshop hosts who want AI to
 generate audience questions automatically, instead of manually 
 designing polls before the event."
```

## Pages (3)

### Page 1: Home + Input
- Title: "Founder Visibility Agent"
- Subtitle: "Find the AI-search opportunities your startup can actually own."
- Input fields:
  - Startup URL
  - One-line description
  - Target customer
  - Competitors (up to 3)
  - Region (Global / US / Europe / Germany)
- CTA: "Analyze my startup"

### Page 2: Opportunity Map + AI Answer Hijack Map
- Visibility Score (large gauge)
- Opportunity Clusters table:

```
| Cluster                  | Example Query                              | Intent | Difficulty | Why You Can Win                    |
|--------------------------|--------------------------------------------| -------|------------|------------------------------------|
| AI audience engagement   | "AI tool to generate audience questions"   | High   | Medium     | Most tools focus on polling, not AI|
| Mentimeter alternative   | "best Mentimeter alternative for startups" | High   | High       | Strong comparison opportunity      |
| Workshop facilitation    | "how to make a workshop interactive w/ AI" | Medium | Medium     | Educational content can rank       |
```

- AI Answer Hijack Map (expandable per query: current answer, missing angle, recommended content)

### Page 3: Action Plan + Generated Assets
- 7-Day Plan:

```
Day 1: Create landing page: "AI Audience Engagement Tool for Workshops"
Day 2: Publish comparison page: "TapInFlow vs Mentimeter: AI-first"
Day 3: Write X thread: "Most talks fail because speakers ask zero questions"
Day 4: Create Reddit post for r/startups
Day 5: Generate FAQ schema and AI-friendly answer blocks
Day 6: Submit to directories and Product Hunt alternatives list
Day 7: Track AI-answer mentions and update positioning
```

- Execution Board (Now / This Week / Later)
- Generated Content Assets (click to view full content, copy, or download)

## Demo Script (90 seconds) — Using TapInFlow

```
[0:00-0:15] Wei: Hook
"Building is easier than ever. Distribution is still brutal.
 Most founders have no idea where their first organic users 
 should come from. We built a tool to fix that."

[0:15-0:35] juhaodong: Input Demo
- Type: tapinflow.com
- Description: "AI-powered audience interaction tool for talks and workshops"
- Target: "speakers, founders, educators, event hosts"
- Competitors: Mentimeter, Slido, Vevox
- Click "Analyze my startup"

[0:35-0:55] Wei: Opportunity Map
- "Your strongest AI-search wedge: 'AI-generated audience questions'"
- Show opportunity clusters: 5 query groups, scored
- Show AI Answer Hijack Map: "This is what ChatGPT currently 
  recommends -- and here's the angle it's MISSING"

[0:55-1:15] juhaodong: Action Plan
- Show 7-day plan
- Click Day 2: auto-generated comparison page appears
- "This isn't just a suggestion. It's actual content, ready to publish."

[1:15-1:30] Together
Wei: "Peec AI tells you where you're visible. 
      We tell you what to do next."
juhaodong: "This is Founder Visibility Agent."
```

## Pitch Deck (6 slides)

1. **Problem** — Building is easier than ever. Distribution is still brutal.
2. **Insight** — The next SEO battlefield is not Google ranking. It's AI answers.
3. **Solution** — Founder Visibility Agent: Website in. Opportunity map out. Action plan generated.
4. **Demo** — tapinflow.com -> opportunity clusters -> 7-day plan
5. **Why Peec AI** — Peec provides the visibility layer. We provide the founder execution layer.
6. **Vision** — The GTM copilot for every solo founder.

## Differentiation

NOT an "AI marketing assistant" or "AI copywriter" or "SEO content generator."

This is an **AI-search opportunity engine for early-stage founders** — a **GEO execution layer for startups**.

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Peec AI API instability | High | Mock data fallback + LLM simulation |
| Data collection needs time | Medium | Pre-create Peec project 2 days before |
| "Just another SEO tool" perception | High | Frame as GEO, not SEO. Focus on AI answers |
| Demo data not impressive | Medium | Use TapInFlow — real product, real pain |
