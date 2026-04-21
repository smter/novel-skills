# Node Validator Migration Design

## Goal

Replace the three PowerShell validator scripts with cross-platform Node.js CLI scripts while preserving the current validation behavior, exit codes, and stage boundaries used by the novel workflow skills.

## Scope

- Replace:
  - `skills/novel-research/scripts/validate-research-project.ps1`
  - `skills/novel-drafting/scripts/validate-drafting-project.ps1`
  - `skills/novel-delivery/scripts/validate-delivery-project.ps1`
- Add Node.js equivalents in the same skill-local `scripts/` directories.
- Extract shared validator helpers into a small common module.
- Update all skill and reference documentation to call the Node validators.
- Remove the old `ps1` files entirely.

## Non-Goals

- No TypeScript migration.
- No large CLI framework.
- No behavior redesign for the validator rules.
- No change to the project file contracts beyond matching the existing checks.

## CLI Contract

The new scripts remain separate entry points:

- `node skills/novel-research/scripts/validate-research-project.js --project-root <path>`
- `node skills/novel-drafting/scripts/validate-drafting-project.js --project-root <path>`
- `node skills/novel-delivery/scripts/validate-delivery-project.js --project-root <path> --mode <Preflight|Output>`

Contract requirements:

- Exit `0` on success.
- Exit `1` on validation failure or invalid arguments.
- Print a success banner on pass.
- Print a stage-specific failure banner followed by one error per line on fail.

## Implementation Shape

Add one shared helper at `scripts/lib/validator-utils.js` with focused utilities for:

- argument parsing
- file existence and non-empty checks
- heading checks
- workflow field checks
- error collection and final reporting

Keep each stage validator as a thin file that defines only stage-specific rules.

## Testing Strategy

Use Node's built-in test runner via `node --test`.

Coverage:

- research validator passes on a complete scaffold
- drafting validator fails when a planned chapter review is non-passing
- delivery validator passes in `Output` mode when the generated manuscript and required artifacts exist

Tests should execute the CLIs as child processes so the command-line contract is verified directly.
