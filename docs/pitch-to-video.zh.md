# Pitch to Video — 60 秒 GTM

[![中文](https://img.shields.io/badge/lang-中文-blue)](#) [![English](https://img.shields.io/badge/lang-English-red)](pitch-to-video.md)

> **赛道：** Peec AI — Marketer-in-a-Box
>
> **Tagline:** 粘贴你的 Pitch，生成一个为 AI 搜索优化的营销视频。
>
> **状态：** 探索中 — 产品方案讨论进行中。

---

## 问题

Vibe coding 让开发变简单了。但大多数 Solo Founder 仍然回答不了：

1. **该说什么？** — 什么信息能打动目标用户？
2. **在哪说？** — 哪些渠道和查询关键词重要？
3. **怎么做？** — 我请不起视频团队、文案、或营销公司。

结果：创始人发布了产品，但从没发布过自己的故事。死在了分发上。

## 洞察

下一个营销战场不是 Google 广告——是 AI 回答。当有人问 ChatGPT "做 X 最好的工具是什么？"，你的创业公司必须是答案。但大多数创始人甚至不知道 "X" 应该是什么。

**Peec AI 知道。** 它追踪哪些品牌出现在 AI 生成的回答中，针对哪些查询，在哪些模型上。我们把这些数据转化为行动——现在，转化为视频。

## 方案

Pitch to Video 接收创始人的原始 pitch（文字或音频），使用 Peec AI 的可见性数据优化内容，然后生成一个可直接发布的 30-60 秒营销视频。

**不是通用的 "文字转视频" 工具。是一个输出视频的 GTM 副驾。**

```
创始人的 Pitch（文字/音频）
  ↓
┌─────────────────────────────────────┐
│  Step 1: Pitch 解析                  │
│  音频 → Whisper 转录                 │
│  文字 → Claude: 提取产品、受众、      │
│  价值主张、竞品                       │
└──────────────┬──────────────────────┘
               ↓
┌─────────────────────────────────────┐
│  Step 2: Peec AI 可见性层            │
│  - 哪些查询对你重要？                 │
│  - 竞品在说什么？                    │
│  - AI 回答中目前缺少什么角度？         │
│  → 关键词 & 话术优化                 │
└──────────────┬──────────────────────┘
               ↓
┌─────────────────────────────────────┐
│  Step 3: 脚本生成器                  │
│  Claude: 优化后的视频脚本             │
│  - Hook (3s)                        │
│  - 痛点 (5s)                        │
│  - 方案 (10s)                       │
│  - Demo/证据 (10s)                  │
│  - CTA (5s)                         │
│  + 每段的画面描述                     │
└──────────────┬──────────────────────┘
               ↓
        ┌──────┴──────┐
        ↓             ↓
┌──────────────┐ ┌──────────────┐
│  旁白语音     │ │  视频片段     │
│  ElevenLabs  │ │  Kling 3.0   │
│  TTS API     │ │  via FAL.AI  │
└──────┬───────┘ └──────┬───────┘
       ↓                ↓
┌─────────────────────────────────────┐
│  Step 4: 合成                       │
│  FFmpeg: 拼接片段 + 旁白             │
│  + 文字叠加 + 背景音乐               │
│  → 30-60s 营销视频                  │
└──────────────┬──────────────────────┘
               ↓
┌─────────────────────────────────────┐
│  Step 5: 输出包                     │
│  - 视频文件 (MP4)                   │
│  - 优化后脚本 (Markdown)             │
│  - AI 搜索关键词 & 标签              │
│  - 建议分发渠道                      │
└─────────────────────────────────────┘
```

## 为什么能在黑客松赢

| 因素 | 原因 |
|------|------|
| **Demo 冲击力** | 评委看到真实视频现场生成——没有比这更强的了 |
| **故事极简** | "粘贴你的 pitch，60 秒拿到视频"——一句话 |
| **Peec AI 深度集成** | 不是展示数据——是用数据优化内容 |
| **创始人共鸣** | 在场每个创始人都有这个痛点 |
| **技术深度** | 多 API 管道（Claude + Peec AI + ElevenLabs + Kling + FFmpeg） |

## 差异化

| 对比 | 我们的优势 |
|------|----------|
| HeyGen / Synthesia | 他们做通用虚拟人视频。我们做 **AI 搜索优化的** 营销内容 |
| Mootion | 他们把 pitch deck 转视频。我们 **优化 pitch 本身**，基于真实可见性数据 |
| Canva 视频 | 模板化。我们从零生成，基于你的产品 + 市场数据 |
| FVA | FVA 输出文字资产。我们输出 **视频** — 更强的 Demo 效果，同样的 GTM 逻辑 |

## 核心功能（MVP: 3 个）

### Feature 1: Pitch 输入 + 优化

- 输入：文本框 OR 录音（Whisper 转录）
- Claude 解析：产品、受众、价值主张、竞品
- Peec AI 层："你的 pitch 提到了'项目管理'，但在 AI 搜索中更有效的角度是'异步团队协作'——我们会为此优化"
- 并排展示：**原始 pitch vs. AI 优化版 pitch**

### Feature 2: 视频生成管道

- 自动生成分镜（5-6 个场景 + 描述）
- 并行生成：旁白（ElevenLabs）+ 视频片段（Kling 3.0）
- FFmpeg 合成：片段 + 旁白 + 文字叠加 + 背景音乐
- 进度 UI：实时显示每个步骤的生成状态

### Feature 3: GTM 输出包

- 可下载的 MP4 视频（30-60s）
- 优化后脚本（可复制 Markdown）
- AI 搜索关键词 & 标签
- 分发清单："把视频发到 X、LinkedIn、Product Hunt，用这些文案"

## 数据模型

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

## 技术栈

```
Frontend:   Next.js 15 + TypeScript + Tailwind CSS + shadcn/ui
Backend:    FastAPI + Python 3.12
AI:         Claude API（脚本生成 + pitch 优化）
Visibility: Peec AI MCP Server（关键词 & 话术优化）
Voice:      ElevenLabs API（文字转语音）
Video:      Kling 3.0 via FAL.AI（文字转视频）
Compositing: FFmpeg（服务端视频拼接）
Database:   PostgreSQL 16
Deploy:     Docker Compose
```

## Demo 脚本（90 秒）— 使用 TapInFlow

```
[0:00-0:15] Wei: Hook
"每个创始人现在都能一个周末做出产品。
 但你能讲出你的故事吗？大多数人不能。
 我们做了一个工具，60 秒搞定。"

[0:15-0:30] juhaodong: 输入
- 输入 pitch: "TapInFlow helps speakers engage audiences
  with AI-generated questions"
- URL: tapinflow.com
- 竞品: Mentimeter, Slido
- 点击 "Generate my video"

[0:30-0:50] Wei: 优化
- "Peec AI 发现 'AI-generated audience questions'
   有高意图但零竞争。你的竞品都没用这个角度。"
- 展示并排：原始 pitch vs. 优化版
- 分镜实时生成

[0:50-1:10] juhaodong: 视频结果
- 播放生成的 30s 营销视频
- "这个视频在 60 秒内生成。
   脚本已针对 AI 搜索可见性优化。"

[1:15-1:30] 一起
Wei: "Peec AI tells you what to say.
      We help you say it — in video."
juhaodong: "This is Pitch to Video."
```

## Pitch Deck（6 页）

1. **Problem** — 创始人能做产品，但讲不出故事。
2. **Insight** — 下一个营销渠道是 AI 回答。Peec AI 知道哪些重要。
3. **Solution** — 粘贴 pitch → AI 优化内容 → 生成营销视频。
4. **Demo** — TapInFlow pitch → 优化脚本 → 60 秒出视频。
5. **Why Peec AI** — Peec 提供可见性数据。我们把它变成可发布的内容。
6. **Vision** — 每个 Solo Founder 的 GTM 副驾。从 pitch 到市场，几分钟搞定。

## 风险评估

| 风险 | 影响 | 应对 |
|------|------|------|
| 视频生成慢/失败 | 高 | Storyboard-first UX：先展示脚本+分镜，视频后台渲染。预渲染备用视频 |
| 片段间风格不一致 | 中 | 统一 style prompt + 限制 4-5 个片段 |
| Peec AI 数据不够震撼 | 中 | 赛前为 TapInFlow 创建 Peec 项目。备 mock 数据 |
| FFmpeg 合成调试耗时 | 中 | 赛前预搭 FFmpeg 模板 |
| "又一个 AI 视频工具" | 高 | 定位为 GTM 副驾，不是视频生成器。视频是输出，Peec AI 数据是大脑 |

## 36 小时开发计划

### 赛前准备

| 任务 | 负责人 | 状态 |
|------|--------|------|
| 注册 Peec AI + 创建 TapInFlow 项目 | Wei | ⬜ |
| 测试 Kling 3.0 API (via FAL.AI) | juhaodong | ⬜ |
| 测试 ElevenLabs TTS API | juhaodong | ⬜ |
| 搭建 FFmpeg 合成模板 | juhaodong | ⬜ |
| 准备脚本生成 prompt 模板 | Wei | ⬜ |
| 预渲染备用 Demo 视频 | Wei | ⬜ |

### 赛事期间

| 阶段 | 时间 | Wei | juhaodong |
|------|------|-----|-----------|
| 1 | Sat 10:00-12:00 | 签到、找 Peec AI 聊、确认 API | 项目搭建、环境配置 |
| 2 | Sat 12:00-16:00 | Pitch 输入 UX、脚本 prompt 工程 | 后端：pitch 解析 + Claude 脚本生成 |
| 3 | Sat 16:00-20:00 | 测试脚本、迭代 prompt、Peec 集成 | 视频管道：FAL.AI + ElevenLabs + FFmpeg |
| 4 | Sat 20:00-00:00 | 端到端测试、Demo 数据 | 前端：分镜 UI、进度跟踪 |
| 5 | Sun 00:00-01:00 | Decision point：功能冻结范围 | Bug fix、降级路径 |
| — | Sun 01:00-07:00 | 睡觉 | 睡觉 |
| 6 | Sun 07:00-10:00 | Demo 视频准备、Pitch 排练 ×5 | 最终 Bug fix、预渲染备份 |
| 7 | Sun 10:00-15:00 | 共同 Pitch + Live Demo | 技术演示 + 备份切换 |

## 与 Founder Visibility Agent 的关系

Pitch to Video 和 FVA 共享同一个 GTM 哲学：

| 维度 | FVA | Pitch to Video |
|------|-----|----------------|
| 核心思路 | 找到 AI 搜索机会 | 把你的故事优化后讲出来 |
| Peec AI 角色 | 可见性分析 | 内容优化 |
| 输出 | 文字资产（着陆页、X thread） | 视频 + 脚本 + GTM 包 |
| Demo 冲击力 | 表格和行动计划 | **真实视频在屏幕上播放** |
| 复杂度 | 5 个 MVP 功能 | 3 个 MVP 功能（更聚焦） |

**Pitch to Video 是同一愿景的更适合黑客松的版本。**
