# 编码与文档约定

> 最后更新: 2026-05-09 | 版本: 1.0

## 文件命名

- 技能入口: `SKILL.md`（大写，遵循 Claude Code 技能规范）
- 引用文档: `kebab-case.md`（如 `chapter-loop.md`, `file-contract.md`）
- TypeScript 脚本: `kebab-case.mts`（显式 ESM 模式）
- 测试文件: `*.test.js`（运行于 Node 原生测试框架，通过 `tsx` 导入 TS）

## 技能内依赖方向

```
SKILL.md / references / contracts
        → scripts/*.mts
        → scripts/lib/*.mts
        → templates/ 或 pandoc/ 资产
```

- `scripts/*.mts` 可以 import 同技能的 `scripts/lib/*`
- 校验器可以 import 同技能的解析器/辅助工具
- templates 和 pandoc 默认值是数据资产，不负责任何逻辑

## 技能间边界

- **允许**: 通过已文档化的文件契约读取上阶段产物
- **不允许**: 从另一个 `novel-*` 技能 import 代码
- **不允许**: 在技能内 import 仓库根路径的共享辅助工具
- **不允许**: 在运行命令中硬编码 `.agents/skills`、`.claude/skills` 或 `skills/...` 等固定路径

## Markdown 文档约定

- 使用 `<skill-root>` 占位符代替技能根路径
- 每个文件一个主题，理想长度 < 300 行
- 校验器错误信息必须包含四要素：什么出错了、为什么重要、如何修复、在哪里查找
- 历史方案/计划保留不删，但当前运维文档必须描述当前可部署契约

## TypeScript 约定

- 使用 `.mts` 扩展名（Node.js ESM 模式）
- 启用 `verbatimModuleSyntax`，显式 `import type` 分离类型导入
- 类型守卫优先于类型断言
- 禁止 `as any`、`@ts-ignore`、`@ts-expect-error`

## Git 约定

- 每个逻辑工作单元一个 commit
- Commit 信息格式: `type(scope): 中文描述`
- 严禁 force push
- 每个功能一个分支: `agent/功能名`

## 技能放置规则

新代码归入行为所属技能:

- 调研校验或脚手架逻辑 → `skills/novel-research/scripts/`
- 起草解析、检查或工作流执行 → `skills/novel-drafting/scripts/`
- 交付导出或交付校验逻辑 → `skills/novel-delivery/scripts/`

不要因为两个技能逻辑相似就创建仓库根路径的共享辅助工具。
先问：这个辅助工具是否必须随每个技能独立发布？如果是，保持技能内放置。
