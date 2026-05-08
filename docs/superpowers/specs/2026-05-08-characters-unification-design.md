# 角色卡与已有角色档案系统融合 — 设计文档

> 日期：2026-05-08
> 原始 spec：`specs/20260508-角色卡和已有角色档案系统的融合.md`

---

## 问题

`novel-research` 同时维护两套角色系统：
1. **Legacy 角色档案**（`20-story/characters.md`）：访谈生成，6 个字段（Name/Role/Goal/Motivation/Conflict/Arc Notes）
2. **角色卡导入**（`20-story/charcard-raw/*.md`）：SillyTavern PNG/WebP 导入，10+ 深度字段

Legacy 档案相对角色卡显得单薄，两套并行造成分裂。需统一为单一角色卡格式。

## 设计决策

| 决策 | 结论 |
|---|---|
| 输出格式 | 统一角色卡格式，全部 legacy 字段融入 |
| 关系追踪 | 独立 `20-story/character-relationships.md` |
| 目录结构 | `charcard-raw/` → `characters/` |
| 访谈生成深度 | Agent 生成完整角色卡（含开场呈现、对话风格） |
| 角色名-文件映射 | 文件名 = sanitize(角色名)，直接拼接路径 |
| 迁移 | 不做——技能面向全新项目 |

---

## 第一部分：统一角色卡格式

每个角色一个 `20-story/characters/{角色名}.md`，字段结构：

```markdown
# {角色名}

> 来源：访谈生成 | 角色卡导入
> 最后更新：YYYY-MM-DD

---

## 身份定位
<!-- legacy：Role/Goal/Motivation/Conflict/Arc Notes -->
- **身份**：
- **目标**：
- **动机**：
- **核心冲突**：
- **弧光笔记**：

## 角色档案
<!-- charcard：description/personality/tags -->
- **简介**：
- **性格**：
- **标签**：

## 情景设定
<!-- charcard：scenario -->
{scenario 内容}

## 开场呈现
<!-- charcard：first_mes -->
{first_mes 内容}

## 对话风格
<!-- charcard：mes_example -->
{mes_example 内容}

## 深层设定
<!-- charcard：character_book / Associated Lore -->
{原始角色书结构化数据：核心认同、驱动力、行为模式、情感架构、特质系统等}

## ⚠️ 角色扮演指令（原始）
<!-- 仅当有 system_prompt / post_history_instructions 时出现 -->
{system_prompt / post_history_instructions}

## 创作者备注
<!-- charcard：creator_notes -->
{creator_notes 内容}
```

**访谈生成 vs 导入的区别：**
- 访谈生成：agent 填充全部字段。「深层设定」和「角色扮演指令」可能为空或较薄
- 角色卡导入：保留原始全部深度数据，legacy 字段（身份定位）由 agent 在访谈阶段补全

---

## 第二部分：角色关系文件

`20-story/character-relationships.md`：

```markdown
# 角色关系

> 最后更新：YYYY-MM-DD

## {角色A} ↔ {角色B}
- **关系类型**：{亲属/恋人/盟友/敌对/利益/...}
- **关系动态**：{支配/平等/依赖/竞争/...}
- **张力点**：{信任问题/利益冲突/情感纠葛/...}
- **演变轨迹**：{如何开始 → 关键转折 → 当前状态 → 预期走向}
- **备注**：
```

Agent 在访谈阶段从对话中提取关系填入。角色卡导入时若 Lore entry 涉及关系描述也提取至此。

---

## 第三部分：目录结构 & 文件契约

### 目录结构

```
20-story/
├── characters/                ← 统一目录（rename from charcard-raw/）
│   ├── 桃奈.md
│   └── ...
├── character-relationships.md ← 新增
├── chapter-plan.md            ← 不变
└── ...
```

### 契约变更

| 文件 | 旧状态 | 新状态 |
|---|---|---|
| `20-story/characters.md` | research 产出，drafting 消费 | **废除** |
| `20-story/charcard-raw/` | 仅存放导入的角色卡 | **重命名** → `characters/` |
| `20-story/characters/{name}.md` | 不存在 | **新增**：每角色一个文件 |
| `20-story/character-relationships.md` | 不存在 | **新增** |

### 各阶段影响边界

**novel-research：**
- 访谈产出 `characters/` + `character-relationships.md`，不再产出 `characters.md`
- `parse-charcard.mts` 输出目录改为 `characters/`
- `validate-research-project.mts` 的 requiredFiles 从 `characters.md` → `characters/` 目录非空 + `character-relationships.md` 存在
- `templates/characters.md` 废除，新增 `templates/character-card.md`

**novel-drafting：**
- Writer/Reviewer 读取 `characters/` 替代 `characters.md`
- 角色子代理读取 `characters/{name}.md` 替代 `charcard-raw/{name}.md`
- chapter-plan Characters 字段不变
- Continuity state 格式不变

**novel-delivery：** 无影响

---

## 第四部分：Research 访谈强化

统一后 agent 需生成完整角色卡，尤其是 `开场呈现` 和 `对话风格`。访谈借鉴珠矶工作流的三条核心原则：

### 原则一：迭代式深挖

```
提出开放问题 → 用户回答 → agent 追问行为具体性 → 用户补充 → agent 总结确认
```

### 原则二：行为具体性强制

用户说「她很善良」→ agent 追问：「她看到受伤的动物具体会做什么？面对哭泣的孩子呢？对被打败的敌人呢？」

### 原则三：两阶段生成

对 `开场呈现` 和 `对话风格` 采用「提案 → 选择 → 执行」：
- agent 根据访谈生成 2-3 个方案 → 用户选择一个 → agent 写出完整版本

### 新增/强化访谈维度

| 维度 | 访谈问题 |
|---|---|
| 外貌与气质 | 「她的外表给人什么第一印象？有没有与性格形成反差的特征？」 |
| 语言风格 | 「她怎么说话？温柔缓慢还是急促锋利？有什么口头禅？在不同人面前语气会变吗？」 |
| 行为细节 | 「紧张时的小动作？独处时和在别人面前有什么区别？」 |
| 开场呈现 | 「读者第一次见到她时，她正在做什么？体现了什么？」→ 生成方案 |
| 对话示例 | 「让她在三场景中说几句话：说服别人、表达脆弱、日常寒暄」→ agent 生成 |

上述经验内化为独立指导文件 `references/character-interview-guide.md`。

---

## 第五部分：Drafting 消费变更

### 路径引用更新

| 文件 | 旧引用 | 新引用 |
|---|---|---|
| writer-subagent.md | `characters.md` | `characters/*.md` |
| reviewer-subagent.md | `characters.md` | `characters/{name}.md` + `character-relationships.md` |
| character-subagent.md | `charcard-raw/{name}.md` | `characters/{name}.md` |
| chapter-loop.md | `charcard-raw/` | `characters/` |

### 角色子代理适配

- 统一后所有角色都有完整字段，blocking condition（无 charcard 文件）自然消除
- context 注入逻辑不变，仅改路径

### Writer/Reviewer 适配

- Writer 从 chapter-plan Characters 字段获取出场角色名，按需读取 `characters/{name}.md`
- Reviewer 同样改为按需读取

### Continuity 系统不变

`continuity/chapter-XX-state.md`、`story-state.md` 的格式和 validator 均不变。

### Validator 变更

| Validator | 变更 |
|---|---|
| validate-research-project.mts | requiredFiles：`characters.md` → `characters/` 目录非空 + `character-relationships.md` |
| validate-drafting-project.mts | Entry gate：检查 `characters/` 目录非空 |
| check-continuity-state.mts | 不变 |
| check-knowledge-boundary-warning.mts | 不变 |

---

## 第六部分：脚本与模板变更

### Research 脚本

| 文件 | 变更 |
|---|---|
| `scripts/parse-charcard.mts` | 输出目录 `charcard-raw/` → `characters/` |
| `scripts/lib/charcard-transformer.mts` | 头信息去「导入」字样；legacy 字段区初始留空标注 `<!-- 待访谈补全 -->`；来源标注 `> 来源：角色卡导入` |
| `scripts/validate-research-project.mts` | requiredFiles 替换 |
| `templates/character-card.md` | **新增**：统一角色卡 Markdown 模板 |
| `references/character-interview-guide.md` | **新增**：珠矶经验内化的角色访谈指导 |
| `templates/characters.md` | **废除** |

### Drafting 脚本

| 文件 | 变更 |
|---|---|
| `scripts/validate-drafting-project.mts` | Entry gate 检查更新 |
| `scripts/lib/parse-chapter-plan.mts` | 不变 |
| `scripts/lib/parse-continuity-state.mts` | 不变 |
| `scripts/checks/check-continuity-state.mts` | 不变 |
| `scripts/checks/check-knowledge-boundary-warning.mts` | 不变 |

### SKILL.md 变更

| Skill | 变更 |
|---|---|
| novel-research/SKILL.md | Phase 3 产出描述更新；引用新访谈指导文件；角色卡导入流程更新 |
| novel-drafting/SKILL.md | Entry gate 检查更新；角色数据源引用更新 |

### Drafting 文档变更

| 文件 | 变更 |
|---|---|
| writer-subagent.md | 路径引用更新 |
| reviewer-subagent.md | 路径引用更新 + character-relationships 引用 |
| character-subagent.md | 路径引用更新 |
| chapter-loop.md | 控制器角色卡查找路径更新 |

---

## 第七部分：测试与验证

### 需更新/新增的测试

- charcard-transformer 测试：新格式输出含 legacy 字段、来源标注
- validate-research-project 测试：`characters/` 目录检查 + `character-relationships.md` 检查
- validate-drafting-project 测试：entry gate 验证
- 端口性回归测试

### 验证命令

```bash
rtk npx tsc --noEmit
rtk npm test
rtk node --import tsx --test tests/validators.test.js --test-name-pattern "skill source files do not depend on repo-root shared script paths"
```

---

## 变更总览

| 类别 | 操作 | 涉及文件 |
|---|---|---|
| 新增 | 统一角色卡模板 | `templates/character-card.md` |
| 新增 | 角色访谈指导 | `references/character-interview-guide.md` |
| 修改 | charcard 导入流转 | `parse-charcard.mts`、`charcard-transformer.mts` |
| 修改 | research validator | `validate-research-project.mts` |
| 修改 | drafting validator | `validate-drafting-project.mts` |
| 修改 | SKILL.md × 2 | `novel-research/SKILL.md`、`novel-drafting/SKILL.md` |
| 修改 | drafting 文档 × 4 | `writer-subagent.md`、`reviewer-subagent.md`、`character-subagent.md`、`chapter-loop.md` |
| 废除 | 旧模板 | `templates/characters.md` |

---

## 非目标

- 不做已有项目迁移
- 不修改 `character-relationships.md` 的自动生成脚本（由 agent 写作）
- 不修改 delivery 阶段
- 不修改 continuity state 格式和 validator
