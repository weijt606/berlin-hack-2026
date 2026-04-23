# Berlin Hack 2026

Product designs and preparation for [Big Berlin Hack 2026](https://lu.ma/bigberlinhack) (April 25-26, Berlin).

## Project Ideas

| Priority | Track | Product | One-liner |
|----------|-------|---------|-----------|
| Primary | Peec AI | **GrowthRadar** | AI search visibility → growth opportunity radar for startups |
| Backup | Qontext | **ContextSync** | Multi-source data → structured context layer for AI agents |
| Backup | Buena | **PropertyMind** | Property data → auto-updating Context Markdown File |
| Wildcard | Free | **8 options** | See [product-designs.md](product-designs.md) |

## Team

| Role | Member | Focus |
|------|--------|-------|
| Product Manager | [@weijt606](https://github.com/weijt606) | Product design, Pitch, Dev (assist) |
| Developer | [@juhaodong](https://github.com/juhaodong) | Full-stack development (lead), Pitch |

## Quick Links

- [Product Designs](product-designs.md) — Track product specs (GrowthRadar, ContextSync, PropertyMind)
- [Wildcard Designs](wildcard-designs.md) — 8 Wildcard project specs with full architecture + demo scripts
- [Peec AI Guide](peec-ai-guide.md) — Peec AI API, MCP Server setup, data integration
- [Tech Stack](product-designs.md#common-tech-stack) — Next.js + FastAPI + PostgreSQL + Claude API

## Tech Stack

- **Frontend:** Next.js 15, TypeScript, Tailwind CSS, shadcn/ui
- **Backend:** FastAPI, Python 3.12, PostgreSQL 16, Redis 7
- **AI:** Claude API (Opus 4.6), Tavily API, Whisper API
- **Infra:** Docker Compose, GitHub Actions
