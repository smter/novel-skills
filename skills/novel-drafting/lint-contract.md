# Lint Contract

## Summary

This file describes the deterministic workflow checks that supervise `novel-drafting`.

The validator is the authoritative gate for project artifact state. Writer and reviewer chat replies are advisory; file state and validator results decide whether the controller may advance.

## Command

Run:

```bash
node --import tsx <skill-root>/scripts/validate-drafting-project.mts --project-root <project-root> --mode <Entry|Progress|Completion>
```

## Modes

### Entry

Use before drafting begins or resumes.

Checks:
- workflow status is `research_complete` or `draft_blocked`
- workflow current stage is drafting-compatible
- drafting prerequisites exist
- `chapter-plan.md` contains at least one parseable planned chapter

### Progress

Use after a writer or reviewer updates the current chapter state.

Checks:
- workflow counters match consecutively approved chapters
- chapter file metadata matches file identity
- failed reviews include actionable required revisions
- the current in-progress chapter meets word-count targets before advancement

### Completion

Use before setting `draft_complete` or `Next Allowed Skill: novel-delivery`.

Checks:
- every planned chapter file exists
- every planned chapter has a review file
- every planned chapter review is `通过`
- workflow status fields match approved chapters
- chapter and manuscript word counts satisfy targets
- `draft_complete` and `novel-delivery` are not set prematurely
