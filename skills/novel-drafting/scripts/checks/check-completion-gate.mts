import { formatFailure } from '../lib/validator-utils.mts';
import type { LoadedDraftingProject } from '../lib/load-drafting-project.mts';
import type { DraftingValidationMode } from './check-workflow-state.mts';

export function checkCompletionGate(
  { project, mode }: { project: LoadedDraftingProject; mode: DraftingValidationMode },
): string[] {
  if (mode !== 'Completion') {
    return [];
  }

  const failures: string[] = [];
  const allApproved = (project.plannedChapters ?? []).every((plannedChapter) => (
    plannedChapter.chapterFile
    && plannedChapter.reviewFile
    && plannedChapter.reviewFile.decision === '通过'
  ));

  if (project.workflowStatus?.status === 'draft_complete' && !allApproved) {
    failures.push(formatFailure([
      'Error: Workflow status claims draft_complete before all planned chapters pass.',
      '',
      'Why it blocks:',
      'Completion gate requires every planned chapter to have a passing review.',
      '',
      'How to fix:',
      'Keep workflow status at draft_in_progress or draft_blocked until all planned chapters are approved.',
      '',
      'See:',
      '- 00-project/workflow-status.md',
      '- 40-review/chapter-reviews/',
    ]));
  }

  if (project.workflowStatus?.nextAllowedSkill === 'novel-delivery' && !allApproved) {
    failures.push(formatFailure([
      'Error: Next Allowed Skill is novel-delivery before all planned chapters pass.',
      '',
      'Why it blocks:',
      'Delivery is only allowed after the drafting completion gate succeeds.',
      '',
      'How to fix:',
      'Leave Next Allowed Skill as novel-drafting until the manuscript is fully approved.',
      '',
      'See:',
      '- 00-project/workflow-status.md',
      '- chapter-loop.md',
    ]));
  }

  return failures;
}
