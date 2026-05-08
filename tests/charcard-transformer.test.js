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
  assert.ok(result.markdown.includes('# 秦雪'));
  assert.ok(result.markdown.includes('## 角色档案'));
  assert.ok(result.markdown.includes('秦雪'));
  assert.ok(result.markdown.includes('冷傲剑客'));
  assert.ok(result.markdown.includes('- **标签**：'));
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
  assert.ok(result.markdown.includes('## 深层设定'));
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

test('transformCharcard — Lore-bias 检测: description/personality 为空但有 character_book 时产生警告', async () => {
  const { transformCharcard } = await import('../skills/novel-research/scripts/lib/charcard-transformer.mts');
  const card = emptyCard({
    name: 'Lore角色',
    description: '',
    personality: '',
    character_book: {
      extensions: {},
      entries: [
        {
          keys: ['角色'],
          content: '全部设定都在 lore 里。',
          enabled: true,
          insertion_order: 1,
          extensions: {},
        },
      ],
    },
  });

  const result = transformCharcard(card, []);
  assert.ok(result.warnings.some((w) => w.message.includes('LORE_BIAS')));
  assert.ok(result.warnings.some((w) => w.message.includes('Associated Lore')));
});

test('transformCharcard — 无 lore-bias: description 有值时即使有 character_book 也不触发', async () => {
  const { transformCharcard } = await import('../skills/novel-research/scripts/lib/charcard-transformer.mts');
  const card = emptyCard({
    name: '正常角色',
    description: '有描述',
    personality: '有个性',
    character_book: {
      extensions: {},
      entries: [
        {
          keys: ['补充'],
          content: '补充设定。',
          enabled: true,
          insertion_order: 1,
          extensions: {},
        },
      ],
    },
  });

  const result = transformCharcard(card, []);
  assert.ok(!result.warnings.some((w) => w.message.includes('LORE_BIAS')));
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
  assert.ok(sanitizeFilename('').startsWith('unknown-'));
  assert.equal(sanitizeFilename('  秦  雪  '), '秦-雪');
});
