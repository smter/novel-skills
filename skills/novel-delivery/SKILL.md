---
name: novel-delivery
description: Use when a Chinese novel project has a finished reviewed manuscript and needs export readiness checks, Pandoc-based PDF or EPUB packaging, or delivery diagnostics
---

# Novel Delivery

## Overview

Verify a finished novel project, assemble a single book manuscript, and export themed PDF and EPUB deliverables with clear failure reporting.

Normal delivery runs must use the scripted exporter. The agent initiates export and verifies outputs; the exporter script performs manuscript assembly and default PDF rendering.

## When to Use

- The project status is `draft_complete` or `delivery_blocked`
- All chapters are written and reviewed
- The user wants to export the final manuscript
- Latte PDF, Mocha PDF, and EPUB output are needed

## Entry Gate

Before exporting, check:
- `00-project/workflow-status.md` status is `draft_complete` or `delivery_blocked`
- `30-draft/chapter-plan.md`
- `30-draft/chapters/` - all planned chapters exist
- `50-delivery/metadata.md`
- `50-delivery/frontmatter.md`
- Local Pandoc availability
- Local Node dependencies for this skill via `npm install` in the skill directory that contains this `SKILL.md`
- A Chromium-compatible browser path for PDF printing
- Chinese serif and sans font availability from the skill fallback lists

Hard-block only when an item is required to produce files at all.

Do not block export on quality-only issues such as:
- missing chapter reviews
- chapter reviews marked `不通过`
- missing optional metadata fields
- invalid or missing cover path

Record those as warnings and continue exporting.

## Project Root Discovery

Treat every path in this skill as relative to the novel project root.

Before export, resolve the root with this rule:
- if the current directory already contains `00-project/workflow-status.md`, use it
- otherwise, if the current directory contains exactly one child book directory with `00-project/workflow-status.md`, use that child directory
- otherwise, stop and report that the novel project root is missing or ambiguous

This covers the common workspace layout `<workspace-root>/<book-slug>/00-project/...` and prevents token waste from blind directory searches.

If no Chromium-compatible browser is available, do not stop at a generic environment error. The skill must:
- detect the current platform
- use a concise platform-specific browser install plan
- prefer short, actionable browser setup guidance over complex TeX distribution repair
- block delivery with concrete next-step commands if the browser path is unavailable

If Playwright dependencies for this skill are unavailable, block delivery with the concrete next step:
- run `npm install` from the skill directory that contains this `SKILL.md`

## Status Updates

- Set `delivery_in_progress` before assembly
- Set `delivery_blocked` on preflight or export failure
- Set `delivery_complete` only after export verification passes

## Scripted Manuscript Assembly

`50-delivery/book.md` is an exporter-generated intermediate file, not a manual authoring target.

The only supported assembly path for normal delivery runs is the exporter script. It assembles `50-delivery/book.md` in this order:
1. `50-delivery/frontmatter.md`
2. Chapters from `30-draft/chapters/` in planned order

Do not hand-edit `book.md` as the source of truth. Regenerate it from the approved chapter files.

During normal export flow:
- do not manually concatenate frontmatter and chapter files
- do not read every chapter body in order to build `book.md` yourself
- do not reimplement the exporter logic in shell, PowerShell, or ad hoc Markdown assembly
- inspect chapter files only as needed for preflight checks such as existence, planned order, and obvious delivery blockers

Read full chapter bodies only when debugging the exporter itself or when the user explicitly asks for content-level delivery review.

## Required Metadata

Hard-required before export:
- title
- author
- language

Warn but continue when these are missing:
- summary
- keywords
- publication date
- output formats
- cover path when used

## Export Commands

Run the scripted exporter with Node from the workspace root or the novel project root:

```bash
node --import tsx <skill-root>/scripts/export-book.mts --project-root <workspace-or-novel-project-path>
```

This command is the required default path for delivery. The agent should trigger it rather than reproducing its assembly steps manually.

Default PDF export flow:
- assemble `50-delivery/book.md`
- generate `Latte` and `Mocha` HTML via Pandoc
- print those HTML files to PDF with Playwright plus a Chromium-compatible browser
- generate EPUB through Pandoc

PDF export should produce:
- `50-delivery/output/<slug>-latte.html`
- `50-delivery/output/<slug>-mocha.html`
- `50-delivery/output/<slug>-latte.pdf`
- `50-delivery/output/<slug>-mocha.pdf`

Themed PDF export should validate:
- Chromium-compatible browser availability
- Chinese font availability
- Non-empty output files
- Latte is suitable for printing and light-screen reading
- Mocha uses a full dark page theme for screen reading

EPUB export should validate:
- Non-empty output file

## Output Verification

After export, check:
- `50-delivery/output/<slug>-latte.html` exists and is non-empty
- `50-delivery/output/<slug>-mocha.html` exists and is non-empty
- `50-delivery/output/<slug>-latte.pdf` exists and is non-empty
- `50-delivery/output/<slug>-mocha.pdf` exists and is non-empty
- `50-delivery/output/<slug>.epub` exists and is non-empty

If non-blocking issues were found, write them to `50-delivery/output/delivery-warnings.md`.

If verification fails, do not mark delivery complete.

## Failure Logging

If export fails, write a concise report to `50-delivery/output/export-log.md` including:
- Attempted command
- Error summary
- Likely cause
- Next fix to try
- Platform-specific browser install command when the PDF renderer is missing

If preflight or export fails:
- set workflow status to `delivery_blocked`
- stop immediately after logging the failure

If export succeeds with warnings:
- keep the generated deliverables
- write `50-delivery/output/delivery-warnings.md`
- allow `delivery_complete`

## Red Flags

- "We can export once just to see"
- "Pandoc probably exists on most machines"
- "I'll read all chapters and stitch `book.md` myself"
- "The skill says to assemble `book.md`, so I should manually concatenate the manuscript first"
- "I'll debug TeX first even though the default PDF path is browser-based"

These mean: do not skip export-critical checks.

## Common Rationalizations

| Excuse | Reality |
|--------|---------|
| "We can export once just to see" | Export-critical checks still have to pass before any deliverable can be produced. |
| "Missing metadata only hurts polish" | Minimal metadata is required, but optional fields should degrade to warnings instead of blocking output. |
| "Pandoc probably exists on most machines" | Environment assumptions must be checked explicitly. |
| "I should read every chapter and build `book.md` myself" | Manual assembly is out of policy for normal delivery runs; use the exporter script. |
| "Assemble `book.md` means the agent should concatenate files directly" | In this skill, assembly is the script's responsibility unless the exporter itself is being debugged. |
| "PDF export means I should repair `xelatex` first" | Chromium printing is the default PDF path; do not spend tokens on TeX unless the user explicitly asks for LaTeX. |

## Next Step

After `delivery_complete`, the workflow is finished. The deliverables are in `50-delivery/output/`.
