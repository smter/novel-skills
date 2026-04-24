# TypeScript Skill Scripts Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor the three skill script stacks from JavaScript to TypeScript without regressing validator or delivery behavior.

**Architecture:** Standardize the script runtime around a single root TypeScript toolchain (`tsx` + `typescript`) and keep the three skills on explicit entrypoints with typed shared utilities. Treat each skill as a vertical slice with clear script boundaries so docs, tests, and runtime commands all point to the same source-of-truth paths.

**Tech Stack:** Node.js, TypeScript, tsx, Node test runner, Playwright Core, Pandoc-facing CLI scripts

---

### Task 1: Lock the new runtime contract in tests

**Files:**
- Modify: `tests/validators.test.js`
- Modify: `skills/novel-delivery/tests/export-book.test.mjs`

- [ ] Add assertions that invoke the validators through the TypeScript runtime path rather than direct `.js/.mjs` execution.
- [ ] Run the relevant tests first and confirm they fail for the expected missing-TypeScript-entrypoint reasons.

### Task 2: Migrate shared validator infrastructure and research/drafting validators

**Files:**
- Modify: `scripts/lib/validator-utils.mts`
- Modify: `skills/novel-research/scripts/validate-research-project.mts`
- Modify: `skills/novel-drafting/scripts/**/*.mts`

- [ ] Convert the shared validator helpers to typed exports and remove CommonJS-only coupling.
- [ ] Convert the full `novel-drafting` validator tree together so the entrypoint does not depend on lingering JavaScript internals.
- [ ] Keep validator behavior stable while adding explicit data shapes for parsed workflow, review, and chapter artifacts.

### Task 3: Migrate delivery scripts and unify module boundaries

**Files:**
- Modify: `skills/novel-delivery/scripts/export-book.mts`
- Modify: `skills/novel-delivery/scripts/validate-delivery-project.mts`

- [ ] Convert the exporter and delivery validator to TypeScript under the same runtime contract as the other skills.
- [ ] Remove the current ESM-to-CommonJS bridge and import the shared validator helpers directly as TypeScript modules.
- [ ] Preserve public behavior while tightening argument parsing and typed preflight/output contracts.

### Task 4: Update tooling and repository-facing commands

**Files:**
- Modify: `package.json`
- Create: `tsconfig.json`
- Modify: `skills/novel-delivery/package.json`
- Modify: `skills/novel-drafting/SKILL.md`
- Modify: `skills/novel-delivery/SKILL.md`
- Modify: `skills/novel-workflow-overview.md`
- Modify: skill reference docs that still hardcode `.js/.mjs` paths

- [ ] Add the root TypeScript runtime dependencies and test command.
- [ ] Update the user-facing command examples to one stable invocation pattern.
- [ ] Keep documentation changes limited to current operational docs rather than rewriting historical plans/specs.

### Task 5: Verify the migration end-to-end

**Files:**
- Modify: `tests/validators.test.js`
- Modify: `skills/novel-delivery/tests/export-book.test.mjs`

- [ ] Run targeted tests while migrating to keep failures local.
- [ ] Run the full test suite after the refactor and confirm the TypeScript runtime path is green.
- [ ] Check for leftover `.js/.mjs` script references in live skill docs and workflow docs.
