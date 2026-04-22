---
name: novel-research
description: Use when starting a new Chinese novel project that needs premise clarification, background or setting research, style guidance, and a structured pre-drafting project scaffold
---

# Novel Research

## Overview

Create a single-book project, interview the user one question at a time, and build a durable Markdown knowledge base for later drafting.

Default to web research unless the user explicitly refuses it.

## When to Use

- The user wants to start a new novel from scratch
- The user has only a premise and needs structure
- The project needs setting, genre, style, or domain research
- The drafting stage should be blocked until files are complete

## Required Outputs

The following files must exist and contain sufficient content to mark research as complete:

- `00-project/project-brief.md`
- `00-project/success-criteria.md`
- `00-project/workflow-status.md`
- `10-research/topic-research.md`
- `10-research/setting-research.md`
- `10-research/style-research.md`
- `10-research/references.md`
- `20-story/characters.md`
- `20-story/plot-outline.md`
- `20-story/foreshadowing.md`
- `30-draft/chapter-plan.md`

## Project Creation Rules

When research starts, create a single-book directory using a slug derived from the title or working title.

If the agent starts from a workspace root rather than the book root, create and use this layout:
- `<workspace-root>/<book-slug>/00-project`
- `<workspace-root>/<book-slug>/10-research`
- `<workspace-root>/<book-slug>/20-story`
- `<workspace-root>/<book-slug>/30-draft`
- `<workspace-root>/<book-slug>/40-review`
- `<workspace-root>/<book-slug>/50-delivery`

When later skills refer to paths like `00-project/...`, interpret them relative to the detected novel project root, which may be:
- the current working directory itself
- exactly one child book directory under the current working directory

Create these directories:
- `00-project`
- `10-research`
- `20-story`
- `30-draft/chapters`
- `40-review/chapter-reviews`
- `50-delivery/output`

Instantiate every template file before declaring progress.

## Discovery Interview

Interview the user around these elements. Do not proceed to outlining until they are clarified:

1. **Genre and Type** - What kind of story is this?
2. **Target Audience** - Who is the intended reader?
3. **Length Target** - Short story, novella, novel? Approximate word count?
4. **Tone and Mood** - Serious, light, dark, hopeful?
5. **Core Conflict** - What is the central tension?
6. **Protagonist Desire** - What does the main character want?
7. **Ending Tendency** - Happy, tragic, open, bittersweet?
8. **Forbidden Content** - Any topics, tropes, or elements to avoid?

Ask one question at a time. Do not batch questions.

## Search Policy

Default to web research for domain facts, period details, setting realism, profession workflows, regional context, and style references unless the user explicitly forbids search.

If search is forbidden:
- Do not browse
- Mark uncertain areas in `references.md`
- State which details are inferred rather than verified

## Research Conversion

Do not stop at links or excerpts.

Convert every useful finding into one or more of:
- Setting constraints
- Terminology notes
- Realism pitfalls
- Style rules
- Taboo or continuity risks

## Completeness Checklist

Before marking research complete, verify:

- [ ] Protagonist, main conflict, and story goal are clearly defined
- [ ] Target length is determined with chapter count
- [ ] Chapter plan matches the target length
- [ ] Foreshadowing appears before its payoff point
- [ ] Style guidelines are sufficient to constrain later writing
- [ ] No critical background gaps remain

If any check fails, continue interviewing or researching. Do not mark complete prematurely.

## Red Flags

- Starting an outline before key constraints are clarified
- Skipping web research even though the user did not forbid it
- Dumping raw links instead of writing structured knowledge files
- Marking research complete while core files are still thin or contradictory

All of these mean: stay in `research_in_progress` or move to `research_blocked`.

## Common Rationalizations

| Excuse | Reality |
|--------|---------|
| "The user was vague, so a loose outline is enough" | Drafting needs hard constraints and file outputs. |
| "I know enough about this genre already" | Research defaults to web-backed verification unless refused. |
| "A short chapter plan is probably fine" | The drafting skill needs explicit chapter progression. |

## Status Transitions

- Start: Set status to `research_in_progress`
- Blocked: Set status to `research_blocked` with specific blocking issues listed
- Complete: Set status to `research_complete` only after all files pass completeness check

## Next Step

After `research_complete`, the next allowed skill is `novel-drafting`.
