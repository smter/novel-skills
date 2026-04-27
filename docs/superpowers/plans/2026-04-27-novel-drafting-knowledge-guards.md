# Novel Drafting Knowledge Guards Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add structured character-knowledge continuity rules and review/style guardrails to `skills/novel-drafting` so POV knowledge leaks and long-form style drift can be caught earlier.

**Architecture:** Keep the existing drafting validator entrypoint and extend the continuity/review parsers with stricter contracts. Enforce deterministic failures for malformed or contradictory knowledge ledgers, and require reviewer/template/documentation updates so semantic checks have a stable structure to operate on.

**Tech Stack:** Node.js built-in test runner, TypeScript `.mts` validator scripts, markdown parsing via existing skill-local parser helpers.

---

### Task 1: Extend Fixtures and Add Failing Regression Tests

**Files:**
- Modify: `tests/validators.test.js`

- [ ] Add fixture helpers for structured knowledge ledger entries and transition notes.
- [ ] Add failing validator tests for malformed knowledge entries, contradictory knowledge states, and missing transition notes.
- [ ] Add doc/template tests for `Knowledge Boundary`, `Style Drift`, and the new chapter-state contract.

### Task 2: Tighten Continuity Parsing and Validation

**Files:**
- Modify: `skills/novel-drafting/scripts/lib/parse-continuity-state.mts`
- Modify: `skills/novel-drafting/scripts/checks/check-continuity-state.mts`

- [ ] Parse `## Knowledge Transition Notes` from chapter state files.
- [ ] Validate `Character Knowledge Changes` and cumulative `Character Knowledge` entries as `角色 | 事实 | unknown|suspected|confirmed | source=chapter-XX`.
- [ ] Fail when the same character/fact pair resolves to conflicting states in the same baseline.
- [ ] Fail when confirmed knowledge appears without a matching transition note in the chapter state that introduced it.

### Task 3: Tighten Review Parsing and Validation

**Files:**
- Modify: `skills/novel-drafting/scripts/lib/parse-review-file.mts`
- Modify: `skills/novel-drafting/scripts/checks/check-review-files.mts`

- [ ] Parse `## Checks` entries explicitly.
- [ ] Require `Knowledge Boundary` and `Style Drift` checks in review files.
- [ ] Keep existing continuity findings requirements intact.

### Task 4: Update Skill Contracts and Templates

**Files:**
- Modify: `skills/novel-drafting/templates/chapter-state.md`
- Modify: `skills/novel-drafting/templates/chapter-review.md`
- Modify: `skills/novel-drafting/writer-subagent.md`
- Modify: `skills/novel-drafting/reviewer-subagent.md`
- Modify: `skills/novel-drafting/file-contract.md`
- Modify: `skills/novel-drafting/lint-contract.md`
- Modify: `skills/novel-drafting/SKILL.md`

- [ ] Document the structured knowledge ledger format and transition-note requirement.
- [ ] Require reviewer outputs to record `Knowledge Boundary` and `Style Drift`.
- [ ] Keep all paths skill-local and portable per repo rules.

### Task 5: Verify

**Files:**
- Modify: none

- [ ] Run targeted drafting validator tests for the new knowledge/review rules.
- [ ] Run `rtk npx tsc --noEmit`.
- [ ] Run `rtk npm test`.
