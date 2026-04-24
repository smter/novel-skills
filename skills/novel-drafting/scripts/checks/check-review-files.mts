import { formatFailure } from '../lib/validator-utils.mts';
import type { LoadedDraftingProject } from '../lib/load-drafting-project.mts';
import type { DraftingValidationMode } from './check-workflow-state.mts';

export function checkReviewFiles(
  { project, mode }: { project: LoadedDraftingProject; mode: DraftingValidationMode },
): string[] {
  const failures: string[] = [];

  for (const plannedChapter of project.plannedChapters ?? []) {
    const review = plannedChapter.reviewFile;

    if (!review) {
      if (mode === 'Completion' && plannedChapter.chapterFile) {
        failures.push(`Missing review file for planned chapter ${plannedChapter.number}: 40-review/chapter-reviews/chapter-${String(plannedChapter.number).padStart(2, '0')}-review.md`);
      }
      if (mode === 'Progress') {
        break;
      }
      continue;
    }

    if (!['通过', '不通过'].includes(review.decision)) {
      failures.push(`Review ${plannedChapter.number} is missing a valid decision.`);
    }

    if (review.metadataNumber !== null && review.fileNumber !== null && review.metadataNumber !== review.fileNumber) {
      failures.push(formatFailure([
        `Error: 40-review/chapter-reviews/chapter-${String(review.fileNumber).padStart(2, '0')}-review.md declares Chapter Number ${review.metadataNumber}.`,
        '',
        'Why it blocks:',
        'Review identity is ambiguous when metadata and file name disagree.',
        '',
        'How to fix:',
        'Make the review file name and Chapter Number metadata refer to the same chapter.',
        '',
        'See:',
        `- 40-review/chapter-reviews/chapter-${String(review.fileNumber).padStart(2, '0')}-review.md`,
      ]));
    }

    if (review.decision === '不通过' && review.requiredRevisionsIsPlaceholder) {
      failures.push(formatFailure([
        `Error: 40-review/chapter-reviews/chapter-${String(review.fileNumber ?? plannedChapter.number).padStart(2, '0')}-review.md has Decision: 不通过 but no actionable Required Revisions.`,
        '',
        'Why it blocks:',
        'A failed review must tell the writer exactly what to revise.',
        '',
        'How to fix:',
        'Replace placeholder revision text with concrete revision items.',
        '',
        'See:',
        `- 40-review/chapter-reviews/chapter-${String(review.fileNumber ?? plannedChapter.number).padStart(2, '0')}-review.md`,
      ]));
    }

    if (mode === 'Completion' && review.decision !== '通过') {
      failures.push(`Review ${plannedChapter.number} does not contain a passing decision.`);
    }

    if (mode === 'Progress' && review.decision === '不通过') {
      break;
    }
  }

  return failures;
}
