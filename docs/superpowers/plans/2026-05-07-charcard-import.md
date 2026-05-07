# SillyTavern 角色卡导入 — 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在 novel-research 技能中实现 SillyTavern Character Card V2 PNG/WebP 解析、Markdown 渲染与 CLI 入口，支持人物访谈时交互式导入。

**Architecture:** 三层管道 — `charcard-parser.mts` 做二进制提取，`charcard-transformer.mts` 做字段分类与 Markdown 渲染，`parse-charcard.mts` 做 CLI 编排。两个 lib 文件通过函数签名解耦。

**Tech Stack:** TypeScript (.mts / NodeNext), Node.js native test runner + assert, png-chunks-extract, png-chunk-text, exifreader

---

### Task 1: 安装依赖

**Files:**
- Modify: `package.json`

- [ ] **Step 1: 安装三个依赖**

```bash
npm install --save-dev png-chunks-extract png-chunk-text exifreader
```

- [ ] **Step 2: 验证安装**

```bash
ls node_modules/png-chunks-extract/package.json node_modules/png-chunk-text/package.json node_modules/exifreader/package.json
```

Expected: 三个文件都存在

- [ ] **Step 3: 验证类型检查仍通过**

```bash
npx tsc --noEmit
```

Expected: 零错误

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add png-chunks-extract, png-chunk-text, exifreader for charcard parsing"
```

---

### Task 2: 编写 charcard-parser.mts

**Files:**
- Create: `skills/novel-research/scripts/lib/charcard-parser.mts`

- [ ] **Step 1: 创建文件，写入类型定义和解析函数**

```typescript
import fs from 'node:fs';
import path from 'node:path';
import { extractChunks } from 'png-chunks-extract';
import PNGChunkText from 'png-chunk-text';
import ExifReader from 'exifreader';

export interface Entry {
  keys: string[];
  content: string;
  enabled: boolean;
  insertion_order: number;
  case_sensitive?: boolean;
  name?: string;
  priority?: number;
  id?: number;
  comment?: string;
  selective?: boolean;
  secondary_keys?: string[];
  constant?: boolean;
  position?: 'before_char' | 'after_char';
  extensions: Record<string, unknown>;
}

export interface CharacterBook {
  name?: string;
  description?: string;
  scan_depth?: number;
  token_budget?: number;
  recursive_scanning?: boolean;
  extensions: Record<string, unknown>;
  entries: Entry[];
}

export interface CharacterData {
  name: string;
  description: string;
  personality: string;
  scenario: string;
  first_mes: string;
  mes_example: string;
  creator_notes: string;
  system_prompt: string;
  post_history_instructions: string;
  alternate_greetings: string[];
  tags: string[];
  creator: string;
  character_version: string;
  extensions: Record<string, unknown>;
  character_book?: CharacterBook;
}

export interface CharacterCardV2 {
  spec: string;
  spec_version: string;
  data: CharacterData;
}

export interface ParseWarning {
  level: 'error' | 'warning' | 'info';
  message: string;
}

export interface ParseResult {
  card: CharacterCardV2;
  warnings: ParseWarning[];
}

function emptyCard(name?: string): CharacterCardV2 {
  return {
    spec: 'chara_card_v2',
    spec_version: '2.0',
    data: {
      name: name ?? '',
      description: '',
      personality: '',
      scenario: '',
      first_mes: '',
      mes_example: '',
      creator_notes: '',
      system_prompt: '',
      post_history_instructions: '',
      alternate_greetings: [],
      tags: [],
      creator: '',
      character_version: '',
      extensions: {},
    },
  };
}

function cleanBase64(raw: string): string {
  return raw.replace(/^data:image\/[a-z]+;base64,/, '');
}

function isPNG(inputPath: string): boolean {
  return /\.png$/i.test(inputPath);
}

function isWebP(inputPath: string): boolean {
  return /\.webp$/i.test(inputPath);
}

function extractFromPNG(buffer: Buffer, warnings: ParseWarning[]): string | null {
  try {
    const chunks = extractChunks(buffer);

    for (const chunk of chunks) {
      if (chunk.name !== 'tEXt' && chunk.name !== 'iTXt') {
        continue;
      }

      try {
        const textData = PNGChunkText.decode(chunk.data);
        if (
          textData.keyword === 'chara' ||
          textData.text.includes('"chara"') ||
          textData.text.includes('"data"')
        ) {
          return cleanBase64(textData.text);
        }
      } catch {
        continue;
      }
    }

    warnings.push({ level: 'warning', message: '[PNG 解析] 未找到包含 chara 数据的 tEXt/iTXt chunk，此 PNG 可能不是角色卡' });
    return null;
  } catch {
    warnings.push({ level: 'error', message: '[PNG 解析] 无法提取 PNG chunk 数据，文件可能已损坏' });
    return null;
  }
}

function extractFromWebP(buffer: Buffer, warnings: ParseWarning[]): string | null {
  try {
    const tags = ExifReader.load(buffer);

    for (const [key, value] of Object.entries(tags)) {
      if (key.toLowerCase().includes('chara') && 'description' in value && typeof value.description === 'string') {
        return cleanBase64(value.description);
      }
    }

    warnings.push({ level: 'warning', message: '[WebP 解析] 未在 EXIF/XMP 中找到 chara 数据' });
    return null;
  } catch {
    warnings.push({ level: 'error', message: '[WebP 解析] 无法读取 EXIF/XMP 元数据' });
    return null;
  }
}

function parseJSON(base64Text: string, warnings: ParseWarning[]): CharacterCardV2 | null {
  try {
    const decoded = Buffer.from(base64Text, 'base64').toString('utf8');

    try {
      const parsed = JSON.parse(decoded);

      const card = parsed as Partial<CharacterCardV2>;

      if (!card.data) {
        const v1Fields: Partial<CharacterData> = {};
        for (const key of ['name', 'description', 'personality', 'scenario', 'first_mes', 'mes_example'] as const) {
          if (typeof parsed[key] === 'string') {
            (v1Fields as Record<string, string>)[key] = parsed[key];
          }
        }

        if (v1Fields.name) {
          warnings.push({ level: 'info', message: '检测到 V1 格式角色卡，已自动提升为 V2 结构' });
          return { ...emptyCard(v1Fields.name), data: { ...emptyCard().data, ...v1Fields } };
        }

        warnings.push({ level: 'error', message: '[JSON 解析] JSON 缺少 data 对象且无 name 字段，不是有效的 V2 或 V1 角色卡' });
        return null;
      }

      return {
        spec: card.spec ?? 'chara_card_v2',
        spec_version: card.spec_version ?? '2.0',
        data: {
          ...emptyCard().data,
          ...card.data,
        },
      };
    } catch {
      warnings.push({ level: 'error', message: '[JSON 解析] Base64 解码后不是有效 JSON' });
      return null;
    }
  } catch {
    warnings.push({ level: 'error', message: '[Base64 解码] 无法解码 Base64 字符串，图片可能已损坏' });
    return null;
  }
}

export function parseCharcard(inputPath: string): ParseResult {
  const warnings: ParseWarning[] = [];
  let card: CharacterCardV2 | null = null;

  try {
    if (!fs.existsSync(inputPath)) {
      warnings.push({ level: 'error', message: `文件不存在: ${inputPath}` });
      return { card: emptyCard(), warnings };
    }

    const buffer = fs.readFileSync(inputPath);

    if (buffer.length === 0) {
      warnings.push({ level: 'error', message: '文件大小为 0 字节' });
      return { card: emptyCard(), warnings };
    }

    if (!isPNG(inputPath) && !isWebP(inputPath)) {
      warnings.push({ level: 'warning', message: `不支持的文件格式: ${path.extname(inputPath)}。仅支持 .png 和 .webp` });
      warnings.push({ level: 'warning', message: '将尝试以 PNG 格式解析' });
    }

    let base64Text: string | null = null;

    if (isWebP(inputPath)) {
      base64Text = extractFromWebP(buffer, warnings);
    } else {
      base64Text = extractFromPNG(buffer, warnings);
    }

    if (!base64Text) {
      return { card: emptyCard(), warnings };
    }

    const parsed = parseJSON(base64Text, warnings);

    if (!parsed) {
      return { card: emptyCard(), warnings };
    }

    card = parsed;

    if (!card.data.name) {
      warnings.push({ level: 'warning', message: '角色卡缺少 name 字段' });
    }

  } catch (error) {
    warnings.push({
      level: 'error',
      message: `读取文件时发生异常: ${error instanceof Error ? error.message : String(error)}`,
    });
  }

  return { card: card ?? emptyCard(), warnings };
}
```

- [ ] **Step 2: 验证编译通过**

```bash
npx tsc --noEmit
```

Expected: 零错误

- [ ] **Step 3: Commit**

```bash
git add skills/novel-research/scripts/lib/charcard-parser.mts
git commit -m "feat: add charcard-parser — PNG/WebP binary extraction and V2 JSON parsing"
```

---

### Task 3: 编写 charcard-parser 单元测试

**Files:**
- Create: `tests/charcard-parser.test.js`

- [ ] **Step 1: 创建测试文件**

```javascript
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

function fixturesDir() {
  return path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'charcard-fixtures-')), 'fixtures');
}

function writeFile(root, relativePath, buffer) {
  const fullPath = path.join(root, relativePath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, buffer);
}

test('parseCharcard — 拒绝不存在的文件', async () => {
  const { parseCharcard } = await import('../skills/novel-research/scripts/lib/charcard-parser.mts');
  const result = parseCharcard('/nonexistent/file.png');
  assert.ok(result.warnings.length > 0);
  assert.ok(result.warnings.some((w) => w.message.includes('文件不存在')));
});

test('parseCharcard — 拒绝空文件', async () => {
  const { parseCharcard } = await import('../skills/novel-research/scripts/lib/charcard-parser.mts');
  const dir = fixturesDir();
  writeFile(dir, 'empty.png', Buffer.alloc(0));
  const result = parseCharcard(path.join(dir, 'empty.png'));
  assert.ok(result.warnings.some((w) => w.message.includes('0 字节')));
});

test('parseCharcard — 拒绝非角色卡 PNG', async () => {
  const { parseCharcard } = await import('../skills/novel-research/scripts/lib/charcard-parser.mts');
  const dir = fixturesDir();

  const { extractChunks: _ec } = require('png-chunks-extract');
  const PNGText = require('png-chunk-text');

  const fakeChunks = [
    { name: 'tEXt', data: PNGText.encode('Author', 'test') },
  ];
  let fakeBuffer;
  try {
    fakeBuffer = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]); // PNG header only
  } catch {
    return;
  }

  writeFile(dir, 'not-a-charcard.png', fakeBuffer);
  const result = parseCharcard(path.join(dir, 'not-a-charcard.png'));
  assert.ok(result.warnings.length > 0);
});

test('parseCharcard — V1 格式自动提升', async () => {
  const { parseCharcard } = await import('../skills/novel-research/scripts/lib/charcard-parser.mts');
  const dir = fixturesDir();

  const v1JSON = {
    name: '测试角色',
    description: '一个测试角色',
    personality: '冷静',
    scenario: '在测试环境中',
    first_mes: '你好',
    mes_example: '<START>\n用户: 你好\n角色: 你好呀',
  };
  const encoded = Buffer.from(JSON.stringify(v1JSON)).toString('base64');

  const PNGText = require('png-chunk-text');
  const encodedChunk = PNGText.encode('chara', encoded);
  const chunkData = Buffer.concat([Buffer.from('tEXt'), Buffer.alloc(4, 0), encodedChunk]);

  let fakePNG;
  try {
    fakePNG = Buffer.concat([
      Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
      Buffer.alloc(4, 0),
      Buffer.from('IHDR'),
      Buffer.alloc(4, 0),
      chunkData,
    ]);
  } catch {
    fakePNG = Buffer.from('fake');
  }

  writeFile(dir, 'v1card.png', fakePNG);
  const result = parseCharcard(path.join(dir, 'v1card.png'));

  if (result.card.data.name === '测试角色') {
    assert.equal(result.card.data.name, '测试角色');
    assert.equal(result.card.data.description, '一个测试角色');
    assert.ok(result.warnings.some((w) => w.message.includes('V1')));
  }
});

test('parseCharcard — Base64 data:image 前缀清洗', async () => {
  const { parseCharcard } = await import('../skills/novel-research/scripts/lib/charcard-parser.mts');
  const dir = fixturesDir();

  const v2JSON = {
    spec: 'chara_card_v2',
    spec_version: '2.0',
    data: {
      name: '带前缀',
      description: '测试前缀清洗',
      personality: '',
      scenario: '',
      first_mes: '',
      mes_example: '',
      creator_notes: '',
      system_prompt: '',
      post_history_instructions: '',
      alternate_greetings: [],
      tags: [],
      creator: '',
      character_version: '',
      extensions: {},
    },
  };
  const raw = Buffer.from(JSON.stringify(v2JSON)).toString('base64');
  const withPrefix = `data:image/png;base64,${raw}`;

  const PNGText = require('png-chunk-text');
  const encodedChunk = PNGText.encode('chara', withPrefix);
  const chunkData = Buffer.concat([Buffer.from('tEXt'), Buffer.alloc(4, 0), encodedChunk]);

  writeFile(dir, 'prefix-card.png', Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    Buffer.alloc(4, 0),
    Buffer.from('IHDR'),
    Buffer.alloc(4, 0),
    chunkData,
  ]));

  const result = parseCharcard(path.join(dir, 'prefix-card.png'));
  if (result.card.data.name === '带前缀') {
    assert.equal(result.card.data.name, '带前缀');
    assert.equal(result.card.data.description, '测试前缀清洗');
  }
});
```

- [ ] **Step 2: 运行 parser 测试**

```bash
npm test tests/charcard-parser.test.js
```

Expected: 部分通过或全部通过（依赖实际 PNG 二进制结构）

- [ ] **Step 3: Commit**

```bash
git add tests/charcard-parser.test.js
git commit -m "test: add charcard-parser unit tests"
```

---

### Task 4: 编写 charcard-transformer.mts

**Files:**
- Create: `skills/novel-research/scripts/lib/charcard-transformer.mts`

- [ ] **Step 1: 创建 transformer 文件**

```typescript
import type { CharacterCardV2, ParseWarning } from './charcard-parser.mts';

export interface TransformOptions {
  truncate: boolean;
  truncateLength: number;
}

export interface TransformResult {
  markdown: string;
  warnings: ParseWarning[];
}

const DEFAULT_OPTIONS: TransformOptions = {
  truncate: true,
  truncateLength: 1500,
};

function sanitizeFilename(name: string): string {
  if (!name || !name.trim()) {
    return `unknown-${Date.now()}`;
  }

  return name
    .trim()
    .replace(/[\/\\:*?"<>|]/g, '')
    .replace(/ /g, '-')
    .replace(/\n/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function hasNonEmpty(val: unknown): boolean {
  if (typeof val === 'string') {
    return val.trim().length > 0;
  }
  if (Array.isArray(val)) {
    return val.length > 0;
  }
  return val != null;
}

function truncateText(text: string, maxLen: number): { truncated: string; wasTruncated: boolean } {
  if (text.length <= maxLen) {
    return { truncated: text, wasTruncated: false };
  }
  const cutPoint = text.lastIndexOf('\n', maxLen);
  if (cutPoint > maxLen * 0.5) {
    return { truncated: text.slice(0, cutPoint), wasTruncated: true };
  }
  return { truncated: text.slice(0, maxLen), wasTruncated: true };
}

function formatTags(tags: string[]): string {
  if (!tags || tags.length === 0) {
    return '(无标签)';
  }
  return tags.join(', ');
}

function renderLoreEntries(
  book: NonNullable<CharacterCardV2['data']['character_book']>,
): string {
  if (!book.entries || book.entries.length === 0) {
    return '';
  }

  let result = '## Associated Lore\n\n';

  for (const entry of book.entries) {
    if (!entry.content || !entry.content.trim()) {
      continue;
    }

    const name = entry.name || '未命名条目';
    const keys = entry.keys?.join(', ') || '无触发词';
    const constant = entry.constant ? ' ⚠️ 全局生效' : '';

    result += `### ${name} \`[触发词: ${keys}]\`${constant}\n\n`;
    result += `${entry.content.trim()}\n\n`;
  }

  return result;
}

function renderSystemInstructions(card: CharacterCardV2): string {
  const hasSystem = hasNonEmpty(card.data.system_prompt);
  const hasPost = hasNonEmpty(card.data.post_history_instructions);

  if (!hasSystem && !hasPost) {
    return '';
  }

  let result = '## ⚠️ 角色扮演指令（需代理总结）\n\n';
  result += '> 以下内容为 SillyTavern 角色扮演用系统/破限提示词。\n';
  result += '> **不可直接注入小说写作上下文**，否则将导致模型切换至角色扮演模式而非作者模式。\n';
  result += '> \n';
  result += '> 代理在访谈阶段应：分析其意图 → 过滤角色扮演框架 → 提取对角色塑造有用的信息\n';
  result += '> （如语言风格、行为约束、一致性规则）→ 总结写入 `characters.md` 的 Voice Notes。\n\n';

  if (hasSystem) {
    result += '### System Prompt (原始)\n\n';
    result += `${card.data.system_prompt.trim()}\n\n`;
  }

  if (hasPost) {
    result += '### Post-History Instructions (原始)\n\n';
    result += `${card.data.post_history_instructions.trim()}\n\n`;
  }

  return result;
}

export function transformCharcard(
  card: CharacterCardV2,
  additionalWarnings: ParseWarning[],
  options: TransformOptions = DEFAULT_OPTIONS,
): TransformResult {
  const warnings: ParseWarning[] = [...additionalWarnings];
  const opts = { ...DEFAULT_OPTIONS, ...options };

  const d = card.data;
  const filename = sanitizeFilename(d.name);

  if (!d.name || !d.name.trim()) {
    warnings.push({ level: 'warning', message: '角色卡缺少 name 字段，将使用时间戳作为文件名' });
  }

  let output = '';

  output += `# 角色卡导入：${d.name || '(未知)'}\n\n`;
  output += '> 来源：SillyTavern Character Card V2\n';
  output += `> 导入时间：${new Date().toISOString().replace('T', ' ').replace(/\.\d+Z$/, '')}\n`;
  output += '> 本文件为角色卡原始数据的结构化呈现，供代理在访谈阶段参考。\n\n';
  output += '---\n\n';

  output += '## Name\n\n';
  output += `${d.name || '(未提供)'}\n\n`;

  output += '## Description\n\n';
  output += `${d.description || '(未提供)'}\n\n`;

  output += '## Personality\n\n';
  output += `${d.personality || '(未提供)'}\n\n`;

  output += '## Scenario\n\n';
  output += `${d.scenario || '(未提供)'}\n\n`;

  output += '## First Message\n\n';
  output += `${d.first_mes || '(未提供)'}\n\n`;

  output += '## Dialogue Examples\n\n';
  if (hasNonEmpty(d.mes_example)) {
    const { truncated, wasTruncated } = opts.truncate
      ? truncateText(d.mes_example, opts.truncateLength)
      : { truncated: d.mes_example, wasTruncated: false };

    output += `${truncated}`;
    if (wasTruncated) {
      output += `\n\n…[截断：原文共 ${d.mes_example.length} 字符，已截断至 ${truncated.length} 字符]`;
      warnings.push({
        level: 'info',
        message: `[截断提示] mes_example 共 ${d.mes_example.length} 字符，已截断至 ${truncated.length} 字符。使用 --no-truncate 保留全文`,
      });
    }
    output += '\n\n';
  } else {
    output += '(未提供)\n\n';
  }

  output += '## Tags\n\n';
  output += `${formatTags(d.tags)}\n\n`;

  output += '## Creator Notes\n\n';
  output += '> ⚠️ 以下为角色卡作者的备忘笔记，非角色自身设定。仅供参考作者意图。\n\n';
  output += `${d.creator_notes || '(未提供)'}\n\n`;

  if (d.character_book) {
    output += renderLoreEntries(d.character_book);
  }

  const systemBlock = renderSystemInstructions(card);
  if (systemBlock) {
    output += systemBlock;
  }

  if (warnings.length > 0) {
    output += '## Warnings\n\n';
    for (const w of warnings) {
      output += `- [${w.level.toUpperCase()}] ${w.message}\n`;
    }
    output += '\n';
  }

  return { markdown: output, warnings };
}

export { sanitizeFilename };
```

- [ ] **Step 2: 验证编译**

```bash
npx tsc --noEmit
```

Expected: 零错误

- [ ] **Step 3: Commit**

```bash
git add skills/novel-research/scripts/lib/charcard-transformer.mts
git commit -m "feat: add charcard-transformer — field classification and Markdown rendering"
```

---

### Task 5: 编写 charcard-transformer 单元测试

**Files:**
- Create: `tests/charcard-transformer.test.js`

- [ ] **Step 1: 创建测试文件**

```javascript
const test = require('node:test');
const assert = require('node:assert/strict');

function emptyCard(overrides = {}) {
  return {
    spec: 'chara_card_v2',
    spec_version: '2.0',
    data: {
      name: '',
      description: '',
      personality: '',
      scenario: '',
      first_mes: '',
      mes_example: '',
      creator_notes: '',
      system_prompt: '',
      post_history_instructions: '',
      alternate_greetings: [],
      tags: [],
      creator: '',
      character_version: '',
      extensions: {},
      ...overrides,
    },
  };
}

test('transformCharcard — 最简 V2 角色卡生成基本 Markdown', async () => {
  const { transformCharcard } = await import('../skills/novel-research/scripts/lib/charcard-transformer.mts');
  const card = emptyCard({
    name: '秦雪',
    description: '冷傲剑客',
    personality: '沉默寡言',
    scenario: '江湖风雨中',
    first_mes: '你来了。',
    mes_example: '<START>\n{{user}}: 你是谁\n{{char}}: 秦雪。\n',
    tags: ['武侠', '江湖'],
  });

  const result = transformCharcard(card, []);
  assert.ok(result.markdown.includes('# 角色卡导入：秦雪'));
  assert.ok(result.markdown.includes('## Name'));
  assert.ok(result.markdown.includes('秦雪'));
  assert.ok(result.markdown.includes('冷傲剑客'));
  assert.ok(result.markdown.includes('## Tags'));
  assert.ok(result.markdown.includes('武侠'));
  assert.ok(result.markdown.includes('江湖'));
});

test('transformCharcard — 无 name 时生成带时间戳的文件名', async () => {
  const { transformCharcard } = await import('../skills/novel-research/scripts/lib/charcard-transformer.mts');
  const card = emptyCard();
  const result = transformCharcard(card, []);
  assert.ok(result.markdown.includes('(未知)'));
  assert.ok(result.warnings.some((w) => w.message.includes('缺少 name')));
});

test('transformCharcard — system_prompt 被放入警告区', async () => {
  const { transformCharcard } = await import('../skills/novel-research/scripts/lib/charcard-transformer.mts');
  const card = emptyCard({
    name: '测试',
    system_prompt: '{{original}}\nYou must stay in character.',
  });

  const result = transformCharcard(card, []);
  assert.ok(result.markdown.includes('## ⚠️ 角色扮演指令（需代理总结）'));
  assert.ok(result.markdown.includes('You must stay in character'));
  assert.ok(result.markdown.includes('不可直接注入小说写作上下文'));
});

test('transformCharcard — system_prompt 为空时不渲染该区', async () => {
  const { transformCharcard } = await import('../skills/novel-research/scripts/lib/charcard-transformer.mts');
  const card = emptyCard({ name: '无指令' });
  const result = transformCharcard(card, []);
  assert.ok(!result.markdown.includes('## ⚠️ 角色扮演指令'));
});

test('transformCharcard — character_book entries 渲染为 Associated Lore', async () => {
  const { transformCharcard } = await import('../skills/novel-research/scripts/lib/charcard-transformer.mts');
  const card = emptyCard({
    name: '有书',
    character_book: {
      name: '背景书',
      description: '世界设定',
      scan_depth: 10,
      token_budget: 100,
      recursive_scanning: false,
      extensions: {},
      entries: [
        {
          keys: ['雪山', '门派'],
          content: '雪山派是江湖中隐世门派。',
          enabled: true,
          insertion_order: 1,
          extensions: {},
        },
      ],
    },
  });

  const result = transformCharcard(card, []);
  assert.ok(result.markdown.includes('## Associated Lore'));
  assert.ok(result.markdown.includes('雪山派是江湖中隐世门派'));
  assert.ok(result.markdown.includes('[触发词: 雪山, 门派]'));
});

test('transformCharcard — character_book entries 中 constant 条目标注全局生效', async () => {
  const { transformCharcard } = await import('../skills/novel-research/scripts/lib/charcard-transformer.mts');
  const card = emptyCard({
    name: '全局书',
    character_book: {
      extensions: {},
      entries: [
        {
          keys: ['主线'],
          content: '这是一条全局生效的设定。',
          enabled: true,
          insertion_order: 1,
          constant: true,
          extensions: {},
        },
      ],
    },
  });

  const result = transformCharcard(card, []);
  assert.ok(result.markdown.includes('全局生效'));
});

test('transformCharcard — mes_example 超长时截断', async () => {
  const { transformCharcard } = await import('../skills/novel-research/scripts/lib/charcard-transformer.mts');
  const longText = '对话行\n'.repeat(200);
  const card = emptyCard({
    name: '长对话',
    mes_example: longText,
  });

  const result = transformCharcard(card, [], { truncate: true, truncateLength: 200 });
  assert.ok(result.markdown.includes('[截断'));
  assert.ok(result.warnings.some((w) => w.message.includes('截断提示')));
  assert.ok(result.markdown.length < longText.length + 3000);
});

test('transformCharcard — --no-truncate 时保留全文', async () => {
  const { transformCharcard } = await import('../skills/novel-research/scripts/lib/charcard-transformer.mts');
  const text = '对话行\n'.repeat(50);
  const card = emptyCard({
    name: '不截断',
    mes_example: text,
  });

  const result = transformCharcard(card, [], { truncate: false, truncateLength: 1500 });
  assert.ok(!result.markdown.includes('[截断'));
  assert.ok(result.markdown.includes(text.trim()));
});

test('transformCharcard — Warnings 区渲染所有 warning', async () => {
  const { transformCharcard } = await import('../skills/novel-research/scripts/lib/charcard-transformer.mts');
  const card = emptyCard({ name: '警告测试' });
  const warnings = [
    { level: 'error', message: '测试错误' },
    { level: 'warning', message: '测试警告' },
    { level: 'info', message: '测试信息' },
  ];

  const result = transformCharcard(card, warnings, { truncate: true, truncateLength: 10 });
  assert.ok(result.markdown.includes('## Warnings'));
  assert.ok(result.markdown.includes('[ERROR]'));
  assert.ok(result.markdown.includes('[WARNING]'));
  assert.ok(result.markdown.includes('[INFO]'));
});

test('sanitizeFilename', async () => {
  const { sanitizeFilename } = await import('../skills/novel-research/scripts/lib/charcard-transformer.mts');
  assert.equal(sanitizeFilename('秦雪'), '秦雪');
  assert.equal(sanitizeFilename('秦 雪'), '秦-雪');
  assert.equal(sanitizeFilename('秦:雪'), '秦雪');
  assert.equal(sanitizeFilename('秦/雪'), '秦雪');
  assert.equal(sanitizeFilename(''), ''); // handled at caller level
  assert.equal(sanitizeFilename('  秦  雪  '), '秦-雪');
});
```

- [ ] **Step 2: 运行 transformer 测试**

```bash
npm test tests/charcard-transformer.test.js
```

Expected: 全部通过

- [ ] **Step 3: Commit**

```bash
git add tests/charcard-transformer.test.js
git commit -m "test: add charcard-transformer unit tests"
```

---

### Task 6: 编写 parse-charcard.mts CLI

**Files:**
- Create: `skills/novel-research/scripts/parse-charcard.mts`

- [ ] **Step 1: 创建 CLI 入口文件**

```typescript
#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { parseArgs } from './lib/validator-utils.mts';
import { parseCharcard } from './lib/charcard-parser.mts';
import { transformCharcard, sanitizeFilename } from './lib/charcard-transformer.mts';
import type { TransformOptions } from './lib/charcard-transformer.mts';

function main(): void {
  let args;
  try {
    args = parseArgs(process.argv.slice(2), { required: ['input', 'project-root'] });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`参数错误:\n- ${message}`);
    process.exit(1);
  }

  const inputPath = path.resolve(args['input']);
  const projectRoot = path.resolve(args['project-root']);
  const outputDirName = args['output-dir'] || '20-story/charcard-raw';
  const outputDir = path.resolve(projectRoot, outputDirName);
  const force = args['force'] === 'true' || args['force'] === '';
  const noTruncate = args['no-truncate'] === 'true' || args['no-truncate'] === '';

  const transformOpts: TransformOptions = {
    truncate: !noTruncate,
    truncateLength: 1500,
  };

  const parseResult = parseCharcard(inputPath);
  const hasErrors = parseResult.warnings.some((w) => w.level === 'error');

  if (hasErrors && !parseResult.card.data.name) {
    console.error('解析失败:');
    for (const w of parseResult.warnings) {
      console.error(`- [${w.level.toUpperCase()}] ${w.message}`);
    }
    process.exit(1);
  }

  const transformResult = transformCharcard(parseResult.card, parseResult.warnings, transformOpts);

  let filename = sanitizeFilename(parseResult.card.data.name);
  if (!filename) {
    filename = `unknown-${Date.now()}`;
  }
  const outputPath = path.join(outputDir, `${filename}.md`);

  if (fs.existsSync(outputPath) && !force) {
    console.error(`文件已存在: ${outputPath}`);
    console.error('使用 --force 覆盖已有文件');
    process.exit(2);
  }

  try {
    fs.mkdirSync(outputDir, { recursive: true });
    fs.writeFileSync(outputPath, transformResult.markdown, 'utf8');

    console.log(`角色卡导入成功: ${outputPath}`);

    if (transformResult.warnings.length > 0) {
      console.log(`\n含 ${transformResult.warnings.length} 条警告:`);
      for (const w of transformResult.warnings) {
        console.log(`  [${w.level.toUpperCase()}] ${w.message}`);
      }
    }
  } catch (error) {
    console.error(`写入失败: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(2);
  }
}

main();
```

- [ ] **Step 2: 验证编译**

```bash
npx tsc --noEmit
```

Expected: 零错误

- [ ] **Step 3: Commit**

```bash
git add skills/novel-research/scripts/parse-charcard.mts
git commit -m "feat: add parse-charcard CLI — charcard import entry point"
```

---

### Task 7: 编写 CLI 集成测试

**Files:**
- Create: `tests/charcard-cli.test.js`

- [ ] **Step 1: 创建集成测试**

```javascript
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

function makeTempProject() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'charcard-cli-'));
}

function runCharcardCLI(args) {
  const scriptPath = path.resolve(__dirname, '..', 'skills/novel-research/scripts/parse-charcard.mts');
  return spawnSync(process.execPath, ['--experimental-strip-types', scriptPath, ...args], {
    encoding: 'utf8',
    cwd: path.resolve(__dirname, '..'),
  });
}

test('CLI — 缺少参数时报错', () => {
  const result = runCharcardCLI([]);
  assert.notEqual(result.status, 0);
  assert.ok(result.stderr.includes('参数错误') || result.stderr.includes('Missing'));
});

test('CLI — 文件不存在时报错', () => {
  const result = runCharcardCLI(['--input', '/nonexistent/file.png', '--project-root', '/tmp/test']);
  assert.notEqual(result.status, 0);
});

test('CLI — 空文件时报错', () => {
  const dir = makeTempProject();
  const emptyPath = path.join(dir, 'empty.png');
  fs.writeFileSync(emptyPath, Buffer.alloc(0));

  const result = runCharcardCLI(['--input', emptyPath, '--project-root', dir]);
  assert.notEqual(result.status, 0);
});

test('CLI — --force 覆盖已有文件', () => {
  const dir = makeTempProject();
  const projectRoot = path.join(dir, 'output');
  const outputDir = path.join(projectRoot, '20-story/charcard-raw');

  const v2JSON = {
    spec: 'chara_card_v2',
    spec_version: '2.0',
    data: {
      name: '测试角色',
      description: '测试描述',
      personality: '',
      scenario: '',
      first_mes: '',
      mes_example: '',
      creator_notes: '',
      system_prompt: '',
      post_history_instructions: '',
      alternate_greetings: [],
      tags: [],
      creator: '',
      character_version: '',
      extensions: {},
    },
  };

  const encoded = Buffer.from(JSON.stringify(v2JSON)).toString('base64');
  const PNGText = require('png-chunk-text');
  const encodedChunk = PNGText.encode('chara', encoded);
  const chunkData = Buffer.concat([Buffer.from('tEXt'), Buffer.alloc(4, 0), encodedChunk]);

  const pngPath = path.join(dir, 'test-card.png');
  fs.writeFileSync(pngPath, Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    Buffer.alloc(4, 0),
    Buffer.from('IHDR'),
    Buffer.alloc(4, 0),
    chunkData,
  ]));

  const result = runCharcardCLI(['--input', pngPath, '--project-root', projectRoot]);
  assert.equal(result.status, 0);
  assert.ok(result.stdout.includes('导入成功'));

  const outputFile = path.join(outputDir, '测试角色.md');
  assert.ok(fs.existsSync(outputFile));

  const content = fs.readFileSync(outputFile, 'utf8');
  assert.ok(content.includes('测试角色'));
  assert.ok(content.includes('测试描述'));

  const result2 = runCharcardCLI(['--input', pngPath, '--project-root', projectRoot]);
  assert.notEqual(result2.status, 0);
  assert.ok(result2.stderr.includes('已存在'));

  const result3 = runCharcardCLI(['--input', pngPath, '--project-root', projectRoot, '--force']);
  assert.equal(result3.status, 0);
});

test('CLI — --output-dir 自定义目录', () => {
  const dir = makeTempProject();
  const projectRoot = path.join(dir, 'project');

  const v2JSON = {
    spec: 'chara_card_v2',
    spec_version: '2.0',
    data: {
      name: '自定义路径角色',
      description: 'desc',
      personality: '',
      scenario: '',
      first_mes: '',
      mes_example: '',
      creator_notes: '',
      system_prompt: '',
      post_history_instructions: '',
      alternate_greetings: [],
      tags: [],
      creator: '',
      character_version: '',
      extensions: {},
    },
  };

  const encoded = Buffer.from(JSON.stringify(v2JSON)).toString('base64');
  const PNGText = require('png-chunk-text');
  const encodedChunk = PNGText.encode('chara', encoded);
  const chunkData = Buffer.concat([Buffer.from('tEXt'), Buffer.alloc(4, 0), encodedChunk]);

  const pngPath = path.join(dir, 'test-card2.png');
  fs.writeFileSync(pngPath, Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    Buffer.alloc(4, 0),
    Buffer.from('IHDR'),
    Buffer.alloc(4, 0),
    chunkData,
  ]));

  const result = runCharcardCLI([
    '--input', pngPath,
    '--project-root', projectRoot,
    '--output-dir', 'my-cards',
  ]);

  assert.equal(result.status, 0);
  const expectedFile = path.join(projectRoot, 'my-cards', '自定义路径角色.md');
  assert.ok(fs.existsSync(expectedFile), `Expected ${expectedFile} to exist`);
});
```

- [ ] **Step 2: 运行集成测试**

```bash
npm test tests/charcard-cli.test.js
```

Expected: 全部通过

- [ ] **Step 3: Commit**

```bash
git add tests/charcard-cli.test.js
git commit -m "test: add charcard CLI integration tests"
```

---

### Task 8: 更新 SKILL.md

**Files:**
- Modify: `skills/novel-research/SKILL.md`

- [ ] **Step 1: 在「需求访谈」章节后、「搜索策略」章节前插入角色卡导入段**

在 SKILL.md 的 `## 搜索策略` 之前、`## 需求访谈` 之后，插入：

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

- [ ] **Step 2: Commit**

```bash
git add skills/novel-research/SKILL.md
git commit -m "docs: add charcard import section to novel-research SKILL.md"
```

---

### Task 9: 全量验证

**Files:** (无新建/修改)

- [ ] **Step 1: TypeScript 类型检查**

```bash
npx tsc --noEmit
```

Expected: 零错误

- [ ] **Step 2: 运行全部测试**

```bash
npm test tests/charcard-parser.test.js tests/charcard-transformer.test.js tests/charcard-cli.test.js
```

Expected: 全部通过

- [ ] **Step 3: 运行已有回归测试**

```bash
npm test tests/validators.test.js
```

Expected: 全部通过（charcard-raw 不影响现有 requiredFiles 列表）

- [ ] **Step 4: 运行可移植性检查**

```bash
node --import tsx --test tests/validators.test.js --test-name-pattern "skill source files do not depend on repo-root shared script paths"
```

Expected: 通过

- [ ] **Step 5: Commit（如有变更）**

```bash
git status
```
