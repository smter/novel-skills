# SillyTavern 角色卡导入 — 设计文档

> 日期：2026-05-07
> 状态：设计完成，待用户审查
> 关联技能：`novel-research`

---

## 1. 概述

在 `novel-research` 技能中增加 SillyTavern Character Card V2（PNG/WebP）导入能力。用户可在调研阶段提供角色卡图片，系统自动解析角色数据并写入结构化 Markdown 档案，代理在人物访谈中据此补充完善 `20-story/characters.md`。

三种使用场景：
1. **交互式** — 人物访谈环节代理主动询问，用户提供路径
2. **预导入** — 用户主动告知路径，代理解析后纳入访谈
3. **独立 CLI** — `parse-charcard.mts` 可随时独立调用

---

## 2. 架构

```
skills/novel-research/
  scripts/
    parse-charcard.mts              # CLI 入口：参数解析 → 调 parser → 调 transformer → 写文件
    lib/
      charcard-parser.mts           # 二进制提取层
      charcard-transformer.mts      # 数据清洗 + 字段分类 + Markdown 渲染
      validator-utils.mts           # (已有，不动)
  templates/
    charcard-output.md              # 输出模板（伪语法，transformer 字符串拼接实现）
```

**职责边界：**
- `charcard-parser`: Buffer → tEXt/iTXt chunk 搜索 → Base64 解码 → `JSON.parse` → 返回 `CharacterCardV2`
- `charcard-transformer`: `CharacterCardV2` → 字段四分类 → 模板渲染 → 返回 Markdown 字符串
- `parse-charcard.mts`: 只做编排，不含解析或格式逻辑
- 两个 lib 文件各自可独立测试

**端口依赖：**

```
parse-charcard.mts
  ├── charcard-parser.mts   → export function parseCharcard(inputPath: string): CharacterCardV2
  └── charcard-transformer.mts → export function transformCharcard(card: CharacterCardV2, opts: TransformOptions): string
```

---

## 3. 字段分类矩阵

V2 全字段处理策略：

### 3.1 直接保留区

| 字段 | 写入位置 | 备注 |
|------|----------|------|
| `name` | `## Name` | — |
| `description` | `## Description` | — |
| `personality` | `## Personality` | — |
| `scenario` | `## Scenario` | — |
| `first_mes` | `## First Message` | — |
| `mes_example` | `## Dialogue Examples` | 默认截断至前 1500 字符 + `…[截断]` 提示 |
| `tags` | `## Tags` | 逗号分隔 |
| `creator_notes` | `## Creator Notes` | 标注「作者笔记，非角色自身设定」 |

### 3.2 需代理总结区

写入但包裹警示框，agent 在访谈阶段读取、提取意图、过滤角色扮演框架后写入 `characters.md`：

| 字段 | 写入方式 |
|------|----------|
| `system_prompt` | `## ⚠️ 角色扮演指令（需代理总结）` → 原文保留 + 操作指引 |
| `post_history_instructions` | 同上 block |

代理总结规则：提取语言风格、行为约束、一致性规则；丢弃角色扮演框架（如 "You are X", "Stay in character"）。

### 3.3 关联 Lore 区

| 字段 | 写入方式 |
|------|----------|
| `character_book.entries[].content` | `## Associated Lore` 列表，每条标记触发词 `keys` |
| `character_book.entries[].constant` | constant=true 的条目标注「全局生效」 |

### 3.4 显式丢弃区

不写入输出文件，也不传递给下游：

`alternate_greetings`, `extensions`（所有层级）, `creator`, `character_version`

---

## 4. 输出模板

文件路径：`{project-root}/20-story/charcard-raw/{sanitized-name}.md`

渲染内容：

```markdown
# 角色卡导入：{{name}}

> 来源：SillyTavern Character Card V2
> 导入时间：{{imported_at}}
> 本文件为角色卡原始数据的结构化呈现，供代理在访谈阶段参考。

---

## Name

{{name}}

## Description

{{description}}

## Personality

{{personality}}

## Scenario

{{scenario}}

## First Message

{{first_mes}}

## Dialogue Examples

{{mes_example}}

## Tags

{{tags}}

## Creator Notes

> ⚠️ 以下为角色卡作者的备忘笔记，非角色自身设定。仅供参考作者意图。

{{creator_notes}}

<!-- character_book 存在时 -->
## Associated Lore

### {{entry_name}} `[触发词: {{keys}}]` {{#if constant}}⚠️ 全局生效{{/if}}

{{content}}

<!-- system_prompt 或 post_history_instructions 非空时 -->
## ⚠️ 角色扮演指令（需代理总结）

> 以下内容为 SillyTavern 角色扮演用系统/破限提示词。
> **不可直接注入小说写作上下文**，否则将导致模型切换至角色扮演模式。
> 
> 代理在访谈阶段应：分析其意图 → 过滤角色扮演框架 → 提取对角色塑造有用的信息
> （如语言风格、行为约束、一致性规则）→ 总结写入 `characters.md` 的 Voice Notes。

### System Prompt (原始)

{{system_prompt}}

### Post-History Instructions (原始)

{{post_history_instructions}}
```

---

## 5. CLI 接口

```bash
node --experimental-strip-types <skill-root>/scripts/parse-charcard.mts \
  --input <path-to-png-or-webp> \
  --project-root <book-directory> \
  [--output-dir <dir>]   # 默认 20-story/charcard-raw/
  [--no-truncate]         # 不截断 mes_example
  [--force]               # 覆盖已有同名文件
```

**退出码：**
- `0` — 成功，已写入输出文件
- `1` — 解析失败（见 Warnings）
- `2` — 写入失败（权限、磁盘等系统错误）

**文件名 sanitize 规则：** 保留中文；去除 `/\:*?"<>|`；空格换 `-`。

---

## 6. SKILL.md 集成

在「需求访谈」章节后增加：

```markdown
## 角色卡导入

在进入人物设定访谈前，先询问用户：

> "你是否拥有 SillyTavern / 酒馆角色卡（PNG 或 WebP 图片）？如果有，我可以解析并导入，作为人物设定的起点。"

如果用户提供角色卡路径：

1. 运行 `<skill-root>/scripts/parse-charcard.mts --input <path> --project-root <project-root>`
2. 读取生成的 `20-story/charcard-raw/<角色名>.md`
3. 遍历「需代理总结」区域的 system_prompt / post_history_instructions，提取对角色塑造有用的信息
4. 将解析结果 + 代理总结整合到 `20-story/characters.md` 的对应角色条目
5. 若解析出的信息足以覆盖模板字段，直接填充；不足的部分进入正常补充访谈

如果用户没有角色卡，直接进入常规人物访谈。
```

---

## 7. 容错策略

**尽力而为 + 警告汇总**：

- 每层解析包裹 `try/catch`，失败不中断后续步骤
- 缺失字段用空字符串填充
- 所有异常写入输出文件底部的 `## Warnings` 区域，逐条列出原因和建议
- 极端情况（连 name 都解析不出）仍生成文件，文件名用 `unknown-{timestamp}`
- Base64 清洗：自动去除 `data:image/*;base64,` 前缀
- PNG chunk 搜索：同时检查 `tEXt` 和 `iTXt`
- V1 兼容：若 JSON 中没有 `data` 嵌套层，将顶层字段提升为 `data` 子对象

**Warnings 示例：**

```markdown
## Warnings

- [JSON 解析警告] `mes_example` 字段存在非 UTF-8 字符，已跳过该字段
- [截断提示] `mes_example` 共 4230 字符，已截断至 1500 字符。使用 --no-truncate 保留全文
- [缺失字段] 未找到 `character_book`，角色卡未附带世界书
```

---

## 8. 依赖

| 库 | 用途 | 大小 |
|----|------|------|
| `png-chunks-extract` | 提取 PNG chunk 元数据 | ~2KB |
| `png-chunk-text` | 解析 tEXt/iTXt chunk 的文本内容 | ~1KB |
| `exifreader` | 读取 WebP EXIF/XMP 元数据块 | ~30KB |

所有依赖通过 npm 安装在仓库根 `package.json`。

---

## 9. 约束与不变量

- **技能自包含：** 所有新脚本位于 `skills/novel-research/scripts/`，不依赖仓库根工具或兄弟技能
- **端口清晰：** parser 和 transformer 通过函数签名解耦，可独立测试
- **不修改已有文件：** 导入操作只写 `20-story/charcard-raw/` 和追加 `20-story/characters.md`，不触及 `00-project/`、`10-research/`、验证器等
- **已有验证器不变：** `charcard-raw/` 目录不在 requiredFiles 列表中，不影响现有验证通过
- **V1 兼容：** V1 角色卡（无 `data` 嵌套、无 `spec` 顶层字段）自动提升为 V2 结构后处理

---

## 10. 测试策略

- `charcard-parser` 单元测试：覆盖正常 PNG、损坏 PNG、非角色卡 PNG、V1 格式、Base64 前缀清洗
- `charcard-transformer` 单元测试：覆盖全字段 V2、最简 V1、仅有 character_book 无其他字段、全空字段
- CLI 集成测试：端到端 `--project-root` 输出完整性验证
- 回归：现有 `tests/validators.test.js` 继续通过（charcard-raw 不影响 requiredFiles 列表）

---

## 11. 范围外（明确不做）

- V3 角色卡格式
- 批量导入（每次调用处理一张卡片）
- 自动扫描目录（用户每次手动指定路径）
- 角色卡图片本身的拷贝/归档（只解析，原图不动）
- 反向导出（从 characters.md 生成角色卡）
- `character_book` 自动写入 `10-research/`（保留在 charcard-raw 中，由 agent 手动整合）
