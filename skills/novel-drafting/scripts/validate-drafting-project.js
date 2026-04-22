#!/usr/bin/env node

const {
  createValidator,
  finish,
  parseArgs,
  requireFile,
} = require('../../../scripts/lib/validator-utils');
const { loadDraftingProject } = require('./lib/load-drafting-project');
const { checkEntryGate } = require('./checks/check-entry-gate');
const { checkWorkflowState } = require('./checks/check-workflow-state');
const { checkChapterFiles } = require('./checks/check-chapter-files');
const { checkReviewFiles } = require('./checks/check-review-files');
const { checkWordCount } = require('./checks/check-word-count');
const { checkCompletionGate } = require('./checks/check-completion-gate');

const requiredFiles = [
  '00-project/project-brief.md',
  '00-project/success-criteria.md',
  '00-project/workflow-status.md',
  '20-story/characters.md',
  '20-story/plot-outline.md',
  '20-story/foreshadowing.md',
  '30-draft/chapter-plan.md',
];

const validModes = new Set(['Entry', 'Progress', 'Completion']);

function runChecks(state, project, mode, checks) {
  for (const check of checks) {
    for (const error of check({ project, mode })) {
      state.errors.push(error);
    }
  }
}

function main() {
  let args;
  try {
    args = parseArgs(process.argv.slice(2), { required: ['project-root'] });
  } catch (error) {
    console.log(`Drafting validation failed:\n- ${error.message}`);
    process.exit(1);
  }

  const mode = args.mode ?? 'Completion';
  if (!validModes.has(mode)) {
    console.log(`Drafting validation failed for mode ${mode}:\n- Invalid mode: ${mode}`);
    process.exit(1);
  }

  const state = createValidator(args['project-root']);

  for (const relativePath of requiredFiles) {
    requireFile(state, relativePath);
  }

  const project = loadDraftingProject(args['project-root']);
  const checksByMode = {
    Entry: [
      checkEntryGate,
      checkWorkflowState,
    ],
    Progress: [
      checkWorkflowState,
      checkChapterFiles,
      checkReviewFiles,
      checkWordCount,
    ],
    Completion: [
      checkWorkflowState,
      checkChapterFiles,
      checkReviewFiles,
      checkWordCount,
      checkCompletionGate,
    ],
  };

  runChecks(state, project, mode, checksByMode[mode]);

  finish(
    state,
    `Drafting validation passed for mode ${mode}.`,
    `Drafting validation failed for mode ${mode}:`,
  );
}

main();
