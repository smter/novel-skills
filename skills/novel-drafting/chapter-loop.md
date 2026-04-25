# 章节循环

## 用途

本文件定义控制器在单章节和整本书完成时应遵循的流程。它是写给控制器看的，不是给 writer 或 reviewer 子 agent 的。

## 循环开始

在派发任何子 agent 之前：

1. 读取 `00-project/workflow-status.md`。
2. 读取 `30-draft/chapter-plan.md`。
3. 检查 `30-draft/chapters/`。
4. 检查 `40-review/chapter-reviews/`。
5. 在推进前运行 `node --experimental-strip-types <skill-root>/scripts/validate-drafting-project.mts --project-root <project-root> --mode Progress`。

如果当前只是想回答“这一章字数够不够”这类问题：
- 不要自己写字数统计命令
- 直接运行 `WordCount` 模式
- 需要点查时使用 `--chapter chapter-XX`

找到第一个满足以下任一条件的章节：

- 章节文件不存在
- 章节文件存在，但审查文件不存在
- 审查文件存在，且 `Decision` 为 `不通过`
- 审查文件缺少有效决策

如果没有章节满足这些条件，则运行整书完成闸门。

## Writer 派发

在派发 writer 之前：

1. 读取 `writer-subagent.md`。
2. 只读取 `file-contract.md` 中与 writer 相关的部分。
3. 向 writer 传递：
   - 当前章节标识
   - 目标文件路径
   - 允许使用的辅助文件路径
   - `30-draft/chapter-plan.md` 中当前章节的目标
   - 该章节当前的重试次数

writer 返回后：

1. 不要只相信聊天文本。
2. 检查报告路径上的章节文件是否真实存在。
3. 以 `Progress` 模式运行起草验证器。
4. 如果 writer 返回 `BLOCKED`，将 `workflow-status.md` 更新为 `draft_blocked` 后停止。
5. 只有在章节文件存在且验证通过时，才派发 reviewer。

## Reviewer 派发

在派发 reviewer 之前：

1. 读取 `reviewer-subagent.md`。
2. 只读取 `file-contract.md` 中与 reviewer 相关的部分。
3. 向 reviewer 传递：
   - 当前章节标识
   - 当前章节文件路径
   - 允许使用的辅助文件路径
   - 当前审查目标路径

reviewer 返回后：

1. 不要只相信聊天文本。
2. 检查报告路径上的审查文件是否真实存在。
3. 以 `Progress` 模式运行起草验证器。
4. 确认 `Decision` 只能是 `通过` 或 `不通过`。
5. 如果 reviewer 返回 `BLOCKED`，将 `workflow-status.md` 更新为 `draft_blocked` 后停止。

如果 reviewer 反馈里唯一待确认的问题是字数：
- 不要额外发明统计方式
- 直接运行 `node --experimental-strip-types <skill-root>/scripts/validate-drafting-project.mts --project-root <project-root> --mode WordCount --chapter chapter-XX`

## 重试规则

如果审查结果为 `不通过`：

1. 增加当前章节的重试计数。
2. 只从审查文件中提取必需修订项。
3. 重新派发 writer，并提供：
   - 章节文件路径
   - 审查文件路径
   - 修订清单
   - 同样最小化的辅助文件路径
4. 除非 writer 明确被相关内容阻塞，否则不要把完整章节正文或完整审查粘贴回控制器消息。

如果某章节累计达到三次草稿尝试后仍未通过：

- 将 `00-project/workflow-status.md` 更新为 `draft_blocked`
- 记录被阻塞的章节和阻塞原因
- 停止循环

## 推进规则

仅在以下条件全部满足时，才能推进到下一章：

- 章节文件存在
- 审查文件存在
- 审查文件包含 `Decision: 通过`
- `node --experimental-strip-types <skill-root>/scripts/validate-drafting-project.mts --project-root <project-root> --mode Progress` 通过

当某章节通过时：

- 更新 `Completed Chapters`
- 更新 `Last Completed Chapter`
- 在整书闸门通过前，将 `Status` 保持为 `draft_in_progress`

## 整书完成闸门

当所有计划章节看起来都已经通过后：

1. 对比 `30-draft/chapter-plan.md` 中的计划章节与 `30-draft/chapters/` 中的文件。
2. 确认每个章节在 `40-review/chapter-reviews/` 中都有对应且已通过的审查。
3. 运行 `node --experimental-strip-types <skill-root>/scripts/validate-drafting-project.mts --project-root <project-root> --mode Completion`。

只有在完成验证器通过之后：

- 将 `Status` 设为 `draft_complete`
- 将 `Next Allowed Skill` 设为 `novel-delivery`

如果任一整书级检查失败：

- 让项目保持在 `draft_in_progress` 或 `draft_blocked`，以与失败状态一致者为准
- 在 `workflow-status.md` 中记录阻塞问题
