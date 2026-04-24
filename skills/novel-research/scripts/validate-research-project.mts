#!/usr/bin/env node

import {
  createValidator,
  finish,
  parseArgs,
  requireFile,
  requireHeadings,
  requireWorkflowFields,
} from './lib/validator-utils.mts';

const requiredFiles = [
  '00-project/project-brief.md',
  '00-project/success-criteria.md',
  '00-project/workflow-status.md',
  '10-research/topic-research.md',
  '10-research/setting-research.md',
  '10-research/style-research.md',
  '10-research/references.md',
  '20-story/characters.md',
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
    '## Forbidden Content',
  ]],
  ['00-project/success-criteria.md', [
    '## Reader Promise',
    '## Length and Scope',
    '## Completion Gates',
    '## Review Expectations',
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

  requireWorkflowFields(state, '00-project/workflow-status.md', [
    'Status:',
    'Current Stage:',
    'Planned Chapters:',
    'Completed Chapters:',
    'Blocking Issues:',
    'Next Allowed Skill:',
  ]);

  finish(state, 'Research validation passed.', 'Research validation failed:');
}

main();
