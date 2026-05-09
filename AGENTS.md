# AGENTS.md

## Summary

This repo contains three staged novel-production skills: `novel-research`, `novel-drafting`, and `novel-delivery`.
Treat each skill as a self-contained deployable unit that may live under `.agents/skills/` or `.claude/skills/`, not only in this repo checkout.

## Non-Negotiables

1. A skill must be runnable from its own directory.
   Do not assume the repo root, `skills/novel-*`, or any fixed parent path exists in production.

2. Do not make a `novel-*` skill depend on files outside its own folder unless the dependency is explicitly packaged with that skill.
   Shared helpers belong under that skill's `scripts/` tree or another deployable skill-local path.

3. User-facing commands in skill docs must use `<skill-root>` or skill-local relative paths.
   Do not hardcode `.agents/skills`, `.claude/skills`, or repo-local `skills/...` paths in live docs.

4. Keep progressive disclosure intact.
   `AGENTS.md` is the routing layer; detailed workflow rules stay in `skills/*/SKILL.md`, `references/`, `chapter-loop.md`, `file-contract.md`, and testing docs.

5. Validate behavior and portability together.
   When changing scripts, verify both the business behavior and the “no repo-root coupling” constraint before closing the work.

## Repo Map

- `skills/novel-research/`
  Research-stage skill, scaffold rules, validator, and references.
- `skills/novel-drafting/`
  Drafting-stage skill, chapter loop, validator, and review contracts.
- `skills/novel-delivery/`
  Delivery-stage skill, export pipeline, validator, templates, and Pandoc assets.
- `skills/novel-workflow-overview.md`
  Cross-skill stage map and handoff contract.
- `ARCHITECTURE.md`
  Skill boundaries, dependency rules, and placement guidance.
- `DESIGN_NOTES.md`
  Cross-skill design rationale, non-obvious decisions, and anti-patterns.
- `progress.md`
  Cross-session progress tracking maintained by the agent.
- `tests/validators.test.js`
  Cross-skill validator and portability regression tests.
- `docs/`
  Structured documentation: conventions, testing, deployment.

## 必读路由表

遇到以下场景时，**必须先阅读对应文档**再行动：

| 场景 | 必须阅读 | 原因 |
|------|---------|------|
| 修改任何技能脚本 | `docs/conventions.md` | 文件命名、import 方向、技能边界规则 |
| 新增或移动技能文件 | `docs/deployment.md` | 可移植性约束、路径占位符规则 |
| 编写或修改测试 | `docs/testing.md` | 测试框架、约定、验证工作流 |
| 跨会话恢复工作 | `progress.md` + `docs/long-running-tasks.md` | 当前进度、交接模板 |
| 声明任务完成 | `docs/testing.md` (验证工作流) | 必须步骤：tsc + test + progress.md |
| 架构决策或依赖变更 | `ARCHITECTURE.md` | 依赖方向、技能放置规则 |
| 理解非显而易见的设计选择 | `DESIGN_NOTES.md` | 已否决的方案、反常决策的原因 |
| 评估输出质量 | `docs/evals-and-scoring.md` | 技能产物评分标准 |
| 阶段闸门判断 | `skills/novel-workflow-overview.md` | 阶段地图、状态契约、交接文件 |
| 启动调研/起草/交付流程 | 对应 `skills/novel-*/SKILL.md` | 控制器入口规则、验证闸门 |

## 参考索引

- Stage rules: `skills/novel-workflow-overview.md`
- Architecture map: `ARCHITECTURE.md`
- Research controller: `skills/novel-research/SKILL.md`
- Drafting controller: `skills/novel-drafting/SKILL.md`
- Delivery controller: `skills/novel-delivery/SKILL.md`
- Current TS migration plan: `docs/superpowers/plans/2026-04-24-typescript-skill-scripts.md`

## Verification

Run from the repo root during development:

```bash
rtk npx tsc --noEmit
rtk npm test
```

Portability guard:

```bash
rtk node --import tsx --test tests/validators.test.js --test-name-pattern "skill source files do not depend on repo-root shared script paths"
```

### 关闭任务前必须

1. `npm test` 全部通过
2. `npx tsc --noEmit` 无错误
3. **更新 `progress.md` 反映当前状态** — pre-commit hook 会检查结构完整性，并在 progress.md 未包含在提交中时发出警告

## Agent 权限边界

### 允许

- 创建/修改技能目录下的文件（`skills/*/`）
- 运行测试和类型检查
- 安装开发依赖（`devDependencies`）
- 创建 git 分支
- 修改 `docs/` 和 `DESIGN_NOTES.md`

### 禁止

- 未经批准修改 CI/CD 配置
- 删除测试文件（`tests/*.test.js`）
- Push 到 main/master
- 修改 `.env` 中的真实凭据
- 未经批准安装生产依赖
- 修改其他技能的 `SKILL.md` 核心规则时不同步更新 `ARCHITECTURE.md`
- Force push

### Git 约定

- 每个逻辑工作单元一个 commit
- Commit 信息格式: `type(scope): 中文描述`
- `scope` 取技能名: `research`, `drafting`, `delivery`, `harness`
- 每个功能一个分支: `agent/功能名`

## Change Guidance

- When adding script helpers, place them under the owning skill's `scripts/lib/`.
- When updating docs, prefer `<skill-root>` placeholders over environment-specific absolute or repo-relative locations.
- When adding checks, make error messages agent-legible: what broke, why it matters, how to fix it, where to look.
- Leave historical specs and old plans as history unless the task explicitly requires rewriting them.

## Why stage gating is file-backed

- Drafting loop details: `skills/novel-drafting/chapter-loop.md`
- Drafting validation contract: `skills/novel-drafting/lint-contract.md`
- Delivery file and export checks: `skills/novel-delivery/references/file-contract.md`, `skills/novel-delivery/references/export-workflow.md`
- Research completion gate: `skills/novel-research/references/completion-gate.md`
