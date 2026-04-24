import { formatFailure } from '../lib/validator-utils.mts';
import type { LoadedDraftingProject } from '../lib/load-drafting-project.mts';

export type DraftingValidationMode = 'Entry' | 'Progress' | 'Completion';

function getApprovedNumbers(project: LoadedDraftingProject): number[] {
  return project.plannedChapters
    .filter((chapter) => chapter.reviewFile && chapter.reviewFile.decision === '通过')
    .map((chapter) => chapter.number);
}

function getConsecutiveApprovedCount(project: LoadedDraftingProject): number {
  let count = 0;
  for (const number of project.chapterPlan?.chapterNumbers ?? []) {
    const plannedChapter = project.plannedChapters.find((chapter) => chapter.number === number);
    if (!plannedChapter?.reviewFile || plannedChapter.reviewFile.decision !== '通过') {
      break;
    }
    count += 1;
  }
  return count;
}

export function checkWorkflowState(
  { project, mode }: { project: LoadedDraftingProject; mode: DraftingValidationMode },
): string[] {
  const failures: string[] = [];
  const workflow = project.workflowStatus;

  if (!workflow || mode === 'Entry') {
    return failures;
  }

  const consecutiveApprovedCount = getConsecutiveApprovedCount(project);
  const approvedNumbers = getApprovedNumbers(project);
  const expectedLastCompleted = consecutiveApprovedCount === 0 ? 0 : approvedNumbers[consecutiveApprovedCount - 1];
  const actualLastCompleted = workflow.lastCompletedChapter ?? 0;

  if ((workflow.completedChapters ?? 0) !== consecutiveApprovedCount) {
    failures.push(formatFailure([
      `Error: Completed Chapters is ${workflow.completedChapters ?? '(missing)'} but ${consecutiveApprovedCount} chapters are actually approved.`,
      '',
      'Why it blocks:',
      'Workflow status must match the real set of consecutively approved chapters.',
      '',
      'How to fix:',
      'Update Completed Chapters to match the number of planned chapters with passing reviews from the start of the book.',
      '',
      'See:',
      '- 00-project/workflow-status.md',
      '- 40-review/chapter-reviews/',
    ]));
  }

  if (actualLastCompleted !== expectedLastCompleted) {
    failures.push(formatFailure([
      `Error: Last Completed Chapter is ${actualLastCompleted} but should be ${expectedLastCompleted}.`,
      '',
      'Why it blocks:',
      'The workflow ledger must point at the highest consecutively approved chapter.',
      '',
      'How to fix:',
      'Set Last Completed Chapter to the highest planned chapter whose review is 通过 with no earlier gaps.',
      '',
      'See:',
      '- 00-project/workflow-status.md',
      '- 40-review/chapter-reviews/',
    ]));
  }

  const allApproved = (project.chapterPlan?.chapterNumbers?.length ?? 0) > 0
    && approvedNumbers.length === project.chapterPlan!.chapterNumbers.length;

  if (workflow.status === 'draft_complete' && !allApproved) {
    failures.push(formatFailure([
      'Error: Workflow status claims draft_complete before all planned chapters are approved.',
      '',
      'Why it blocks:',
      'draft_complete is only valid after every planned chapter has a passing review.',
      '',
      'How to fix:',
      'Keep workflow status at draft_in_progress or draft_blocked until all planned chapters pass review.',
      '',
      'See:',
      '- 00-project/workflow-status.md',
      '- 40-review/chapter-reviews/',
    ]));
  }

  if (workflow.nextAllowedSkill === 'novel-delivery' && !allApproved) {
    failures.push(formatFailure([
      'Error: Next Allowed Skill is novel-delivery before drafting completion gate passes.',
      '',
      'Why it blocks:',
      'Delivery may begin only after the full drafting completion gate succeeds.',
      '',
      'How to fix:',
      'Keep Next Allowed Skill as novel-drafting until every planned chapter is approved and drafting is complete.',
      '',
      'See:',
      '- 00-project/workflow-status.md',
      '- chapter-loop.md',
    ]));
  }

  return failures;
}
