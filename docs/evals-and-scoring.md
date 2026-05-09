# Eval 与质量评分

> 最后更新: 2026-05-09 | 版本: 1.0

## 现有测试基础设施

本项目已有 96 个测试覆盖：
- 交付导出管线测试 (export-book.test.mjs)
- 角色卡解析/转换测试 (charcard-transformer.test.mjs)
- 起草验证器测试 (validators.test.js 中的 drafting 部分)
- 调研验证器测试 (validators.test.js 中的 research 部分)
- 可移植性测试 (validators.test.js 中的 portability 部分)

## 技能质量评分标准

用于评估技能输出（非源代码）的质量：

```
## 技能产物质量评分标准
- 5: 产物完全符合契约，错误消息包含四要素（什么错了/为什么重要/如何修复/在哪里查），
     跨平台一致，文档路径使用 <skill-root> 占位符
- 4: 产物符合契约，错误消息清晰但缺少四要素中的一项，
     文档路径正确
- 3: 产物基本符合契约，错误消息可理解但不够结构化，
     有一处路径硬编码
- 2: 产物部分符合契约，缺少关键错误信息，
     多处路径问题
- 1: 产物不符合契约，错误消息不可读，
     无法独立部署
```

## GC Agent Prompt 模板

以下 prompt 用于定期代码库一致性扫描：

> 扫描此代码库，查找以下内容并报告：
> 1. 技能源码中硬编码的绝对路径或 `.agents/skills/`、`.claude/skills/` 路径
> 2. 跨技能 import 违规（技能从兄弟技能或仓库根路径 import 代码）
> 3. 过时的文档引用（SKILL.md 中指向不存在文件的链接）
> 4. 未使用的 TypeScript 声明（根据 tsconfig 的 noUnusedLocals）
> 5. AGENTS.md 与 docs/ 之间的一致性偏差
>
> 报告格式：每个差异一行，包含：文件路径 + 行号 + 问题描述 + 建议修复。

## 反馈循环

### 保存时检查
```bash
# 完整检查
npm run check

# 仅类型检查
npm run typecheck

# 仅测试
npm test
```

### Pre-commit 自动化
`.husky/pre-commit` 在每次提交前运行 `tsc --noEmit` + 测试套件。

### Agent 自我验证工作流
Agent 在声明任务完成前必须：
1. `npm test` 全部通过
2. `npx tsc --noEmit` 无错误
3. 新增/修改的脚本通过可移植性测试
4. 更新 `progress.md`
