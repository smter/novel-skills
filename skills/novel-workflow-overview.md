# Novel Workflow Overview

## Summary

This document explains how `novel-research`, `novel-drafting`, and `novel-delivery` fit together as one staged skill system. Use it when you need to understand stage boundaries, handoff files, or which validator to run.

## Key Decisions

- Each stage has one controller skill and one workflow status gate.
- A later stage may read earlier files, but it must not silently rewrite earlier-stage intent.
- Status transitions are file-backed and validator-backed, not chat-backed.

## Stage Map

1. `novel-research`
   Creates the project scaffold, collects constraints, runs research, and blocks drafting until the story foundation is explicit.
2. `novel-drafting`
   Runs the chapter loop, dispatches writer and reviewer roles, and blocks delivery until every planned chapter has a passed review.
3. `novel-delivery`
   Performs preflight, assembles `book.md`, exports final artifacts, and blocks completion until outputs are verified.

## Handoff Files

Research must leave these files strong enough for drafting:

- `00-project/project-brief.md`
- `00-project/success-criteria.md`
- `00-project/workflow-status.md`
- `10-research/*.md`
- `20-story/*.md`
- `30-draft/chapter-plan.md`

Drafting must leave these files strong enough for delivery:

- `30-draft/chapters/chapter-XX.md`
- `40-review/chapter-reviews/chapter-XX-review.md`
- updated `00-project/workflow-status.md`

Delivery consumes those files and adds:

- `50-delivery/metadata.md`
- `50-delivery/frontmatter.md`
- `50-delivery/book.md`
- `50-delivery/output/*`

## Validation Entry Points

- Research: `node --experimental-strip-types <skill-root>/scripts/validate-research-project.mts --project-root <path>`
- Drafting: `node --experimental-strip-types <skill-root>/scripts/validate-drafting-project.mts --project-root <path>`
- Delivery: `node --experimental-strip-types <skill-root>/scripts/validate-delivery-project.mts --project-root <path> --mode <Preflight|Output>`

## Status Contract

Expected workflow progression:

- `initialized`
- `research_in_progress`
- `research_complete`
- `draft_in_progress`
- `draft_complete`
- `delivery_in_progress`
- `delivery_complete`

Blocked states may interrupt the happy path:

- `research_blocked`
- `draft_blocked`
- `delivery_blocked`

## Pointers

- Read each stage skill's `SKILL.md` for the controller entry rules.
- Read the stage-local `references/` or subdocuments only when entering that part of the workflow.
