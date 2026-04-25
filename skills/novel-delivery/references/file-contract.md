# 文件契约

## 概述

使用本文件验证交付阶段的输入与输出在结构上是否完整。范围包括 metadata、frontmatter、生成的书稿和最终输出产物。

## 交付输入文件

交付阶段要求：

- `50-delivery/metadata.md`
- `50-delivery/frontmatter.md`
- `50-delivery/book.md` after assembly

## 最低章节规则

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

## 输出规则

The output directory should contain:

- `<slug>.pdf` when PDF export is requested
- `<slug>.epub` when EPUB export is requested
- `export-log.md` when any export or validation step fails

## 指引

Use `node --experimental-strip-types ../scripts/validate-delivery-project.mts --project-root <path> --mode <Preflight|Output>` for mechanical checks.
