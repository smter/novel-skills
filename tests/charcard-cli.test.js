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
  const { buildPNGWithTextChunk } = require('./helpers/png-builder');

  const pngPath = path.join(dir, 'test-card.png');
  fs.writeFileSync(pngPath, buildPNGWithTextChunk('chara', encoded));

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

  const result3 = runCharcardCLI(['--input', pngPath, '--project-root', projectRoot, '--force', 'true']);
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

  const encoded2 = Buffer.from(JSON.stringify(v2JSON)).toString('base64');
  const { buildPNGWithTextChunk: buildPNG2 } = require('./helpers/png-builder');

  const pngPath2 = path.join(dir, 'test-card2.png');
  fs.writeFileSync(pngPath2, buildPNG2('chara', encoded2));

  const result = runCharcardCLI([
    '--input', pngPath2,
    '--project-root', projectRoot,
    '--output-dir', 'my-cards',
  ]);

  assert.equal(result.status, 0);
  const expectedFile = path.join(projectRoot, 'my-cards', '自定义路径角色.md');
  assert.ok(fs.existsSync(expectedFile), `Expected ${expectedFile} to exist`);
});
