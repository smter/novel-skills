# ARCHITECTURE.md

## Summary

This repository is a staged skill system for Chinese novel production.
The primary architectural unit is the skill, not the shared utility folder: `novel-research`, `novel-drafting`, and `novel-delivery` are vertical slices that own their own scripts, references, templates, and operational rules.

## Key Decisions

- Skills are deployable units.
  A skill must remain runnable when copied under `.agents/skills/<name>` or `.claude/skills/<name>`.

- Dependencies flow inward, then forward.
  Inside a skill, docs define the contract, scripts enforce it, and templates/assets support execution; scripts do not reach out to repo-root helpers or sibling skill internals.

- Cross-skill collaboration is artifact-based.
  `novel-research` produces project files, `novel-drafting` consumes and advances them, and `novel-delivery` packages them. The boundary is the file contract, not direct code imports.

- Skill-local duplication is acceptable when it preserves deployability.
  Small helper duplication is preferred over hidden coupling to non-packaged shared modules.

## Domain Map

### `novel-research`

Purpose:
Start a project, collect constraints, scaffold the book workspace, and verify research completeness.

Owns:
- `SKILL.md`
- `references/`
- `templates/`
- `scripts/validate-research-project.mts`
- `scripts/lib/validator-utils.mts`

Consumes:
- User input
- Optional external research chosen during the research workflow

Produces:
- `00-project/*`
- `10-research/*`
- `20-story/*`
- `30-draft/chapter-plan.md`

### `novel-drafting`

Purpose:
Advance a researched project through chapter drafting, review, and completion gating.

Owns:
- `SKILL.md`
- `chapter-loop.md`
- `file-contract.md`
- `lint-contract.md`
- `scripts/validate-drafting-project.mts`
- `scripts/checks/*`
- `scripts/lib/*`

Consumes:
- Research-stage project artifacts
- Review artifacts produced during drafting

Produces:
- `30-draft/chapters/*`
- `40-review/chapter-reviews/*`
- updated workflow state for delivery handoff

### `novel-delivery`

Purpose:
Validate delivery readiness, assemble the manuscript, and export themed HTML/PDF/EPUB outputs.

Owns:
- `SKILL.md`
- `references/`
- `templates/`
- `pandoc/`
- `scripts/export-book.mts`
- `scripts/validate-delivery-project.mts`
- `scripts/lib/validator-utils.mts`

Consumes:
- Drafting-stage manuscript and workflow artifacts
- delivery metadata/frontmatter

Produces:
- `50-delivery/book.md`
- `50-delivery/output/*`
- warning and export log artifacts

## Dependency Rules

### Cross-Skill Rules

Allowed:
- Reading earlier-stage project files through documented file contracts
- Referring to another skill's docs as human-readable guidance

Not allowed:
- Importing code from another `novel-*` skill
- Importing repo-root helpers from inside a skill
- Requiring fixed deployment locations such as `skills/...`, `.agents/skills/...`, or `.claude/skills/...` in live commands

### Within-Skill Rules

Preferred dependency shape:

```text
SKILL.md / references / contracts
        -> scripts/*.mts
        -> scripts/lib/*.mts
        -> templates/ or pandoc/ assets
```

Implications:
- `scripts/*.mts` may import from same-skill `scripts/lib/*`
- checks may import same-skill parsers/helpers
- templates and pandoc defaults are data assets, not logic owners
- tests may reference repo-root layout because they validate the development checkout, not the production deployment shape

## Placement Rules

New code goes where the owning behavior lives:

- Research validation or scaffolding logic:
  `skills/novel-research/scripts/`
- Drafting parsing, checks, or workflow enforcement:
  `skills/novel-drafting/scripts/`
- Delivery export or delivery validation logic:
  `skills/novel-delivery/scripts/`

Do not create a new repo-root script helper just because two skills look similar.
First ask whether the helper must ship with each skill independently. If yes, keep it skill-local.

## Operational Invariants

- Every live command shown to users must survive skill relocation.
- Every validator must explain what failed, why it matters, how to fix it, and where to look.
- Portability regressions must be caught by tests, not rediscovered during deployment.
- Historical plans/specs may mention older paths, but current operational docs must describe the current deployable contract.

## Verification

Development verification:

```bash
rtk npx tsc --noEmit
rtk npm test
```

Portability verification:

```bash
rtk node --import tsx --test tests/validators.test.js --test-name-pattern "skill source files do not depend on repo-root shared script paths"
```

## Pointers

- Top-level routing: [AGENTS.md](/Users/smterc/Project/写小说/novel-skills/AGENTS.md:1)
- Stage handoff map: [skills/novel-workflow-overview.md](/Users/smterc/Project/写小说/novel-skills/skills/novel-workflow-overview.md:1)
- Research details: [skills/novel-research/SKILL.md](/Users/smterc/Project/写小说/novel-skills/skills/novel-research/SKILL.md:1)
- Drafting details: [skills/novel-drafting/SKILL.md](/Users/smterc/Project/写小说/novel-skills/skills/novel-drafting/SKILL.md:1)
- Delivery details: [skills/novel-delivery/SKILL.md](/Users/smterc/Project/写小说/novel-skills/skills/novel-delivery/SKILL.md:1)
