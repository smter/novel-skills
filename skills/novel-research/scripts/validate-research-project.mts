#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

import {
  addError,
  createValidator,
  finish,
  parseArgs,
  requireFile,
  requireHeadings,
} from './lib/validator-utils.mts';

const requiredFiles = [
  '00-project/project-brief.md',
  '00-project/success-criteria.md',
  '00-project/workflow-status.md',
  '10-research/topic-research.md',
  '10-research/setting-research.md',
  '10-research/style-research.md',
  '10-research/references.md',
  '20-story/character-relationships.md',
  '20-story/plot-outline.md',
  '20-story/foreshadowing.md',
  '30-draft/chapter-plan.md',
];

const requiredHeadings = new Map<string, string[]>([
  ['00-project/project-brief.md', [
    '## Working Title',
    '## Genre/Type',
    '## Target Audience',
    '## Target Length',
    '## Core Premise',
    '## Central Conflict',
    '## Protagonist Goal',
    '## Content Boundaries',
  ]],
  ['10-research/references.md', [
    '## Source Entry',
    '## Open Question',
    '## Inference Note',
  ]],
  ['30-draft/chapter-plan.md', [
    '## Overview',
    '## Chapter List',
  ]],
]);

const placeholderPattern = /{{.+?}}|待补|待填写|todo|tbd|placeholder/i;

function getHeadingContent(markdown: string, heading: string): string {
  const normalized = String(markdown ?? '').replace(/\r\n?/g, '\n');
  const headingLevel = (heading.match(/^#+/) ?? [''])[0].length;
  const escapedHeading = heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const startPattern = new RegExp(`^${escapedHeading}\\s*$`, 'm');
  const startMatch = startPattern.exec(normalized);
  if (!startMatch) {
    return '';
  }

  const lineEndIndex = normalized.indexOf('\n', startMatch.index);
  const contentStart = lineEndIndex === -1 ? normalized.length : lineEndIndex + 1;
  const remaining = normalized.slice(contentStart);
  const headingPattern = /^#{1,6}\s+.*$/gm;
  let nextMatch: RegExpExecArray | null;

  while ((nextMatch = headingPattern.exec(remaining)) !== null) {
    const nextLevel = (nextMatch[0].match(/^#+/) ?? [''])[0].length;
    if (nextLevel <= headingLevel) {
      return remaining.slice(0, nextMatch.index).trim();
    }
  }

  return remaining.trim();
}

function parseField(markdown: string, label: string): string {
  const escapedLabel = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = String(markdown ?? '').match(new RegExp(`^\\s*[-*]?\\s*${escapedLabel}\\s*(.+)$`, 'im'));
  return match ? match[1].trim() : '';
}

function isMeaningful(value: string, minimumLength = 12): boolean {
  const normalized = String(value ?? '')
    .replace(/[#>*_\-\s:`|.,;!?()[\]{}"'、，。；：！？]/g, '')
    .trim();

  return normalized.length >= minimumLength && !placeholderPattern.test(value);
}

function requireMeaningfulSection(
  state: ReturnType<typeof createValidator>,
  relativePath: string,
  heading: string,
  minimumLength = 12,
): void {
  const content = requireFile(state, relativePath);
  if (content === null) {
    return;
  }

  const sectionContent = getHeadingContent(content, heading);
  if (!isMeaningful(sectionContent, minimumLength)) {
    addError(state, `${relativePath} is too thin under '${heading}'. Replace placeholders with specific drafting constraints.`);
  }
}

function requireMeaningfulField(
  state: ReturnType<typeof createValidator>,
  relativePath: string,
  label: string,
  minimumLength = 6,
): void {
  const content = requireFile(state, relativePath);
  if (content === null) {
    return;
  }

  const value = parseField(content, `${label}:`);
  if (!isMeaningful(value, minimumLength)) {
    addError(state, `${relativePath} is missing a concrete value for '${label}'.`);
  }
}

function validateWorkflowStatus(state: ReturnType<typeof createValidator>): void {
  const content = requireFile(state, '00-project/workflow-status.md');
  if (content === null) {
    return;
  }

  const status = parseField(content, 'Status:');
  const currentStage = parseField(content, 'Current Stage:');
  const plannedChapters = parseField(content, 'Planned Chapters:');
  const nextAllowedSkill = parseField(content, 'Next Allowed Skill:');

  if (!['research_in_progress', 'research_blocked', 'research_complete'].includes(status)) {
    addError(state, '00-project/workflow-status.md has an invalid Status. Use research_in_progress, research_blocked, or research_complete.');
  }

  if (currentStage !== 'novel-research') {
    addError(state, '00-project/workflow-status.md must use Current Stage: novel-research during the research skill.');
  }

  if (!/^\d+$/.test(plannedChapters) || Number(plannedChapters) <= 0) {
    addError(state, '00-project/workflow-status.md must set Planned Chapters to a positive integer.');
  }

  if (status === 'research_complete' && nextAllowedSkill !== 'novel-drafting') {
    addError(state, 'research_complete requires Next Allowed Skill: novel-drafting.');
  }

  if (status !== 'research_complete' && nextAllowedSkill !== 'novel-research') {
    addError(state, 'Incomplete research work must keep Next Allowed Skill: novel-research.');
  }
}

function validateResearchContent(state: ReturnType<typeof createValidator>): void {
  for (const [heading, minimumLength] of [
    ['## Working Title', 2],
    ['## Genre/Type', 2],
    ['## Target Audience', 4],
    ['## Target Length', 2],
    ['## Core Premise', 12],
    ['## Central Conflict', 12],
    ['## Protagonist Goal', 8],
    ['## Content Boundaries', 2],
  ] as const) {
    requireMeaningfulSection(state, '00-project/project-brief.md', heading, minimumLength);
  }

  for (const [label, minimumLength] of [
    ['Target Audience', 4],
    ['Length Tier', 2],
    ['Planned Chapters', 1],
    ['Target Total Words', 3],
    ['Per-Chapter Word Range', 3],
    ['Completion Rule', 8],
    ['Review Pass Rule', 6],
  ] as const) {
    requireMeaningfulField(state, '00-project/success-criteria.md', label, minimumLength);
  }

  for (const relativePath of [
    '10-research/topic-research.md',
    '10-research/setting-research.md',
    '10-research/style-research.md',
    '20-story/foreshadowing.md',
  ]) {
    const content = requireFile(state, relativePath);
    if (content === null) {
      continue;
    }

    if (!isMeaningful(content, 20)) {
      addError(state, `${relativePath} is too thin to guide drafting. Expand it with specific constraints instead of placeholders.`);
    }
  }

  for (const heading of ['## Source Entry', '## Open Question', '## Inference Note']) {
    requireMeaningfulSection(state, '10-research/references.md', heading, 16);
  }

  for (const label of ['Opening', 'Midpoint', 'Resolution']) {
    requireMeaningfulField(state, '20-story/plot-outline.md', label);
  }

  for (const [label, minimumLength] of [
    ['Total Chapters', 1],
    ['Target Per Chapter', 3],
  ] as const) {
    requireMeaningfulField(state, '30-draft/chapter-plan.md', label, minimumLength);
  }

  const chapterPlan = requireFile(state, '30-draft/chapter-plan.md');
  if (chapterPlan !== null) {
    if (!/^\s*###\s+Chapter\s+\d+\s*$/m.test(chapterPlan)) {
      addError(state, '30-draft/chapter-plan.md must include at least one parseable `### Chapter N` entry.');
    }
    if (!/^\s*-\s*Word Target:\s*\S.+$/m.test(chapterPlan)) {
      addError(state, '30-draft/chapter-plan.md must give each planned chapter a concrete Word Target.');
    }
    if (!/^\s*-\s*Goal:\s*\S.+$/m.test(chapterPlan)) {
      addError(state, '30-draft/chapter-plan.md must give each planned chapter a concrete Goal.');
    }
    if (placeholderPattern.test(chapterPlan)) {
      addError(state, '30-draft/chapter-plan.md still contains placeholders. Replace them with concrete chapter targets.');
    }
  }
}

function main(): void {
  let args;
  try {
    args = parseArgs(process.argv.slice(2), { required: ['project-root'] });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.log(`Research validation failed:\n- ${message}`);
    process.exit(1);
  }

  const state = createValidator(args['project-root']);

  for (const relativePath of requiredFiles) {
    const headings = requiredHeadings.get(relativePath);
    if (headings) {
      requireHeadings(state, relativePath, headings);
      continue;
    }

    requireFile(state, relativePath);
  }

  const charactersDir = path.join(state.projectRoot, '20-story', 'characters');
  if (!fs.existsSync(charactersDir) || fs.readdirSync(charactersDir).filter((f: string) => f.endsWith('.md')).length === 0) {
    addError(state, '[文件缺失] 20-story/characters/ 目录不存在或目录下无 .md 文件（需至少一个角色卡）。\n  此目录应包含每个角色的统一角色卡文件。');
  }

  validateWorkflowStatus(state);
  validateResearchContent(state);

  finish(state, 'Research validation passed.', 'Research validation failed:');
}

main();
