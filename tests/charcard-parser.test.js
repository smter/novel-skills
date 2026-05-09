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

test('parseCharcard — 非角色卡 PNG（无 chara 键）产生警告', async () => {
  const { parseCharcard } = await import('../skills/novel-research/scripts/lib/charcard-parser.mts');
  const dir = fixturesDir();

  const minimalPNG = Buffer.from([
    0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,
  ]);

  writeFile(dir, 'not-a-charcard.png', minimalPNG);
  const result = parseCharcard(path.join(dir, 'not-a-charcard.png'));

  assert.ok(result.warnings.length > 0);
  assert.ok(result.warnings.some((w) => w.message.includes('chara') || w.message.includes('EXIF')));
});

test('parseCharcard — V1 格式自动提升为 V2', async () => {
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

  const { buildPNGWithTextChunk } = await import('./helpers/png-builder.js');
  const pngBuffer = buildPNGWithTextChunk('chara', encoded);
  writeFile(dir, 'v1-card.png', pngBuffer);

  const result = parseCharcard(path.join(dir, 'v1-card.png'));
  assert.equal(result.card.data.name, '测试角色');
  assert.equal(result.card.spec, 'chara_card_v2');
  assert.ok(result.warnings.some((w) => w.message.includes('V1')));
});

test('parseCharcard — V1/V2 共存时 data.* 优先', async () => {
  const { parseCharcard } = await import('../skills/novel-research/scripts/lib/charcard-parser.mts');
  const dir = fixturesDir();

  const coexistentJSON = {
    name: '顶层名字',
    description: '顶层描述',
    spec: 'chara_card_v2',
    spec_version: '2.0',
    data: {
      name: 'data名字',
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

  const encoded = Buffer.from(JSON.stringify(coexistentJSON)).toString('base64');
  const { buildPNGWithTextChunk } = await import('./helpers/png-builder.js');
  const pngBuffer = buildPNGWithTextChunk('chara', encoded);
  writeFile(dir, 'coexistent-card.png', pngBuffer);

  const result = parseCharcard(path.join(dir, 'coexistent-card.png'));
  assert.equal(result.card.data.name, 'data名字');
  assert.equal(result.card.data.description, '顶层描述');
  assert.ok(result.warnings.some((w) => w.message.includes('字段回退')));
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

  const { buildPNGWithTextChunk } = await import('./helpers/png-builder.js');
  const pngBuffer = buildPNGWithTextChunk('chara', withPrefix);
  writeFile(dir, 'prefix-card.png', pngBuffer);

  const result = parseCharcard(path.join(dir, 'prefix-card.png'));
  assert.equal(result.card.data.name, '带前缀');
  assert.equal(result.card.data.description, '测试前缀清洗');
});
