# 文件契约

## 概述

使用本文件判断调研阶段是否已经产出可供起草使用的最小可行知识库。控制器应校验文件内容，而不只是文件是否存在。

## 必需文件

The project must contain:

- `00-project/project-brief.md`
- `00-project/success-criteria.md`
- `00-project/workflow-status.md`
- `10-research/topic-research.md`
- `10-research/setting-research.md`
- `10-research/style-research.md`
- `10-research/references.md`
- `20-story/characters/` — 每个角色一个 `.md` 文件，统一角色卡格式
- `20-story/character-relationships.md` — 角色间双向关系
- `20-story/plot-outline.md`
- `20-story/foreshadowing.md`
- `30-draft/chapter-plan.md`

## 最低章节规则

`00-project/project-brief.md` must contain at least:

- `## Working Title`
- `## Genre/Type`
- `## Target Audience`
- `## Target Length`
- `## Core Premise`
- `## Central Conflict`
- `## Protagonist Goal`
- `## Content Boundaries`

`00-project/success-criteria.md` must contain at least:

- `## Reader Promise`
- `## Length and Scope`
- `## Completion Gates`
- `## Review Expectations`

`00-project/workflow-status.md` must keep these fields current:

- `Status`
- `Current Stage`
- `Planned Chapters`
- `Completed Chapters`
- `Blocking Issues`
- `Next Allowed Skill`

`10-research/references.md` must separate:

- source entries
- open questions
- inference notes

`20-story/plot-outline.md` must identify:

- beginning
- middle escalation
- ending direction

`30-draft/chapter-plan.md` must identify:

- total chapters
- target words or range
- one explicit goal per planned chapter

## 验证原则

如果文件只包含标题、占位符，或内部说法互相矛盾，则视为不完整。结构完整是必要条件，但不是充分条件。

## 指引

- Run `node --experimental-strip-types ../scripts/validate-research-project.mts --project-root <path>` for the mechanical checks.
- Read `completion-gate.md` for the qualitative release decision.
