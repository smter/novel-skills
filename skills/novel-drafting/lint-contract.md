# Lint 契约

## 概述

本文件描述用于监督 `novel-drafting` 的确定性工作流检查。

验证器是项目产物状态的权威闸门。writer 与 reviewer 的聊天回复仅作参考；真正决定控制器能否推进的是文件状态和验证器结果。

## 命令

执行：

```bash
node --experimental-strip-types <skill-root>/scripts/validate-drafting-project.mts --project-root <project-root> --mode <Entry|Progress|Completion|WordCount>
```

## 模式

### Entry

在起草开始或恢复之前使用。

检查项：
- 工作流状态为 `research_complete` 或 `draft_blocked`
- 工作流当前阶段与起草兼容
- 起草前置条件已经存在
- `chapter-plan.md` 至少包含一个可解析的计划章节

### Progress

在 writer 或 reviewer 更新当前章节状态之后使用。

检查项：
- 工作流计数与连续通过的章节一致
- 当前章节 continuity state 文件存在且结构完整
- `story-state.md` 存在且覆盖到当前已批准基线
- 章节文件元数据与文件身份一致
- review 文件包含明确的 continuity findings
- 未通过的审查包含可执行的必改项
- `Character Knowledge Changes` 使用结构化知识账本格式
- `Knowledge Transition Notes` 能为 `confirmed` 的知识升级提供依据
- cumulative `Character Knowledge` 不包含同一角色/事实的冲突终态
- 当前进行中的章节在推进前满足字数目标

### Completion

在设置 `draft_complete` 或 `Next Allowed Skill: novel-delivery` 之前使用。

检查项：
- 所有计划章节文件都存在
- 所有已存在章节都有对应 continuity state 文件
- 所有计划章节都有对应审查文件
- 所有计划章节审查都为 `通过`
- `story-state.md` 与最后一个连续通过章节对齐
- 工作流状态字段与已批准章节一致
- 章节与书稿总字数满足目标
- `draft_complete` 与 `novel-delivery` 没有被过早设置

### WordCount

在 agent 只需要做字数检查，而不需要触发工作流、审查或完成闸门时使用。

检查项：
- 所有已有章节，或 `--chapter` 指定章节，是否落在目标字数区间内
- 不检查工作流状态
- 不检查 review 文件
- 不检查 completion gate
- 不检查全书总字数

强制使用约定：
- 只要需求是“确认字数是否达标”，就应使用 `WordCount`
- 不要为了字数检查额外实现 ad hoc 统计命令
- 不要在 `Progress` / `Completion` 之外手工复写字数规则
