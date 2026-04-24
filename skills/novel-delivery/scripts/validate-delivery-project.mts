#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

import {
  getCurrentPlatform,
  getExportTargets,
  getResolvedFonts,
  resolvePdfBrowserPath,
} from './export-book.mts';

import {
  addError,
  createValidator,
  finish,
  getMetadataFlag,
  hasCommand,
  parseArgs,
  readFile,
  requireFile,
  requireHeadings,
} from './lib/validator-utils.mts';

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const skillRoot = path.resolve(__dirname, '..');

function requireNonEmptyFile(
  state: ReturnType<typeof createValidator>,
  relativePath: string,
): void {
  const content = readFile(state, relativePath);
  if (content === null) {
    addError(state, `Missing required artifact: ${relativePath}`);
    return;
  }

  const fullPath = path.join(state.projectRoot, relativePath);
  if (fs.statSync(fullPath).size <= 0) {
    addError(state, `Artifact is empty: ${relativePath}`);
  }
}

function parseInstalledFontsArg(value?: string): string[] | undefined {
  if (!value) {
    return undefined;
  }

  if (value === 'none') {
    return [];
  }

  return value
    .split(',')
    .map((font) => font.trim())
    .filter(Boolean);
}

function validatePreflight(
  state: ReturnType<typeof createValidator>,
  options: { pdfBrowserPath?: string | null; installedFonts?: string } = {},
): void {
  for (const relativePath of [
    '00-project/workflow-status.md',
    '30-draft/chapter-plan.md',
    '50-delivery/metadata.md',
    '50-delivery/frontmatter.md',
  ]) {
    requireFile(state, relativePath);
  }

  requireHeadings(state, '50-delivery/metadata.md', [
    '# Metadata',
    '## Bibliographic Data',
    '## Output Targets',
  ]);

  requireHeadings(state, '50-delivery/frontmatter.md', [
    '# Title Page',
    '## Book Title',
    '## Author',
    '## Rights',
    '## Summary',
  ]);

  const workflowContent = readFile(state, '00-project/workflow-status.md') ?? '';
  if (!/\b(draft_complete|delivery_blocked)\b/.test(workflowContent)) {
    addError(
      state,
      'Delivery preflight requires workflow status draft_complete or delivery_blocked in 00-project/workflow-status.md.',
    );
  }

  if (!hasCommand('pandoc')) {
    addError(state, 'Pandoc is not available on PATH.');
  }

  try {
    require.resolve('playwright-core/package.json', { paths: [skillRoot] });
  } catch {
    addError(
      state,
      'Playwright dependency is missing for this skill. Run npm install from the skill directory that contains this validator.',
    );
  }

  try {
    resolvePdfBrowserPath(options.pdfBrowserPath ?? null);
  } catch (error) {
    addError(state, error instanceof Error ? error.message : String(error));
  }

  try {
    getResolvedFonts(parseInstalledFontsArg(options.installedFonts));
  } catch (error) {
    const platform = getCurrentPlatform();
    const message = error instanceof Error ? error.message : String(error);
    addError(
      state,
      `Chinese font availability check failed on ${platform}: ${message}`,
    );
  }
}

function validateOutput(state: ReturnType<typeof createValidator>): void {
  const metadataContent = readFile(state, '50-delivery/metadata.md') ?? '';
  let needsPdf = /^(yes|true|1|y)$/i.test(getMetadataFlag(metadataContent, 'Produce PDF:') ?? '');
  let needsEpub = /^(yes|true|1|y)$/i.test(getMetadataFlag(metadataContent, 'Produce EPUB:') ?? '');
  if (!needsPdf && !needsEpub) {
    needsPdf = true;
    needsEpub = true;
  }

  const bookContent = readFile(state, '50-delivery/book.md');
  if (bookContent !== null) {
    if (!bookContent.includes('# Title Page')) {
      addError(state, 'book.md is missing frontmatter content.');
    }
    if (!/^#\s+Chapter/m.test(bookContent) && !/^##\s+Chapter/m.test(bookContent)) {
      addError(state, 'book.md does not appear to include chapter headings.');
    }
  } else {
    addError(state, 'Missing generated manuscript: 50-delivery/book.md');
  }

  const targets = getExportTargets(state.projectRoot);
  if (needsPdf) {
    requireNonEmptyFile(state, path.relative(state.projectRoot, targets.latteHtml));
    requireNonEmptyFile(state, path.relative(state.projectRoot, targets.mochaHtml));
    requireNonEmptyFile(state, path.relative(state.projectRoot, targets.lattePdf));
    requireNonEmptyFile(state, path.relative(state.projectRoot, targets.mochaPdf));
  }

  if (needsEpub) {
    requireNonEmptyFile(state, path.relative(state.projectRoot, targets.epub));
  }
}

function main(): void {
  let args;
  try {
    args = parseArgs(process.argv.slice(2), { required: ['project-root'] });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.log(`Delivery validation failed for mode Preflight:\n- ${message}`);
    process.exit(1);
  }

  const mode = args.mode ?? 'Preflight';
  if (!['Preflight', 'Output'].includes(mode)) {
    console.log(`Delivery validation failed for mode ${mode}:\n- Invalid mode: ${mode}`);
    process.exit(1);
  }

  const state = createValidator(args['project-root']);

  if (mode === 'Preflight') {
    validatePreflight(state, {
      pdfBrowserPath: args['pdf-browser-path'],
      installedFonts: args['installed-fonts'],
    });
  }

  if (mode === 'Output') {
    validateOutput(state);
  }

  finish(
    state,
    `Delivery validation passed for mode ${mode}.`,
    `Delivery validation failed for mode ${mode}:`,
  );
}

main();
