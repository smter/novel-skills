---
name: novel-delivery
description: Use when a Chinese novel project has a finished reviewed manuscript and needs export readiness checks, Pandoc-based PDF or EPUB packaging, or delivery diagnostics
---

# Novel Delivery

## Summary

This skill performs delivery preflight, assembles the book manuscript from approved chapter files, exports PDF and EPUB, and verifies that the final deliverables are structurally usable.

Treat this as a controller skill. Read only the next document you need.

## Key Decisions

- Delivery starts only after the manuscript has already passed drafting and review gates.
- `50-delivery/book.md` is generated output, not the source of truth.
- Export is not complete when Pandoc exits successfully; output files must also pass post-export verification.
- Do not mark `delivery_complete` until `node scripts/validate-delivery-project.js --project-root <path> --mode <Preflight|Output>` passes in both preflight and output mode.

## When To Use

- The project status is `draft_complete` or `delivery_blocked`
- The manuscript chapters and reviews already exist
- The user wants PDF, EPUB, or both
- Export diagnostics or packaging repair is needed

## Progressive Disclosure

Load only the next layer you need:

1. Read this file to decide whether the skill applies and whether delivery can start.
2. Read `references/preflight-checklist.md` before changing status or assembling the manuscript.
3. Read `references/manuscript-assembly.md` before generating `50-delivery/book.md`.
4. Read `references/export-workflow.md` before running Pandoc.
5. Read `references/file-contract.md` when validating metadata, frontmatter, book manuscript, or output files.
6. Read `references/failure-recovery.md` when export or validation fails.
7. Run `node scripts/validate-delivery-project.js --project-root <path> --mode <Preflight|Output>` before claiming `delivery_complete`.

Do not load every export rule into context before the entry gate passes.

## Entry Gate

Before delivery begins:

- check `00-project/workflow-status.md`
- confirm the status is `draft_complete` or `delivery_blocked`
- confirm all planned chapters exist
- confirm all chapter reviews exist and passed
- confirm `50-delivery/metadata.md` exists
- confirm `50-delivery/frontmatter.md` exists
- confirm Pandoc is installed locally

If any preflight item fails, stop and mark `delivery_blocked`.

## Controller Rules

The controller must:

- set `delivery_in_progress` before assembly or export
- regenerate `50-delivery/book.md` from approved source files
- verify PDF and EPUB outputs after export
- write `50-delivery/output/export-log.md` on failure
- keep `00-project/workflow-status.md` current

The controller must not:

- hand-edit `book.md` as if it were the canonical manuscript
- export from stale or partially reviewed chapter files
- mark delivery complete based only on command success text
- ignore missing metadata because the files are "mostly done"

## Status Transitions

- Start: set status to `delivery_in_progress`
- Blocked: set status to `delivery_blocked` and record the specific failure
- Complete: set status to `delivery_complete` only after export validation passes

## Next Step

After `delivery_complete`, the workflow is finished and the deliverables live in `50-delivery/output/`.
