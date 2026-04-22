# File Contract

## Chapter File Contract

The chapter file at `30-draft/chapters/chapter-XX.md` must contain at least:

- a chapter title
- `## Metadata`
- `## Summary`
- `## Content`
- `Draft Status`

Example minimum structure:

```md
# Chapter XX

## Metadata
- Chapter Number: XX
- Chapter Goal: ...
- Target Word Range: ...
- Draft Status: drafted

## Summary
- ...

## Content
...
```

## Review File Contract

The review file at `40-review/chapter-reviews/chapter-XX-review.md` must contain at least:

- a review title
- `## Metadata`
- `Decision`
- `## Checks`
- `## Findings`
- `## Required Revisions`

Example minimum structure:

```md
# Chapter XX Review

## Metadata
- Chapter Number: XX
- Decision: 通过
- Reviewer Status: completed

## Checks
- Word Count: pass
- Outline Alignment: pass

## Findings
- ...

## Required Revisions
- None
```

## Workflow Status Contract

`00-project/workflow-status.md` must keep these fields current:

- `Status`
- `Current Stage`
- `Completed Chapters`
- `Last Completed Chapter`
- `Blocking Issues`
- `Next Allowed Skill`

## Controller Validation Rules

The controller must validate files by reading the file contents, not by trusting the chat reply alone.

Validation rules:

- A writer run is not complete until the expected chapter file exists and includes the chapter-file sections above.
- A reviewer run is not complete until the expected review file exists and includes a valid `Decision`.
- The controller may advance only when the review file contains `Decision: 通过`.
- The controller must run `skills/novel-drafting/scripts/validate-drafting-project.js` before advancing status.
- If a file exists but is structurally incomplete or fails validator checks, treat that as a failed run and stop or re-dispatch as appropriate.

## Validator-Enforced Invariants

The drafting validator currently enforces:

- entry status and stage compatibility
- chapter file and review file identity consistency
- actionable required revisions for failed reviews
- chapter and manuscript word-count gates
- workflow field consistency for completion state
