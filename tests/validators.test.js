const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

function makeTempProject() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'novel-skills-'));
}

function writeFile(root, relativePath, content) {
  const fullPath = path.join(root, relativePath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content);
}

function runValidator(scriptPath, args) {
  return spawnSync(process.execPath, [scriptPath, ...args], {
    encoding: 'utf8',
    cwd: path.resolve(__dirname, '..'),
  });
}

function writeDraftingBaseProject(root, overrides = {}) {
  writeFile(root, '00-project/project-brief.md', overrides.projectBrief ?? '# Brief\n');
  writeFile(root, '00-project/success-criteria.md', overrides.successCriteria ?? [
    '# Success Criteria',
    '',
    '- Target Audience: web fiction readers',
    '- Length Tier: novella',
    '- Planned Chapters: 2',
    '- Target Total Words: 2400-3200',
    '- Per-Chapter Word Range: 1200-1600',
    '- Completion Rule: all planned chapters drafted and approved',
    '- Review Pass Rule: every planned chapter review must be 通过',
  ].join('\n'));
  writeFile(root, '00-project/workflow-status.md', overrides.workflowStatus ?? [
    '# Workflow Status',
    '',
    '- Project: test-book',
    '- Status: research_complete',
    '- Current Stage: novel-drafting',
    '- Planned Chapters: 2',
    '- Completed Chapters: 0',
    '- Last Completed Chapter:',
    '- Blocking Issues:',
    '  -',
    '- Next Allowed Skill: novel-drafting',
    '- Last Updated: 2026-04-22',
  ].join('\n'));
  writeFile(root, '20-story/characters.md', overrides.characters ?? '# Characters\n');
  writeFile(root, '20-story/plot-outline.md', overrides.plotOutline ?? '# Plot Outline\n');
  writeFile(root, '20-story/foreshadowing.md', overrides.foreshadowing ?? '# Foreshadowing\n');
  writeFile(root, '30-draft/chapter-plan.md', overrides.chapterPlan ?? [
    '# Chapter Plan',
    '',
    '## Overview',
    '',
    '- Total Chapters: 2',
    '- Target Per Chapter: 1200-1600',
    '',
    '## Chapter List',
    '',
    '### Chapter 1',
    '- Title: First Crossing',
    '- POV: Lin',
    '- Word Target: 1200-1600',
    '- Goal: Get Lin onto the river convoy.',
    '- Key Events: Lin bargains for passage.',
    '- Characters: Lin, Boatmaster Qiu',
    '',
    '### Chapter 2',
    '- Title: Lantern Wake',
    '- POV: Lin',
    '- Word Target: 1200-1600',
    '- Goal: Reveal the sabotage attempt without solving it.',
    '- Key Events: Lin spots the cut mooring line.',
    '- Characters: Lin, Boatmaster Qiu',
  ].join('\n'));

  fs.mkdirSync(path.join(root, '30-draft', 'chapters'), { recursive: true });
  fs.mkdirSync(path.join(root, '40-review', 'chapter-reviews'), { recursive: true });
}

function makeChapterContent(text) {
  return [
    '# Chapter 1',
    '',
    '## Metadata',
    '- Chapter Number: 1',
    '- Chapter Goal: Get Lin onto the river convoy.',
    '- Target Word Range: 1200-1600',
    '- Draft Status: drafted',
    '',
    '## Summary',
    '- Lin secures passage.',
    '',
    '## Content',
    text,
  ].join('\n');
}

test('research validator passes for a complete scaffold', () => {
  const root = makeTempProject();

  writeFile(root, '00-project/project-brief.md', [
    '## Working Title',
    '## Genre/Type',
    '## Target Audience',
    '## Target Length',
    '## Core Premise',
    '## Central Conflict',
    '## Protagonist Goal',
    '## Forbidden Content',
  ].join('\n\n'));
  writeFile(root, '00-project/success-criteria.md', [
    '## Reader Promise',
    '## Length and Scope',
    '## Completion Gates',
    '## Review Expectations',
  ].join('\n\n'));
  writeFile(root, '00-project/workflow-status.md', [
    'Status: research_complete',
    'Current Stage: research',
    'Planned Chapters: 12',
    'Completed Chapters: 0',
    'Blocking Issues: none',
    'Next Allowed Skill: novel-drafting',
  ].join('\n'));
  writeFile(root, '10-research/topic-research.md', 'topic');
  writeFile(root, '10-research/setting-research.md', 'setting');
  writeFile(root, '10-research/style-research.md', 'style');
  writeFile(root, '10-research/references.md', [
    '## Source Entry',
    '## Open Question',
    '## Inference Note',
  ].join('\n\n'));
  writeFile(root, '20-story/characters.md', 'characters');
  writeFile(root, '20-story/plot-outline.md', 'plot');
  writeFile(root, '20-story/foreshadowing.md', 'foreshadowing');
  writeFile(root, '30-draft/chapter-plan.md', [
    '## Overview',
    '## Chapter List',
    '### Chapter 1',
  ].join('\n\n'));

  const result = runValidator(
    path.join('skills', 'novel-research', 'scripts', 'validate-research-project.js'),
    ['--project-root', root],
  );

  assert.equal(result.status, 0);
  assert.match(result.stdout, /Research validation passed\./);
});

test('drafting validator fails when a planned review is not passing', () => {
  const root = makeTempProject();

  writeFile(root, '00-project/project-brief.md', 'brief');
  writeFile(root, '00-project/success-criteria.md', 'criteria');
  writeFile(root, '00-project/workflow-status.md', [
    'Status: draft_in_progress',
    'Current Stage: drafting',
    'Completed Chapters: 0',
    'Last Completed Chapter: 0',
    'Blocking Issues: none',
    'Next Allowed Skill: novel-drafting',
  ].join('\n'));
  writeFile(root, '20-story/characters.md', 'characters');
  writeFile(root, '20-story/plot-outline.md', 'plot');
  writeFile(root, '20-story/foreshadowing.md', 'foreshadowing');
  writeFile(root, '30-draft/chapter-plan.md', [
    '## Overview',
    '## Chapter List',
    '### Chapter 1',
  ].join('\n\n'));
  writeFile(root, '30-draft/chapters/chapter-01.md', [
    '## Metadata',
    '## Summary',
    '## Content',
    'Draft Status',
  ].join('\n\n'));
  writeFile(root, '40-review/chapter-reviews/chapter-01-review.md', [
    '## Metadata',
    '## Checks',
    '## Findings',
    '## Required Revisions',
    'Decision: 不通过',
  ].join('\n\n'));

  fs.mkdirSync(path.join(root, '30-draft', 'chapters'), { recursive: true });
  fs.mkdirSync(path.join(root, '40-review', 'chapter-reviews'), { recursive: true });

  const result = runValidator(
    path.join('skills', 'novel-drafting', 'scripts', 'validate-drafting-project.js'),
    ['--project-root', root],
  );

  assert.equal(result.status, 1);
  assert.match(result.stdout, /Drafting validation failed for mode Completion:/);
  assert.match(result.stdout, /does not contain a passing decision/);
});

test('drafting validator passes in progress mode when the current chapter review is not passing yet', () => {
  const root = makeTempProject();

  writeFile(root, '00-project/project-brief.md', 'brief');
  writeFile(root, '00-project/success-criteria.md', 'criteria');
  writeFile(root, '00-project/workflow-status.md', [
    'Status: draft_in_progress',
    'Current Stage: drafting',
    'Completed Chapters: 0',
    'Last Completed Chapter: 0',
    'Blocking Issues: none',
    'Next Allowed Skill: novel-drafting',
  ].join('\n'));
  writeFile(root, '20-story/characters.md', 'characters');
  writeFile(root, '20-story/plot-outline.md', 'plot');
  writeFile(root, '20-story/foreshadowing.md', 'foreshadowing');
  writeFile(root, '30-draft/chapter-plan.md', [
    '## Overview',
    '## Chapter List',
    '### Chapter 1',
    '### Chapter 2',
  ].join('\n\n'));
  writeFile(root, '30-draft/chapters/chapter-01.md', [
    '# Chapter 1',
    '## Metadata',
    '## Summary',
    '## Content',
    'Draft Status: drafted',
  ].join('\n\n'));
  writeFile(root, '40-review/chapter-reviews/chapter-01-review.md', [
    '# Chapter 1 Review',
    '## Metadata',
    '## Checks',
    '## Findings',
    '## Required Revisions',
    'Decision: 不通过',
  ].join('\n\n'));

  fs.mkdirSync(path.join(root, '30-draft', 'chapters'), { recursive: true });
  fs.mkdirSync(path.join(root, '40-review', 'chapter-reviews'), { recursive: true });

  const result = runValidator(
    path.join('skills', 'novel-drafting', 'scripts', 'validate-drafting-project.js'),
    ['--project-root', root, '--mode', 'Progress'],
  );

  assert.equal(result.status, 0);
  assert.match(result.stdout, /Drafting validation passed for mode Progress\./);
});

test('drafting validator in completion mode fails when later chapters are still missing', () => {
  const root = makeTempProject();

  writeFile(root, '00-project/project-brief.md', 'brief');
  writeFile(root, '00-project/success-criteria.md', 'criteria');
  writeFile(root, '00-project/workflow-status.md', [
    'Status: draft_in_progress',
    'Current Stage: drafting',
    'Completed Chapters: 1',
    'Last Completed Chapter: 1',
    'Blocking Issues: none',
    'Next Allowed Skill: novel-drafting',
  ].join('\n'));
  writeFile(root, '20-story/characters.md', 'characters');
  writeFile(root, '20-story/plot-outline.md', 'plot');
  writeFile(root, '20-story/foreshadowing.md', 'foreshadowing');
  writeFile(root, '30-draft/chapter-plan.md', [
    '## Overview',
    '## Chapter List',
    '### Chapter 1',
    '### Chapter 2',
  ].join('\n\n'));
  writeFile(root, '30-draft/chapters/chapter-01.md', [
    '# Chapter 1',
    '## Metadata',
    '## Summary',
    '## Content',
    'Draft Status: drafted',
  ].join('\n\n'));
  writeFile(root, '40-review/chapter-reviews/chapter-01-review.md', [
    '# Chapter 1 Review',
    '## Metadata',
    '## Checks',
    '## Findings',
    '## Required Revisions',
    'Decision: 通过',
  ].join('\n\n'));

  fs.mkdirSync(path.join(root, '30-draft', 'chapters'), { recursive: true });
  fs.mkdirSync(path.join(root, '40-review', 'chapter-reviews'), { recursive: true });

  const result = runValidator(
    path.join('skills', 'novel-drafting', 'scripts', 'validate-drafting-project.js'),
    ['--project-root', root, '--mode', 'Completion'],
  );

  assert.equal(result.status, 1);
  assert.match(result.stdout, /Missing chapter file for planned chapter 2/);
});

test('drafting validator in entry mode fails when workflow status is not research_complete or draft_blocked', () => {
  const root = makeTempProject();
  writeDraftingBaseProject(root, {
    workflowStatus: [
      '# Workflow Status',
      '',
      '- Project: test-book',
      '- Status: initialized',
      '- Current Stage: novel-research',
      '- Planned Chapters: 2',
      '- Completed Chapters: 0',
      '- Last Completed Chapter:',
      '- Blocking Issues:',
      '  -',
      '- Next Allowed Skill: novel-research',
      '- Last Updated: 2026-04-22',
    ].join('\n'),
  });

  const result = runValidator(
    path.join('skills', 'novel-drafting', 'scripts', 'validate-drafting-project.js'),
    ['--project-root', root, '--mode', 'Entry'],
  );

  assert.equal(result.status, 1);
  assert.match(result.stdout, /workflow status/i);
  assert.match(result.stdout, /research_complete|draft_blocked/i);
});

test('drafting validator in entry mode fails when workflow current stage is still novel-research', () => {
  const root = makeTempProject();
  writeDraftingBaseProject(root, {
    workflowStatus: [
      '# Workflow Status',
      '',
      '- Project: test-book',
      '- Status: research_complete',
      '- Current Stage: novel-research',
      '- Planned Chapters: 2',
      '- Completed Chapters: 0',
      '- Last Completed Chapter:',
      '- Blocking Issues:',
      '  -',
      '- Next Allowed Skill: novel-drafting',
      '- Last Updated: 2026-04-22',
    ].join('\n'),
  });

  const result = runValidator(
    path.join('skills', 'novel-drafting', 'scripts', 'validate-drafting-project.js'),
    ['--project-root', root, '--mode', 'Entry'],
  );

  assert.equal(result.status, 1);
  assert.match(result.stdout, /Current Stage/i);
  assert.match(result.stdout, /novel-research|novel-drafting/i);
});

test('delivery validator passes in output mode when required themed artifacts exist', () => {
  const workspace = makeTempProject();
  const root = path.join(workspace, 'book-slug');
  fs.mkdirSync(root, { recursive: true });

  writeFile(root, '50-delivery/metadata.md', [
    '# Metadata',
    '## Bibliographic Data',
    '## Output Targets',
    '- Produce PDF: yes',
    '- Produce EPUB: yes',
  ].join('\n\n'));
  writeFile(root, '50-delivery/book.md', [
    '# Title Page',
    '# Chapter 1',
  ].join('\n\n'));
  writeFile(root, '50-delivery/output/book-slug-latte.html', 'latte html');
  writeFile(root, '50-delivery/output/book-slug-mocha.html', 'mocha html');
  writeFile(root, '50-delivery/output/book-slug-latte.pdf', 'latte pdf');
  writeFile(root, '50-delivery/output/book-slug-mocha.pdf', 'mocha pdf');
  writeFile(root, '50-delivery/output/book-slug.epub', 'epub');

  const result = runValidator(
    path.join('skills', 'novel-delivery', 'scripts', 'validate-delivery-project.js'),
    ['--project-root', root, '--mode', 'Output'],
  );

  assert.equal(result.status, 0);
  assert.match(result.stdout, /Delivery validation passed for mode Output\./);
});

test('delivery validator in preflight mode fails when workflow, browser, fonts, and playwright dependencies are missing', () => {
  const root = makeTempProject();
  const fakeBin = path.join(root, 'bin');
  const pathSeparator = process.platform === 'win32' ? ';' : ':';
  const originalPath = process.env.PATH ?? '';

  fs.mkdirSync(fakeBin, { recursive: true });
  if (process.platform === 'win32') {
    writeFile(fakeBin, 'pandoc.cmd', '@echo off\r\nexit /b 0\r\n');
  } else {
    writeFile(fakeBin, 'pandoc', '#!/bin/sh\nexit 0\n');
    fs.chmodSync(path.join(fakeBin, 'pandoc'), 0o755);
  }

  writeFile(root, '00-project/workflow-status.md', 'Status: research_complete\n');
  writeFile(root, '30-draft/chapter-plan.md', '## Overview\n\n## Chapter List\n\n### Chapter 1\n');
  writeFile(root, '50-delivery/metadata.md', [
    '# Metadata',
    '## Bibliographic Data',
    '## Output Targets',
    '- Produce PDF: yes',
    '- Produce EPUB: yes',
  ].join('\n\n'));
  writeFile(root, '50-delivery/frontmatter.md', [
    '# Title Page',
    '## Book Title',
    '## Author',
    '## Rights',
    '## Summary',
  ].join('\n\n'));

  process.env.PATH = `${fakeBin}${pathSeparator}${originalPath}`;
  const result = runValidator(
    path.join('skills', 'novel-delivery', 'scripts', 'validate-delivery-project.js'),
    [
      '--project-root', root,
      '--mode', 'Preflight',
      '--pdf-browser-path', path.join(root, 'missing-browser'),
      '--installed-fonts', 'none',
    ],
  );
  process.env.PATH = originalPath;

  assert.equal(result.status, 1);
  assert.match(result.stdout, /workflow status/i);
  assert.match(result.stdout, /Playwright/i);
  assert.match(result.stdout, /Chromium-compatible browser/i);
  assert.match(result.stdout, /Chinese font/i);
});

test('delivery validator in output mode fails when themed artifacts use the wrong names', () => {
  const root = makeTempProject();

  writeFile(root, '50-delivery/metadata.md', [
    '# Metadata',
    '## Bibliographic Data',
    '## Output Targets',
    '- Produce PDF: yes',
    '- Produce EPUB: yes',
  ].join('\n\n'));
  writeFile(root, '50-delivery/book.md', [
    '# Title Page',
    '# Chapter 1',
  ].join('\n\n'));
  writeFile(root, '50-delivery/output/book-slug-latte.html', 'latte html');
  writeFile(root, '50-delivery/output/book-slug-mocha.html', 'mocha html');
  writeFile(root, '50-delivery/output/book-slug-latte.pdf', 'latte pdf');
  writeFile(root, '50-delivery/output/book-slug-mocha.pdf', 'mocha pdf');
  writeFile(root, '50-delivery/output/book-slug.epub', 'epub');
  writeFile(root, '50-delivery/output/book.html', 'html');

  const result = runValidator(
    path.join('skills', 'novel-delivery', 'scripts', 'validate-delivery-project.js'),
    ['--project-root', root, '--mode', 'Output'],
  );

  assert.equal(result.status, 1);
  assert.match(result.stdout, /latte\.html/i);
  assert.match(result.stdout, /mocha\.html/i);
  assert.match(result.stdout, /latte\.pdf/i);
  assert.match(result.stdout, /mocha\.pdf/i);
});
