import { formatFailure } from '../lib/validator-utils.mts';
import type { LoadedDraftingProject, PlannedChapterRecord } from '../lib/load-drafting-project.mts';
import type { DraftingValidationMode } from './check-workflow-state.mts';

type KnowledgeState = 'unknown' | 'suspected' | 'confirmed';

interface KnowledgeEntry {
  character: string;
  fact: string;
  state: KnowledgeState;
  source: string;
}

const COGNITION_PATTERN = /(忽然意识到|意识到|明白了|原来|果然)/;

function chapterLabel(number: number): string {
  return `chapter-${String(number).padStart(2, '0')}`;
}

function parseKnowledgeEntry(entry: string): KnowledgeEntry | null {
  const match = entry.trim().match(/^(.+?)\s*\|\s*(.+?)\s*\|\s*(unknown|suspected|confirmed)\s*\|\s*source=(chapter-\d{2}|baseline)$/i);
  if (!match) {
    return null;
  }

  return {
    character: match[1].trim(),
    fact: match[2].trim(),
    state: match[3].toLowerCase() as KnowledgeState,
    source: match[4].trim().toLowerCase(),
  };
}

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

function normalizeComparableText(value: string): string {
  return normalize(value).replace(/[.,!?;:，。！？；：、“”"'‘’\s]/g, '');
}

function findLatestKnowledgeState(entries: KnowledgeEntry[], character: string, fact: string): KnowledgeEntry | null {
  const targetCharacter = normalize(character);
  const targetFact = normalize(fact);
  for (let index = entries.length - 1; index >= 0; index -= 1) {
    const entry = entries[index];
    if (normalize(entry.character) === targetCharacter && normalize(entry.fact) === targetFact) {
      return entry;
    }
  }
  return null;
}

function currentChapter(project: LoadedDraftingProject): PlannedChapterRecord | null {
  const drafted = [...(project.plannedChapters ?? [])].filter((chapter) => chapter.chapterFile);
  return drafted.length > 0 ? drafted[drafted.length - 1] : null;
}

export function checkKnowledgeBoundaryWarning(
  { project, mode }: { project: LoadedDraftingProject; mode: DraftingValidationMode },
): { warnings: string[] } {
  if (!['Progress', 'Completion'].includes(mode) || !project.storyState) {
    return { warnings: [] };
  }

  const chapter = currentChapter(project);
  if (!chapter?.chapterFile || !chapter.pov) {
    return { warnings: [] };
  }

  const content = chapter.chapterFile.content;
  if (!COGNITION_PATTERN.test(content)) {
    return { warnings: [] };
  }
  const comparableContent = normalizeComparableText(content);

  const ledger = project.storyState.characterKnowledge
    .map(parseKnowledgeEntry)
    .filter((entry): entry is KnowledgeEntry => Boolean(entry));

  const warnings: string[] = [];

  for (const otherEntry of ledger) {
    if (normalize(otherEntry.character) === normalize(chapter.pov) || otherEntry.state !== 'confirmed') {
      continue;
    }

    if (!comparableContent.includes(normalizeComparableText(otherEntry.fact))) {
      continue;
    }

    const povState = findLatestKnowledgeState(ledger, chapter.pov, otherEntry.fact);
    if (povState?.state === 'confirmed') {
      continue;
    }

    warnings.push(formatFailure([
      `Warning: Knowledge Boundary in ${chapterLabel(chapter.number)} suggests POV leakage for ${chapter.pov}.`,
      '',
      'Why it matters:',
      'When the current POV reasons from another character\'s confirmed fact, long-form drafting can silently collapse information boundaries.',
      '',
      'Reviewer focus:',
      `Check whether ${chapter.pov} truly earned this conclusion on-page, or whether the chapter is borrowing another character's confirmed knowledge.`,
      '',
      'Observed:',
      `${chapter.pov} uses "${otherEntry.fact}" while ledger state is expected=${povState?.state ?? 'unknown'} and another character holds used_as=confirmed (${otherEntry.character}).`,
      '',
      'See:',
      `- 30-draft/chapters/${chapterLabel(chapter.number)}.md`,
      '- 30-draft/continuity/story-state.md',
      '- reviewer-subagent.md',
    ]));
    break;
  }

  return { warnings };
}
