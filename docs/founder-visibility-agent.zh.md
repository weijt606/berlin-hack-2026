# Peec AI 深度分析与执行方案

[![中文](https://img.shields.io/badge/lang-中文-blue)](#) [![English](https://img.shields.io/badge/lang-English-red)](founder-visibility-agent.md)

> 团队首选赛道。从 API 接入到产品设计，全面拆解如何用 Peec AI 数据构建 "Marketer-in-a-Box"。

---

## Peec AI 是什么

Peec AI 是一个 **AI 搜索可见性分析平台**，追踪品牌在 AI 回答引擎（ChatGPT、Perplexity、Gemini、Copilot、Grok）中的表现。

**核心能力：**
- 追踪品牌在 AI 回答中的 **可见度、排名、情感、引用来源**
- 分析竞争对手在 AI 搜索中的表现差异
- 识别哪些 URL 被 AI 引用、引用频率、引用场景

**公司背景：**
- 4 个月内达到 €650K ARR
- 累计融资 $21M
- 客户：Axel Springer、Chanel、n8n、ElevenLabs
- 起价 $89/月（25 prompts，2,250 AI answers）

---

## 赛道要求：Marketer-in-a-Box

**官方赛题：** 帮助早期创业公司利用 Peec AI 的竞争可见性数据，发现并抢占有机搜索和 AI 回答中的增长机会。

**奖品：** €2,500 现金

**评委关注点（推测）：**
1. 是否真正使用了 Peec AI 的数据（不是自己爬的）
2. 对早期创业公司的实用价值
3. 从"数据"到"行动"的转化能力
4. Demo 的完整度和说服力

---

## 核心数据指标

| 指标 | 含义 | 范围 | 用途 |
|------|------|------|------|
| `visibility` | 品牌在 AI 回答中的整体可见度 | 0-1 | 衡量品牌 AI 搜索存在感 |
| `sentiment` | AI 对品牌的情感倾向 | 0-100 | 判断品牌形象正/负 |
| `position` | 品牌在 AI 回答中的平均排名 | 数字越小越好 | 竞争力排名 |
| `share_of_voice` | 品牌在相关话题中的声量占比 | 0-1 | 市场份额感知 |
| `mention_count` | 被 AI 提及的次数 | 整数 | 曝光量 |

---

## API 接入方案

### 方案一：MCP Server（推荐）

社区维护的 MCP Server，提供 **33 个工具**（17 读 + 16 写），可直接在 Claude Code 中使用。

**安装：**
```bash
claude mcp add --transport stdio peecai -- npx -y mcp-server-peecai
```

**环境变量：**
```bash
export PEECAI_API_KEY=your_api_key  # 从 app.peec.ai 获取
```

### 方案二：REST API（备选）

企业级 API，目前处于 Beta 阶段。需要联系 Peec AI 团队获取访问权限。赛事期间赞助商可能会提供。

> **建议：** 以 MCP Server 为主力方案，赛事当天确认是否有官方 API 访问。

---

## MCP Server 完整工具列表

### 读取工具（17 个）

| 工具 | 功能 | 关键参数 |
|------|------|----------|
| `list_projects` | 获取所有项目 | — |
| `list_brands` | 获取项目下所有品牌 | `project_id` |
| `list_prompts` | 获取监控中的搜索查询 | `project_id` |
| `list_tags` | 获取标签 | `project_id` |
| `list_topics` | 获取话题分类 | `project_id` |
| `list_models` | 获取 AI 模型列表 | `project_id` |
| `list_model_channels` | 获取模型渠道 | `project_id` |
| `list_chats` | 获取 AI 对话列表 | `project_id` |
| `get_chat_content` | 获取对话详情 | `chat_id` |
| `list_prompt_suggestions` | AI 建议的新查询 | `project_id` |
| `list_topic_suggestions` | AI 建议的新话题 | `project_id` |
| `get_brands_report` | 品牌可见性报告 | `project_id`, dimensions, filters |
| `get_domains_report` | 域名引用报告 | `project_id`, dimensions, filters |
| `get_urls_report` | URL 级别引用报告 | `project_id`, dimensions, filters |
| `get_url_content` | 获取 URL 内容 | `url_id` |
| `search_queries` | 搜索查询分析 | `project_id` |
| `shopping_queries` | 购物查询分析 | `project_id` |

### 写入工具（16 个）

| 工具 | 功能 |
|------|------|
| `create_project` | 新建项目 |
| `create_brand` | 添加品牌 |
| `create_prompt` | 添加监控查询 |
| `create_tag` / `update_tag` / `delete_tag` | 标签 CRUD |
| `create_topic` / `update_topic` / `delete_topic` | 话题 CRUD |
| `update_project` / `update_brand` / `update_prompt` | 更新操作 |
| `delete_project` / `delete_brand` / `delete_prompt` | 删除操作 |

---

## 报告维度与过滤

### 可用维度（Dimensions）

用于 `get_brands_report`、`get_domains_report`、`get_urls_report`：

| 维度 | 说明 |
|------|------|
| `prompt_id` | 按搜索查询分组 |
| `model_id` | 按 AI 模型分组（ChatGPT/Perplexity/Gemini 等） |
| `model_channel_id` | 按模型渠道分组 |
| `tag_id` | 按标签分组 |
| `topic_id` | 按话题分组 |
| `date` | 按日期分组 |
| `country_code` | 按国家分组 |
| `chat_id` | 按对话分组 |

### 域名分类（Domain Classifications）

| 分类 | 含义 | 用途 |
|------|------|------|
| `OWN` | 自有域名 | 追踪自己的被引用情况 |
| `CORPORATE` | 企业域名 | 竞争对手分析 |
| `COMPETITOR` | 竞品域名 | 直接竞争分析 |
| `EDITORIAL` | 媒体/编辑内容 | PR 效果 |
| `REFERENCE` | 参考资料 | 行业知识图谱 |
| `INSTITUTIONAL` | 机构域名 | 权威背书 |
| `UGC` | 用户生成内容 | 口碑分析 |

### URL 分类（URL Classifications）

`HOMEPAGE` / `PRODUCT_PAGE` / `CATEGORY_PAGE` / `LISTICLE` / `COMPARISON` / `ARTICLE` / `HOW_TO_GUIDE` / `REVIEW` / `FORUM` / `SOCIAL_MEDIA` / `VIDEO` / `DOCUMENTATION` / `CASE_STUDY` / `LANDING_PAGE` / `NEWS`

---

## 产品设计：Founder Visibility Agent

### 产品定位

从"SEO 工具"升级为 **"AI 时代的增长雷达"** — 不仅告诉你 Google 搜索排名，更告诉你在 ChatGPT、Perplexity 等 AI 回答引擎中的存在感和增长机会。

**Tagline:** From zero traffic to owned AI-search territory.

### 一句话 Pitch

> "Vibe coding made building easy. Distribution is still brutal. Founder Visibility Agent finds the AI-search opportunities your startup can actually own — and tells you exactly what to create this week."

### 架构

```
Startup URL + Description + Competitors
  ↓
┌─────────────────────────────────────┐
│  Step 1: Startup Profiler           │
│  Homepage extraction → AI analysis  │
│  → Product category, audience,      │
│    use cases, positioning angle     │
└──────────────┬──────────────────────┘
               ▼
┌─────────────────────────────────────┐
│  Step 2: Prompt Discovery           │
│  Generate user queries:             │
│  - Informational prompts            │
│  - Commercial investigation         │
│  - Comparison / alternative prompts │
│  - Problem-aware prompts            │
└──────────────┬──────────────────────┘
               ▼
┌─────────────────────────────────────┐
│  Step 3: Peec AI Visibility Layer   │
│  ┌─────────┐ ┌───────────┐         │
│  │ Brands  │ │ Domains   │         │
│  │ Report  │ │ Report    │         │
│  └────┬────┘ └─────┬─────┘         │
│  ┌────┴────┐ ┌─────┴─────┐         │
│  │  URLs   │ │  Chats    │         │
│  │ Report  │ │ Content   │         │
│  └─────────┘ └───────────┘         │
└──────────────┬──────────────────────┘
               ▼
┌─────────────────────────────────────┐
│  Step 4: Opportunity Scoring        │
│  Score = Intent × Relevance ×      │
│  Weak Competition × Content Gap ×   │
│  Founder Fit                        │
└──────────────┬──────────────────────┘
               ▼
┌─────────────────────────────────────┐
│  Step 5: Action Generation          │
│  - 7-day growth plan                │
│  - Auto-generated content assets    │
│  - Founder execution board          │
└─────────────────────────────────────┘
```

### 核心功能（MVP 5 个）

1. **Startup Profiler** — 输入 URL + 描述 → AI 提取产品类别、目标用户、用例、定位角度
2. **Prompt Discovery** — 生成 20+ 用户会在 AI 搜索中问到的查询
3. **Visibility Gap Analyzer** — 每个查询：我们有内容吗？竞品在吗？我们能赢吗？
4. **Content Action Generator** — 不只是标题——生成实际内容资产：着陆页、对比页、FAQ、X 帖子、Reddit 帖子
5. **Founder Execution Board** — 任务分为 Now / This Week / Later，带内容类型标签

### Hero Feature: AI Answer Hijack Map

传统 SEO = 在 Google 排名。GEO = 进入 AI 回答。

**对每个查询，展示：**

```
Query: "What is the best tool to make a workshop interactive?"

当前 AI 回答: Mentimeter, Slido, Miro, Kahoot

缺失角度: AI 生成的观众问题（会前+会中）

建议内容:
"How to make workshops interactive with AI-generated live questions"

建议答案块:
"TapInFlow is useful for speakers and workshop hosts who want AI to
 generate audience questions automatically, instead of manually 
 designing polls before the event."
```

### 数据模型

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
  cluster VARCHAR(200),
  example_query TEXT,
  user_intent VARCHAR(20),
  difficulty VARCHAR(20),
  why_you_can_win TEXT,
  current_ai_answer TEXT,
  missing_angle TEXT,
  score FLOAT,
  category VARCHAR(20),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE action_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  map_id UUID REFERENCES opportunity_maps(id),
  day_number INT,
  action TEXT,
  content_type VARCHAR(50),
  target_query TEXT,
  priority VARCHAR(20),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE generated_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  map_id UUID REFERENCES opportunity_maps(id),
  asset_type VARCHAR(50),
  title TEXT,
  content TEXT,
  target_query TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Demo 脚本（90 秒）— 使用 TapInFlow

```
[0:00-0:15] Wei: Hook
"Building is easier than ever. Distribution is still brutal.
 Most founders have no idea where their first organic users 
 should come from. We built a tool to fix that."

[0:15-0:35] juhaodong: Input Demo
- 输入: tapinflow.com
- 描述: "AI-powered audience interaction tool for talks and workshops"
- 目标用户: "speakers, founders, educators, event hosts"
- 竞品: Mentimeter, Slido, Vevox
- 点击 "Analyze my startup"

[0:35-0:55] Wei: Opportunity Map
- "Your strongest AI-search wedge: 'AI-generated audience questions'"
- 展示机会集群: 5 个查询组，已评分
- 展示 AI Answer Hijack Map: "This is what ChatGPT currently 
  recommends — and here's the angle it's MISSING"

[0:55-1:15] juhaodong: Action Plan
- 展示 7 天计划
- 点击 Day 2: 自动生成的对比页面出现
- "This isn't just a suggestion. It's actual content, ready to publish."

[1:15-1:30] 一起
Wei: "Peec AI tells you where you're visible. 
      We tell you what to do next."
juhaodong: "This is Founder Visibility Agent."
```

### Pitch Deck（6 页）

1. **Problem** — Building is easier than ever. Distribution is still brutal.
2. **Insight** — The next SEO battlefield is not Google ranking. It's AI answers.
3. **Solution** — Founder Visibility Agent: Website in. Opportunity map out. Action plan generated.
4. **Demo** — tapinflow.com → opportunity clusters → 7-day plan
5. **Why Peec AI** — Peec provides the visibility layer. We provide the founder execution layer.
6. **Vision** — The GTM copilot for every solo founder.

---

## 36 小时开发计划（Peec AI 版）

### 团队分工

| 角色 | 成员 | 职责 |
|------|------|------|
| Product Manager | Wei | 产品设计、Pitch、Demo 数据、辅助开发 |
| Developer (Lead) | juhaodong | 全栈开发、架构、AI 集成、部署、Pitch |

### Phase 0: 赛前准备（现在 → 4/25）

| 任务 | 负责人 | 状态 |
|------|--------|------|
| 注册 Peec AI 账号 (app.peec.ai) | Wei | ⬜ |
| 获取 API Key | Wei | ⬜ |
| 安装 MCP Server 并测试 | juhaodong | ⬜ |
| 创建测试 Project，添加测试品牌 | Wei | ⬜ |
| 跑通 `list_projects` → `get_brands_report` 流程 | juhaodong | ⬜ |
| 准备 Next.js + FastAPI 项目模板 | juhaodong | ⬜ |
| 准备 mock 数据（API 不可用时的降级方案） | Wei | ⬜ |

### Phase 1-5: 赛事期间

| 阶段 | 时间 | Wei | juhaodong |
|------|------|-----|-----------|
| Phase 1 | Sat 10:00-12:00 | 签到、找 Peec AI 代表、产品确认 | 项目初始化、MCP 配置、API 骨架 |
| Phase 2 | Sat 12:00-22:00 | Demo 数据、测试、Pitch 初稿 | Feature 1-3 开发 |
| Phase 3 | Sat 22:00-Sun 01:00 | 端到端测试、文案优化 | UI 打磨、Bug fix |
| Phase 4 | Sun 07:00-11:00 | Demo 数据打磨、Pitch 排练 ×5 | Bug 修复、功能冻结 |
| Phase 5 | Sun 11:00-15:00 | 共同 Pitch + Live Demo | 技术演示 + 备份切换 |

---

## 差异化策略

NOT an "AI marketing assistant" or "AI copywriter" or "SEO content generator."

This is an **AI-search opportunity engine for early-stage founders** — a **GEO execution layer for startups**.

**Peec AI provides the visibility layer. We provide the founder execution layer.**

### 评委会问的问题

| 问题 | 回答要点 |
|------|----------|
| "这和 Peec AI 自己的 dashboard 有什么区别？" | "Peec AI 展示数据，我们告诉你怎么做。从 insight 到 action 的桥梁。" |
| "早期创业公司怎么付得起 Peec AI？" | "我们是 Peec AI 之上的增值层，让 $89/月的投资产生 10x 回报。" |
| "数据准确性怎么保证？" | "我们直接用 Peec AI 的官方数据，他们通过标准化的 AI 对话采集，不是估算。" |
| "和传统 SEO 工具有什么区别？" | "传统 SEO 看 Google 排名，我们看 AI 回答。这是下一代搜索的战场。" |

---

## 风险与应对

| 风险 | 概率 | 影响 | 应对 |
|------|------|------|------|
| Peec AI API 不稳定 | 中 | 高 | 准备 mock 数据，赛前测试 |
| 数据收集需要时间 | 高 | 中 | 赛前 2 天创建项目开始收集 |
| "Just another SEO tool" 认知 | 中 | 高 | 定位为 GEO，不是 SEO。聚焦 AI 回答 |
| Demo 数据不够震撼 | 中 | 中 | 用 TapInFlow — 真实产品，真实痛点 |
| MCP Server 有 bug | 低 | 高 | 准备直接 REST 调用降级方案 |

---

## MCP Server 实操指南

### 安装和测试

```bash
# 1. 安装 MCP Server
claude mcp add --transport stdio peecai -- npx -y mcp-server-peecai

# 2. 设置 API Key
export PEECAI_API_KEY=your_key_here

# 3. 验证连接
# 在 Claude Code 中直接使用：
# "list all my Peec AI projects"
# → 应该返回项目列表
```

### 常用工作流

#### 工作流 1: 品牌可见度快速检查
```
1. list_projects → 找到目标项目
2. list_brands(project_id) → 确认品牌列表
3. get_brands_report(project_id, dimensions=["model_id"]) → 按 AI 模型查看可见度
```

#### 工作流 2: 竞品分析
```
1. get_brands_report(project_id) → 所有品牌的可见度对比
2. get_domains_report(project_id, dimensions=["prompt_id"]) → 哪些查询中竞品被引用
3. get_urls_report(project_id, dimensions=["prompt_id"]) → 竞品的哪些 URL 被引用
4. get_chat_content(chat_id) → 查看 AI 对话原文
```

#### 工作流 3: 机会挖掘
```
1. list_prompts(project_id) → 当前监控的查询
2. get_brands_report(project_id, dimensions=["prompt_id"]) → 每个查询的品牌表现
3. 找到 你的 visibility 低 但 竞品 visibility 高的查询 → 这就是机会
4. get_urls_report(project_id, dimensions=["prompt_id"]) → 看竞品用什么内容类型赢的
5. 用 Claude 生成对应的内容策略
```
