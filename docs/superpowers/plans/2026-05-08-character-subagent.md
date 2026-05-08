# 角色子代理（Character Sub-Agent）Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为 novel-drafting 的章节写作引入角色子代理——Writer 写作前控制器预派发角色视角分析作为上下文，Writer 写作中可自救派发。

**Architecture:** 新建 `character-subagent.md` 作为派发方指南（含占位符 Prompt 模板）。修改 `chapter-loop.md` 在 Writer 派发前插入角色子代理预派发步骤。修改 `writer-subagent.md` 增加自救派发章节。角色子代理不写文件，验证器不变。

**Tech Stack:** Markdown 指令文件 + TypeScript 验证器（无代码改动）

**Source Spec:** `docs/superpowers/specs/2026-05-08-character-subagent-design.md`

---

## File Structure

| 文件 | 操作 | 职责 |
|------|------|------|
| `skills/novel-drafting/character-subagent.md` | 新建 | 派发方指南：Prompt 模板、填充规则、禁止行为 |
| `skills/novel-drafting/chapter-loop.md` | 修改 | Writer 派发前插入角色子代理预派发步骤 |
| `skills/novel-drafting/writer-subagent.md` | 修改 | 新增「角色子代理（自救工具）」章节 |

**注意**：`chapter-plan.md` 模板已有 `Characters` 字段，解析器 `parse-chapter-plan.mts` 已有 `characters: string[]` 解析，无需改动。

---

### Task 1: 创建 character-subagent.md

**Files:**
- Create: `skills/novel-drafting/character-subagent.md`

- [ ] **Step 1: 写入派发方指南**

```markdown
# Character Sub-Agent Dispatch Guide

## 用途

本文件指导派发方（控制器或 Writer）如何组装角色子代理的 prompt。
角色子代理收到的应是一个「角色本人」视角的提示，而不是「扮演角色的 AI」的提示。

## Prompt 模板

使用以下占位符模板，填充后直接发给角色子代理：

---

<CHARACTER_CARD>
（完整 charcard-raw/<角色名>.md 内容）
</CHARACTER_CARD>

<IN_STORY_MEMORY>
（从 chapter-state 的 Character Knowledge Changes 按角色名过滤后的条目）
</IN_STORY_MEMORY>

<CURRENT_SITUATION>
（本章情节简报 + story-state 情节摘要）
</CURRENT_SITUATION>

<OUTPUT_FORMAT>
请以以下格式回复：

当前情绪/心理状态：
<...>

对当前情境的本能反应：
<...>

可能的行动倾向：
1. <行动A> — 动机：<...>
2. <行动B> — 动机：<...>
3. <行动C> — 动机：<...>

内心独白片段：
<原文>

角色此刻不知道/误解的事：
- <...>
</OUTPUT_FORMAT>

---

## 填充规则

- **CHARACTER_CARD**：直接粘贴 `charcard-raw/<角色名>.md` 全文，不删改
- **IN_STORY_MEMORY**：
  1. 从各章 `chapter-XX-state.md` 的 `## Character Knowledge Changes` 表格中，匹配 `| <角色名> |` 开头的行
  2. 补充 story-state 中 confirmed 且该角色在场的全局事实（best-effort 语义推断，不确定则不纳入）
  3. 对第一章（无前文 state），此段留空，角色子代理仅依据角色卡的 scenario 推断初始心理
- **CURRENT_SITUATION**：从 chapter-plan 提取本章 Goal 段落 + story-state 的位置/状态摘要
- **OUTPUT_FORMAT**：固定不变，是施加给角色子代理的唯一元指令

## 派发方禁止行为

- 不要在模板外添加「你是角色扮演 Agent」等身份描述
- 不要混入其他角色的信息
- 不要预先假设角色的反应——让角色子代理从角色卡推导
- 不要将角色子代理的输出写入任何项目文件

## 角色子代理的输出处理

角色子代理返回结构化文本后：
- 控制器预派发：将输出汇总为 `## 角色视角分析` 段落，作为 Writer 上下文的附加部分
- Writer 自救派发：直接参考角色分析继续写作，不写入文件

## 阻塞条件

角色子代理应返回 BLOCKED 当：
- 角色卡文件（charcard-raw/<角色名>.md）缺失
- IN_STORY_MEMORY 为空且角色卡的 scenario 字段不足以推断当前心理状态
- 本章情节简报过于模糊，无法判断角色处境

## 对角色子代理的预期行为（供派发方理解）

角色子代理从角色卡中接收到该角色的完整人格定义（personality、scenario、first_mes、mes_example 等），应：
- 完全代入角色视角，以角色的语气和思维模式进行分析
- 仅依据 IN_STORY_MEMORY 中的信息做判断，不调用未接触的全局事实
- 角色分析中的「内心独白片段」应以角色口吻书写，可直接用于章节正文
```

- [ ] **Step 2: 验证文件内容格式正确**

检查要点：
- 所有占位符标签（`<CHARACTER_CARD>`, `<IN_STORY_MEMORY>`, `<CURRENT_SITUATION>`, `<OUTPUT_FORMAT>`）拼写一致
- 填充规则覆盖所有四种输入
- 禁止行为不含「Agent」身份描述
- 阻塞条件明确

- [ ] **Step 3: 提交**

```bash
git add skills/novel-drafting/character-subagent.md
git commit -m "feat: add character-subagent dispatch guide for novel-drafting"
```

---

### Task 2: 修改 chapter-loop.md —— 插入预派发步骤

**Files:**
- Modify: `skills/novel-drafting/chapter-loop.md:32-32`（Writer 派发章节之前）

在 `## Writer 派发` 章节的「在派发 writer 之前：」之后、「1. 读取 writer-subagent.md」之前，插入角色子代理预派发步骤。

- [ ] **Step 1: 插入预派发步骤**

定位 `chapter-loop.md` 第 34-38 行：

```
在派发 writer 之前：

1. 读取 `writer-subagent.md`。
2. 只读取 `file-contract.md` 中与 writer 相关的部分。
```

在「在派发 writer 之前：」和「1. 读取 `writer-subagent.md`」之间插入以下内容：

```markdown
### 角色子代理预派发（如适用）

在收集 writer 上下文之前，先为本章关键角色收集视角分析：

1. 从 `30-draft/chapter-plan.md` 中读取当前章节的 `Characters` 字段。
2. 对 `Characters` 中列出的每个角色：
   - 检查 `20-story/charcard-raw/<角色名>.md` 是否存在。
   - 存在：读取该角色卡全文。从各章 `30-draft/continuity/chapter-XX-state.md` 的
     `## Character Knowledge Changes` 表格中过滤出 `| <角色名> |` 开头的行。
     加上 `30-draft/continuity/story-state.md` 中该角色在场的 confirmed 全局事实。
     按照 `<skill-root>/character-subagent.md` 的 Prompt 模板组装，派发角色子代理。
   - 不存在：跳过该角色。
3. 将所有角色子代理返回的结构化分析汇总为 `## 角色视角分析` 段落。
4. 该段落将在派发 Writer 时，紧随 chapter-plan 的本章目标之后注入上下文。
5. 如果某角色子代理返回 BLOCKED，在汇总中标明「<角色名> 视角缺失」，继续流程。
6. 如果章节没有 `Characters` 字段或所有角色均无角色卡，跳过预派发，直接进入 Writer 派发。
```

- [ ] **Step 2: 验证插入后文件结构完整**

检查：
- 原「1. 读取 writer-subagent.md」→ 重新编号或保持原有流程顺序
- 预派发步骤不影响后续「writer 返回后」的验证逻辑
- 角色子代理产物不进入 writer 的输出契约检查

- [ ] **Step 3: 提交**

```bash
git add skills/novel-drafting/chapter-loop.md
git commit -m "feat: add character sub-agent pre-dispatch step to chapter-loop"
```

---

### Task 3: 修改 writer-subagent.md —— 新增自救派发章节

**Files:**
- Modify: `skills/novel-drafting/writer-subagent.md`（在 `## 阻塞情形` 之后插入）

- [ ] **Step 1: 在「阻塞情形」后插入自救派发章节**

在 `writer-subagent.md` 的 `## 阻塞情形` 章节和 `## 输出契约` 章节之间插入：

```markdown
## 角色子代理（自救工具）

当你在写作中觉得难以代入某个角色的视角时，可以派发角色子代理获取该角色的内心视角分析。

### 派发步骤

1. 读取 `<skill-root>/character-subagent.md` 中的 Prompt 模板。
2. 按模板填充占位符：
   - `<CHARACTER_CARD>`：读取 `20-story/charcard-raw/<角色名>.md` 全文
   - `<IN_STORY_MEMORY>`：从你正在写入的 `chapter-XX-state.md` 的 Knowledge Changes 中过滤该角色的行
   - `<CURRENT_SITUATION>`：当前场景上下文 + 角色此刻的具体处境
   - `<OUTPUT_FORMAT>`：固定模板，不修改
3. 派发角色子代理，获取结构化角色分析。
4. 参考角色分析继续写作。

### 注意事项

- 自救派发应在同一次 Writer 回合内完成，不返回控制器等待
- 角色分析结果不写入任何文件，仅作为写作参考
- 仅在确实需要时使用，避免无意义派发消耗 token
- 如果角色子代理返回 BLOCKED，在 `Concerns` 字段中标注「角色视角缺失：<角色名>」
```

- [ ] **Step 2: 更新「输出契约」中的 Concerns 字段说明**

在 `## 输出契约` 的格式模板中，将 `Concerns: <empty or short note>` 更新为：

```text
Concerns: <empty, short note, or "角色视角缺失: <角色名>" if character sub-agent was blocked>
```

- [ ] **Step 3: 验证文件完整性**

检查：
- 自救派发章节在「阻塞情形」之后、「输出契约」之前，不破坏原有结构
- 路径引用使用 `<skill-root>` 占位符（遵循项目约定）
- 不引用其他角色的 charcard（自救只针对当前写作困难的特定角色）

- [ ] **Step 4: 提交**

```bash
git add skills/novel-drafting/writer-subagent.md
git commit -m "feat: add character sub-agent self-dispatch to writer-subagent"
```

---

### Task 4: 验证与收尾

**Files:** 无新建或修改，纯验证

- [ ] **Step 1: 确认 chapter-plan 模板无需修改**

验证 `skills/novel-research/templates/chapter-plan.md` 已包含 `Characters` 字段：
```bash
grep -n "Characters" skills/novel-research/templates/chapter-plan.md
```
预期输出：每章模板中均有 `- Characters:` 行。

验证解析器 `skills/novel-drafting/scripts/lib/parse-chapter-plan.mts` 已解析 `characters`：
```bash
grep -n "characters" skills/novel-drafting/scripts/lib/parse-chapter-plan.mts
```
预期：`characters: splitCommaList(fieldValue(fields, 'Characters'))` 已存在。

- [ ] **Step 2: 确认验证器无需修改**

角色子代理不写文件，不对项目产物结构造成改动。运行现有验证器确认无回归：
```bash
node --import tsx --test tests/validators.test.js
```

- [ ] **Step 3: 运行 TypeScript 类型检查**

```bash
npx tsc --noEmit
```

- [ ] **Step 4: 确认无文件越权引用**

检查新建和修改的文件没有引用 repo-root 硬编码路径：
```bash
node --import tsx --test tests/validators.test.js --test-name-pattern "skill source files do not depend on repo-root shared script paths"
```

- [ ] **Step 5: 提交**

```bash
git add -A
git commit -m "chore: final verification for character sub-agent feature"
```
