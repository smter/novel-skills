# Preflight Checklist

## Summary

Use this file before assembling the manuscript or running Pandoc. Delivery must stop here if the source manuscript or metadata is incomplete.

## Key Decisions

- Delivery is blocked unless drafting is already complete.
- Preflight checks must be performed before any export attempt.
- Missing metadata is a blocking issue, not a polish issue.

## Required Checks

Confirm:

- `00-project/workflow-status.md` shows `draft_complete` or an intentional delivery retry state
- `30-draft/chapter-plan.md` exists
- every planned chapter exists under `30-draft/chapters/`
- every chapter has a passed review under `40-review/chapter-reviews/`
- `50-delivery/metadata.md` exists and is populated
- `50-delivery/frontmatter.md` exists and is populated
- Pandoc is installed and callable

## Failure Rule

If any check fails:

- set `Status` to `delivery_blocked`
- record the blocker in `workflow-status.md`
- do not assemble `book.md`
- do not run Pandoc

## Pointer

Run `node ../scripts/validate-delivery-project.js --project-root <path> --mode Preflight` for the mechanical checks.
