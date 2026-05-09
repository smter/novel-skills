# 项目脚手架

## 概述

在创建新小说项目或规范化一个不完整项目时使用本文件。它定义了后续 skill 依赖的最小目录与文件脚手架。

## 关键决策

- Keep one book per root project directory.
- Create every required directory before writing content.
- Instantiate every required core file before claiming that research has started.
- Prefer filling templates incrementally over inventing ad hoc file shapes.

## 必需结构

创建以下目录：

- `00-project`
- `10-research`
- `20-story`
- `30-draft/chapters`
- `40-review/chapter-reviews`
- `50-delivery/output`

根据模板创建以下文件：

- `00-project/project-brief.md`
- `00-project/success-criteria.md`
- `00-project/workflow-status.md`
- `10-research/topic-research.md`
- `10-research/setting-research.md`
- `10-research/style-research.md`
- `10-research/references.md`
- `20-story/characters/` — 角色卡片目录（每个角色一个 .md 文件）
- `20-story/character-relationships.md` — 角色关系文件
- `20-story/plot-outline.md`
- `20-story/foreshadowing.md`
- `30-draft/chapter-plan.md`

## 初始化顺序

1. Derive a slug from the title or working title.
2. Create the directory structure.
3. Instantiate the template files.
4. Set `Status` to `research_in_progress`.
5. Record whether web research is allowed.
6. Begin the interview loop.

## 规范化规则

如果项目已经存在：

- keep valid user-authored content
- add any missing required files
- normalize inconsistent headings only when needed for later validation
- do not delete user content just because it does not match the newest template exactly

## 指引

- Read `interview-loop.md` to collect missing story constraints.
- Read `file-contract.md` to validate whether an existing file is strong enough.
