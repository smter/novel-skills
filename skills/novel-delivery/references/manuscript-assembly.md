# Manuscript Assembly

## Summary

Use this file when preflight has passed and you are ready to generate `50-delivery/book.md` from approved source files.

## Key Decisions

- `book.md` is generated from source files every time.
- Approved chapter files are the only source of chapter prose.
- Frontmatter goes first, then chapters in planned order.

## Assembly Order

Generate `50-delivery/book.md` using:

1. `50-delivery/frontmatter.md`
2. chapter files from `30-draft/chapters/` in the order defined by `30-draft/chapter-plan.md`

## Assembly Rules

- do not manually rewrite prose during assembly
- do not reorder chapters based on file timestamps
- do not include chapters that lack approved review status
- regenerate the full file instead of patching pieces into an old `book.md`

## Pointers

- Read `file-contract.md` to validate the generated manuscript.
- Read `export-workflow.md` before converting the manuscript into deliverables.
