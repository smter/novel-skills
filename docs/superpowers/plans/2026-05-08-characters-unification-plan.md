# 角色卡与已有角色档案系统融合 — 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 novel-research 的两套角色系统（legacy `characters.md` + `charcard-raw/`）统一为单一角色卡格式（`characters/` + `character-relationships.md`）

**Architecture:** 废除 `characters.md` 和 `charcard-raw/` 目录，重命名为 `characters/`。角色卡 transformer 更新输出格式融入 legacy 叙事字段。所有 drafting 子代理的路径引用同步更新。两个 validator 的 requiredFiles 检查更新。

**Tech Stack:** TypeScript (.mts), Node.js test runner, tsx

---

## Task 1: 创建统一角色卡模板

**Files:**
- Create: `skills/novel-research/templates/character-card.md`

- [ ] **Step 1: 写入角色卡模板文件**

```markdown
---
template: character-card
---

# {{角色名}}

> 来源：{{来源}}
> 最后更新：{{日期}}

---

## 身份定位

- **身份**：{{身份}}
- **目标**：{{目标}}
- **动机**：{{动机}}
- **核心冲突**：{{核心冲突}}
- **弧光笔记**：{{弧光笔记}}

## 角色档案

- **简介**：{{简介}}
- **性格**：{{性格}}
- **标签**：{{标签}}

## 情景设定

{{情景}}

## 开场呈现

{{开场呈现}}

## 对话风格

{{对话风格}}

## 深层设定

{{深层设定}}

## ⚠️ 角色扮演指令（原始）

{{角色扮演指令}}

## 创作者备注

{{创作者备注}}
```

- [ ] **Step 2: 提交**

```bash
git add skills/novel-research/templates/character-card.md
git commit -m "feat(research): add unified character card template"
```

---

## Task 2: 创建角色访谈指导文件

**Files:**
- Create: `skills/novel-research/references/character-interview-guide.md`

- [ ] **Step 1: 写入角色访谈指导**

```markdown
# 角色访谈指导

本文件指导 agent 在 novel-research Phase 3 访谈中为每个角色生成完整的统一角色卡。核心方法论借鉴珠矶工作流的三条原则。

---

## 三条核心原则

### 原则一：迭代式深挖

不要满足于单轮问答。对每个角色维度采用「提出开放问题 → 用户回答 → 追问行为具体性 → 用户补充 → agent 总结确认」的循环。

### 原则二：行为具体性强制

用户说抽象形容词（如「她很善良」）时，必须追问具体场景下的行为：
- 「她看到受伤的动物具体会做什么？」
- 「面对哭泣的孩子呢？」
- 「对被打败的敌人呢？」

将抽象特质转化为可写的具体行为。

### 原则三：两阶段生成

对 **开场呈现** 和 **对话风格** 采用「提案 → 选择 → 执行」：
1. agent 根据访谈生成 2-3 个方案（每个 2-3 句概括）
2. 用户选择一个
3. agent 写出完整版本

---

## 访谈维度与问题模板

### 身份定位（legacy 字段）

- 「他在故事中承担什么角色？推动情节还是制造障碍？」
- 「他想要达成什么？如果失败会怎样？」
- 「他为什么非要这么做？不做行不行？」
- 「他身上最大的矛盾是什么？」
- 「他在故事中会经历怎样的变化？」

### 外貌与气质

- 「她的外表给人什么第一印象？」
- 「有没有与性格形成反差的特征？」（如幼小身躯 + 成熟气质）
- 「如果有读者插画，最想强调哪个身体特征？」

### 性格与内在

- 「用三个形容词描述他，然后为每个词举一个具体行为」
- 「他在压力下和放松时，性格表现有什么不同？」
- 「他有什么不自知的盲点？」
- 「别人对他的评价和他自己的认知有什么差距？」

### 语言风格

- 「她怎么说话？语速快慢？用词文雅还是粗糙？」
- 「有什么口头禅或标志性句式？」
- 「在不同人面前语气会变吗？对上级、对朋友、对敌人分别怎么说？」
- 「情绪激动时语言会如何变化？会沉默还是会爆发？」

### 行为细节

- 「紧张时的小动作是什么？」
- 「独处时和在别人面前有什么区别？」
- 「有什么日常习惯或仪式？」

### 情景设定

- 「故事开始时，她处于什么处境？」
- 「她所处的环境如何塑造了她？」

### 开场呈现

- 「如果读者第一次见到她，她正在做什么？这个场景体现了她的什么特质？」
- → 生成 2-3 个开场场景方案供用户选择
- → 用户选择后，写出 200-400 字的完整场景

### 对话示例

让角色在以下三个场景中说几句话：
- **说服别人时**（对话作为行动/操控）
- **表达脆弱时**（对话作为暴露/求助）
- **日常寒暄时**（对话作为面具/维护）

为每个场景生成 3-5 句对话，附简要上下文说明。

### 深层设定（可选）

如果访谈深度足够，可进一步挖掘：
- 核心认同（他如何看待自己？）
- 驱动力结构（什么让他早上起床？）
- 情感模式（他如何处理亲密关系？）
- 过往创伤（有什么塑造了他但回避谈论的事？）

---

## 生成清单

访谈结束后，agent 应确保每个角色卡至少包含：
- [x] 身份、目标、动机、核心冲突、弧光笔记（必填）
- [x] 简介、性格、标签（必填）
- [x] 情景设定（必填）
- [x] 开场呈现（尽力生成，至少 1 个方案）
- [x] 对话风格（尽力生成，至少 2 个场景）
- [x] 深层设定（可选，访谈深度够时填）
- [x] 角色扮演指令（仅角色卡导入时有）

同时生成 `20-story/character-relationships.md`，包含所有角色间的双向关系条目。
```

- [ ] **Step 2: 提交**

```bash
git add skills/novel-research/references/character-interview-guide.md
git commit -m "feat(research): add character interview guide with zhuji-inspired methodology"
```

---

## Task 3: 更新 charcard-transformer 输出格式

**Files:**
- Modify: `skills/novel-research/scripts/lib/charcard-transformer.mts`

需要对 `transformCharcard` 函数做以下修改：

1. 标题从 `# 角色卡导入：{name}` → `# {name}`
2. 来源行从 `> 来源：SillyTavern Character Card V2` → `> 来源：角色卡导入`
3. 导入时间行保留
4. 去掉 `> 本文件为角色卡原始数据的结构化呈现，供代理在访谈阶段参考。`
5. 在标题后插入 legacy 字段区（空占位，标注 `<!-- 待访谈补全 -->`）
6. `## Name` → `## 角色档案` 中的 `- **简介**：`
7. `## Personality` → `## 角色档案` 中的 `- **性格**：`
8. `## Tags` → `## 角色档案` 中的 `- **标签**：`
9. `## Scenario` → `## 情景设定`
10. `## First Message` → `## 开场呈现`
11. `## Dialogue Examples` → `## 对话风格`
12. 角色扮演指令区的引用文字从 `characters.md` → `characters/` 目录
13. `## Associated Lore` → `## 深层设定`
14. `## Creator Notes` 保留但放在最后（在角色扮演指令之后）

- [ ] **Step 1: 读取当前 transformer 完整内容以确认替换点**

```bash
# Already read — full 208 lines. Key sections to replace:
# Line 130-134: Header block
# Line 136-141: Name section → merge with Description/Personality/Tags into 角色档案
# Line 142-143: Personality section
# Line 156-157: Scenario section
# Line 159-160: First Message section
# Line 162-178: Dialogue Examples section  
# Line 181-182: Tags section
# Line 184-186: Creator Notes section
# Line 188-190: Associated Lore section
# Line 192-195: System instructions section
# Line 98: Reference to characters.md in system instructions
```

- [ ] **Step 2: 替换标题块（lines 130-134）**

Old:
```typescript
  output += `# 角色卡导入：${d.name || '(未知)'}\n\n`;
  output += '> 来源：SillyTavern Character Card V2\n';
  output += `> 导入时间：${new Date().toISOString().replace('T', ' ').replace(/\.\d+Z$/, '')}\n`;
  output += '> 本文件为角色卡原始数据的结构化呈现，供代理在访谈阶段参考。\n\n';
  output += '---\n\n';
```

New:
```typescript
  output += `# ${d.name || '(未知)'}\n\n`;
  output += '> 来源：角色卡导入\n';
  output += `> 导入时间：${new Date().toISOString().replace('T', ' ').replace(/\.\d+Z$/, '')}\n\n`;
  output += '---\n\n';

  // Legacy narrative fields — placeholder for interview completion
  output += '## 身份定位\n\n';
  output += '<!-- 待访谈补全 -->\n\n';
  output += '- **身份**：\n';
  output += '- **目标**：\n';
  output += '- **动机**：\n';
  output += '- **核心冲突**：\n';
  output += '- **弧光笔记**：\n\n';
```

- [ ] **Step 3: 将 Name、Description、Personality、Tags 合并为 角色档案（lines 136-143, 181-182）**

Old:
```typescript
  output += '## Name\n\n';
  output += `${d.name || '(未提供)'}\n\n`;

  output += '## Description\n\n';
  output += `${d.description || '(未提供)'}\n\n`;

  output += '## Personality\n\n';
  output += `${d.personality || '(未提供)'}\n\n`;
```

New:
```typescript
  output += '## 角色档案\n\n';
  output += `- **简介**：${d.description || '(未提供)'}\n`;
  output += `- **性格**：${d.personality || '(未提供)'}\n`;

  // ... (tags rendered after scenario, first_mes, dialogue — moved here)
```

Wait — need to reorganize. The tags section was originally after Dialogue Examples. Let me restructure properly:

Old (lines 136-182):
```
## Name → ## Description → ## Personality → ## Scenario → ## First Message → ## Dialogue Examples → ## Tags → ## Creator Notes
```

New order should be:
```
身份定位 → 角色档案(简介/性格/标签) → 情景设定 → 开场呈现 → 对话风格 → 深层设定 → 角色扮演指令 → 创作者备注
```

Let me rewrite the key section replacements properly.

- [ ] **Step 3 (revised): 重组 sections 顺序**

Replace lines 136-143 (Name block) with combined 角色档案:

```typescript
  output += '## 角色档案\n\n';
  output += `- **简介**：${d.description || '(未提供)'}\n`;
  output += `- **性格**：${d.personality || '(未提供)'}\n`;

  // Tags rendered inline
  output += `- **标签**：${formatTags(d.tags)}\n\n`;
```

Remove old Name line (136-137), old Description block (139-140), old Personality block (142-143), and old Tags block (181-182).

- [ ] **Step 4: 重命名 Scenario section (line 156-157)**

Old:
```typescript
  output += '## Scenario\n\n';
  output += `${d.scenario || '(未提供)'}\n\n`;
```

New:
```typescript
  output += '## 情景设定\n\n';
  output += `${d.scenario || '(未提供)'}\n\n`;
```

- [ ] **Step 5: 重命名 First Message section (line 159-160)**

Old:
```typescript
  output += '## First Message\n\n';
  output += `${d.first_mes || '(未提供)'}\n\n`;
```

New:
```typescript
  output += '## 开场呈现\n\n';
  output += `${d.first_mes || '(未提供)'}\n\n`;
```

- [ ] **Step 6: 重命名 Dialogue Examples section (line 162)**

Old:
```typescript
  output += '## Dialogue Examples\n\n';
```

New:
```typescript
  output += '## 对话风格\n\n';
```

- [ ] **Step 7: 重命名 Associated Lore → 深层设定 (line 189)**

Old:
```typescript
  output += '## Associated Lore\n\n';
```

Where `renderLoreEntries` is called. Change the heading:

```typescript
    let result = '## 深层设定\n\n';
```

- [ ] **Step 8: 更新系统指令区引用文字 (line 98)**

Old:
```typescript
  result += '> （如语言风格、行为约束、一致性规则）→ 总结写入 `characters.md` 的 Voice Notes。\n\n';
```

New:
```typescript
  result += '> （如语言风格、行为约束、一致性规则）→ 总结写入 `characters/` 目录下对应角色卡的对应字段。\n\n';
```

- [ ] **Step 9: 更新创建者备注的位置标题保留不变，但确保它在最后出现**

Creator Notes 已经是最后的位置（在 Associated Lore 和 System Instructions 之后），保持不变。

- [ ] **Step 10: 运行类型检查**

```bash
rtk npx tsc --noEmit
```

Expected: No type errors.

- [ ] **Step 11: 运行已有测试确认 regression**

```bash
rtk node --import tsx --test tests/charcard-transformer.test.js
```

Expected: Tests WILL fail due to format changes. This is expected — tests need updating next.

- [ ] **Step 12: 提交**

```bash
git add skills/novel-research/scripts/lib/charcard-transformer.mts
git commit -m "feat(research): update charcard-transformer to unified character card format"
```

---

## Task 4: 更新 charcard-transformer 测试

**Files:**
- Modify: `tests/charcard-transformer.test.js`

- [ ] **Step 1: 更新"Minimal V2 card → basic Markdown"测试断言**

测试中需要更新输出格式断言。读取当前测试中的具体断言并更新。

关键变更：
- `# 角色卡导入：TestChar` → `# TestChar`
- `> 来源：SillyTavern Character Card V2` → `> 来源：角色卡导入`
- 去掉 `> 本文件为角色卡原始数据的结构化呈现...`
- `## Name` → 合并进 `## 角色档案`
- `## Description` → `## 角色档案` 内的 `- **简介**：`
- `## Personality` → `## 角色档案` 内的 `- **性格**：`
- `## Tags` → `## 角色档案` 内的 `- **标签**：`
- `## Scenario` → `## 情景设定`
- `## First Message` → `## 开场呈现`
- `## Dialogue Examples` → `## 对话风格`
- `## Associated Lore` → `## 深层设定`
- 新增 `## 身份定位` section

- [ ] **Step 2: 更新"system_prompt in warning zone"测试**

```javascript
// Old: assert.match(md, /## ⚠️ 角色扮演指令（需代理总结）/);
// 引用文字变更需更新：
assert.match(md, /characters\//);
```

- [ ] **Step 3: 运行测试确认通过**

```bash
rtk node --import tsx --test tests/charcard-transformer.test.js
```

Expected: All 10 tests PASS.

- [ ] **Step 4: 提交**

```bash
git add tests/charcard-transformer.test.js
git commit -m "test: update charcard-transformer tests for unified format"
```

---

## Task 5: 更新 parse-charcard CLI 输出目录

**Files:**
- Modify: `skills/novel-research/scripts/parse-charcard.mts` (line 22)
- Modify: `tests/charcard-cli.test.js`

- [ ] **Step 1: 修改默认输出目录**

在 `parse-charcard.mts` 第 22 行：

```typescript
// Old:
const outputDirName = args['output-dir'] || '20-story/charcard-raw';

// New:
const outputDirName = args['output-dir'] || '20-story/characters';
```

- [ ] **Step 2: 更新 CLI 测试中的路径引用**

`tests/charcard-cli.test.js` 中所有对 `charcard-raw` 的引用改为 `characters`。

- [ ] **Step 3: 运行测试**

```bash
rtk node --import tsx --test tests/charcard-cli.test.js
```

Expected: All 5 tests PASS.

- [ ] **Step 4: 提交**

```bash
git add skills/novel-research/scripts/parse-charcard.mts tests/charcard-cli.test.js
git commit -m "feat(research): update charcard CLI output dir from charcard-raw/ to characters/"
```

---

## Task 6: 更新 research validator

**Files:**
- Modify: `skills/novel-research/scripts/validate-research-project.mts`

- [ ] **Step 1: 修改 requiredFiles 列表（line 20）**

```typescript
// Old:
  '20-story/characters.md',

// New: characters.md is removed; we check the directory separately
// (characters.md removed from requiredFiles)
```

同时在 requiredFiles 中添加：

```typescript
  '20-story/character-relationships.md',
```

- [ ] **Step 2: 添加 characters/ 目录非空检查**

在 `validateResearchContent` 函数或 `checkRequiredFiles` 函数中添加：

```typescript
// After the requiredFiles loop, add:
const charactersDir = path.join(root, '20-story', 'characters');
if (!fs.existsSync(charactersDir) || fs.readdirSync(charactersDir).filter(f => f.endsWith('.md')).length === 0) {
  results.push({
    file: '20-story/characters/',
    status: 'fail',
    message: '[文件缺失] 20-story/characters/ 目录不存在或目录下无 .md 文件。此目录应包含每个角色的统一角色卡文件。',
  });
}
```

- [ ] **Step 3: 更新 content meaningfulness 检查（line 186）**

```typescript
// Old:
  '20-story/characters.md',

// New: remove this line (characters.md no longer exists)
```

- [ ] **Step 4: 删除参数补全中的 characters.md 引用（如有）**

在 `suggestMissing` 或 `help` 文本中涉及 `characters.md` 的地方更新。

- [ ] **Step 5: 运行类型检查**

```bash
rtk npx tsc --noEmit
```

- [ ] **Step 6: 运行 research validator 相关测试**

```bash
rtk node --import tsx --test tests/validators.test.js --test-name-pattern "research"
```

Expected: Tests likely fail — need test updates next.

- [ ] **Step 7: 提交**

```bash
git add skills/novel-research/scripts/validate-research-project.mts
git commit -m "feat(research): update validator for unified characters/ directory"
```

---

## Task 7: 更新 drafting validator

**Files:**
- Modify: `skills/novel-drafting/scripts/validate-drafting-project.mts`

- [ ] **Step 1: 修改 requiredFiles（line 24）**

```typescript
// Old:
  '20-story/characters.md',

// New: remove this line
```

添加检查 `20-story/characters/` 目录非空（在 entry gate 检查中或 separately）：

```typescript
const charactersDir = path.join(projectRoot, '20-story', 'characters');
if (!fs.existsSync(charactersDir) || fs.readdirSync(charactersDir).filter(f => f.endsWith('.md')).length === 0) {
  errors.push('[角色数据缺失] 20-story/characters/ 目录不存在或为空。请先完成 novel-research 阶段的角色访谈或角色卡导入。');
}
```

- [ ] **Step 2: 运行类型检查**

```bash
rtk npx tsc --noEmit
```

- [ ] **Step 3: 提交**

```bash
git add skills/novel-drafting/scripts/validate-drafting-project.mts
git commit -m "feat(drafting): update entry gate for unified characters/ directory"
```

---

## Task 8: 更新 validator 测试

**Files:**
- Modify: `tests/validators.test.js`

- [ ] **Step 1: 更新 research validator 测试中的 requiredFiles 断言**

在 `writeDraftingBaseProject` 和 research 相关测试中，确保测试项目创建 `20-story/characters/` 目录而非 `characters.md`。更新 `makeCharactersContent` 辅助函数（如果存在）或相关测试 fixture。

具体需要检查测试中：
- 是否写入 `20-story/characters.md`
- 是否检查 `20-story/characters.md` 的 requiredFiles

需改为写入 `20-story/characters/` 目录下的文件，并确保 `20-story/character-relationships.md` 存在。

- [ ] **Step 2: 运行所有 validator 测试**

```bash
rtk node --import tsx --test tests/validators.test.js
```

Expected: All tests PASS after updates.

- [ ] **Step 3: 提交**

```bash
git add tests/validators.test.js
git commit -m "test: update validator tests for unified characters/ directory"
```

---

## Task 9: 更新 novel-research SKILL.md

**Files:**
- Modify: `skills/novel-research/SKILL.md`

- [ ] **Step 1: 更新数据源引用（line 35）**

把「角色与关系」产出描述从 `20-story/characters.md` 改为 `20-story/characters/` + `20-story/character-relationships.md`。

- [ ] **Step 2: 更新角色卡导入流程（lines 146-148）**

把导入→整合到 `characters.md` 的流程改为直接导入到 `characters/`，legacy 字段留待补全。

- [ ] **Step 3: 更新 Phase 3 访谈产出描述**

描述角色卡格式统一生成，引用 `references/character-interview-guide.md` 作为访谈方法指南。

- [ ] **Step 4: 更新 completion gate 检查项（line 194）**

`characters.md` → `characters/` 目录非空 + `character-relationships.md` 存在。

- [ ] **Step 5: 提交**

```bash
git add skills/novel-research/SKILL.md
git commit -m "docs(research): update SKILL.md for unified characters/ directory"
```

---

## Task 10: 更新 novel-research 参考文档

**Files:**
- Modify: `skills/novel-research/references/file-contract.md` (line 18)
- Modify: `skills/novel-research/references/project-scaffold.md` (line 34)

- [ ] **Step 1: 更新 file-contract.md**

```markdown
# Old:
- `20-story/characters.md`

# New:
- `20-story/characters/` — 每个角色一个 `.md` 文件，统一角色卡格式
- `20-story/character-relationships.md` — 角色间双向关系
```

- [ ] **Step 2: 更新 project-scaffold.md**

```markdown
# Old:
- `20-story/characters.md`

# New:
- `20-story/characters/` — 角色卡片目录（每个角色一个 .md 文件）
- `20-story/character-relationships.md` — 角色关系文件
```

- [ ] **Step 3: 提交**

```bash
git add skills/novel-research/references/file-contract.md skills/novel-research/references/project-scaffold.md
git commit -m "docs(research): update reference docs for unified characters/ directory"
```

---

## Task 11: 更新 novel-drafting SKILL.md

**Files:**
- Modify: `skills/novel-drafting/SKILL.md`

- [ ] **Step 1: 更新 Entry gate 数据源引用（line 27）**

把 `20-story/characters.md` 引用改为 `20-story/characters/` 目录。

- [ ] **Step 2: 更新角色数据源引用（line 89）**

把 `20-story/characters.md` 改为 `20-story/characters/`。

- [ ] **Step 3: 提交**

```bash
git add skills/novel-drafting/SKILL.md
git commit -m "docs(drafting): update SKILL.md for unified characters/ directory"
```

---

## Task 12: 更新 drafting 子代理文档

**Files:**
- Modify: `skills/novel-drafting/writer-subagent.md`
- Modify: `skills/novel-drafting/reviewer-subagent.md`
- Modify: `skills/novel-drafting/character-subagent.md`
- Modify: `skills/novel-drafting/chapter-loop.md`

- [ ] **Step 1: 更新 writer-subagent.md**

- Line 15: `20-story/characters.md` → `20-story/characters/` 目录
- Line 40: 不要重写列表中去掉 `characters.md`
- Line 75: `20-story/charcard-raw/<角色名>.md` → `20-story/characters/<角色名>.md`

- [ ] **Step 2: 更新 reviewer-subagent.md**

- Line 21: `20-story/characters.md` → `20-story/characters/` 目录
- 添加对 `20-story/character-relationships.md` 的引用作为附加数据源

- [ ] **Step 3: 更新 character-subagent.md**

- Line 15: `charcard-raw/<角色名>.md` → `characters/<角色名>.md`
- Line 51: `charcard-raw/<角色名>.md` → `characters/<角色名>.md`
- Line 75: `charcard-raw/<角色名>.md` → `characters/<角色名>.md`

- [ ] **Step 4: 更新 chapter-loop.md**

- Line 42: `20-story/charcard-raw/<角色名>.md` → `20-story/characters/<角色名>.md`

- [ ] **Step 5: 提交**

```bash
git add skills/novel-drafting/writer-subagent.md skills/novel-drafting/reviewer-subagent.md skills/novel-drafting/character-subagent.md skills/novel-drafting/chapter-loop.md
git commit -m "docs(drafting): update sub-agent docs path references to characters/ directory"
```

---

## Task 13: 删除旧模板

**Files:**
- Delete: `skills/novel-research/templates/characters.md`

- [ ] **Step 1: 删除文件**

```bash
rm skills/novel-research/templates/characters.md
```

- [ ] **Step 2: 确认没有引用残留**

```bash
rg 'templates/characters\.md' skills/ --type md
```

Expected: No output (no remaining references).

- [ ] **Step 3: 提交**

```bash
git rm skills/novel-research/templates/characters.md
git commit -m "feat(research): remove deprecated characters.md template"
```

---

## Task 14: 全量验证

**Files:** None (verification only)

- [ ] **Step 1: 类型检查**

```bash
rtk npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 2: 运行全部测试**

```bash
rtk npm test
```

Expected: All tests PASS.

- [ ] **Step 3: 运行端口性回归测试**

```bash
rtk node --import tsx --test tests/validators.test.js --test-name-pattern "skill source files do not depend on repo-root shared script paths"
```

Expected: No portability violations.

- [ ] **Step 4: 运行文档内容测试**

```bash
rtk node --import tsx --test tests/validators.test.js --test-name-pattern "control doc"
```

Expected: Doc content tests PASS (may need update if they reference `characters.md` or `charcard-raw`).

---

## Task 15: 最终检查 — 无残留引用

- [ ] **Step 1: 搜索 skills/ 目录中的残留引用**

```bash
rg 'charcard-raw' skills/ --type md --type ts 2>/dev/null
```

Expected: No output (all `charcard-raw` references should be updated to `characters`).

```bash
rg '20-story/characters\.md' skills/ 2>/dev/null
```

Expected: No output in operational files (references in templates/ and testing/ may remain for historical reasons).

- [ ] **Step 2: 若有残留，修复并提交**
