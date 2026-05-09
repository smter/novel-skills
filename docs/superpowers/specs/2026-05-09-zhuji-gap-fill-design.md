# 珠矶提取缺口补全 — 设计文档

> 日期：2026-05-09
> 状态：设计完成
> 前置调研：conversation context 中的 5 子项目完成度调查
> 源文件：`ref/example/【珠矶预设化】V1.71.json`
> 关联提案：`docs/superpowers/specs/2026-05-08-zhuji-tool-extraction-proposal.md`
> 关联分类映射：`docs/superpowers/specs/2026-05-08-zhuji-tool-classification.md`

---

## 问题摘要

原提案的 5 个子项目中，子项目一（角色管线）和子项目二（世界观构建）已深度完成——内容从 JSON 源重写为 agent 操作手册。剩余三个存在缺口：

| 子项目 | 缺口 |
|--------|------|
| 三：风格与叙事 | `narrative-structure-guide.md` 完全缺失，但 `novel-research/SKILL.md` 已有僵尸引用 |
| 四：参考理论 | `references/theory/` 目录不存在，5 个理论文件零提取。`character-interview-guide.md` 的审查章节已标注对此产出的依赖 |
| 五：提示词工程 | 目标文件存在但未注入 zhuji 方法论（COT、自检清单、思路梳理） |

本设计一次性补全三个缺口。

---

## 核心约束

1. **深度内化**——所有产出必须将 JSON 源 prompt 完全重写为自身语言。产出文件中不出现源 prompt 编号标记（如 `[133]`）。与已完成的子项目一二同质量标准。
2. **强制调用**——理论文件不是"可选参考"，必须通过 SKILL.md 中的硬闸门确保 agent 在特定步骤非查阅不可。
3. **三阶段推进**——theory 文件最先（被 narrative 和管线依赖），然后 narrative，最后做 SKILL.md / lint-contract 注入（减少合并冲突）。

---

## 阶段一：创建 `references/theory/` 目录及 5 个理论文件

### 整体定位

理论文件是 agent 在特定步骤**必须查阅**的理论基础。它们不是"按步骤执行"的操作手册（区别于 worldbuilding-guide），而是提供概念框架——agent 从理论文件中提取概念工具应用到对应操作步骤中。

### 文件清单

| 文件 | 源 JSON prompt | 内容 | 强制定点 |
|------|---------------|------|---------|
| `references/theory/mckee-character.md` | #70（知识库：《人物》） | 人物 vs 人、透明度/复杂性/吸引力/弧光、六维度调整、情节-人物辩题 | `character-interview-guide.md` 第二部分"角色审查"（直接嵌入诊断流程） |
| `references/theory/mckee-dialogue.md` | #71（知识库：《对白》） | 对白即行动、三大功能（暴露/操控/维护）、潜文本动词体系、三种言说路径 | `novel-drafting/SKILL.md` Writer 契约（对话场景编写条款） |
| `references/theory/mckee-story.md` | #72 + #73（知识库：《故事》+ 标注） | 故事三角、激励事件、幕设计（三幕/五幕）、场景分析、危机与高潮 | `narrative-structure-guide.md` 第一部分（情节结构选型步骤） |
| `references/theory/harmon-story-circle.md` | #74（知识库：故事圈） | 8 阶段循环（均衡→需求→跨越→适应→胜利→代价→回归→改变）、与幕结构对照 | `character-interview-guide.md` char0（弧光设计）和 narrative-structure-guide（弧光校验） |
| `references/theory/zhuji-character-theory.md` | #69（珠矶自有理论体系） | 三轴解构（外显轴/内质轴/外延轴）、各轴子维度与联动规则 | `character-interview-guide.md` 管线段落（强制前置阅读） |

### 文件结构约定

每个理论文件包含：
1. **概念框架** — 对该理论的核心体系做结构化呈现
2. **操作要点** — 理论中的可操作概念及如何使用
3. **与项目产物的映射** — 指出哪些概念对应哪些产物字段

### 强制调用机制

理论文件通过以下方式确保 agent 非查阅不可：

- `mckee-character.md`：`character-interview-guide.md` 的角色审查流程中直接嵌入"按麦基六维度逐项诊断"，不查阅则无法完成审查
- `mckee-dialogue.md`：`novel-drafting/SKILL.md` Writer 契约新增硬性条款——每段对话必须体现至少一种潜文本动词
- `mckee-story.md` + `harmon-story-circle.md`：`narrative-structure-guide.md` 在情节结构选型和弧光校验步骤中直接引用两个理论文件，不查阅则无法完成步骤
- `zhuji-character-theory.md`：`character-interview-guide.md` 管线段落标注"开始前必须阅读"，并将三轴概念融入 char0~3 的每一步操作要点

---

## 阶段二：创建 `narrative-structure-guide.md`

### 定位

Agent 操作手册。在 novel-research Phase 4 撰写叙事结构和章节计划时使用，将模糊的情节构想转化为可逐章执行的框架。

### 文件结构

```
narrative-structure-guide.md
├── 引言 — 何时使用、前置条件
├── 第一部分：叙事框架设计
│   ├── 预设作者与语境 — 叙事声音的人格面具、知识范围、价值立场
│   ├── 情节结构与叙事序列 — 幕结构选型 + 故事圈弧光校验
│   ├── 叙述视角与时间处理 — 人称选择、视角切换规则、时间跳跃
│   └── 预期读者体验 — 信息不对称设计、悬念节奏、空白策略
├── 第二部分：叙事网络梳理
│   ├── 章节概览 — 逐章一句话概括 + 起承转合位置
│   ├── 情感弧线与紧张度曲线 — 全篇情感基调变化
│   └── 伏笔/呼应时间线 — 与 foreshadowing.md 交叉对照
├── 第三部分：章节细化
│   └── 逐章深度设计 → 写入 chapter-plan.md
└── 产出清单
```

### 各部设计要点

**引言** — 说明此文件在 Phase 4 的叙事步骤中使用。前置条件：角色创建完成、世界观构建完成。

**第一部分：叙事框架设计**（写入 `plot-outline.md` 的叙事约束段落）

| 步骤 | 操作要点 | 强制依赖 |
|------|---------|---------|
| 预设作者与语境 | 定义叙事声音：人格面具特征、知识范围（全知/有限）、价值立场、情感倾向；确定故事发生时代的叙事含义 | 无 |
| 情节结构与叙事序列 | 选择合适的幕结构（三幕/五幕/故事圈）；确定故事因果链和时序安排 | **必须查阅 `mckee-story.md` 的幕设计原则** |
| 叙述视角与时间处理 | 选定人称和视角切换规则；定义时间跳跃的频率和合法性规则 | 无 |
| 预期读者体验 | 设计信息不对称（读者知道/不知道什么）；确定悬念节奏和留给读者推断的空白 | 无 |
| 弧光校验 | 用故事圈 8 阶段逐角色校验弧光完整性；缺失某阶段需注明原因 | **必须查阅 `harmon-story-circle.md`** |

**第二部分：叙事网络梳理**（更新 `plot-outline.md` 和 `foreshadowing.md`）

| 步骤 | 产出 | 写入位置 |
|------|------|---------|
| 章节概览 | 每章一句概括 + 起承转合位置标注 | `plot-outline.md` |
| 情感/紧张度曲线 | 每章情感基调 → 全篇情感曲线；紧张-缓解交替节奏 | `plot-outline.md` |
| 线索管理 | 伏笔设置章 → 呼应揭示章对照表 | `plot-outline.md` + 与 `foreshadowing.md` 交叉校验 |

**第三部分：章节细化**（写入 `chapter-plan.md` 逐章条目）

每章填写：本章目标、出场角色（对齐角色卡列表）、时空起止、关键场景（2–5 个）、前后衔接、预期字数。

### 关联的 SKILL.md 变更

`novel-research/SKILL.md` Phase 4 的描述改为两步：
1. 按 narrative-structure-guide 第一部分建立叙事框架 → 写入 plot-outline.md
2. 按第二、三部分梳理章节 → 写入 chapter-plan.md

同时修复第 175 行和第 274 行的僵尸引用。

---

## 阶段三：SKILL.md ×2 + lint-contract.md 注入

### 3.1 `novel-research/SKILL.md` 变更

| 位置 | 变更内容 |
|------|---------|
| Phase 3 — 在角色管线段落（当前第 154 行附近）之前 | **新增前置段落**："agent 在开始角色创建前，必须阅读 `references/theory/zhuji-character-theory.md` 理解三轴解构体系，并在后续 char0~3 中以三轴框架引导访谈。" |
| Phase 4 — 风格与叙事构建段落（当前第 175 行） | **重写**：先按 narrative-structure-guide 第一部分建立叙事框架（情节结构选型时必须查阅 `references/theory/mckee-story.md`），再按第二、三部分梳理章节。保留对 style-analysis-guide 的已有引用。 |
| 参考文件列表（当前第 268-274 行） | **新增**：`references/theory/mckee-character.md`、`mckee-dialogue.md`、`mckee-story.md`、`harmon-story-circle.md`、`zhuji-character-theory.md`、`references/narrative-structure-guide.md` |

### 3.2 `novel-drafting/SKILL.md` 变更

| 位置 | 变更内容 |
|------|---------|
| Writer 契约（当前第 84-97 行） | **新增条款**："对话场景：每段对话必须至少体现一种潜文本动词（暴露/操控/维护），对照 `references/theory/mckee-dialogue.md` 的三大功能体系。" **补充风格条款**："起草时对照 `references/style-analysis-guide.md` 的四层宪章（神/骨/皮/肉）逐层校验。"（此条已有雏形但需强化） |
| Reviewer 契约（当前第 99-117 行） | **新增条款**："角色行为一致性：对照 `references/theory/mckee-character.md` 的六维度体系检查角色行为是否存在矛盾。""叙事结构校验：本章是否达成 chapter-plan 目标？是否正确承接前章/铺垫后章？" |
| 在 Writer 契约之前新增一个小节 | **COT 思维链模板**：subagent 在执行起草/审查前按以下模板推进——① 上下文理解（本章在全书的位置/目标）→ ② 约束回顾（风格约束/角色声线/伏笔要求）→ ③ 执行方案（拟写几幕/每幕功能）→ ④ 自检（是否覆盖全部要求）。此模板从 JSON 源 COT prompt 中提炼并改写。 |

### 3.3 `lint-contract.md` 变更

保留现有第一部分（Entry/Progress/Completion/WordCount 四种验证模式），**新增第二部分**：

```
## 起草自检清单

以下维度供 agent 在提交验证前做自我审查。覆盖 15+ 检查项。

### 结构维度
- □ 章节目标达成
- □ 前后衔接正确

### 角色维度
- □ 角色声线一致
- □ 角色行为一致（对照 mckee-character 六维度）
- □ 角色弧光推进（可感知变化）

### 叙事维度
- □ 叙事视角一致
- □ 节奏合理

### 风格维度
- □ 四层宪章逐层校验（神/骨/皮/肉）
- □ 对话功能校验（每段对话至少体现一种潜文本动词）

### 质量维度
- □ 信息密度达标（新信息/线索推进）
- □ 字数达标
- □ 无伏笔遗漏
- □ 无设定矛盾（对照 worldbuilding-guide 约束）

### 连续性维度
- □ 时间线一致
- □ 空间转换有交代
```

---

## 文件变更总览

### 新增

| 文件 | 类型 |
|------|------|
| `skills/novel-research/references/theory/` 目录 | 新建 |
| `skills/novel-research/references/theory/mckee-character.md` | 理论参考 |
| `skills/novel-research/references/theory/mckee-dialogue.md` | 理论参考 |
| `skills/novel-research/references/theory/mckee-story.md` | 理论参考 |
| `skills/novel-research/references/theory/harmon-story-circle.md` | 理论参考 |
| `skills/novel-research/references/theory/zhuji-character-theory.md` | 理论参考 |
| `skills/novel-research/references/narrative-structure-guide.md` | Agent 操作手册 |

### 修改

| 文件 | 变更类型 |
|------|---------|
| `skills/novel-research/SKILL.md` | Phase 3/4 流程段落更新 + 参考文件列表扩展 |
| `skills/novel-drafting/SKILL.md` | Writer/Reviewer 契约新增条款 + COT 模板注入 |
| `skills/novel-drafting/lint-contract.md` | 新增第二部分"起草自检清单" |

### 不变

| 范围 | 说明 |
|------|------|
| 现有 character-interview-guide.md | 已完成且质量达标，仅在审查章节补上 mckee-character 参照说明 |
| 现有 worldbuilding-guide.md | 已完成，不变 |
| 现有 style-analysis-guide.md | 已完成，不变 |
| 现有验证器脚本 | 不变 |
| delivery 阶段 | 不变 |

---

## 测试与验证

### 文档质量

- [ ] 6 个新文件均覆盖各自设计中列出的全部章节
- [ ] 所有内容为自己语言重写，无 JSON 源 prompt 编号标记
- [ ] narrative-structure-guide 的产出格式对应到正确的项目产物（plot-outline / chapter-plan / foreshadowing）

### 一致性

- [ ] `novel-research/SKILL.md` Phase 3/4 描述与 character-interview-guide / narrative-structure-guide 流程一致
- [ ] `novel-drafting/SKILL.md` Writer/Reviewer 契约引用指向存在的文件
- [ ] lint-contract 自检清单项目与 narrative-structure-guide / mckee-character / mckee-dialogue 的概念体系一致
- [ ] 无僵尸引用

### 回归

- [ ] `rtk npx tsc --noEmit`
- [ ] `rtk npm test`
- [ ] 端口性回归：`node --import tsx --test tests/validators.test.js --test-name-pattern "skill source files do not depend on repo-root shared script paths"`

### 强制调用验证

- [ ] character-interview-guide 的审查章节直接嵌入了 mckee-character 诊断流程（不查阅则无法完成审查）
- [ ] drafting SKILL.md Writer 契约包含对 mckee-dialogue 的硬性条款
- [ ] narrative-structure-guide 的情节结构步骤标注了必须查阅 mckee-story 和 harmon-story-circle

---

## 非目标

- 不在本任务中清理已完成的 character-interview-guide / worldbuilding-guide / style-analysis-guide 中的源 prompt 标记（另立任务）
- 不提取 JSON 中已标记排除的 SillyTavern 特有机能
- 不修改验证器脚本
- 不修改 delivery 阶段
- 不修改角色卡模板
