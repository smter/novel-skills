# Baseline Results

## Method

- Review date: 2026-04-21
- Review type: retrospective baseline reconstruction
- Evidence basis: pressure scenarios plus comparison against default, non-skill-guided delivery behavior
- Limitation: no preserved live baseline transcript was found in the repository

## Scenario 1: Draft not complete

- Baseline result: Likely fail
- Export allowed illegally: Likely yes
- Failed review reported: Likely no
- Notes: without an explicit delivery gate, a generic export request can be treated as "good enough to try"

## Scenario 2: Pandoc missing

- Baseline result: Likely fail
- Pandoc checked: Unreliable
- Installation guidance given: Likely no
- Notes: a generic assistant may assume the export tool exists until the command fails

## Scenario 3: Metadata incomplete

- Baseline result: Likely fail
- Metadata validated: Likely no
- Missing fields reported: Likely incomplete
- Notes: without a required metadata contract, export quality is usually treated as a polish issue instead of a blocker
