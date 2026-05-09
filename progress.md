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
- [x] 元叙事措辞三层防线 (2026-05-09)
  - writer-subagent.md: 新增"不得在正文中使用章节号等元叙事指代"禁令 + 写作标准中引用事件必须用故事内参照
  - reviewer-subagent.md: 新增元叙事措辞检查项 + Meta-Reference Checks 字段 + 修订示例
  - check-style-drift.mts: 新增 checkMetaReferences() 检测函数，匹配章节号/前后文引述/章节指代三类模式
  - lint-contract.md: 质量维度自检清单新增"无元叙事措辞"项
  - validators.test.js: 新增 meta-reference phrasing 测试用例
- [x] 珠矶提取缺口补全 (2026-05-09)
  - 新增 `references/theory/` 5 个理论参考文件（mckee-character/dialogue/story, harmon-story-circle, zhuji-character-theory）
  - 新增 `references/narrative-structure-guide.md` 叙事结构操作手册
  - novel-research SKILL.md: Phase 3/4 注入理论强制调用闸门 + 参考列表扩展
  - novel-drafting SKILL.md: COT 思维链 + Writer/Reviewer 契约理论条款
  - lint-contract.md: 新增 15+ 维度起草自检清单
  - 修复 character-interview-guide.md 待补充标记
  - 修复 narrative-structure-guide.md 僵尸引用

## 进行中

_无_

## 已阻塞

_无_

## 下一步

1. 考虑修复 2 个 Windows 路径分隔符预存测试失败 (export-book.test.mjs #7, #24)
2. 推进 TS 迁移计划
