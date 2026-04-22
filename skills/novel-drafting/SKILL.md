---
name: novel-drafting
description: Use when a Chinese novel project already has research files and needs chapter drafting with review gates, continuity checks, or resume-from-blocked drafting work
---

# Novel Drafting

## Overview

Validate research outputs, resume progress from any point, and loop through chapter writing and review with subagents until the planned novel is complete and all review gates pass.

## When to Use

- The project status is `research_complete` or `draft_blocked`
- All required research files exist and are sufficient
- The user wants to begin or continue writing chapters
- Drafting needs to be blocked until review passes

## Entry Gate

Before writing, check:
- `00-project/workflow-status.md` status is `research_complete` or `draft_blocked`
- `00-project/success-criteria.md`
- `20-story/characters.md`
- `20-story/plot-outline.md`
- `20-story/foreshadowing.md`
- `30-draft/chapter-plan.md`

If any item is missing or weak, stop and report the block.

## Project Root Discovery

Treat all paths in this skill as relative to the novel project root, not automatically the workspace root.

Before reading or writing `00-project`, `30-draft`, `40-review`, or `50-delivery`, detect the root with this rule:
- if the current directory already contains `00-project/workflow-status.md`, use it
- otherwise, if the current directory contains exactly one child book directory with `00-project/workflow-status.md`, use that child directory
- otherwise, stop and report that the project root is ambiguous

Do not waste cycles repeatedly searching sibling trees once one valid novel root is identified.

## Resume Logic

Inspect:
- `30-draft/chapters/`
- `40-review/chapter-reviews/`

Resume from the first chapter that is missing, failed review, or not yet marked as passed.

## Writer Subagent Contract

Give the writer only:
- `00-project/project-brief.md`
- `10-research/style-research.md`
- `20-story/characters.md`
- `20-story/plot-outline.md`
- `20-story/foreshadowing.md`
- Prior approved chapter summaries or necessary approved text
- The current chapter target from `30-draft/chapter-plan.md`

The writer outputs only the current chapter draft.

## Reviewer Subagent Contract

The reviewer checks:
- Chapter word count against target
- Alignment with chapter goal
- Alignment with overall outline
- Character consistency
- Forbidden early reveals
- Continuity with prior chapters
- Pacing and readability

The reviewer must write a structured review file to `40-review/chapter-reviews/chapter-XX-review.md` and return `通过` or `不通过`.
The reviewer does not rewrite the chapter.

## Revision Loop

- If review returns `不通过`, send only the review findings back to the writer.
- Retry up to 3 total draft attempts for the same chapter.
- If the third attempt still fails, stop and mark `draft_blocked`.

## Status Updates

When drafting starts:
- Set status to `draft_in_progress`

When a chapter fails too many times:
- Set status to `draft_blocked`
- List the blocked chapter and the reason

When all chapters and the final review pass:
- Set status to `draft_complete`

## Final Manuscript Gate

After the last planned chapter passes, run a book-level review:
- Compare completed chapters to `30-draft/chapter-plan.md`
- Compare open setup items in `20-story/foreshadowing.md`
- Verify each `40-review/chapter-reviews/chapter-XX-review.md` is passed
- Compare total words to the target range

Only then set `draft_complete`.

## Red Flags

- "The chapter is close enough, continue"
- "The review found issues, but they can be fixed later"
- "The reveal is exciting, so early is fine"
- "The third retry is probably enough to move on"

All of these mean: do not advance.

## Common Rationalizations

| Excuse | Reality |
|--------|---------|
| "A missing file should not block creativity" | Missing files mean the contract is incomplete. |
| "Review can be soft because later chapters will fix it" | Later chapters compound continuity damage. |
| "One more retry is harmless" | Unbounded retries hide blocked work. |

## Next Step

After `draft_complete`, the next allowed skill is `novel-delivery`.
