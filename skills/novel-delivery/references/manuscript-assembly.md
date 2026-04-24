# 书稿组装

## 概述

当预检通过，且你已准备好从批准的源文件生成 `50-delivery/book.md` 时，使用本文件。

## 关键决策

- `book.md` 每次都应从源文件重新生成。
- 已批准的章节文件是章节正文的唯一来源。
- frontmatter 在前，章节按计划顺序在后。

## 组装顺序

按以下顺序生成 `50-delivery/book.md`：

1. `50-delivery/frontmatter.md`
2. `30-draft/chapters/` 中的章节文件，顺序以 `30-draft/chapter-plan.md` 为准

## 组装规则

- 组装时不要手工重写正文
- 不要按文件时间戳重排章节顺序
- 不要包含缺少已批准审查状态的章节
- 应重新生成完整文件，而不是向旧 `book.md` 打补丁

## 指引

- 阅读 `file-contract.md` 以验证生成的书稿。
- 在把书稿转换为交付物之前，先阅读 `export-workflow.md`。
