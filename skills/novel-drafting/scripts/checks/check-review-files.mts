import { formatFailure } from '../lib/validator-utils.mts';
import type { LoadedDraftingProject } from '../lib/load-drafting-project.mts';
import type { DraftingValidationMode } from './check-workflow-state.mts';

function isContinuityFindingWellFormed(entry: string): boolean {
  const trimmed = entry.trim();
  if (/^Clean:\s+.+$/i.test(trimmed)) {
    return true;
  }

  return /^Conflict:\s+.+\|\s*source=(story-state|chapter-state)\s*\|\s*issue=[a-z0-9-]+$/i.test(trimmed);
}

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
      failures.push(formatFailure([
        `Error: 40-review/chapter-reviews/chapter-${String(plannedChapter.number).padStart(2, '0')}-review.md is missing a valid review decision.`,
        '',
        'Why it blocks:',
        'The controller may only advance when the review file uses the structured review format and Decision is exactly 通过 or 不通过.',
        '',
        'How to fix:',
        'Rewrite the review file with a `## Metadata` section that includes the exact field `- Decision: 通过|不通过`, or copy the exact headings from templates/chapter-review.md.',
        '',
        'See:',
        `- 40-review/chapter-reviews/chapter-${String(plannedChapter.number).padStart(2, '0')}-review.md`,
        '- reviewer-subagent.md',
        '- templates/chapter-review.md',
      ]));
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

    if (review.continuityFindingsIsPlaceholder) {
      failures.push(formatFailure([
        `Error: 40-review/chapter-reviews/chapter-${String(review.fileNumber ?? plannedChapter.number).padStart(2, '0')}-review.md is missing actionable Continuity Findings.`,
        '',
        'Why it blocks:',
        'Every review must explicitly record whether continuity is clean or name the conflicting continuity state entries.',
        '',
        'How to fix:',
        'Fill ## Continuity Findings with concrete continuity conclusions such as "No continuity conflicts found." or the exact state entries that conflict.',
        '',
        'See:',
        `- 40-review/chapter-reviews/chapter-${String(review.fileNumber ?? plannedChapter.number).padStart(2, '0')}-review.md`,
        '- reviewer-subagent.md',
      ]));
    }

    const malformedContinuityFindings = review.continuityFindings.filter(
      (entry) => !isContinuityFindingWellFormed(entry),
    );
    if (malformedContinuityFindings.length > 0) {
      failures.push(formatFailure([
        `Error: 40-review/chapter-reviews/chapter-${String(review.fileNumber ?? plannedChapter.number).padStart(2, '0')}-review.md has malformed Continuity Findings entries: ${malformedContinuityFindings.join('; ')}`,
        '',
        'Why it blocks:',
        'Continuity findings must explicitly say whether continuity is clean or identify a concrete conflict with its source and issue type.',
        '',
        'How to fix:',
        'Use `Clean: ...` for no-conflict conclusions, or `Conflict: <Event Name> | source=story-state|chapter-state | issue=<slug>` for continuity problems.',
        '',
        'See:',
        `- 40-review/chapter-reviews/chapter-${String(review.fileNumber ?? plannedChapter.number).padStart(2, '0')}-review.md`,
        '- reviewer-subagent.md',
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
