import { formatFailure } from '../lib/validator-utils.mts';
import type { LoadedDraftingProject } from '../lib/load-drafting-project.mts';
import type { DraftingValidationMode } from './check-workflow-state.mts';

function hasRequiredSections(chapter: { title: string; summary: string; content: string }): boolean {
  return Boolean(chapter.title) && chapter.summary !== '' && chapter.content !== '';
}

export function checkChapterFiles(
  { project, mode }: { project: LoadedDraftingProject; mode: DraftingValidationMode },
): string[] {
  const failures: string[] = [];
  const plannedChapters = project.plannedChapters ?? [];

  for (const plannedChapter of plannedChapters) {
    const chapter = plannedChapter.chapterFile;

    if (!chapter) {
      if (mode === 'Completion') {
        failures.push(`Missing chapter file for planned chapter ${plannedChapter.number}: 30-draft/chapters/chapter-${String(plannedChapter.number).padStart(2, '0')}.md`);
      }
      if (mode === 'Progress') {
        break;
      }
      continue;
    }

    if (chapter.metadataNumber !== null && chapter.fileNumber !== null && chapter.metadataNumber !== chapter.fileNumber) {
      failures.push(formatFailure([
        `Error: 30-draft/chapters/chapter-${String(chapter.fileNumber).padStart(2, '0')}.md declares Chapter Number ${chapter.metadataNumber}.`,
        '',
        'Why it blocks:',
        'Chapter file identity is ambiguous when metadata and file name disagree.',
        '',
        'How to fix:',
        'Make the file name and Chapter Number metadata refer to the same planned chapter.',
        '',
        'See:',
        `- 30-draft/chapters/chapter-${String(chapter.fileNumber).padStart(2, '0')}.md`,
      ]));
    }

    if (mode === 'Completion' && !hasRequiredSections(chapter)) {
      failures.push(formatFailure([
        `Error: 30-draft/chapters/chapter-${String(plannedChapter.number).padStart(2, '0')}.md is structurally incomplete.`,
        '',
        'Why it blocks:',
        'Completion requires each chapter to include title, summary, and content sections with actual content.',
        '',
        'How to fix:',
        'Fill in the chapter title, summary, and content before attempting completion.',
        '',
        'See:',
        `- 30-draft/chapters/chapter-${String(plannedChapter.number).padStart(2, '0')}.md`,
      ]));
    }

    if (mode === 'Progress' && !plannedChapter.reviewFile) {
      break;
    }
  }

  return failures;
}
