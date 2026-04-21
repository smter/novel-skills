# Export Workflow

## Summary

Use this file after `book.md`, `metadata.md`, and `frontmatter.md` are ready. It defines how to export PDF and EPUB and what must be verified after each run.

## Key Decisions

- Pandoc availability is checked before export, not assumed.
- PDF and EPUB each need output-specific validation.
- Command success is insufficient without file and structure checks.

## PDF Validation

After PDF export, verify:

- the PDF file exists and is non-empty
- Chinese font assumptions were satisfied or intentionally configured
- chapter headings appear in the table of contents

## EPUB Validation

After EPUB export, verify:

- the EPUB file exists and is non-empty
- metadata fields are present
- the table of contents is navigable
- cover and image paths resolve correctly

## Output Rule

If either format fails validation:

- keep `Status` as `delivery_blocked` or `delivery_in_progress`, whichever matches the retry state
- write `50-delivery/output/export-log.md`
- do not mark `delivery_complete`

## Pointer

Run `node ../scripts/validate-delivery-project.js --project-root <path> --mode Output` after export.
