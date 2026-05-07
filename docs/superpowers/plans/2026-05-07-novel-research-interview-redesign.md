# novel-research Interview Flow Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restructure `skills/novel-research/SKILL.md` from a flat interview list into 6 numbered phases (scope assessment → approach exploration → incremental interview → research & files → self-check → user review gate), and update `completion-gate.md` exit rules to reference the new Phase 6 gate.

**Architecture:** Single-file skill doc rewrite. The core change is reordering and wrapping existing content into phase-structured sections. No new files. The only reference file touched is `completion-gate.md` (exit rules). All other references (`interview-loop.md`, `research-workflow.md`, `file-contract.md`, `project-scaffold.md`) remain unchanged.

**Tech Stack:** Markdown-only change. Verification via `npx tsc --noEmit` and `npm test`.

---

### Task 1: Rewrite SKILL.md — top half (overview through Phase 3)

**Files:**
- Modify: `skills/novel-research/SKILL.md:1-96` (replaces frontmatter through current 角色卡导入)

- [ ] **Step 1: Replace SKILL.md from frontmatter through Phase 3**

Replace lines 1–96 (the YAML frontmatter through the 角色卡导入 section) with the new content below. The replacement includes: frontmatter, 概述, 何时使用, 必需产物, Phase 1, Phase 2, Phase 3.

```markdown
---
name: novel-research
description: Use when 需要为新的中文小说项目完成设定澄清、背景或世界观调研、风格约束与起草前项目脚手架搭建
---

# 小说调研

## 概述

创建单本小说项目，通过 6 个阶段将模糊的故事构想转化为可供起草长期使用的 Markdown 知识库。

- Phase 1–3 是访谈阶段（范围评估 → 方案探索 → 增量访谈），聚焦与用户协作澄清创作意图
- Phase 4–6 是执行与验证阶段（调研撰写 → 自检 → 用户审阅），将确认结论固化为产物文件

除非用户明确拒绝，否则默认进行联网调研。

## 何时使用

- 用户想从零开始一个新小说项目
- 用户只有一个故事前提，需要进一步结构化
- 项目需要设定、类型、风格或专业领域调研
- 在文件补齐前，起草阶段必须保持阻塞

## 必需产物

只有以下文件全部存在且内容充分时，才能将调研标记为完成：

- `00-project/project-brief.md`
- `00-project/success-criteria.md`
- `00-project/workflow-status.md`
- `10-research/topic-research.md`
- `10-research/setting-research.md`
- `10-research/style-research.md`
- `10-research/references.md`
- `20-story/characters.md`
- `20-story/plot-outline.md`
- `20-story/foreshadowing.md`
- `30-draft/chapter-plan.md`

以上文件在 Phase 4 中撰写，在 Phase 5 中自检，在 Phase 6 中由用户审阅确认。

---

## Phase 1: 范围评估与分解

**进入条件：** 用户提出任何新小说构想时首先执行此阶段。

**如有以下信号，项目需要拆分：**
- 三部曲 / 系列 / 多部
- 超过 3 条主线 POV 的群像剧
- 横跨多个时代或大陆，世界观本身即为独立工程
- 用户明确提到「系列」「多部」

**拆分流程：**
1. 帮助用户理清子项目之间的关系和阅读顺序
2. 每个子项目是独立的一本书，有独立目录结构和 research 周期
3. 当前 session 聚焦第一个子项目

**正常范围：** 若适合一本小说消化，执行项目创建规则并进入 Phase 2。

### 项目创建规则

调研开始时，使用书名或暂定名派生出的 slug 创建单书目录。

如果 agent 是从工作区根目录启动，而不是从书籍根目录启动，则创建并使用以下结构：
- `<workspace-root>/<book-slug>/00-project`
- `<workspace-root>/<book-slug>/10-research`
- `<workspace-root>/<book-slug>/20-story`
- `<workspace-root>/<book-slug>/30-draft`
- `<workspace-root>/<book-slug>/40-review`
- `<workspace-root>/<book-slug>/50-delivery`

当后续 skill 引用 `00-project/...` 这类路径时，应将其解析为相对于检测出的小说项目根目录。该根目录可能是：
- 当前工作目录本身
- 当前工作目录下唯一的一个子级书籍目录

创建以下目录：
- `00-project`
- `10-research`
- `20-story`
- `30-draft/chapters`
- `40-review/chapter-reviews`
- `50-delivery/output`

在声明进度之前，必须先实例化所有模板文件。

---

## Phase 2: 方案探索

**目的：** 在细节访谈之前，向用户呈现 2-3 个不同的大方向，让用户主动选择而非被动跟随 agent 的默认理解。

**方向卡片格式**（每个 3-5 句）：
- 一句话定位（这是什么故事）
- 叙事视角 + 体裁
- 基调与气质
- 独特卖点（和另外几个方向的本质区别）

**示例：** 用户说「我想写一个复仇仙侠」——

- 方向 A：**传统修炼复仇记** — 第一人称，主角从灭门到飞升，黑暗写实基调，核心是力量成长与道德代价
- 方向 B：**庙堂博弈暗线** — 第三人称多视角，复仇藏在宗门与王朝权力斗争之下，基调冷峻智斗
- 方向 C：**解构式反套路** — 第一人称带讽刺口吻，主角发现「复仇」是更高存在设计的剧本，基调荒诞中有温情

**流程：**
1. Agent 说明「你的想法可以往这几个方向走」
2. 逐个呈现方向卡片
3. 等待用户选择（可单选、可混合元素、可提出自己的方向）

**跳过条件：** 若用户初始表述已非常具体（如「第三人称多 POV、明朝背景、谍战武侠」），可将方案探索缩短为一次确认。

---

## Phase 3: 增量访谈

8 个访谈话题分为 3 组。组内逐题提问，组末暂停确认。一次只问一个问题，不要批量提问。

### A 组：外部形态

| 话题 | 问法 |
|------|------|
| 类型与体裁 | 这是什么样的故事？ |
| 目标读者 | 预期读者是谁？ |
| 篇幅目标 | 短篇、中篇、长篇？大致字数？ |

**A 组确认：** 三题答完后，agent 用 3-5 句话总结，询问「这部分理解对吗？」

### B 组：内在驱动

| 话题 | 问法 |
|------|------|
| 语气与氛围 | 严肃、轻快、黑暗、希望感？ |
| 核心冲突 | 中心张力是什么？ |
| 主角欲望 | 主角最想得到什么？ |

**B 组确认：** 同 A 组，总结后确认。

### 角色卡导入时机

在 B 组完成之后、C 组开始之前询问用户：

> "你是否拥有 SillyTavern / 酒馆角色卡（PNG 或 WebP 图片）？如果有，我可以解析并导入，作为人物设定的起点。"

如果用户提供角色卡路径：
1. 运行 `<skill-root>/scripts/parse-charcard.mts --input <path> --project-root <project-root>`
2. 读取生成的 `20-story/charcard-raw/<角色名>.md`
3. 遍历「需代理总结」区域的 system_prompt / post_history_instructions，提取对角色塑造有用的信息
4. 将解析结果 + 代理总结整合到 `20-story/characters.md` 的对应角色条目
5. 若解析出的信息足以覆盖模板字段，直接填充；不足的部分在 Phase 4 补充

如果用户没有角色卡，继续 C 组访谈。

### C 组：边界条件

| 话题 | 问法 |
|------|------|
| 结局倾向 | 圆满、悲剧、开放式、苦乐参半？ |
| 禁忌内容 | 有哪些题材、套路或元素必须避免？ |

**C 组确认：** 同前，总结后确认。

### 整体确认

三组全部通过后，agent 给出覆盖所有 8 个话题 + 角色信息的整体摘要。用户确认后进入 Phase 4。
```

- [ ] **Step 2: Verify the edit applied correctly**

Run: `head -5 skills/novel-research/SKILL.md`
Expected: YAML frontmatter with `name: novel-research`

Run: `rg "Phase 3: 增量访谈" skills/novel-research/SKILL.md`
Expected: match found

- [ ] **Step 3: Commit**

```bash
git add skills/novel-research/SKILL.md
git commit -m "feat(research): restructure SKILL.md top half — Phases 1-3"
```

---

### Task 2: Rewrite SKILL.md — bottom half (Phase 4 through end)

**Files:**
- Modify: `skills/novel-research/SKILL.md` (remaining old content after the Phase 3 insertion)

- [ ] **Step 1: Replace remaining old content with Phases 4-6 + preserved sections**

Now replace everything after Phase 3 (the old 搜索策略, 调研转化, 完整性清单, 推进前置条件, 常见自我说服, 状态流转, 下一步 sections) with the new Phase 4–6 content plus updated preserved sections.

```markdown
---

## Phase 4: 调研与文件撰写

将 Phase 2–3 确认的结论写入全部 11 个产物文件。

### 联网调研

对于领域事实、时代细节、设定真实性、职业流程、地域背景和风格参照，除非用户明确禁止，否则默认进行联网调研。

如果禁止搜索：
- 不要联网浏览
- 在 `references.md` 中标记不确定区域
- 明确指出哪些细节是推断而非验证所得

### 调研转化

不要停留在链接或摘录层面。把每一个有用发现转化为以下一种或多种内容：
- 设定约束
- 术语说明
- 真实性风险
- 风格规则
- 禁忌或连续性风险

### 文件撰写原则

- 每个文件的约束必须可追溯到 Phase 3 的确认结论
- 文件之间不得矛盾（若有，视为未完成）
- 角色卡解析结果整合到 `characters.md`

---

## Phase 5: 自检

在文件全部写完后，依次通过两道检查。任一道不过 → 状态保持 `research_in_progress`，回到对应阶段补充。

### 第一道：完整性清单

- [ ] 主角、核心冲突、故事目标已明确定义
- [ ] 篇幅目标已设定，且与章节数量一致
- [ ] 章节计划与篇幅和推进节奏匹配
- [ ] 伏笔出现在对应收束点之前
- [ ] 风格约束足够约束后续起草
- [ ] 世界观 / 设定 / 真实性无明显空白

### 第二道：机械验证

运行 validator（必须成功）：

```
node --experimental-strip-types <skill-root>/scripts/validate-research-project.mts --project-root <project-root>
```

两道检查全部通过后，进入 Phase 6。

---

## Phase 6: 用户审阅闸门

**硬约束：在用户明确确认之前，`workflow-status.md` 中的 `Status` 绝对不能写为 `research_complete`。**

**流程：**
1. Agent 列出全部 11 个产物文件路径，给出简洁摘要（类型、篇幅、核心冲突、关键约束）
2. 询问：「所有文件已就绪，请审阅确认。如有需要调整请告诉我，确认后我将状态设为 research_complete。」
3. **等待用户回复，不做任何推进动作**
4. 用户提出修改 → 修改后回到步骤 1
5. 用户确认 → 更新 `00-project/workflow-status.md`：
   - `Status` → `research_complete`
   - `Next Allowed Skill` → `novel-drafting`
   - 更新 `Last Updated`

---

## 常见自我说服

| Excuse | Reality |
|--------|---------|
| "用户说得很模糊，所以给个宽松大纲就够了" | 起草阶段需要明确约束和文件产物。 |
| "这个类型我已经很熟，不用查了" | 除非被拒绝，否则调研默认需要联网核验。 |
| "章节计划短一点应该也没问题" | 起草 skill 需要明确的章节推进设计。 |
| "用户要求很简单，快速过一遍就行" | 跳过 Phase 2 方案探索或 Phase 6 用户审阅意味着未经验证的假设进入起草。 |
| "自检过了就标 research_complete" | Phase 6 用户审阅闸门是强制步骤，未经用户确认不得推进。 |

## 状态流转

- 开始：将状态设为 `research_in_progress`
- 阻塞：将状态设为 `research_blocked`，并列出具体阻塞原因
- 完成：通过 Phase 5 自检 **且** Phase 6 用户确认后，才能设为 `research_complete`

## 下一步

在 `research_complete` 之后，下一个允许使用的 skill 是 `novel-drafting`。**在用户通过 Phase 6 确认之前，绝不推进到 drafting。**

---

## 参考文件

- 自检细则：[references/completion-gate.md](references/completion-gate.md)
```

- [ ] **Step 2: Verify the file is complete and well-formed**

Run: `wc -l skills/novel-research/SKILL.md`
Expected: ~200-230 lines

Run: `rg "Phase 6: 用户审阅闸门" skills/novel-research/SKILL.md`
Expected: match found

Run: `rg "novel-drafting" skills/novel-research/SKILL.md`
Expected: match found (checks 下一步 preserved)

- [ ] **Step 3: Commit**

```bash
git add skills/novel-research/SKILL.md
git commit -m "feat(research): restructure SKILL.md bottom half — Phases 4-6 + preserved sections"
```

---

### Task 3: Update completion-gate.md exit rules

**Files:**
- Modify: `skills/novel-research/references/completion-gate.md:27-33`

- [ ] **Step 1: Update exit rules to reference Phase 6 gate**

Replace lines 27–33 (the 退出规则 section):

**Old:**
```markdown
## 退出规则

只有在清单全部通过后，才能：

- set `Status` to `research_complete`
- set `Next Allowed Skill` to `novel-drafting`
- update `Last Updated`
```

**New:**
```markdown
## 退出规则

清单全部通过后，进入 Phase 6（用户审阅闸门）。只有在用户明确确认后：

- set `Status` to `research_complete`
- set `Next Allowed Skill` to `novel-drafting`
- update `Last Updated`
```

- [ ] **Step 2: Verify the edit**

Run: `rg "Phase 6" skills/novel-research/references/completion-gate.md`
Expected: match found

- [ ] **Step 3: Commit**

```bash
git add skills/novel-research/references/completion-gate.md
git commit -m "docs(research): update completion-gate exit rules to reference Phase 6 user review"
```

---

### Task 4: Verification

**Files:**
- No changes — read-only verification

- [ ] **Step 1: Run TypeScript type check**

```bash
npx tsc --noEmit
```
Expected: exit code 0, no errors (only checking that SKILL.md changes didn't break any TypeScript files — this is a markdown-only change so it should pass)

- [ ] **Step 2: Run test suite**

```bash
npm test
```
Expected: all tests pass

- [ ] **Step 3: Run portability guard**

```bash
node --import tsx --test tests/validators.test.js --test-name-pattern "skill source files do not depend on repo-root shared script paths"
```
Expected: PASS

- [ ] **Step 4: Commit if any auto-fixes were applied**

Only if pre-commit hooks modified files:
```bash
git add -A && git commit -m "chore: auto-fixes from pre-commit hooks"
```
Otherwise skip.
```
