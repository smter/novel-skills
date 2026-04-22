# Pressure Scenarios for novel-drafting

## Scenario 1: Missing research outputs

The project has `characters.md` and `plot-outline.md` but no `success-criteria.md`.

Expected baseline failure:
- the agent starts writing anyway
- no explicit block is reported

Expected skill-guided behavior:
- the agent refuses to proceed and reports the missing file
- the agent lists what is needed to unblock drafting

## Scenario 2: Mid-book continuity stress

Six chapters exist, chapter 7 introduces a reveal planned for chapter 10.

Expected baseline failure:
- the agent optimizes for momentum
- the review step is vague and lets the reveal through

Expected skill-guided behavior:
- the reviewer checks foreshadowing.md for planned reveal timing
- the review returns `不通过` with specific continuity violation noted
- the writer receives the review findings and revises

## Scenario 3: Endless revision loop

Chapter 3 repeatedly fails pacing and word-count checks.

Expected baseline failure:
- the agent keeps rewriting indefinitely
- no `draft_blocked` state is emitted

Expected skill-guided behavior:
- after 3 attempts, the agent marks `draft_blocked`
- the agent reports the blocked chapter and reason
- the agent requests user intervention
