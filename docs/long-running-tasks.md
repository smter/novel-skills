# 交接产物模板

> 用于 Agent 跨会话或跨技能交接时记录状态。写入文件，不可仅口头传递。

## 会话交接模板

```markdown
# Handoff — <date> <time>

## 已完成
- [x] <task 1> — commit: <hash>
- [x] <task 2> — commit: <hash>

## 当前状态
- 正在处理: <task>
- 已完成百分比: <N>%
- 最后修改文件: <path>

## 已决策
1. <decision> — 原因: <why>
2. <decision> — 原因: <why>

## 下一步
1. <next step>
2. <next step>

## 阻塞项
- <blocker> — 需要: <what's needed>

## 注意事项
- <warning or gotcha>
- <context that would be lost without this doc>
```

## 使用方式

- 长任务会话结束时写入 `.harness/handoff-<date>.md`
- 新会话开始时 Agent 读取最新的交接文件
- 交接文件读取后标记为 `[CONSUMED]`（不移除，保留审计记录）

## 项目进度跟踪

长期进度使用 `progress.md`（仓库根路径），结构：

```markdown
# 工作进度

## 当前状态
- <feature>: <status> — <note>

## 已完成
- [x] <item> (commit: <hash>)

## 进行中
- [ ] <item>

## 已阻塞
- <item> — 原因: <why>

## 下一步
1. <next step>
```
