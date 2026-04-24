# Peec AI Integration Guide

> API documentation, MCP Server setup, and data integration for GrowthRadar.

---

## What is Peec AI

Peec AI tracks brand visibility across AI answer engines (ChatGPT, Perplexity, Gemini, Copilot, Grok). It monitors how brands appear in AI-generated responses — visibility scores, sentiment, ranking positions, and source citations.

**Key Metrics:**

| Metric           | Description                          | Range          |
| ---------------- | ------------------------------------ | -------------- |
| `visibility`     | Brand presence in AI answers         | 0-1            |
| `sentiment`      | AI's tone toward the brand           | 0-100          |
| `position`       | Average rank in AI responses         | Lower = better |
| `share_of_voice` | Share of mentions in relevant topics | 0-1            |
| `mention_count`  | Total AI mentions                    | Integer        |

---

## MCP Server Setup (Primary Access Method)

Community-maintained MCP server with **33 tools** (17 read, 16 write).

### Installation

```bash
# Add MCP server to Claude Code
claude mcp add --transport stdio peecai -- npx -y mcp-server-peecai

# Set API key (get from app.peec.ai)
export PEECAI_API_KEY=your_api_key
```

### Verify Connection

In Claude Code, ask: "list all my Peec AI projects" — should return project list.

---

## Available Tools

### Read Tools (17)

| Tool                      | Purpose                      | Key Params                        |
| ------------------------- | ---------------------------- | --------------------------------- |
| `list_projects`           | Get all projects             | —                                 |
| `list_brands`             | Get brands in project        | `project_id`                      |
| `list_prompts`            | Get monitored search queries | `project_id`                      |
| `list_tags`               | Get tags                     | `project_id`                      |
| `list_topics`             | Get topic categories         | `project_id`                      |
| `list_models`             | Get AI model list            | `project_id`                      |
| `list_model_channels`     | Get model channels           | `project_id`                      |
| `list_chats`              | Get AI conversations         | `project_id`                      |
| `get_chat_content`        | Get conversation details     | `chat_id`                         |
| `list_prompt_suggestions` | AI-suggested new queries     | `project_id`                      |
| `list_topic_suggestions`  | AI-suggested new topics      | `project_id`                      |
| `get_brands_report`       | Brand visibility report      | `project_id`, dimensions, filters |
| `get_domains_report`      | Domain citation report       | `project_id`, dimensions, filters |
| `get_urls_report`         | URL-level citation report    | `project_id`, dimensions, filters |
| `get_url_content`         | Get URL content              | `url_id`                          |
| `search_queries`          | Search query analysis        | `project_id`                      |
| `shopping_queries`        | Shopping query analysis      | `project_id`                      |

### Write Tools (16)

| Tool                                                | Purpose                     |
| --------------------------------------------------- | --------------------------- |
| `create_project`                                    | Create new project          |
| `create_brand`                                      | Add brand to track          |
| `create_prompt`                                     | Add search query to monitor |
| `create_tag` / `update_tag` / `delete_tag`          | Tag CRUD                    |
| `create_topic` / `update_topic` / `delete_topic`    | Topic CRUD                  |
| `update_project` / `update_brand` / `update_prompt` | Update operations           |
| `delete_project` / `delete_brand` / `delete_prompt` | Delete operations           |

---

## Report Dimensions & Filters

### Dimensions

Available for `get_brands_report`, `get_domains_report`, `get_urls_report`:

| Dimension          | Groups by                                 |
| ------------------ | ----------------------------------------- |
| `prompt_id`        | Search query                              |
| `model_id`         | AI model (ChatGPT/Perplexity/Gemini etc.) |
| `model_channel_id` | Model channel                             |
| `tag_id`           | Tag                                       |
| `topic_id`         | Topic                                     |
| `date`             | Date                                      |
| `country_code`     | Country                                   |
| `chat_id`          | Conversation                              |

### Domain Classifications

| Type            | Meaning                 |
| --------------- | ----------------------- |
| `OWN`           | Your own domains        |
| `CORPORATE`     | Corporate domains       |
| `COMPETITOR`    | Competitor domains      |
| `EDITORIAL`     | Media/editorial content |
| `REFERENCE`     | Reference material      |
| `INSTITUTIONAL` | Institutional domains   |
| `UGC`           | User-generated content  |
| `OTHER`         | Uncategorized           |

### URL Classifications

`HOMEPAGE` · `PRODUCT_PAGE` · `CATEGORY_PAGE` · `LISTICLE` · `COMPARISON` · `ARTICLE` · `HOW_TO_GUIDE` · `REVIEW` · `FORUM` · `SOCIAL_MEDIA` · `VIDEO` · `DOCUMENTATION` · `CASE_STUDY` · `LANDING_PAGE` · `NEWS`

---

## Data Integration Workflows

### Workflow 1: Brand Visibility Check

```
list_projects → find target project
  → list_brands(project_id) → confirm brands
  → get_brands_report(project_id, dimensions=["model_id"]) → visibility by AI model
```

### Workflow 2: Competitor Analysis

```
get_brands_report(project_id) → all brands visibility comparison
  → get_domains_report(project_id, dimensions=["prompt_id"]) → which queries cite competitors
  → get_urls_report(project_id, dimensions=["prompt_id"]) → which competitor URLs are cited
  → get_chat_content(chat_id) → view actual AI conversation
```

### Workflow 3: Opportunity Mining

```
list_prompts(project_id) → current monitored queries
  → get_brands_report(project_id, dimensions=["prompt_id"]) → brand performance per query
  → find queries where your_visibility LOW but competitor_visibility HIGH → opportunities
  → get_urls_report → see what content types competitors win with
  → Claude API → generate matching content strategy
```

---

## GrowthRadar Data Flow

```
User Input (brand + competitors + industry)
  ↓
Peec AI MCP Server
  ├── get_brands_report → visibility scores
  ├── get_domains_report → domain citations
  └── get_urls_report → URL-level data
  ↓
AI Analysis (Claude API)
  ├── Visibility gap analysis
  ├── Opportunity scoring
  └── Action plan generation
  ↓
Frontend (Next.js)
  ├── Visibility Score dashboard
  ├── Opportunity list (Quick Wins / Growth / Long-term)
  └── 4-week action plan
```

### Opportunity Scoring

```python
score = (
    competitor_visibility * 0.3 +
    (1 - your_visibility) * 0.3 +
    content_gap_factor * 0.2 +
    prompt_volume_estimate * 0.2
)
# 8-10: Quick Win | 5-7: Growth Play | 1-4: Long-term
```

---

## Fallback Strategy

Peec AI collects data via UI scraping — new projects need time to accumulate data.

| Plan              | Approach                                                      |
| ----------------- | ------------------------------------------------------------- |
| **A (Ideal)**     | Create project 2-3 days before event, use real data           |
| **B (Realistic)** | Use demo/sample data from Peec AI or sponsor-provided dataset |
| **C (Fallback)**  | Mock data matching exact Peec AI API response format          |

---

## Pre-Event Checklist

- [ ] Register at app.peec.ai
- [ ] Get API key
- [ ] Install MCP server: `claude mcp add --transport stdio peecai -- npx -y mcp-server-peecai`
- [ ] Create test project + add test brand
- [ ] Run `list_projects` → `get_brands_report` end-to-end
- [ ] Prepare mock data fallback
- [ ] Set up Next.js + FastAPI project template
