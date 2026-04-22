# Novel Drafting Reliable Lint Design

## Summary

This design upgrades `skills/novel-drafting` from a prompt-led workflow into a lint-supervised workflow. Agents may still draft and review chapters, but workflow advancement must be justified by project artifacts that pass deterministic checks.

The first implementation scope is intentionally narrow: only `novel-drafting`, and only project artifact state. Chat transcript contracts, semantic literary judgment, and repo-wide harness generalization are explicitly out of scope for this pass.

## Key Decisions

- Keep a single stable validator entrypoint at `skills/novel-drafting/scripts/validate-drafting-project.js`.
- Split drafting validation into single-purpose sub-checkers plus shared parsers.
- Preserve the existing staged modes `Entry`, `Progress`, and `Completion`, but make each mode load only the checks it needs.
- Treat validator output as the authoritative workflow gate; controller logic must not advance the project on chat claims alone.
- Promote only mechanical, reliable rules into lint in this pass; semantic checks such as unresolved foreshadowing stay in reviewer judgment until they have a stable structured representation.

## Context

The current drafting validator only checks shallow structure:

- required files exist
- chapter and review files contain required section headings
- review files contain `Decision: 通过` or `Decision: 不通过`

That leaves several workflow-critical rules enforced only by prose:

- entry-state gating for drafting
- workflow field consistency
- chapter metadata and filename consistency
- review metadata and filename consistency
- chapter and manuscript word-count gates
- completion-state gating before `draft_complete`

This creates a mismatch between skill documentation and actual enforcement. The skill reads as if workflow progression is guarded, but the current script mostly confirms file presence and a few strings.

## Goals

- Make `novel-drafting` progression depend on deterministic validation of project artifacts.
- Provide a single validator command that agents can use before advancing work.
- Encode workflow-critical invariants as lint-like checks with actionable remediation.
- Support progressive disclosure by exposing only stage-relevant checks in each validator mode.
- Keep the architecture open for later expansion without turning the first pass into a generic framework.

## Non-Goals

- Validating writer, reviewer, or controller chat reply shapes.
- Enforcing deep semantic story quality such as whether a payoff is emotionally satisfying.
- Building a generic `.harness/*.yml` rule engine in this iteration.
- Expanding the same lint architecture across `novel-research` and `novel-delivery` in this iteration.

## Proposed Architecture

### Stable Entrypoint

Retain:

- `skills/novel-drafting/scripts/validate-drafting-project.js`

This file becomes a thin orchestrator that:

1. parses CLI args
2. resolves validator mode
3. loads the project model through shared parsers
4. runs the checks assigned to that mode
5. prints aggregated, agent-legible failures

The entrypoint should remain stable so that agent instructions and future automation do not need to learn multiple commands.

### Sub-Checker Layout

Add a dedicated checks directory:

- `skills/novel-drafting/scripts/checks/check-entry-gate.js`
- `skills/novel-drafting/scripts/checks/check-workflow-state.js`
- `skills/novel-drafting/scripts/checks/check-chapter-files.js`
- `skills/novel-drafting/scripts/checks/check-review-files.js`
- `skills/novel-drafting/scripts/checks/check-word-count.js`
- `skills/novel-drafting/scripts/checks/check-completion-gate.js`

Each checker should:

- accept a normalized `context`
- return a list of structured failures
- avoid filesystem traversal beyond its own concern
- avoid making controller decisions directly

This keeps responsibility isolated and prevents the validator from collapsing back into one large procedural script.

### Shared Parsing Layer

Add focused parsers under:

- `skills/novel-drafting/scripts/lib/parse-workflow-status.js`
- `skills/novel-drafting/scripts/lib/parse-chapter-plan.js`
- `skills/novel-drafting/scripts/lib/parse-chapter-file.js`
- `skills/novel-drafting/scripts/lib/parse-review-file.js`
- `skills/novel-drafting/scripts/lib/count-chinese-words.js`

The parser layer exists to turn markdown artifacts into stable data structures. Checks should operate on parsed models rather than re-running ad hoc regexes in multiple places.

## Progressive Disclosure Model

The validator should disclose only the rules needed for the current stage.

### `Entry`

Purpose:

- determine whether drafting may begin or resume

Checks loaded:

- entry gate
- minimal workflow-state sanity
- chapter-plan parseability

Checks not loaded:

- full chapter/review sweep
- completion gate

### `Progress`

Purpose:

- determine whether the current drafting state is internally consistent
- determine whether the project is waiting on drafting, review, revision, or blocking intervention

Checks loaded:

- workflow state
- chapter files
- review files
- word count for chapters that exist

Checks not loaded:

- full completion gate for `draft_complete`

### `Completion`

Purpose:

- determine whether the manuscript may be marked `draft_complete`

Checks loaded:

- workflow state
- full chapter sweep
- full review sweep
- chapter and manuscript word counts
- completion gate

This staged loading is the progressive-disclosure mechanism. Agents only see the constraints relevant to the current gate instead of having to internalize every drafting rule at once.

## Project Model

The validator should normalize repository state into a project model with at least:

- `workflow`
- `successCriteria`
- `chapterPlan`
- `chapters`
- `reviews`
- `plannedChapterNumbers`
- `approvedChapterNumbers`
- `actualCompletedChapterNumbers`

### Workflow Status Model

Parse `00-project/workflow-status.md` into fields including:

- `status`
- `currentStage`
- `plannedChapters`
- `completedChapters`
- `lastCompletedChapter`
- `blockingIssues`
- `nextAllowedSkill`
- `lastUpdated`

Presence is not enough. These fields must be validated as values, not just labels.

### Chapter Plan Model

Parse `30-draft/chapter-plan.md` into:

- ordered list of chapter records
- chapter number
- title
- POV
- word target
- goal
- key events
- characters

The parser should also detect:

- duplicate chapter numbers
- missing chapter numbers
- non-contiguous numbering
- missing `Word Target` or `Goal`

### Chapter File Model

Parse each chapter file into:

- file chapter number
- title
- metadata fields such as `Chapter Number`, `Chapter Goal`, `Target Word Range`, `Draft Status`
- summary section
- content section
- computed content word count

### Review File Model

Parse each review file into:

- file chapter number
- metadata fields such as `Chapter Number`, `Decision`, `Reviewer Status`
- checks section
- findings section
- required revisions section

## Lint Rules

### Entry Gate Rules

The following must be machine-checked:

- `workflow.status` is `research_complete` or `draft_blocked`
- `workflow.currentStage` is compatible with drafting
- drafting prerequisites exist and are non-empty:
  - `00-project/project-brief.md`
  - `00-project/success-criteria.md`
  - `00-project/workflow-status.md`
  - `20-story/characters.md`
  - `20-story/plot-outline.md`
  - `20-story/foreshadowing.md`
  - `30-draft/chapter-plan.md`
- `chapter-plan.md` contains at least one valid planned chapter

This closes the gap where drafting can begin from an unready or incorrectly staged project.

### Workflow State Rules

The validator should confirm:

- `Completed Chapters` equals the count of chapters whose reviews are actually passed
- `Last Completed Chapter` equals the highest consecutively passed planned chapter
- `Next Allowed Skill` is not `novel-delivery` unless completion gate passes
- `Status` is not `draft_complete` unless completion gate passes
- `Status` is `draft_blocked` only when there is a recorded blocking issue

These checks turn workflow status into a verified ledger rather than a free-form note.

### Chapter File Rules

For every existing or required chapter file:

- filename chapter number matches internal `Chapter Number`
- top-level title matches the chapter identity
- required sections exist
- `Draft Status` is present and from an allowed set
- `## Content` is not empty
- `Chapter Goal` is present
- if `Target Word Range` exists, it must be parseable

These rules catch structurally misleading chapter files that currently pass shallow heading checks.

### Review File Rules

For every existing or required review file:

- filename chapter number matches internal `Chapter Number`
- required sections exist
- `Decision` is exactly `通过` or `不通过`
- `Reviewer Status` is present and parseable
- if `Decision` is `不通过`, `## Required Revisions` must contain real revision items rather than an empty placeholder

These rules ensure failed reviews carry actionable downstream information.

### Word-Count Rules

Word-count checks should operate only on chapter body content, not summary or metadata.

Single-chapter rules:

- prefer `chapter-plan.md` `Word Target`
- if no chapter target is available, fall back to `success-criteria.md` `Per-Chapter Word Range`
- report the actual computed count, the expected target or range, and the delta

Completion rules:

- sum chapter-body word counts across all planned chapters that exist
- compare the total against `success-criteria.md` `Target Total Words`

The exact counting algorithm does not need perfect linguistic segmentation; it needs one stable repository-wide method. Consistency is more important than literary precision.

### Completion Gate Rules

The manuscript may pass completion only if:

- every planned chapter file exists
- every planned chapter has a corresponding review file
- every planned chapter review is `通过`
- workflow state is consistent with those passed reviews
- manuscript total words satisfy target rules
- only then may `Status` be `draft_complete`
- only then may `Next Allowed Skill` be `novel-delivery`

This closes the current loophole where completion mostly means "all reviews say pass" while other gating conditions remain unverified.

## Error Message Contract

Every failure should be written for agents, not only humans.

Each message should include:

1. what is wrong
2. why it blocks workflow progression
3. how to remediate it
4. where to look

Preferred shape:

- `Error:` line names the exact drafting violation
- `Why it blocks:` line ties the failure to a workflow rule
- `How to fix:` line gives concrete remediation steps
- `See:` section points to the relevant project files

Example:

```text
Error: Chapter 03 cannot count as completed because
40-review/chapter-reviews/chapter-03-review.md has Decision: 不通过.

Why it blocks:
Drafting may only advance when the chapter review decision is 通过.

How to fix:
Revise chapter-03.md using the required revisions in the review file, then re-run review.
Do not increase Completed Chapters or set Status to draft_complete yet.

See:
- 30-draft/chapters/chapter-03.md
- 40-review/chapter-reviews/chapter-03-review.md
- 00-project/workflow-status.md
```

## Documentation Changes

The documentation should be refactored to match the lint-supervised architecture.

### `SKILL.md`

Keep only:

- when to use the skill
- high-level workflow
- stable validator command and modes
- the rule that advancement depends on validator output

### `chapter-loop.md`

Keep controller behavior only:

- when to dispatch writer
- when to dispatch reviewer
- when to stop or block
- requirement to validate project state before advancement

### `file-contract.md`

Keep artifact contracts only:

- chapter file contract
- review file contract
- workflow status contract

### New `lint-contract.md`

Add a dedicated file that explains:

- validator modes
- which classes of rules each mode runs
- the requirement to treat validator output as authoritative

This separates navigation docs from enforcement docs and supports progressive disclosure inside the skill itself.

## Implementation Plan Shape

Implementation should proceed in small slices:

1. extract shared parsing helpers
2. refactor the existing validator into an orchestrator
3. introduce workflow-state checks
4. introduce chapter and review metadata checks
5. introduce word-count checks
6. introduce completion-gate checks
7. update drafting docs to reference the lint-supervised workflow
8. add tests for each checker and each mode

## Verification Strategy

Before claiming the redesign complete, verify:

- the validator still works in all three modes
- failures are attributable to the correct checker
- error messages are actionable
- existing valid fixtures still pass
- newly added invalid fixtures fail for the intended reason

At minimum, test scenarios should include:

- illegal entry status
- chapter filename and metadata mismatch
- review filename and metadata mismatch
- passed review count inconsistent with workflow status
- chapter under target length
- manuscript total under target length
- `draft_complete` set too early

## Risks and Tradeoffs

### Worth Taking

- Adding more files to the validator implementation
  - This is acceptable because the new files are purpose-specific and reduce future validator entropy.

- Using a stable approximate word-count algorithm
  - This is acceptable because consistency matters more than perfect natural-language segmentation for lint gates.

### Deferred

- Foreshadowing resolution lint
  - Deferred because it is not yet backed by a sufficiently reliable structured representation.

- Chat-output contract lint
  - Deferred because it couples the validator to a runtime transcript format rather than to project artifacts.

- Repo-wide harness generalization
  - Deferred because the immediate failure mode is within drafting workflow enforcement, not the absence of a generic harness engine.

## Recommendation

Implement the lint-supervised drafting validator with a stable top-level command and single-purpose sub-checkers. This gives `novel-drafting` a reliable enforcement layer without prematurely building a generic rule engine, and it matches the intended harness pattern of progressive disclosure plus mechanical supervision.
