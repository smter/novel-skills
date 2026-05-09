# 工作进度

> 由 Agent 维护的跨会话进度跟踪。每个任务完成后更新。

## 当前状态

- **Harness 适配**: 已完成 (2026-05-09)
- **TS 迁移**: 规划阶段 — 见 `docs/superpowers/plans/2026-04-24-typescript-skill-scripts.md`

## 已完成

- [x] AGENTS.md / ARCHITECTURE.md 绝对路径修复
- [x] docs/ 结构化文档 (conventions, testing, deployment, evals-and-scoring, long-running-tasks)
- [x] DESIGN_NOTES.md (跨技能设计决策)
- [x] progress.md (跨会话进度跟踪)
- [x] Agent 权限边界 + Git 约定
- [x] pre-commit hooks (.husky/pre-commit: tsc + test)
- [x] tsconfig 新增 noUnusedLocals / noUnusedParameters / noFallthroughCasesInSwitch
- [x] 修复 2 个 TS 未使用变量警告 (check-style-drift.mts, charcard-transformer.mts)
- [x] AGENTS.md 新增阶段闸门文件支撑规则
- [x] Eval 评分标准 + GC Agent prompt 模板
- [x] 长运行任务交接模板

## 进行中

_无_

## 已阻塞

_无_

## 下一步

1. 考虑修复 2 个 Windows 路径分隔符预存测试失败 (export-book.test.mjs #7, #24)
2. 推进 TS 迁移计划
