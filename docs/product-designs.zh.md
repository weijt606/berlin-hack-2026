# 产品设计文档 — Big Berlin Hack 2026

[![中文](https://img.shields.io/badge/lang-中文-blue)](#) [![English](https://img.shields.io/badge/lang-English-red)](product-designs.md)

> 参赛产品方案。按优先级排列，到场后根据赛道热度和组队情况选定。

---

## 方案总览

| 优先级      | 赛道    | 产品名                       | 一句话                                                  | 奖品            |
| ----------- | ------- | ---------------------------- | ------------------------------------------------------- | --------------- |
| 🥇 首选     | Peec AI | **Founder Visibility Agent** | GEO 执行副驾：帮创始人发现并占领 AI 搜索机会            | €2,500          |
| 🥈 备选     | Qontext | **ContextSync**              | 企业多源数据 → 结构化上下文层，让任何 AI Agent 即插即用 | 金条 + 私人晚餐 |
| 🥈 备选     | Buena   | **PropertyMind**             | 房产多源数据 → 自动更新的 Context Markdown File         | €2,500          |
| 🔄 Wildcard | 自由    | **13 个备选**                | 见 [wildcard-designs.zh.md](wildcard-designs.zh.md)     | 直接晋级决赛    |

---

## 通用技术栈

```
Frontend:  Next.js 15 + TypeScript + Tailwind CSS + shadcn/ui
Backend:   FastAPI + Python 3.12
Database:  PostgreSQL 16 + Redis 7
AI:        Claude API (Opus 4.6)
Deploy:    Docker Compose
```

---

# 🥇 Founder Visibility Agent（Peec AI 赛道）— 首选

> **完整产品设计：** [founder-visibility-agent.zh.md](founder-visibility-agent.zh.md)
>
> **Peec AI 接入指南：** [peec-ai-guide.md](peec-ai-guide.md)
>
> **Tagline:** From zero traffic to owned AI-search territory.

GEO 执行副驾。输入创业公司 URL + 竞品 → AI 搜索机会地图 → 7 天增长计划 + 自动生成内容资产。

**Peec AI 提供可见性层。我们提供创始人执行层。**

### 核心功能

1. **Startup Profiler** — URL → AI 提取产品类别、目标用户、用例、定位
2. **Prompt Discovery** — 生成 20+ 用户会在 AI 搜索中问到的查询
3. **Visibility Gap Analyzer** — 每个查询：有内容吗？竞品在吗？能赢吗？
4. **Content Action Generator** — 生成实际内容：着陆页、对比页、FAQ、X 帖子
5. **Founder Execution Board** — 任务分为 Now / This Week / Later

### Hero Feature: AI Answer Hijack Map

传统 SEO = Google 排名。GEO = 进入 AI 回答。对每个查询展示：当前 AI 回答、缺失角度、建议内容、建议答案块。

---

# 🥈 ContextSync（Qontext 赛道）

## 问题

企业 AI 系统每次运行都要从邮件、CRM、工单、文档、聊天中临时拼凑公司现实。这不 scale——慢、不准、重复劳动。

## 方案

ContextSync 从多种数据源持续提取、结构化、更新企业上下文，生成标准化的 Context Layer，任何 AI Agent 可以直接读取使用。

## Pitch

> "We built a context layer that turns your company's scattered data — emails, CRM, tickets, docs — into a single, structured context that any AI agent can use instantly."

## 数据流架构

```
┌─────────────┐   ┌─────────────┐   ┌─────────────┐
│  Email API  │   │   CRM API   │   │  PDF Upload  │
│  (模拟数据)  │   │  (模拟数据)  │   │  (真实文件)   │
└──────┬──────┘   └──────┬──────┘   └──────┬──────┘
       │                 │                 │
       ▼                 ▼                 ▼
┌──────────────────────────────────────────────┐
│              Data Ingestion Layer            │
│    FastAPI endpoints + 文件解析 (PyPDF2)      │
└──────────────────────┬───────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────┐
│           AI Context Extraction              │
│    Claude API: 实体提取 + 关系识别 + 时间线     │
└──────────────────────┬───────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────┐
│           Context Store (PostgreSQL)          │
│    实体表 + 关系表 + 时间线表 + 原始数据引用      │
└──────────────────────┬───────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────┐
│         Context Document Generator           │
│    结构化 Markdown / JSON 输出                │
└──────────────────────┬───────────────────────┘
                       │
            ┌──────────┴──────────┐
            ▼                     ▼
    ┌──────────────┐     ┌──────────────┐
    │  Web UI 预览  │     │  Agent 查询   │
    │  (Next.js)   │     │  (Chat 演示)  │
    └──────────────┘     └──────────────┘
```

## API 设计

```
POST   /api/sources              # 添加数据源（邮件/CRM/PDF）
GET    /api/sources              # 列出已接入的数据源
POST   /api/sources/{id}/sync    # 触发数据同步
POST   /api/upload               # 上传 PDF/文档文件

GET    /api/context              # 获取完整上下文（Markdown/JSON）
GET    /api/context/entities     # 获取提取的实体列表
GET    /api/context/timeline     # 获取事件时间线
GET    /api/context/relations    # 获取实体关系图

POST   /api/chat                 # Agent 查询接口
GET    /api/health               # 健康检查
```

## 数据模型

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

## 页面设计（3 页）

1. **Dashboard** — 数据源卡片 + Context Health + 时间线
2. **Context Document** — 结构化文档预览（Markdown/JSON/Copy）
3. **Agent Chat** — 基于上下文回答问题

## Demo 脚本（90 秒）

```
[0:00]  打开 Dashboard → "This is ContextSync. We've connected
        4 data sources for a demo company."
[0:15]  点击 "Sync All" → 展示数据同步
[0:25]  切换到 Context Document → 结构化文档生成
[0:40]  展示 People / Projects / Decisions / Issues
[0:55]  切换到 Agent Chat → 输入问题
[1:05]  Agent 即时回答 → "No runtime data reconstruction needed."
[1:20]  上传新 PDF → Context 自动更新
[1:30]  "This is ContextSync — the context layer that fixes AI's runtime data problem."
```

## 开发计划（36h）

| 时段   | 任务                                | 产出           |
| ------ | ----------------------------------- | -------------- |
| 0-2h   | 选题确认 + 模板启动 + CLAUDE.md     | 项目骨架       |
| 2-5h   | 数据模型 + API + 数据接入           | 后端能接收数据 |
| 5-9h   | AI 提取逻辑 + Context Document 生成 | 核心功能跑通   |
| 9-13h  | 前端 Dashboard + Context 预览       | UI 基本成型    |
| 13-17h | Agent Chat + 实时更新               | 全流程可演示   |
| 17-21h | 睡眠 4h + 早餐                      | —              |
| 21-25h | UI 打磨 + Demo 数据                 | Demo-ready     |
| 25-27h | Feature Freeze + 排练               | 提交           |

---

# 🥈 PropertyMind（Buena 赛道）

> 与 ContextSync 技术方案 80% 重叠，区别在于垂直场景和数据源。

## 问题

房产管理公司的信息分散在 ERP、邮件、Slack、PDF 合同中。AI Agent 要回答一个关于某房产的问题，需要从 5 个系统拼凑信息。

## 方案

PropertyMind 为每个房产自动生成和维护一份 Context Markdown File——一个"活文档"，任何 AI Agent 可以直接读取。

## Pitch

> "We built a system that automatically creates a living Context File for every property — pulling from ERPs, emails, Slack, and PDFs — so any AI agent can instantly understand the full picture."

## 与 ContextSync 的差异

| 维度      | ContextSync（Qontext）   | PropertyMind（Buena）                   |
| --------- | ------------------------ | --------------------------------------- |
| 范围      | 通用企业                 | 垂直房产                                |
| 实体类型  | People, Projects, Issues | Properties, Tenants, Contracts, Repairs |
| 数据源    | 邮件/CRM/工单/聊天       | ERP/邮件/Slack/PDF 合同                 |
| 输出      | 企业级 Context Layer     | 每个房产一个 Markdown File              |
| Demo 数据 | 模拟企业数据             | 模拟柏林房产数据                        |

## Context File 示例

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

## Open Actions

- [ ] Window replacement — contractor booked May 5
- [ ] Noise complaint — pending response

## Financial Summary (2026 YTD)

- Rental Income: €4,800 | Maintenance: €340 | Net: €4,460
```

## 页面设计（3 页）

1. **Properties List** — 所有房产卡片，状态概览，搜索筛选
2. **Property Context** — 单个房产 Context File 预览 + 数据源追溯
3. **Agent Chat** — "Ask about any property"

## Demo 脚本差异

与 ContextSync 结构相同，但用柏林房产数据演示：

- "This property at Kastanienallee 42 has data scattered across ERP, email, and Slack..."
- 上传 PDF 租赁合同 → 自动提取租户、租金、合同期限
- Agent: "When is the next maintenance scheduled for this property?"

---

# 🔄 Wildcard 备选方案

> **完整 13 个 Wildcard 项目设计：** [wildcard-designs.zh.md](wildcard-designs.zh.md)
