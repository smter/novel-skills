import { formatFailure } from '../lib/validator-utils.mts';
import type { LoadedDraftingProject } from '../lib/load-drafting-project.mts';
import type { DraftingValidationMode } from './check-workflow-state.mts';

function countMatches(content: string, pattern: RegExp): number {
  return content.match(pattern)?.length ?? 0;
}

const META_REFERENCE_PATTERNS: Array<{ name: string; pattern: RegExp }> = [
  { name: 'chapter-number', pattern: /第[\d零一二三四五六七八九十百千]+[章节卷]/g },
  { name: 'cross-reference', pattern: /(上文|下文|前文|后文)(所述|提到|交代)/g },
  { name: 'section-index', pattern: /(上|下|本|这|那)(一)?(章|节|卷|回)/g },
];

function checkMetaReferences(content: string): Array<{ pattern: string; match: string }> {
  const hits: Array<{ pattern: string; match: string }> = [];
  for (const { name, pattern } of META_REFERENCE_PATTERNS) {
    const matches = content.match(pattern);
    if (matches) {
      for (const match of matches) {
        hits.push({ pattern: name, match });
      }
    }
  }
  return hits;
}

function perThousand(count: number, words: number): number {
  if (words <= 0) {
    return 0;
  }
  return (count / words) * 1000;
}

function chapterLabel(number: number): string {
  return `chapter-${String(number).padStart(2, '0')}`;
}

function normalizePhrase(value: string): string {
  return value.trim().replace(/\s+/g, '');
}

function countPhraseOccurrences(content: string, phrase: string): number {
  if (!phrase) {
    return 0;
  }
  return content.split(phrase).length - 1;
}

function collectRepeatedClauses(content: string): Array<{ phrase: string; count: number }> {
  const counts = new Map<string, number>();
  const clauses = content
    .split(/[，。！？；\n]/)
    .map((clause) => normalizePhrase(clause))
    .filter((clause) => clause.length >= 5 && clause.length <= 16);

  for (const clause of clauses) {
    counts.set(clause, (counts.get(clause) ?? 0) + 1);
  }

  return Array.from(counts.entries())
    .filter(([, count]) => count >= 4)
    .sort((left, right) => right[1] - left[1])
    .map(([phrase, count]) => ({ phrase, count }));
}

export function checkStyleDrift(
  { project, mode }: { project: LoadedDraftingProject; mode: DraftingValidationMode },
): { warnings: string[] } {
  if (!['Progress', 'Completion'].includes(mode)) {
    return { warnings: [] };
  }

  const existingChapters = [...(project.plannedChapters ?? [])].filter((chapter) => chapter.chapterFile);
  if (existingChapters.length < 2) {
    return { warnings: [] };
  }

  const currentChapter = existingChapters[existingChapters.length - 1];
  const baselineChapters = existingChapters.slice(Math.max(0, existingChapters.length - 4), existingChapters.length - 1);
  if (baselineChapters.length === 0 || !currentChapter.chapterFile) {
    return { warnings: [] };
  }

  const currentContent = currentChapter.chapterFile.content;
  const contentSection = currentContent.split('## Content')[1]?.split(/^#/m)[0] ?? currentContent;
  const currentWords = currentChapter.chapterFile.contentWordCount;
  const currentDashCount = countMatches(currentContent, /——/g);
  const baselineDashRate = baselineChapters.reduce((sum, chapter) =>
    sum + perThousand(countMatches(chapter.chapterFile!.content, /——/g), chapter.chapterFile!.contentWordCount), 0) / baselineChapters.length;
  const currentDashRate = perThousand(currentDashCount, currentWords);

  const currentCognitionCount = countMatches(currentContent, /(忽然意识到|意识到|明白了|原来|果然)/g);
  const baselineCognitionRate = baselineChapters.reduce((sum, chapter) =>
    sum + perThousand(countMatches(chapter.chapterFile!.content, /(忽然意识到|意识到|明白了|原来|果然)/g), chapter.chapterFile!.contentWordCount), 0) / baselineChapters.length;
  const currentCognitionRate = perThousand(currentCognitionCount, currentWords);
  const repeatedClauses = collectRepeatedClauses(currentContent);

  const warnings: string[] = [];

  if (currentDashCount >= 6 && currentDashRate >= baselineDashRate * 3 && currentDashRate - baselineDashRate >= 8) {
    warnings.push(formatFailure([
      `Warning: Style Drift in ${chapterLabel(currentChapter.number)} suggests em-dash overuse.`,
      '',
      'Why it matters:',
      'Punctuation habits that spike sharply across later chapters often signal long-form continuation drift rather than intentional style.',
      '',
      'Reviewer focus:',
      `Compare ${chapterLabel(currentChapter.number)} against the previous ${baselineChapters.length} chapter(s) and confirm whether 破折号 is replacing normal pauses or commas.`,
      '',
      'Observed:',
      `Current em-dash rate is ${currentDashRate.toFixed(1)} per 1000 words versus baseline ${baselineDashRate.toFixed(1)}.`,
      '',
      'See:',
      `- 30-draft/chapters/${chapterLabel(currentChapter.number)}.md`,
      '- templates/chapter-review.md',
    ]));
  }

  if (currentCognitionCount >= 4 && currentCognitionRate >= baselineCognitionRate * 2.5 && currentCognitionRate - baselineCognitionRate >= 5) {
    warnings.push(formatFailure([
      `Warning: Style Drift in ${chapterLabel(currentChapter.number)} shows a spike in cognition-reveal phrasing.`,
      '',
      'Why it matters:',
      'Repeated “意识到 / 原来 / 果然” phrasing can indicate explanation drift or premature certainty rather than scene-based discovery.',
      '',
      'Reviewer focus:',
      `Check whether ${chapterLabel(currentChapter.number)} is over-explaining conclusions or upgrading suspicion into certainty too quickly.`,
      '',
      'Observed:',
      `Current cognition-phrase rate is ${currentCognitionRate.toFixed(1)} per 1000 words versus baseline ${baselineCognitionRate.toFixed(1)}.`,
      '',
      'See:',
      `- 30-draft/chapters/${chapterLabel(currentChapter.number)}.md`,
      '- reviewer-subagent.md',
    ]));
  }

  const topRepeatedClause = repeatedClauses[0];
  if (topRepeatedClause) {
    const baselineRepeats = baselineChapters.reduce((sum, chapter) =>
      sum + countPhraseOccurrences(normalizePhrase(chapter.chapterFile!.content), topRepeatedClause.phrase), 0);
    if (topRepeatedClause.count >= 6 && baselineRepeats <= 1) {
      warnings.push(formatFailure([
        `Warning: Style Drift in ${chapterLabel(currentChapter.number)} shows a repeated phrase echo.`,
        '',
        'Why it matters:',
        'When one clause keeps echoing inside the same chapter, the prose can start sounding like a stuck continuation pattern instead of deliberate rhythm.',
        '',
        'Reviewer focus:',
        `Check whether the repeated phrase is serving a real effect, or whether the chapter is leaning on one fallback beat too many times.`,
        '',
        'Observed:',
        `Phrase "${topRepeatedClause.phrase}" appears ${topRepeatedClause.count} times in the current chapter and ${baselineRepeats} times across the recent baseline chapters.`,
        '',
        'See:',
        `- 30-draft/chapters/${chapterLabel(currentChapter.number)}.md`,
        '- templates/chapter-review.md',
      ]));
    }
  }

  const metaHits = checkMetaReferences(contentSection);
  if (metaHits.length > 0) {
    const uniqueHits = [...new Set(metaHits.map((h) => h.match))];
    warnings.push(formatFailure([
      `Warning: Style Drift in ${chapterLabel(currentChapter.number)} contains meta-referential phrasing (第四面墙 break).`,
      '',
      'Why it matters:',
      'Phrases like "第x章", "上一章", or "前文所述" break four-wall immersion. Characters and narration should reference events through story-internal cues — time, place, event name — never through the book structure.',
      '',
      'Reviewer focus:',
      `Replace every meta-reference with a story-internal reference. Check whether the knowledge ledger source=chapter-XX format is leaking into narrative text.`,
      '',
      'Observed:',
      `Found ${metaHits.length} meta-referential phrase(s): ${uniqueHits.join(', ')}`,
      '',
      'See:',
      `- 30-draft/chapters/${chapterLabel(currentChapter.number)}.md`,
      '- writer-subagent.md (meta-reference rule)',
    ]));
  }

  return { warnings };
}
