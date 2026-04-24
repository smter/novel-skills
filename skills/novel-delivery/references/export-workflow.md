# 导出工作流

## 概述

在 `book.md`、`metadata.md` 与 `frontmatter.md` 准备就绪后使用本文件。它定义了如何导出 PDF 与 EPUB，以及每次运行后必须验证什么。

## 关键决策

- 导出前必须检查 Pandoc 是否可用，不能想当然。
- PDF 与 EPUB 都需要各自的输出校验。
- 仅命令执行成功并不足够，还必须检查文件与结构。

## PDF 验证

PDF 导出后，验证：

- PDF 文件存在且非空
- 中文字体假设已满足，或已明确进行配置
- 章节标题出现在目录中

## EPUB 验证

EPUB 导出后，验证：

- EPUB 文件存在且非空
- 元数据字段存在
- 目录可导航
- 封面与图片路径可以正确解析

## 输出规则

如果任一格式验证失败：

- 将 `Status` 保持为 `delivery_blocked` 或 `delivery_in_progress`，以符合当前重试状态者为准
- 写入 `50-delivery/output/export-log.md`
- 不要标记 `delivery_complete`

## 指引

导出后运行 `node --import tsx ../scripts/validate-delivery-project.mts --project-root <path> --mode Output`。
