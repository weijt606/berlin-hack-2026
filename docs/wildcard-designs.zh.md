# Wildcard 项目设计 — Big Berlin Hack 2026

[![中文](https://img.shields.io/badge/lang-中文-blue)](#) [![English](https://img.shields.io/badge/lang-English-red)](wildcard-designs.md)

> Wildcard 赛道（自由主题）备选方案。到场后根据氛围、团队化学反应和竞争格局选择。

---

## 方案总览

| ID  | 产品             | 一句话                                              | Demo 冲击力 | 难度 | 评分       |
| --- | ---------------- | --------------------------------------------------- | ----------- | ---- | ---------- |
| W1  | **PitchCoach**   | 录制 Pitch → AI 即时评分和教练                      | 极高        | 低   | ⭐⭐⭐⭐⭐ |
| W2  | **AgentFlow**    | 多 Agent 任务协作 + 实时可视化                      | 高          | 高   | ⭐⭐⭐⭐   |
| W3  | **DataStory**    | 上传 CSV → AI 叙事 + 交互图表                       | 高          | 中   | ⭐⭐⭐⭐   |
| W4  | **ContextDocs**  | GitHub repo → 自动生成 CLAUDE.md                    | 中          | 低   | ⭐⭐⭐     |
| W5  | **MeetingMind**  | 会议录音 → AI 提取决策和待办                        | 高          | 中   | ⭐⭐⭐⭐   |
| W6  | **FounderGPT**   | Solo Founder AI 副驾：Standup + 优先级 + 盲点       | 高          | 中   | ⭐⭐⭐⭐   |
| W7  | **BerlinLens**   | AI 柏林街区探索 + 智能推荐                          | 中          | 中   | ⭐⭐⭐     |
| W8  | **ShipScope**    | 粘贴 URL → AI 竞品完整拆解                          | 高          | 中   | ⭐⭐⭐⭐   |
| W9  | **VibeCheck**    | GitHub repo → AI vs 人类代码检测 + vibe coding 评分 | 高          | 中   | ⭐⭐⭐⭐   |
| W10 | **CostCutter**   | 粘贴 prompt → AI 重写更短 + 展示成本节省            | 中          | 低   | ⭐⭐⭐     |
| W11 | **HalluciWatch** | 粘贴 AI 文本 → 逐句事实核查 + 幻觉指数              | 高          | 中   | ⭐⭐⭐⭐   |
| W12 | **MCPForge**     | 描述 API → 自动生成 MCP Server + 一键安装           | 高          | 高   | ⭐⭐⭐⭐⭐ |
| W13 | **Agent Mirror** | 个人上下文层 → AI 学习你的风格和偏好                | 高          | 中   | ⭐⭐⭐⭐   |

---

## W1：PitchCoach ⭐⭐⭐⭐⭐

**录制 Pitch → AI 即时评分和教练。**

### 为什么能赢

- **Meta 且有趣** — 黑客松上做一个帮人赢黑客松的工具，评委天然喜欢
- 技术可行性极高 — 音频转文字 + AI 分析
- Demo 冲击力极强 — 现场录一段 Pitch，AI 即时反馈

### 核心功能

1. 上传/录制 Pitch 音频
2. AI 转录 + 分析（语速、结构、关键词、情感、填充词）
3. 逐句评分 + 改进建议
4. Before/After 对比

### 技术方案

```
Frontend:  Next.js + Web Audio API（录音）+ 波形可视化
Backend:   FastAPI + Whisper API（转录）+ Claude API（分析）
```

### Demo 脚本

```
"Every hackathon winner says: the pitch matters more than the code."
→ 现场录制 30 秒 Pitch → AI 分析出现
→ 评分：Structure 8/10, Pacing 6/10, Hook 9/10
→ "Your opening is strong, but slow down at 0:15."
→ "This is PitchCoach — your personal pitch trainer."
```

---

## W2：AgentFlow ⭐⭐⭐⭐

**多 Agent 任务协作 + 实时可视化。**

### 为什么能赢

- 匹配多 Agent 工作流经验
- React Flow 实时动画效果震撼
- 可集成赞助商 API（Tavily 做搜索 Agent）

### 核心功能

1. 输入复杂任务（如 "Research Berlin's AI startup ecosystem"）
2. Orchestrator Agent 拆解为子任务
3. 多个 Specialist Agent 并行执行
4. React Flow 实时可视化 Agent 通信和进度
5. 汇聚最终报告

### 技术方案

```
Frontend:  Next.js + React Flow（Agent 图）+ WebSocket（实时更新）
Backend:   FastAPI + WebSocket + 异步任务
AI:        Claude API（Orchestrator + Analysis）+ Tavily API（Search）
```

---

## W3：DataStory ⭐⭐⭐⭐

**上传 CSV → AI 叙事 + 交互图表。**

### 为什么能赢

- 数据科学背景加持
- Demo 效果好：真实数据 → 即时图表 + 故事
- 支持自然语言追问

### 核心功能

1. 上传 CSV/Excel
2. AI 自动分析数据结构、分布、异常
3. 生成 3-5 个关键洞察（自然语言叙事）
4. 自动匹配最佳图表类型
5. 自然语言追问（"Why did revenue drop in Q3?"）

### 技术方案

```
Frontend:  Next.js + Recharts（交互图表）
Backend:   FastAPI + Pandas + Claude API
Demo:      用柏林公开数据集（房租、人口、创业数据）
```

---

## W4：ContextDocs ⭐⭐⭐

**GitHub repo → 自动生成 CLAUDE.md。**

### 核心功能

1. 输入 GitHub repo URL
2. 自动分析：目录结构、README、主文件、依赖、架构模式
3. 生成结构化 Context Document
4. 支持编辑和自定义
5. 一键复制/下载

### 技术方案

```
Frontend:  Next.js + Monaco Editor
Backend:   FastAPI + GitHub API + Claude API
```

---

## W5：MeetingMind ⭐⭐⭐⭐

**会议录音 → AI 提取决策和待办。**

### 为什么能赢

- 通用痛点 — 没人喜欢写会议纪要
- 现场 Demo：对着麦克风说话 → 结构化输出即时出现

### 核心功能

1. 录制或上传会议音频
2. Whisper API 实时转录
3. AI 提取：决策、待办、关键话题、参与者角色
4. 生成结构化会议摘要
5. 自动分配待办

### 技术方案

```
Frontend:  Next.js + Web Audio API + 实时转录显示
Backend:   FastAPI + Whisper API + Claude API
```

---

## W6：FounderGPT ⭐⭐⭐⭐

**Solo Founder AI 副驾。**

### 为什么能赢

- 柏林黑客松多创业者，天然共鸣
- 独特角度：不是生产力工具，而是"替代联合创始人"

### 核心功能

1. 每日 Standup：昨天做了什么？今天计划？
2. AI 分析：燃尽风险、scope creep、被忽视领域
3. 优先级矩阵 + AI 建议
4. 每周回顾自动生成
5. 上下文记忆

### Demo 脚本

```
"As a solo founder, there's no one to ask: am I working on the right thing?"
→ 输入昨天的工作和今天计划
→ AI: "You've been on backend for 5 days straight. Your landing page
   hasn't been touched. Is backend the bottleneck?"
→ Dashboard：燃尽风险上升，营销被忽视
→ "This is FounderGPT — the co-founder you don't have."
```

---

## W7：BerlinLens ⭐⭐⭐

**AI 柏林街区探索。**

### 核心功能

1. 柏林交互地图 + 街区边界
2. 点击街区 → AI 生成画像（氛围、房租、交通、美食）
3. 双街区对比
4. "我应该住哪？" 问卷 → AI 推荐

### 技术方案

```
Frontend:  Next.js + Mapbox/Leaflet
Backend:   FastAPI + Tavily API + Claude API
Data:      公开柏林数据集
```

---

## W8：ShipScope ⭐⭐⭐⭐

**粘贴 URL → AI 竞品完整拆解。**

### 核心功能

1. 粘贴任意落地页 URL
2. AI 抓取分析：价值主张、定价、目标用户、技术栈、SEO
3. 生成竞品拆解报告
4. 与自己的产品对比
5. 差异化策略建议

### 技术方案

```
Frontend:  Next.js + 报告查看器 + 对比 UI
Backend:   FastAPI + Web Scraper + Claude API + Tavily API
```

---

## W9：VibeCheck ⭐⭐⭐⭐

**GitHub repo → AI vs 人类代码检测 + vibe coding 评分。**

### 为什么能赢

- 2026 年最热话题：vibe coding 是真是假？
- 每个开发者都好奇自己的代码 "vibe coding 含量"
- Demo：粘贴任何 repo → 即时出评分

### 核心功能

1. 输入 GitHub repo URL
2. 分析代码模式：命名、注释风格、架构一致性、错误处理
3. AI vs Human 代码概率评分
4. Vibe Coding Score（0-100）
5. 逐文件热力图

### 技术方案

```
Frontend:  Next.js + 代码高亮 + 热力图
Backend:   FastAPI + GitHub API + Claude API
```

---

## W10：CostCutter ⭐⭐⭐

**粘贴 prompt → AI 重写更短 + 展示成本节省。**

### 核心功能

1. 粘贴原始 prompt
2. AI 重写：更短、更高效
3. 并排对比：原始 vs 优化
4. Token 计数 + 成本计算
5. 批量优化模式

### 技术方案

```
Frontend:  Next.js + diff 视图 + 成本仪表盘
Backend:   FastAPI + Claude API + tiktoken
```

---

## W11：HalluciWatch ⭐⭐⭐⭐

**粘贴 AI 文本 → 逐句事实核查 + 幻觉指数。**

### 为什么能赢

- AI 幻觉是 2026 年最大痛点之一
- Demo 效果强：粘贴任何 AI 文本 → 红/黄/绿标注

### 核心功能

1. 粘贴 AI 生成的文本
2. 逐句拆分 + 事实性评估
3. Tavily 实时搜索验证
4. 红/黄/绿 颜色标注
5. 总体幻觉指数（0-100）

### 技术方案

```
Frontend:  Next.js + 逐句高亮 + 置信度仪表
Backend:   FastAPI + Tavily API + Claude API
```

---

## W12：MCPForge ⭐⭐⭐⭐⭐

**描述 API → 自动生成 MCP Server + 一键安装。**

### 为什么能赢

- MCP 是 2026 AI 基础设施热点
- 解决真实痛点：手写 MCP Server 繁琐
- Demo：描述 API → 30 秒生成可用 MCP Server

### 核心功能

1. 输入 API 文档 URL 或 OpenAPI spec
2. AI 解析 endpoints、参数、认证
3. 自动生成 MCP Server 代码（TypeScript）
4. 在线预览 + 测试
5. 一键安装命令生成

### 技术方案

```
Frontend:  Next.js + Monaco Editor + 终端模拟
Backend:   FastAPI + Claude API
```

---

## W13：Agent Mirror ⭐⭐⭐⭐

**个人上下文层 → AI 学习你的风格和偏好。**

### 为什么能赢

- 独特角度：不是让 AI 更强，而是让 AI 更像你
- Demo 震撼：通用 AI vs "你的 AI" 并排对比
- 每个人都想试

### 核心功能

1. 输入个人内容（X 帖子、邮件、笔记）
2. AI 生成 Personal Agent Context（8 个维度）：
   - Writing Style / Decision Style / Product Taste / Risk Preference
   - Communication Rules / Things I Care About / Things I Hate / How to Reply Like Me
3. 导出为 Markdown（可直接用于 CLAUDE.md）
4. 并排对比：通用 AI vs 镜像 AI 回答

### 技术方案

```
Frontend:  Next.js + 分屏对比 UI
Backend:   FastAPI + Claude API
```

### Demo 脚本

```
"Every AI assistant sounds the same. But you're not generic."
→ 导入 10 条 X 帖子 + 5 封邮件
→ AI 生成 Personal Agent Context
→ 同一个问题，两个 AI 并排回答
→ "左边是通用 AI。右边是你的 AI。"
→ "This is Agent Mirror."
```

---

## Wildcard 选择决策树

```
到场后评估：

├── 两人团队，想最大化 Demo 冲击力？
│     ├── 现场互动 → W1（PitchCoach）或 W5（MeetingMind）
│     └── 即时结果 → W8（ShipScope）或 W12（MCPForge）
│
├── 想打 2026 AI 热点？
│     ├── Vibe coding → W9（VibeCheck）
│     ├── AI 幻觉 → W11（HalluciWatch）
│     ├── MCP 生态 → W12（MCPForge）
│     └── AI 身份 → W13（Agent Mirror）
│
├── 想发挥数据科学背景？
│     └── W3（DataStory）或 W8（ShipScope）
│
├── 想打创业者共鸣牌？
│     └── W6（FounderGPT）或 W8（ShipScope）
│
└── 想与主赛道（上下文）关联？
      └── W4（ContextDocs）或 W13（Agent Mirror）
```
