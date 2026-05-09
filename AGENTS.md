# AGENTS.md

## Summary

This repo contains three staged novel-production skills: `novel-research`, `novel-drafting`, and `novel-delivery`.
Treat each skill as a self-contained deployable unit that may live under `.agents/skills/` or `.claude/skills/`, not only in this repo checkout.

## Non-Negotiables

1. A skill must be runnable from its own directory.
   Do not assume the repo root, `skills/novel-*`, or any fixed parent path exists in production.

2. Do not make a `novel-*` skill depend on files outside its own folder unless the dependency is explicitly packaged with that skill.
   Shared helpers belong under that skill's `scripts/` tree or another deployable skill-local path.

3. User-facing commands in skill docs must use `<skill-root>` or skill-local relative paths.
   Do not hardcode `.agents/skills`, `.claude/skills`, or repo-local `skills/...` paths in live docs.

4. Keep progressive disclosure intact.
   `AGENTS.md` is the routing layer; detailed workflow rules stay in `skills/*/SKILL.md`, `references/`, `chapter-loop.md`, `file-contract.md`, and testing docs.

5. Validate behavior and portability together.
   When changing scripts, verify both the business behavior and the “no repo-root coupling” constraint before closing the work.

## Repo Map

- `skills/novel-research/`
  Research-stage skill, scaffold rules, validator, and references.
- `skills/novel-drafting/`
  Drafting-stage skill, chapter loop, validator, and review contracts.
- `skills/novel-delivery/`
  Delivery-stage skill, export pipeline, validator, templates, and Pandoc assets.
- `skills/novel-workflow-overview.md`
  Cross-skill stage map and handoff contract.
- `ARCHITECTURE.md`
  Skill boundaries, dependency rules, and placement guidance.
- `tests/validators.test.js`
  Cross-skill validator and portability regression tests.

## Where To Look

- Stage rules: [skills/novel-workflow-overview.md](/Users/smterc/Project/写小说/novel-skills/skills/novel-workflow-overview.md:1)
- Architecture map: [ARCHITECTURE.md](/Users/smterc/Project/写小说/novel-skills/ARCHITECTURE.md:1)
- Research controller: [skills/novel-research/SKILL.md](/Users/smterc/Project/写小说/novel-skills/skills/novel-research/SKILL.md:1)
- Drafting controller: [skills/novel-drafting/SKILL.md](/Users/smterc/Project/写小说/novel-skills/skills/novel-drafting/SKILL.md:1)
- Delivery controller: [skills/novel-delivery/SKILL.md](/Users/smterc/Project/写小说/novel-skills/skills/novel-delivery/SKILL.md:1)
- Current TS migration plan: [docs/superpowers/plans/2026-04-24-typescript-skill-scripts.md](/Users/smterc/Project/写小说/novel-skills/docs/superpowers/plans/2026-04-24-typescript-skill-scripts.md:1)

## Verification

Run from the repo root during development:

```bash
rtk npx tsc --noEmit
rtk npm test
```

Portability guard:

```bash
rtk node --import tsx --test tests/validators.test.js --test-name-pattern "skill source files do not depend on repo-root shared script paths"
```

## Change Guidance

- When adding script helpers, place them under the owning skill's `scripts/lib/`.
- When updating docs, prefer `<skill-root>` placeholders over environment-specific absolute or repo-relative locations.
- When adding checks, make error messages agent-legible: what broke, why it matters, how to fix it, where to look.
- Leave historical specs and old plans as history unless the task explicitly requires rewriting them.

## Pointers

- Drafting loop details: [skills/novel-drafting/chapter-loop.md](/Users/smterc/Project/写小说/novel-skills/skills/novel-drafting/chapter-loop.md:1)
- Drafting validation contract: [skills/novel-drafting/lint-contract.md](/Users/smterc/Project/写小说/novel-skills/skills/novel-drafting/lint-contract.md:1)
- Delivery file and export checks: [skills/novel-delivery/references/file-contract.md](/Users/smterc/Project/写小说/novel-skills/skills/novel-delivery/references/file-contract.md:1), [skills/novel-delivery/references/export-workflow.md](/Users/smterc/Project/写小说/novel-skills/skills/novel-delivery/references/export-workflow.md:1)
- Research completion gate: [skills/novel-research/references/completion-gate.md](/Users/smterc/Project/写小说/novel-skills/skills/novel-research/references/completion-gate.md:1)

## Superpowers plans Rule

当使用`superpowers`的`brainstorming`和`writing-plans`技能生成specs和plans时
务必采用`.agents/skills/harness-engineering/references/knowledge-layer.md`规定的渐进性披露原则，避免单个文件过大