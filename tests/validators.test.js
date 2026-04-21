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
  assert.match(result.stdout, /Drafting validation failed:/);
  assert.match(result.stdout, /does not contain a passing decision/);
});

test('delivery validator passes in output mode when required artifacts exist', () => {
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
  writeFile(root, '50-delivery/output/book.pdf', 'pdf');
  writeFile(root, '50-delivery/output/book.epub', 'epub');

  const result = runValidator(
    path.join('skills', 'novel-delivery', 'scripts', 'validate-delivery-project.js'),
    ['--project-root', root, '--mode', 'Output'],
  );

  assert.equal(result.status, 0);
  assert.match(result.stdout, /Delivery validation passed for mode Output\./);
});
