# 预检清单

## 概述

在组装书稿或运行 Pandoc 之前使用本文件。如果源书稿或元数据不完整，交付流程必须在这里停止。

## 关键决策

- Delivery is blocked unless drafting is already complete.
- Preflight checks must be performed before any export attempt.
- Missing metadata is a blocking issue, not a polish issue.

## 必需检查

确认：

- `00-project/workflow-status.md` shows `draft_complete` or an intentional delivery retry state
- `30-draft/chapter-plan.md` exists
- every planned chapter exists under `30-draft/chapters/`
- every chapter has a passed review under `40-review/chapter-reviews/`
- `50-delivery/metadata.md` exists and is populated
- `50-delivery/frontmatter.md` exists and is populated
- Pandoc is installed and callable

## 失败规则

如果任一检查失败：

- set `Status` to `delivery_blocked`
- record the blocker in `workflow-status.md`
- do not assemble `book.md`
- do not run Pandoc

## 指引

Run `node --import tsx ../scripts/validate-delivery-project.mts --project-root <path> --mode Preflight` for the mechanical checks.
