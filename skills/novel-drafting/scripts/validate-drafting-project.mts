#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

import {
  createValidator,
  finish,
  parseArgs,
  requireFile,
} from './lib/validator-utils.mts';
import { loadDraftingProject } from './lib/load-drafting-project.mts';
import { checkEntryGate } from './checks/check-entry-gate.mts';
import { checkWorkflowState, type DraftingValidationMode } from './checks/check-workflow-state.mts';
import { checkChapterFiles } from './checks/check-chapter-files.mts';
import { checkReviewFiles } from './checks/check-review-files.mts';
import { checkWordCount } from './checks/check-word-count.mts';
import { checkCompletionGate } from './checks/check-completion-gate.mts';
import { checkContinuityState } from './checks/check-continuity-state.mts';
import { checkKnowledgeBoundaryWarning } from './checks/check-knowledge-boundary-warning.mts';
import { checkStyleDrift } from './checks/check-style-drift.mts';

const requiredFiles = [
  '00-project/project-brief.md',
  '00-project/success-criteria.md',
  '00-project/workflow-status.md',
  '20-story/plot-outline.md',
  '20-story/foreshadowing.md',
  '30-draft/chapter-plan.md',
];

const validModes = new Set<DraftingValidationMode>(['Entry', 'Progress', 'Completion', 'WordCount']);

type DraftingCheck = (args: {
  project: ReturnType<typeof loadDraftingProject>;
  mode: DraftingValidationMode;
  chapterNumber?: number | null;
}) => string[] | { errors?: string[]; warnings?: string[] };

function runChecks(
  state: ReturnType<typeof createValidator>,
  project: ReturnType<typeof loadDraftingProject>,
  mode: DraftingValidationMode,
  chapterNumber: number | null,
  checks: DraftingCheck[],
): void {
  for (const check of checks) {
    const result = check({ project, mode, chapterNumber });
    if (Array.isArray(result)) {
      for (const error of result) {
        state.errors.push(error);
      }
      continue;
    }

    for (const error of result.errors ?? []) {
      state.errors.push(error);
    }
    for (const warning of result.warnings ?? []) {
      state.warnings.push(warning);
    }
  }
}

function parseChapterSelector(rawValue: string | undefined): number | null {
  if (!rawValue) {
    return null;
  }

  const match = rawValue.match(/^(?:chapter-)?0*([1-9]\d*)$/i);
  if (!match) {
    throw new Error(`Invalid value for --chapter: ${rawValue}`);
  }

  return Number(match[1]);
}

function main(): void {
  let args;
  try {
    args = parseArgs(process.argv.slice(2), { required: ['project-root'] });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.log(`Drafting validation failed:\n- ${message}`);
    process.exit(1);
  }

  const mode = (args.mode ?? 'Completion') as DraftingValidationMode;
  if (!validModes.has(mode)) {
    console.log(`Drafting validation failed for mode ${mode}:\n- Invalid mode: ${mode}`);
    process.exit(1);
  }

  let chapterNumber: number | null = null;
  try {
    chapterNumber = parseChapterSelector(args.chapter);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.log(`Drafting validation failed for mode ${mode}:\n- ${message}`);
    process.exit(1);
  }

  if (mode !== 'WordCount' && chapterNumber !== null) {
    console.log(`Drafting validation failed for mode ${mode}:\n- --chapter is only supported when --mode WordCount.`);
    process.exit(1);
  }

  const state = createValidator(args['project-root']);

  const requiredFilesForMode = mode === 'WordCount'
    ? ['30-draft/chapter-plan.md']
    : requiredFiles;

  for (const relativePath of requiredFilesForMode) {
    requireFile(state, relativePath);
  }

  const charactersDir = path.join(args['project-root'], '20-story', 'characters');
  if (!fs.existsSync(charactersDir) || fs.readdirSync(charactersDir).filter((f: string) => f.endsWith('.md')).length === 0) {
    state.errors.push('[角色数据缺失] 20-story/characters/ 目录不存在或为空（需至少一个角色卡 .md 文件）。\n  请先完成 novel-research 阶段的角色访谈或角色卡导入。');
  }

  const project = loadDraftingProject(args['project-root']);
  const checksByMode: Record<DraftingValidationMode, DraftingCheck[]> = {
    Entry: [
      checkEntryGate,
      checkWorkflowState,
    ],
    Progress: [
      checkWorkflowState,
      checkContinuityState,
      checkChapterFiles,
      checkReviewFiles,
      checkWordCount,
      checkKnowledgeBoundaryWarning,
      checkStyleDrift,
    ],
    Completion: [
      checkWorkflowState,
      checkContinuityState,
      checkChapterFiles,
      checkReviewFiles,
      checkWordCount,
      checkCompletionGate,
      checkKnowledgeBoundaryWarning,
      checkStyleDrift,
    ],
    WordCount: [
      checkWordCount,
    ],
  };

  runChecks(state, project, mode, chapterNumber, checksByMode[mode]);

  finish(
    state,
    `Drafting validation passed for mode ${mode}.`,
    `Drafting validation failed for mode ${mode}:`,
  );
}

main();
