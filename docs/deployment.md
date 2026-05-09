# 技能部署模型

> 最后更新: 2026-05-09 | 版本: 1.0

## 概述

`novel-research`、`novel-drafting`、`novel-delivery` 三个技能是可独立部署的单元。每个技能从中立路径下的**自身目录**运行，不依赖仓库根路径或固定父路径。

## 部署位置

技能可放置在以下任意路径，运行时表现一致:

- `.agents/skills/<skill-name>/`
- `.claude/skills/<skill-name>/`
- 开发仓库中的 `skills/<skill-name>/`

技能代码本身不假定何种路径结构——所有内部引用使用技能本地相对路径。

## 运行时要求

### novel-research

- Node.js >= 20（需要 `--experimental-strip-types`）
- 无外部依赖（纯 Node.js + TypeScript）

### novel-drafting

- Node.js >= 20
- 运行前在技能目录内执行 `npm install`（安装技能局部依赖）

### novel-delivery

- Node.js >= 20
- Pandoc（用于 EPUB/DOCX 生成）
- Chromium 兼容浏览器（用于 PDF 打印）
- 运行前在技能目录内执行 `npm install`
- 中文字体（宋体/黑体，或技能 fallback 列表中的字体）

## 技能自包含原则

每个技能自带:

- `SKILL.md` — Agent 路由入口
- `scripts/` — 所有可执行逻辑
- `scripts/lib/` — 技能内共享辅助工具
- `references/` — 详细规则文档
- `templates/` 或 `pandoc/` — 数据资产

技能之间通过**产物文件**通信，而非代码 import:

```
novel-research → 产物文件 → novel-drafting → 产物文件 → novel-delivery
```

## 环境设置

从**技能根目录**执行（不是仓库根路径）:

```bash
# 安装技能依赖
npm install

# 验证技能可用性
node --experimental-strip-types scripts/validate-<stage>-project.mts --help
```

## 可移植性验证

```bash
# 在仓库根路径运行，验证所有技能源码不依赖仓库根路径共享脚本
node --import tsx --test tests/validators.test.js \
  --test-name-pattern "skill source files do not depend on repo-root shared script paths"
```
