# 文件契约

## 章节文件契约

`30-draft/chapters/chapter-XX.md` 章节文件至少必须包含：

- 一个章节标题
- `## Metadata`
- `## Summary`
- `## Content`
- `Draft Status`

最小结构示例：

```md
# Chapter XX

## Metadata
- Chapter Number: XX
- Chapter Goal: ...
- Target Word Range: ...
- Draft Status: drafted

## Summary
- ...

## Content
...
```

## 连续性状态文件契约

`30-draft/continuity/chapter-XX-state.md` 至少必须包含：

- 一个状态标题
- `## Metadata`
- `## New Facts Confirmed`
- `## Character Knowledge Changes`
- `## Knowledge Transition Notes`
- `## One-Time Events Triggered`
- `## Continuity Notes For Next Chapter`

最小结构示例：

```md
# Chapter XX State Update

## Metadata
- Chapter Number: XX
- Source Chapter: 30-draft/chapters/chapter-XX.md
- State Status: approved

## New Facts Confirmed
- ...

## Character Knowledge Changes
- `<Character> | <Fact> | unknown|suspected|confirmed | source=chapter-XX`

## Knowledge Transition Notes
- `<Character> | <Fact> | basis=<brief evidence from this chapter>`

## One-Time Events Triggered
- `<Event Name> | consumed=yes`
- `<Event Name> | consumed=no`

## Continuity Notes For Next Chapter
- ...
```

`30-draft/continuity/story-state.md` 至少必须包含：

- `# Story State`
- `## Covered Through`
- `## Confirmed Facts`
- `## Character Knowledge`
- `## One-Time Events Consumed`
- `## Open Secrets`
- `## Locked Continuity Rules`

`## One-Time Events Consumed` 中的每一条必须使用以下格式：

- `<Event Name>: chapter-XX`

示例：

- `First discovery of the sabotage attempt: chapter-01`

触发与归档规则：

- 当 `chapter-XX-state.md` 中某条 `One-Time Events Triggered` 使用 `consumed=yes` 时，
  `story-state.md` 的 `## One-Time Events Consumed` 中必须存在同名事件的归档条目。

知识账本规则：

- `chapter-XX-state.md` 的 `## Character Knowledge Changes` 与 `story-state.md` 的 `## Character Knowledge` 都必须使用
  `角色 | 事实 | unknown|suspected|confirmed | source=chapter-XX`
- 仅当确实需要显式锁定“不知道”时才写 `unknown`，不要枚举所有未知项。
- 同一连续性基线内，同一 `角色 | 事实` 只能有一个终态；不能同时出现 `suspected` 和 `confirmed`。
- 若 `chapter-XX-state.md` 中某条知识状态为 `confirmed`，必须在 `## Knowledge Transition Notes` 中有对应的 `basis=...` 条目。

## 审查文件契约

`40-review/chapter-reviews/chapter-XX-review.md` 审查文件至少必须包含：

- 一个审查标题
- `## Metadata`
- `Decision`
- `## Checks`
- `## Findings`
- `## Continuity Findings`
- `## Required Revisions`

最小结构示例：

```md
# Chapter XX Review

## Metadata
- Chapter Number: XX
- Decision: 通过
- Reviewer Status: completed

## Checks
- Word Count: pass
- Outline Alignment: pass
- Knowledge Boundary: pass
- Premise Alignment: pass
- Research Accuracy: pass
- Verified Facts Only: pass
- Style Adherence: pass
- Style Drift: pass
 
## Findings
- ...

## Knowledge Boundary Findings
- Clean: POV knowledge stays within the approved character knowledge ledger.

或：

- Leak: 林闻 | 假溺女不是受害者 | expected=suspected | used_as=confirmed

## Style Drift Findings
- Clean: no abnormal style drift detected for punctuation, repeated phrasing, or explanatory habits.

## Continuity Findings
- Clean: no continuity conflicts found.

或：

- Conflict: First discovery of the sabotage attempt | source=story-state | issue=repeated-discovery

## Required Revisions
- None
```

## 工作流状态契约

`00-project/workflow-status.md` 必须持续维护以下字段的最新状态：

- `Status`
- `Current Stage`
- `Completed Chapters`
- `Last Completed Chapter`
- `Blocking Issues`
- `Next Allowed Skill`

其中：

- `Completed Chapters` 必须是纯数字
- `Last Completed Chapter` 必须是纯数字；填写 `0`、`1`、`2` 这类整数，不要填写 `chapter-01`

## 控制器验证规则

控制器必须通过读取文件内容来验证结果，不能只依赖聊天回复。

验证规则：

- 只有当预期章节文件存在，且包含上述章节文件必需部分时，writer 运行才算完成。
- 只有当对应的 `chapter-XX-state.md` 存在且结构完整时，章节起草才算完成。
- 只有当预期审查文件存在，且包含有效 `Decision` 时，reviewer 运行才算完成。
- 只有当审查文件包含非占位的 `## Continuity Findings` 时，连续性审查才算完成。
- 只有当审查文件显式给出 `Knowledge Boundary` 与 `Style Drift` 检查结论时，相关审查才算完整。
- `## Continuity Findings` 中的每条结论都必须使用 `Clean:` 或 `Conflict:` 结构化格式。
- 只有在审查文件包含 `Decision: 通过` 时，控制器才能推进。
- 如果审查文件结构不合法，控制器必须将其视为 reviewer 失败；控制器不得代写或修补审查结论。
- 控制器在推进前，必须保证 `story-state.md` 与连续通过的章节对齐。
- 控制器在推进状态前，必须运行 `node --experimental-strip-types <skill-root>/scripts/validate-drafting-project.mts --project-root <project-root> --mode <Entry|Progress|Completion>`。
- 如果文件虽然存在，但结构不完整或未通过验证器检查，应视为失败运行，并按情况停止或重新派发。

## 验证器强制不变量

当前起草验证器会强制检查：

- 入口状态与阶段兼容性
- 章节文件与审查文件的身份一致性
- 对未通过审查给出可执行的必改项
- review 文件中的 continuity findings 非空且非占位
- continuity state 文件存在且结构完整
- 角色知识账本必须结构化且不能自相矛盾
- `confirmed` 的知识升级必须带有 `Knowledge Transition Notes`
- `story-state.md` 与已批准章节对齐
- 章节与书稿的字数闸门
- 完成状态下工作流字段的一致性
