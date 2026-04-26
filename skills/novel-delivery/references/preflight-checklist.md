# 预检清单

## 概述

在组装书稿或运行 Pandoc 之前使用本文件。如果源书稿或元数据不完整，交付流程必须在这里停止。

## 关键决策

- Delivery is blocked unless drafting is already complete.
- Preflight checks must be performed before any export attempt.
- Do not manually set `delivery_in_progress`; `export-book.mts` owns that transition after preflight passes.
- Missing required metadata fields are blocking; missing optional metadata fields are warnings.

## 必需检查

确认：

- `00-project/workflow-status.md` shows `draft_complete` or an intentional delivery retry state
- `30-draft/chapter-plan.md` exists
- every planned chapter exists under `30-draft/chapters/`
- chapter reviews under `40-review/chapter-reviews/` are checked, but missing or failed reviews remain warnings
- `50-delivery/metadata.md` exists and is populated
- `50-delivery/frontmatter.md` exists and is populated
- Pandoc is installed and callable
- a Chromium-compatible browser is available, either by auto-detection or explicit `--pdf-browser-path`

If `metadata.md` or `frontmatter.md` is missing:

- initialize it from `<skill-root>/templates/`
- fill the minimum required fields before export

## 失败规则

如果任一检查失败：

- set `Status` to `delivery_blocked`
- record the blocker in `workflow-status.md`
- do not assemble `book.md`
- do not run Pandoc

## 指引

Run `node --experimental-strip-types <skill-root>/scripts/validate-delivery-project.mts --project-root <path> --mode Preflight` for the mechanical checks.
