# 故障恢复

## 概述

当预检、组装、导出或输出验证失败时使用本文件。目标是记录有用的失败报告，并让工作流状态保持真实。

## 关键决策

- Every failed export attempt should leave behind a concise log.
- Failure reports must say what was tried and what to fix next.
- Delivery remains blocked until the underlying cause is removed and validation passes.

## 导出日志内容

向 `50-delivery/output/export-log.md` 写入：

- attempted command
- error summary
- likely cause
- next fix to try

## 常见失败来源

- Pandoc missing from the environment
- Chinese font not available for PDF rendering
- metadata or frontmatter missing required fields
- chapter ordering mismatch between chapter plan and files
- bad cover or image paths

## 指引

After fixing the issue, re-run the preflight or output validation step that failed before changing workflow status.
