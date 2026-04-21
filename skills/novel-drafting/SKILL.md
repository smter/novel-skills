---
name: novel-drafting
description: Use when a Chinese novel project already has research files and needs chapter drafting with review gates, continuity checks, or resume-from-blocked drafting work
---

# Novel Drafting

## Summary

This skill coordinates whole-book drafting through a file-backed controller loop. It validates entry conditions, identifies the next chapter, dispatches writer and reviewer subagents, and advances only when disk state proves the chapter has passed review.

Treat this as a controller skill. Read only the next document you need.

## Key Decisions

- Drafting starts only after research files are strong enough to constrain chapter work.
- The controller trusts files on disk, not subagent chat summaries.
- Writer and reviewer each own one output file class and must not silently edit upstream planning documents.
- Do not mark `draft_complete` until the whole-book gate passes and `node scripts/validate-drafting-project.js --project-root <path>` reports success.

## When To Use

- The project status is `research_complete` or `draft_blocked`
- The novel project already has the required research files
- The user wants to begin or continue full-book chapter drafting
- The workflow must stop if a chapter review does not pass

## Entry Gate

Before drafting, check:

- `00-project/workflow-status.md`
- `00-project/success-criteria.md`
- `00-project/project-brief.md`
- `20-story/characters.md`
- `20-story/plot-outline.md`
- `20-story/foreshadowing.md`
- `30-draft/chapter-plan.md`

If any file is missing, the project status is wrong, or the content is too weak to support drafting, stop and report the block.

## Progressive Disclosure

Load only the next layer you need:

1. Read this file to decide whether the skill applies and whether entry is allowed.
2. Read `chapter-loop.md` only after entry passes and the controller is ready to run the chapter loop.
3. Read `file-contract.md` when validating files or preparing the exact file requirements for a subagent.
4. Read `writer-subagent.md` only before dispatching the writer.
5. Read `reviewer-subagent.md` only before dispatching the reviewer.
6. Run `node scripts/validate-drafting-project.js --project-root <path>` before claiming the project is ready for `novel-delivery`.

Do not front-load every drafting rule into every subagent dispatch.

## Controller Rules

The controller must:

- decide which chapter needs work
- dispatch writer and reviewer with only the minimum required context
- require writer and reviewer to write their primary outputs directly to disk
- verify file existence and required fields before advancing
- track retries for the current chapter
- update `00-project/workflow-status.md`
- run structural validation before claiming `draft_complete`

The controller must not:

- manually rewrite or paste chapter prose into chapter files
- manually rewrite or paste full review content into review files
- advance based only on chat text without checking the files
- let either subagent silently change unrelated project files

## Block and Completion Rules

- If the writer cannot produce the current chapter because required context is missing or contradictory, stop and mark `draft_blocked`.
- If the reviewer returns `不通过`, keep the workflow on the same chapter and follow the retry rules in `chapter-loop.md`.
- If the same chapter fails three draft attempts, stop and mark `draft_blocked`.
- Only set `draft_complete` after the whole-book review gate defined in `chapter-loop.md` passes and `node scripts/validate-drafting-project.js --project-root <path>` reports success.

## Next Step

After `draft_complete`, the next allowed skill is `novel-delivery`.
