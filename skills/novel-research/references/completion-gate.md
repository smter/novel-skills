# Completion Gate

## Summary

Use this file immediately before changing the project status to `research_complete`. It combines qualitative review with the mechanical validation script.

## Key Decisions

- Drafting stays blocked until both the files and the story constraints are strong enough.
- Contradictions count as incomplete work even if every file exists.
- A thin outline is not acceptable if later skills cannot infer chapter progression from it.

## Completion Checklist

Before marking research complete, verify:

- protagonist, main conflict, and story goal are clearly defined
- target length is set and consistent with planned chapter count
- chapter plan aligns with the intended length and progression
- foreshadowing appears before planned payoff points
- style guidance is strong enough to constrain later drafting
- no critical setting or realism gaps remain unresolved
- `scripts/validate-research-project.ps1` reports success

If any check fails, keep the project in `research_in_progress` or `research_blocked`.

## Exit Rule

Only after the checklist passes:

- set `Status` to `research_complete`
- set `Next Allowed Skill` to `novel-drafting`
- update `Last Updated`

## Pointers

- Read `file-contract.md` if the failure is structural.
- Read `research-workflow.md` if the failure is factual or stylistic.
