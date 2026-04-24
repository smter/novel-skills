import { formatFailure } from '../lib/validator-utils.mts';
import type { LoadedDraftingProject } from '../lib/load-drafting-project.mts';
import type { PlannedChapterRecord } from '../lib/load-drafting-project.mts';
import type { ParsedRange } from '../lib/common.mts';
import type { DraftingValidationMode } from './check-workflow-state.mts';

function isRangeUsable(range: ParsedRange | null | undefined): boolean {
  return Boolean(range) && range!.min !== null && range!.max !== null;
}

function getExpectedRange(
  plannedChapter: PlannedChapterRecord,
  project: LoadedDraftingProject,
): ParsedRange | null {
  if (isRangeUsable(plannedChapter.wordTarget)) {
    return plannedChapter.wordTarget;
  }

  if (plannedChapter.chapterFile && isRangeUsable(plannedChapter.chapterFile.metadata.targetWordRange)) {
    return plannedChapter.chapterFile.metadata.targetWordRange;
  }

  if (project.successCriteria && isRangeUsable(project.successCriteria.perChapterWordRange)) {
    return project.successCriteria.perChapterWordRange;
  }

  return null;
}

export function checkWordCount(
  { project, mode }: { project: LoadedDraftingProject; mode: DraftingValidationMode },
): string[] {
  const failures: string[] = [];
  let totalWordCount = 0;

  for (const plannedChapter of project.plannedChapters ?? []) {
    const chapter = plannedChapter.chapterFile;
    if (!chapter) {
      continue;
    }

    totalWordCount += chapter.contentWordCount;
    const expectedRange = getExpectedRange(plannedChapter, project);
    if (!expectedRange) {
      continue;
    }

    const shouldCheckChapter = mode === 'Completion' || (mode === 'Progress' && !plannedChapter.reviewFile);
    if (!shouldCheckChapter) {
      continue;
    }

    if (chapter.contentWordCount < expectedRange.min! || chapter.contentWordCount > expectedRange.max!) {
      failures.push(formatFailure([
        `Error: 30-draft/chapters/chapter-${String(plannedChapter.number).padStart(2, '0')}.md has word count ${chapter.contentWordCount}, outside expected range ${expectedRange.raw}.`,
        '',
        'Why it blocks:',
        'Drafting cannot advance when the current chapter length is outside the planned target.',
        '',
        'How to fix:',
        'Revise the chapter body under ## Content until its actual count falls within the expected range.',
        '',
        'See:',
        `- 30-draft/chapters/chapter-${String(plannedChapter.number).padStart(2, '0')}.md`,
        '- 30-draft/chapter-plan.md',
        '- 00-project/success-criteria.md',
      ]));
    }
  }

  if (mode === 'Completion' && project.successCriteria && isRangeUsable(project.successCriteria.targetTotalWords)) {
    const expectedTotal = project.successCriteria.targetTotalWords;
    if (totalWordCount < expectedTotal.min! || totalWordCount > expectedTotal.max!) {
      failures.push(formatFailure([
        `Error: Manuscript total word count ${totalWordCount} is outside expected range ${expectedTotal.raw}.`,
        '',
        'Why it blocks:',
        'The manuscript cannot be marked draft_complete until the total length matches success criteria.',
        '',
        'How to fix:',
        'Adjust chapter content so the combined manuscript falls within the target total words range.',
        '',
        'See:',
        '- 00-project/success-criteria.md',
        '- 30-draft/chapters/',
      ]));
    }
  }

  return failures;
}
