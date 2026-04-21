# Project Scaffold

## Summary

Use this file when creating a new novel project or normalizing an incomplete one. It defines the minimum directory and file scaffold that later skills rely on.

## Key Decisions

- Keep one book per root project directory.
- Create every required directory before writing content.
- Instantiate every required core file before claiming that research has started.
- Prefer filling templates incrementally over inventing ad hoc file shapes.

## Required Structure

Create these directories:

- `00-project`
- `10-research`
- `20-story`
- `30-draft/chapters`
- `40-review/chapter-reviews`
- `50-delivery/output`

Create these files from templates:

- `00-project/project-brief.md`
- `00-project/success-criteria.md`
- `00-project/workflow-status.md`
- `10-research/topic-research.md`
- `10-research/setting-research.md`
- `10-research/style-research.md`
- `10-research/references.md`
- `20-story/characters.md`
- `20-story/plot-outline.md`
- `20-story/foreshadowing.md`
- `30-draft/chapter-plan.md`

## Initialization Order

1. Derive a slug from the title or working title.
2. Create the directory structure.
3. Instantiate the template files.
4. Set `Status` to `research_in_progress`.
5. Record whether web research is allowed.
6. Begin the interview loop.

## Normalization Rules

If the project already exists:

- keep valid user-authored content
- add any missing required files
- normalize inconsistent headings only when needed for later validation
- do not delete user content just because it does not match the newest template exactly

## Pointers

- Read `interview-loop.md` to collect missing story constraints.
- Read `file-contract.md` to validate whether an existing file is strong enough.
