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

## 审查文件契约

`40-review/chapter-reviews/chapter-XX-review.md` 审查文件至少必须包含：

- 一个审查标题
- `## Metadata`
- `Decision`
- `## Checks`
- `## Findings`
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

## Findings
- ...

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

## 控制器验证规则

控制器必须通过读取文件内容来验证结果，不能只依赖聊天回复。

验证规则：

- 只有当预期章节文件存在，且包含上述章节文件必需部分时，writer 运行才算完成。
- 只有当预期审查文件存在，且包含有效 `Decision` 时，reviewer 运行才算完成。
- 只有在审查文件包含 `Decision: 通过` 时，控制器才能推进。
- 控制器在推进状态前，必须运行 `node --import tsx <skill-root>/scripts/validate-drafting-project.mts --project-root <project-root> --mode <Entry|Progress|Completion>`。
- 如果文件虽然存在，但结构不完整或未通过验证器检查，应视为失败运行，并按情况停止或重新派发。

## 验证器强制不变量

当前起草验证器会强制检查：

- 入口状态与阶段兼容性
- 章节文件与审查文件的身份一致性
- 对未通过审查给出可执行的必改项
- 章节与书稿的字数闸门
- 完成状态下工作流字段的一致性
