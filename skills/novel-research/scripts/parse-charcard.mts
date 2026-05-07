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
