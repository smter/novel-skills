# Failure Recovery

## Summary

Use this file when preflight, assembly, export, or output verification fails. The goal is to record a useful failure report and keep the workflow state honest.

## Key Decisions

- Every failed export attempt should leave behind a concise log.
- Failure reports must say what was tried and what to fix next.
- Delivery remains blocked until the underlying cause is removed and validation passes.

## Export Log Contents

Write `50-delivery/output/export-log.md` with:

- attempted command
- error summary
- likely cause
- next fix to try

## Common Failure Sources

- Pandoc missing from the environment
- Chinese font not available for PDF rendering
- metadata or frontmatter missing required fields
- chapter ordering mismatch between chapter plan and files
- bad cover or image paths

## Pointer

After fixing the issue, re-run the preflight or output validation step that failed before changing workflow status.
