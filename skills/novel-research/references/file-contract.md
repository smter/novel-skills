# File Contract

## Summary

Use this file to validate whether the research phase has produced the minimum viable knowledge base for drafting. The controller should validate file content, not just file existence.

## Required Files

The project must contain:

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

## Minimum Section Rules

`00-project/project-brief.md` must contain at least:

- `## Working Title`
- `## Genre/Type`
- `## Target Audience`
- `## Target Length`
- `## Core Premise`
- `## Central Conflict`
- `## Protagonist Goal`
- `## Forbidden Content`

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

## Validation Principle

A file counts as incomplete if it only contains headings, placeholders, or contradictory statements. Structural completeness is necessary but not sufficient.

## Pointers

- Run `node ../scripts/validate-research-project.js --project-root <path>` for the mechanical checks.
- Read `completion-gate.md` for the qualitative release decision.
