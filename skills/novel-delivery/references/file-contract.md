# File Contract

## Summary

Use this file to validate whether delivery inputs and outputs are structurally complete. This file covers metadata, frontmatter, generated manuscript, and final output artifacts.

## Delivery Input Files

The delivery stage expects:

- `50-delivery/metadata.md`
- `50-delivery/frontmatter.md`
- `50-delivery/book.md` after assembly

## Minimum Section Rules

`50-delivery/metadata.md` must contain at least:

- `# Metadata`
- `## Bibliographic Data`
- `## Output Targets`

`50-delivery/frontmatter.md` must contain at least:

- a title page heading
- a copyright or rights statement placeholder
- a summary or jacket copy section

`50-delivery/book.md` must contain at least:

- the frontmatter content
- at least one chapter heading

## Output Rules

The output directory should contain:

- `<slug>.pdf` when PDF export is requested
- `<slug>.epub` when EPUB export is requested
- `export-log.md` when any export or validation step fails

## Pointer

Use `node ../scripts/validate-delivery-project.js --project-root <path> --mode <Preflight|Output>` for mechanical checks.
