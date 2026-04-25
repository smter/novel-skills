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
  {
    project,
    mode,
    chapterNumber,
  }: {
    project: LoadedDraftingProject;
    mode: DraftingValidationMode;
    chapterNumber?: number | null;
  },
): string[] {
  const failures: string[] = [];
  let totalWordCount = 0;
  const selectedChapter = chapterNumber === null || chapterNumber === undefined
    ? null
    : project.plannedChapters.find((plannedChapter) => plannedChapter.number === chapterNumber) ?? null;

  if (mode === 'WordCount' && chapterNumber !== null && chapterNumber !== undefined && !selectedChapter) {
    return [formatFailure([
      `Error: Chapter ${chapterNumber} is not defined in 30-draft/chapter-plan.md.`,
      '',
      'Why it blocks:',
      'Word-count-only validation can only target chapters that exist in the chapter plan.',
      '',
      'How to fix:',
      'Use a planned chapter number, or update 30-draft/chapter-plan.md before running targeted word-count validation.',
      '',
      'See:',
      '- 30-draft/chapter-plan.md',
    ])];
  }

  for (const plannedChapter of project.plannedChapters ?? []) {
    if (selectedChapter && plannedChapter.number !== selectedChapter.number) {
      continue;
    }

    const chapter = plannedChapter.chapterFile;
    if (!chapter) {
      if (mode === 'WordCount' && selectedChapter) {
        failures.push(formatFailure([
          `Error: 30-draft/chapters/chapter-${String(plannedChapter.number).padStart(2, '0')}.md does not exist.`,
          '',
          'Why it blocks:',
          'Targeted word-count validation needs the chapter file to measure its current content length.',
          '',
          'How to fix:',
          'Create the chapter file first, or run word-count validation against a chapter that already has draft content.',
          '',
          'See:',
          `- 30-draft/chapters/chapter-${String(plannedChapter.number).padStart(2, '0')}.md`,
          '- 30-draft/chapter-plan.md',
        ]));
      }
      continue;
    }

    totalWordCount += chapter.contentWordCount;
    const expectedRange = getExpectedRange(plannedChapter, project);
    if (!expectedRange) {
      continue;
    }

    const shouldCheckChapter =
      mode === 'WordCount'
      || mode === 'Completion'
      || (mode === 'Progress' && !plannedChapter.reviewFile);
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

  if (mode === 'WordCount' && !selectedChapter && totalWordCount === 0) {
    failures.push(formatFailure([
      'Error: No drafted chapter files were found for word-count validation.',
      '',
      'Why it blocks:',
      'Word-count-only validation needs at least one existing chapter file under 30-draft/chapters/.',
      '',
      'How to fix:',
      'Create or save a chapter draft first, or pass --chapter for a specific existing chapter file.',
      '',
      'See:',
      '- 30-draft/chapters/',
      '- 30-draft/chapter-plan.md',
    ]));
  }

  return failures;
}
