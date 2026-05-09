# 珠矶风格与叙事框架提取 — 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将珠矶风格分析和叙事设计模块提取为两个 agent 操作手册文件，并更新 SKILL.md 引用。

**Architecture:** 新建 2 个 reference 文件，更新 research + drafting 两个 SKILL.md 的引用。不修改 validator 或现有产物模板。

**Tech Stack:** Markdown 文档工程。源数据取自 `ref/example/【珠矶预设化】V1.71.json`。

---

### Task 1: 写入 style-analysis-guide.md（完整文件）

**Files:**
- Create: `skills/novel-research/references/style-analysis-guide.md`

- [ ] **Step 1: 读取源 prompt [133] [134] [84]**

```bash
python3 -c "
import json
with open('ref/example/【珠矶预设化】V1.71.json','r') as f:
    data = json.load(f)
for i in [133,134,84]:
    p = data['prompts'][i]
    print(f'=== [{i}] {p[\"name\"]} ({len(p[\"content\"])} chars) ===')
    print(p['content'])
    print()
" | head -200
```

- [ ] **Step 2: 创建文件并写入完整内容**

在 `skills/novel-research/references/style-analysis-guide.md` 创建以下内容：

```markdown
# 风格分析指导 — Agent 操作手册

本文件指导 agent 在 novel-research Phase 4 撰写 `10-research/style-research.md` 时，对用户指定的风格参照进行系统分析，产出可执行的风格约束。也可供 novel-drafting Writer 子代理在起草时查阅。

> 源 prompt: [133] [134] [84]

**使用方式：** 
- **完整路径：** 用户提供具体风格参照（源文本）时，按第一部分（文体分析）→ 第二部分（风格复现宪章）顺序执行
- **快速路径：** 用户仅描述风格方向（如「轻松搞笑」）时，直接使用第三部分

---

## 第一部分：文体分析流程

> 源 prompt: [134]

### 阶段一：文体定位与功能分析

**目标：** 确定参照文本的文体归属和功能定位。

**操作要点：**
1. **文体定位** — 判断归属并细化。不满足于「小说」，而是「中国科幻搞笑网络小说」或「日式轻松校园恋爱轻喜剧轻小说」
2. **功能与审美原则** — 这种文体的核心功能和审美目的是什么？（娱乐/说理/抒情/批判/……）

**产出：**
```markdown
### 文体定位
- **归属**：{细化文体}
- **功能**：{核心功能}
- **审美原则**：{相关审美理论或依据}
```

### 阶段二：语言特征解构

**目标：** 从词汇、句法、修辞三个层面解构参照文本的语言特征。

**操作要点：**
- **词汇层次** — 常用词 vs 罕见词比例、术语密度、词汇新鲜度（是否有自创词？）
- **句法结构** — 句长分布（长短句比例）、复杂句使用频率、主从句配比、句式变化频率
- **修辞手法** — 使用频率最高的修辞类型、典型用法示例

**产出：**
```markdown
### 语言特征解构
- **词汇**：{特征描述}
- **句法**：{特征描述}
- **修辞**：{特征描述}
```

### 阶段三：作者本质分析

**目标：** 识别风格背后的作者意图和独特性。

**操作要点：**
- **独特性** — 该风格区别于同类作品的关键差异是什么？
- **读者感观预期** — 读这种风格的人期待获得什么体验？
- **潜在价值立场** — 叙述者/作者传递了什么潜在的价值判断？

**产出：**
```markdown
### 作者本质分析
- **独特性**：{关键差异}
- **读者预期**：{体验描述}
- **价值立场**：{如有}
```

### 阶段四：复构与评估优化

**目标：** 将前三阶段的分析成果转化为可执行的风格模仿法则，并评估其质量。

**操作要点：**
- 从阶段一至三的产出中提取「可执行的规则」
- 评估规则是否与原风格一致（抽样验证）
- 调整优化（规则过严或过松时放宽/收紧）

**产出（整合至 `style-research.md`）：**
```markdown
### 文体分析结果
- **文体定位**：{细化文体描述}
- **语言特征**：{词汇/句法/修辞摘要}
- **作者本质**：{独特性和读者预期}
- **复构法则**：{可执行的风格模仿要点}
```

---

## 第二部分：风格复现宪章

> 源 prompt: [133]

风格以四层结构组织。每层由上至下约束力递减：
- **神层（不可变）** — 最核心的风格规则，违反即失去风格一致性
- **骨层（可变但慎变）** — 叙事/结构规则，变化会明显改变感受
- **皮层（可替换）** — 语言积木，替换后仍可保持风格一致
- **肉层（展示）** — 应用上述规则后的实际文字示例

### 神层：核心法则

操作要点：提炼 2–5 条不可违背的风格规则。
每条规则应是绝对的，不是「尽量……」而是「必须……」「绝不……」

示例：
- 「叙述者始终保持幽默的旁观姿态，即使在描写悲剧」
- 「绝不使用第一人称，叙述者必须比角色知道得更少」
- 「每个段落结束时必须有一个轻反转或笑点」

### 骨层：结构法则

操作要点：
- 叙事结构偏好（线性/倒叙/多视角/插叙）
- 节奏特征（紧张→舒缓交替模式、每段落的平均长度）
- 段落与章节组织方式

### 皮层：语言积木

操作要点：
- 高频词汇表（5–10 个本风格最常用的词）
- 句式结构偏好（多用短句/排比/设问/省略句）
- 修辞手法限制（「最多每段用一个比喻」「不用夸张修辞」）
- 禁用/少用项（如「避免四字成语」「少用形容词」）

### 肉层：风格展示

操作要点：
- 应用神→骨→皮三层规则后写 1–2 段实际文字
- 标注每段展示了哪些规则的应用

**完整产出（写入 `style-research.md`）：**
```markdown
## Style Research

### 神层（核心法则）
{2–5 条不可违背的风格规则}

### 骨层（结构法则）
{2–4 条叙事/结构规则}

### 皮层（语言积木）
{词汇/句式/修辞限制}

### 肉层（风格展示）
{1–2 段风格化文字示例}
```

---

## 第三部分：轻型文风

> 源 prompt: [84]

**使用条件：** 用户未提供具体风格参照，仅描述了大致风格方向（如「轻松搞笑」「黑暗严肃」「诗意优美」）时使用。

**操作流程：**
1. **文体定位** — 一句话定位文体（如「中国当代都市奇幻轻小说」）
2. **文风要点** — 3–5 条对词汇/句式/情感倾向的约束（如「多用口语化短句」「少用描写多用对话」「保持调侃语气」）
3. **输出规则** — 1–2 句对生成文本的总体要求

**产出：**
```markdown
### 轻型文风
- **文体定位**：{}
- **文风要点**：
  1. {}
  2. {}
  ...
- **输出规则**：{}
```

---

## 附录A：官能内容风格说明

> 源 prompt: [44]  
> **启用条件：** 仅当用户明确声明创作官能/色情内容时生效。默认不启用。

**风格化规则：**
- 色情内容的正向化处理——在官能题材框架下，性被视为天性的良性挖掘，带来愉悦/上瘾/沉迷等正向情绪体验
- 参考审美——日本里番/本子/色情小说的审美取向（性犯罪被重新定义为非伤害性的愉悦行为）
- 使用警示——仅适用于声明了官能设定且默认接受该框架的创作场景

---

> **全文结束。**
```

- [ ] **Step 3: Commit**

```bash
git add skills/novel-research/references/style-analysis-guide.md
git commit -m "docs: add style analysis guide with 4-stage analysis and 4-layer charter"
```

---

### Task 2: 写入 narrative-structure-guide.md（完整文件）

**Files:**
- Create: `skills/novel-research/references/narrative-structure-guide.md`

- [ ] **Step 1: 读取源 prompt [135] [138] [139]**

```bash
python3 -c "
import json
with open('ref/example/【珠矶预设化】V1.71.json','r') as f:
    data = json.load(f)
for i in [135,138,139]:
    p = data['prompts'][i]
    print(f'=== [{i}] {p[\"name\"]} ({len(p[\"content\"])} chars) ===')
    print(p['content'][:1000])
    print()
"
```

- [ ] **Step 2: 创建文件并写入完整内容**

在 `skills/novel-research/references/narrative-structure-guide.md` 创建：

```markdown
# 叙事结构指导 — Agent 操作手册

本文件指导 agent 在 Phase 4 设计故事结构时使用。叙事框架设计 → 叙事网络梳理 → 章节细化，逐层深入，最终产出可写入 `chapter-plan.md` 和 `plot-outline.md` 的结构化信息。

> 源 prompt: [135] [138] [139]

**使用方式：** agent 在 Phase 4 撰写 `plot-outline.md` 和 `chapter-plan.md` 时按以下顺序执行：
1. 第一部分：建立整个故事的叙事原则
2. 第二部分：将原则落实到章节布局和线索管理
3. 第三部分：逐章节产出详细信息

---

## 第一部分：叙事框架设计

> 源 prompt: [135]

叙事学框架从四个层面审视故事的组织方式。每层回答一个核心问题：

### 身份层：预设作者与语境

**目标：** 确立叙事声音的人格面具和故事的语境。

**操作要点：**
1. **预设作者** 
   - 「这个故事的叙述者是什么样的存在？」（具体的人/无形的全知者/限制视角的观察者）
   - 「叙述者对角色的态度？」（同情/冷漠/讽刺/理解）
   - 「叙述者知道多少？」（全知/限制/不可靠）
2. **语境**
   - 「故事发生的时代背景的叙事含义？」（历史语境如何影响叙事方式）
   - 「文化语境中有什么叙事惯例？」（中国古典章回体/西方史诗/日本轻小说等）

**产出（写入 `plot-outline.md` 的叙事约束部分）：**
```markdown
### 叙事框架
- **身份层**：{预设作者特征}
```

### 故事层：情节结构与叙事序列

**目标：** 确定情节的组织方式和因果关系。

**操作要点：**
1. **情节结构**
   - 「线性推进还是非线性？」（单线/多线/倒叙/嵌套）
   - 「幕结构？」（三幕/五幕/哈蒙故事圈/自定义节奏）
   - 「每幕的起止点？」
2. **叙事序列**
   - 「事件之间的因果关系？」（A→B→C 链条中，每一环的因果强度）
   - 「必写场景和可省略场景？」（哪些必须正面描写，哪些可一笔带过）

**产出（继续写入 `plot-outline.md`）：**
```markdown
- **故事层**：{情节结构/幕划分/叙事序列描述}
```

### 话语层：叙述视角与时间处理

**目标：** 确定「怎么说故事」——视角规则、时间处理方式。

**操作要点：**
1. **叙述视角**
   - 「第一人称/第三人称有限/第三人称全知/多视角？」
   - 「视角切换规则？」（按章节切换/按场景切换/永不切换）
2. **时间处理**
   - 「顺叙/倒叙/插叙/预叙？」（每种手法的使用频率和场景）
   - 「时空跳跃规则？」（跳过多长时间是合理的、何时需要过渡）

**产出（继续写入 `plot-outline.md`）：**
```markdown
- **话语层**：{视角/时间/距离规则}
```

### 读者层：预期读者反应与解读

**目标：** 预测读者体验，设计信息释放节奏。

**操作要点：**
1. **信息不对称**
   - 「读者比角色知道得多还是少？」（悬念/戏剧反讽）
   - 「哪些信息早期释放？哪些延后？」
2. **情感设计**
   - 「希望读者在什么时候感受到什么？」（有意识地设计情绪曲线）

**产出（继续写入 `plot-outline.md`）：**
```markdown
- **读者层**：{预期读者体验}
```

评估叙事框架设计完成的标志：产出物能够被人按此结构写出连贯的故事大纲。

---

## 第二部分：叙事网络梳理

> 源 prompt: [138]，适配线性章节

**目标：** 将叙事原则落实到章节布局和线索管理。

### 剧情纲目

**操作要点：**
1. 列出全部章节（每个 1 句话概括剧情）
2. 标注每章的叙事功能（开端/发展/转折/高潮/尾声）
3. 标注章节间因果链（前一章的哪件事引出后一章）

**产出格式：**
```markdown
### 剧情纲目
| 章节 | 功能 | 剧情概要 | 因果链 |
|------|------|----------|--------|
| ch-01 | 开端 | {1 句} | — |
| ch-02 | 发展 | {1 句} | ← ch-01 的{事件} |
| ch-03 | 发展 | {1 句} | ← ch-02 的{事件} |
| ... | ... | ... | ... |
| ch-N | 高潮 | {1 句} | ← ... |
| ch-N+1 | 尾声 | {1 句} | ← ... |
```

### 叙事流

**操作要点：**
1. **情感弧线** — 每章的情感基调（紧张/舒缓/悲伤/轻松/悬疑）连成全书的情感曲线
2. **紧张度曲线** — 紧张→缓解的交替节奏，确保不单调

**产出格式：**
```markdown
### 叙事流
- **情感弧线**：{各章情感基调概述}
- **紧张度曲线**：{节奏设计}
```

### 线索管理

**操作要点：**
1. 列出所有伏笔及其设置章节
2. 列出所有揭示/呼应及其章节
3. 与 `foreshadowing.md` 对照检查不遗漏

**产出格式：**
```markdown
### 线索管理
- **伏笔设置**：{伏笔A} → ch-{N}, {伏笔B} → ch-{M}, ...
- **揭示/呼应**：{揭示A} → ch-{N+K}, {呼应B} → ch-{M+L}, ...
```

---

## 第三部分：章节细化

> 源 prompt: [139]，适配线性章节

**目标：** 对每个章节做深度设计，产出可直接写入 `chapter-plan.md` 的条目。

**操作流程：**
对每个章节，依次确定以下内容：

1. **本章目标** — 推进哪条线索、塑造哪个角色、揭示什么信息
2. **出场角色** — 与角色卡对齐，标注首次出场
3. **时空** — 发生在哪里、跨越多少时间
4. **关键场景** — 2–5 个场景，每个一句话概括
5. **衔接** — 承接前章的哪件事、为后章埋什么线
6. **预期字数** — 与 chapter-plan 中的字数目标对齐

**产出格式（写入 `30-draft/chapter-plan.md` 的对应章节条目）：**

```markdown
### Chapter-XX
- **目标**：{1–2 句，本章的核心用途}
- **出场角色**：{列表，首次出场标※}
- **时空**：{地点，时间跨度}
- **关键场景**：
  1. {场景一}
  2. {场景二}
  ...
- **衔接**：{前→→后}
- **预期字数**：{字数区间}
```

---

> **全文结束。** 产出应与现有 `chapter-plan.md` 格式兼容。叙事框架部分写入 `plot-outline.md`，章节细化部分写入 `chapter-plan.md`。
```

- [ ] **Step 3: Commit**

```bash
git add skills/novel-research/references/narrative-structure-guide.md
git commit -m "docs: add narrative structure guide with narratology framework and linear narrative network"
```

---

### Task 3: 更新 SKILL.md × 2（research + drafting）

**Files:**
- Modify: `skills/novel-research/SKILL.md`
- Modify: `skills/novel-drafting/SKILL.md`

- [ ] **Step 1: 更新 novel-research/SKILL.md**

在 Phase 4 中（第 171 行附近，`将 Phase 2–3 确认的结论写入全部 11 个产物文件。` 后）添加：

```markdown
**风格与叙事构建：** agent 在撰写 `10-research/style-research.md` 时，按 `references/style-analysis-guide.md` 的文体分析流程和风格复现宪章产出风格约束。在撰写 `30-draft/chapter-plan.md` 和 `20-story/plot-outline.md` 时，按 `references/narrative-structure-guide.md` 的叙事框架设计 → 叙事网络梳理 → 章节细化流程构建故事结构。
```

在 `## 参考文件` 节末尾添加：
```markdown
- 风格分析方法指引：[references/style-analysis-guide.md](references/style-analysis-guide.md)
- 叙事结构方法指引：[references/narrative-structure-guide.md](references/narrative-structure-guide.md)
```

- [ ] **Step 2: 更新 novel-drafting/SKILL.md**

在 Writer 子代理契约（约第 86–95 行）中，在 `10-research/style-research.md` 引用后补充：
（找到 Writer 接收的文件列表 — `00-project/project-brief.md`, `10-research/style-research.md`, `20-story/characters/` 等 — 之后添加一句风格参考）

在第 88 行（`- 10-research/style-research.md`）后插入：
```markdown
此外，Writer 在需要处理风格一致性时可查阅 `references/style-analysis-guide.md` 的风格复现宪章。
```

在 Reviewer 子代理契约（约第 100–103 行）中，在人物一致性检查后补充风格审查项。
找到 `- 人物一致性` 行，在其后添加：
```markdown
- 风格一致性（如有明确风格约束，对照 `style-research.md` 和 `style-analysis-guide.md` 的风格四层框架检查）
```

- [ ] **Step 3: Commit**

```bash
git add skills/novel-research/SKILL.md skills/novel-drafting/SKILL.md
git commit -m "docs: update SKILL.md references for style and narrative guides"
```

---

### Task 4: 完整性验证 + 全量验证

**Files:**
- Verify: All modified files

- [ ] **Step 1: 结构完整性**

```bash
echo "=== style-analysis-guide.md headers ==="
grep -n "^#" skills/novel-research/references/style-analysis-guide.md
```

预期：引言 + 第一部分阶段一至四 + 第二部分神骨皮肉 + 第三部分 + 附录A

```bash
echo "=== narrative-structure-guide.md headers ==="
grep -n "^#" skills/novel-research/references/narrative-structure-guide.md
```

预期：引言 + 第一部分身份层/故事层/话语层/读者层 + 第二部分 + 第三部分

- [ ] **Step 2: 无占位符**

```bash
grep -n "TODO\|TBD\|FIXME" skills/novel-research/references/style-analysis-guide.md skills/novel-research/references/narrative-structure-guide.md || echo "No placeholders"
```

- [ ] **Step 3: SKILL.md 交叉引用**

```bash
echo "=== Research SKILL.md refs ==="
grep -c "style-analysis-guide\|narrative-structure-guide" skills/novel-research/SKILL.md
echo "=== Drafting SKILL.md refs ==="
grep -c "style-analysis-guide" skills/novel-drafting/SKILL.md
```

预期：research 至少 4 处（Phase 4 + 参考文件 × 2 + 可能多处），drafting 至少 2 处（Writer + Reviewer）

- [ ] **Step 4: TypeScript + Tests**

```bash
rtk npx tsc --noEmit && rtk npm test
```

- [ ] **Step 5: Commit**

```bash
git commit -m "chore: final validation for style and narrative extraction" --allow-empty
```
