#!/usr/bin/env node

const {
  addError,
  createValidator,
  finish,
  parseArgs,
  readFile,
  requireFile,
  requireWorkflowFields,
  resolveProjectPath,
} = require('../../../scripts/lib/validator-utils');
const fs = require('node:fs');

const requiredFiles = [
  '00-project/project-brief.md',
  '00-project/success-criteria.md',
  '00-project/workflow-status.md',
  '20-story/characters.md',
  '20-story/plot-outline.md',
  '20-story/foreshadowing.md',
  '30-draft/chapter-plan.md',
];

function main() {
  let args;
  try {
    args = parseArgs(process.argv.slice(2), { required: ['project-root'] });
  } catch (error) {
    console.log(`Drafting validation failed:\n- ${error.message}`);
    process.exit(1);
  }

  const state = createValidator(args['project-root']);

  for (const relativePath of requiredFiles) {
    requireFile(state, relativePath);
  }

  const chapterDir = resolveProjectPath(state, '30-draft/chapters');
  const reviewDir = resolveProjectPath(state, '40-review/chapter-reviews');

  if (!fs.existsSync(chapterDir)) {
    addError(state, 'Missing chapter directory: 30-draft/chapters');
  }

  if (!fs.existsSync(reviewDir)) {
    addError(state, 'Missing review directory: 40-review/chapter-reviews');
  }

  const chapterPlan = requireFile(state, '30-draft/chapter-plan.md');
  const plannedChapterNumbers = [];
  if (chapterPlan !== null) {
    for (const match of chapterPlan.matchAll(/^###\s+Chapter\s+(\d+)/gm)) {
      plannedChapterNumbers.push(Number(match[1]));
    }

    if (plannedChapterNumbers.length === 0) {
      addError(state, 'No planned chapters were found in 30-draft/chapter-plan.md');
    }
  }

  for (const number of plannedChapterNumbers) {
    const formattedNumber = String(number).padStart(2, '0');
    const chapterPath = `30-draft/chapters/chapter-${formattedNumber}.md`;
    const reviewPath = `40-review/chapter-reviews/chapter-${formattedNumber}-review.md`;

    const chapterContent = readFile(state, chapterPath);
    if (chapterContent !== null) {
      for (const heading of ['## Metadata', '## Summary', '## Content', 'Draft Status']) {
        if (!chapterContent.includes(heading)) {
          addError(state, `Chapter ${number} is missing section '${heading}'.`);
        }
      }
    } else {
      addError(state, `Missing chapter file for planned chapter ${number}: ${chapterPath}`);
    }

    const reviewContent = readFile(state, reviewPath);
    if (reviewContent !== null) {
      for (const heading of ['## Metadata', '## Checks', '## Findings', '## Required Revisions']) {
        if (!reviewContent.includes(heading)) {
          addError(state, `Review ${number} is missing section '${heading}'.`);
        }
      }
      if (!/Decision:\s*通过/.test(reviewContent)) {
        addError(state, `Review ${number} does not contain a passing decision.`);
      }
    } else {
      addError(state, `Missing review file for planned chapter ${number}: ${reviewPath}`);
    }
  }

  requireWorkflowFields(state, '00-project/workflow-status.md', [
    'Status:',
    'Current Stage:',
    'Completed Chapters:',
    'Last Completed Chapter:',
    'Blocking Issues:',
    'Next Allowed Skill:',
  ]);

  finish(state, 'Drafting validation passed.', 'Drafting validation failed:');
}

main();
