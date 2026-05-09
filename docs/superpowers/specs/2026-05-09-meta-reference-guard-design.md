# 元叙事措辞防御设计

## 问题

`novel-drafting` 技能在起草小说章节时，角色台词和叙述文本中有概率出现"第x章""上一章""前文所述"等元叙事措辞，打破第四面墙，让角色以作者口吻说话。

根因：`source=chapter-XX` 格式在知识账本中大量出现，Writer 子代理在阅读 continuity state 获取角色认知信息时，被此元数据暗示，错误地将"章节号"搬运进叙事文本。当前 Writer 指令、Reviewer 检查项、Style Drift 检测器均未覆盖此问题。

## 方案：三层防线

不改动任何现有格式、文件命名或正则解析逻辑。在 Writer、Reviewer、Validator 三层追加防御。

### 第一层：Writer 禁令（`writer-subagent.md`）

**位置 1**：在 `## 你不得做的事` 段落后追加一条：

```markdown
- 不得在正文（对话或叙述）中使用章节号、卷号等元叙事指代。
  当角色或叙述需要引用过去事件时，必须使用故事内部参照：
  时间（"那天晚上"）、地点（"在密室的时候"）、事件名（"火场那次"），而非"第x章"。
```

**位置 2**：在 `## 写作标准` 列表中追加一条：

```markdown
- 引用过去线索或事件时，一律使用故事内参照，禁止出现"第x章""上一章""前文"等元叙事措辞
```

### 第二层：Reviewer 检查项（`reviewer-subagent.md`）

**位置 1**：在 `## 你必须检查` 列表中追加：

```markdown
- 是否出现元叙事措辞：对话或叙述中是否出现"第x章""第x卷""上一章""前文所述"等打破第四面墙的表述
```

**位置 2**：在审查文件最小结构的 `## Checks` 段中追加：

```markdown
- Meta-Reference: pass
```

**位置 3**：在 `## Required Revisions` 相关规则后追加示例：

```markdown
如果出现元叙事措辞，必须在修订项中引用原文并给出修改建议：
- 元叙事措辞：第3段对话"就像第三章那样" → 改为故事内部参照，如"就像火场那次"
```

### 第三层：Style Drift 检测器（`check-style-drift.mts`）

追加一个检测函数，匹配以下模式：

| 模式 | 正则 | 示例 |
|------|------|------|
| 章节号 | `第[\d零一二三四五六七八九十百千]+[章节卷]` | "第3章""第十二卷" |
| 前后文引述 | `(上文\|下文\|前文\|后文)(所述\|提到\|交代)` | "前文所述" |
| 章节指代 | `(上\|下\|本\|这\|那)[一]?(章\|节\|卷\|回)` | "上一章""这一节" |

检测逻辑：
- 仅扫描 `## Content` 正文段落，排除 `## Metadata`、`## Summary` 等元数据段
- 匹配到则输出 warning 级提示，包含行号和具体措辞

### 自检清单更新（`lint-contract.md`）

在 `### 质量维度` 中追加：

```markdown
- [ ] 无元叙事措辞 — 正文中是否出现了"第x章""上一章""前文"等打破第四面墙的表述？
```

## 影响范围

| 文件 | 变更 | 估行 |
|------|------|------|
| `writer-subagent.md` | 追加 2 条规则 | +6 |
| `reviewer-subagent.md` | 追加检查项 + Checks 项 + 修订示例 | +8 |
| `check-style-drift.mts` | 追加检测函数 | +30 |
| `lint-contract.md` | 自检清单追加 1 项 | +2 |

不改动任何现有正则解析逻辑、文件名规范、元数据格式。不涉及 `novel-delivery` 或其他技能。

## 验证

1. `npx tsc --noEmit` 无类型错误
2. `npm test` 全部通过（新检测函数需追加对应测试用例）
3. 端口性守卫测试通过：`node --import tsx --test tests/validators.test.js --test-name-pattern "skill source files do not depend on repo-root shared script paths"`
