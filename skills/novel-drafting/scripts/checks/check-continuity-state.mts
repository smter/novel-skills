import { formatFailure } from '../lib/validator-utils.mts';
import type { LoadedDraftingProject } from '../lib/load-drafting-project.mts';
import type { DraftingValidationMode } from './check-workflow-state.mts';

function hasRequiredChapterStateSections(chapterState: {
  title: string;
  newFactsConfirmed: string[];
  characterKnowledgeChanges: string[];
  oneTimeEventsTriggered: string[];
  continuityNotes: string[];
}): boolean {
  return Boolean(chapterState.title)
    && chapterState.newFactsConfirmed.length > 0
    && chapterState.characterKnowledgeChanges.length > 0
    && chapterState.oneTimeEventsTriggered.length > 0
    && chapterState.continuityNotes.length > 0;
}

function hasRequiredStoryStateSections(storyState: NonNullable<LoadedDraftingProject['storyState']>): boolean {
  return Boolean(storyState.title)
    && storyState.confirmedFacts.length > 0
    && storyState.characterKnowledge.length > 0
    && storyState.oneTimeEventsConsumed.length > 0
    && storyState.openSecrets.length > 0
    && storyState.lockedContinuityRules.length > 0;
}

function isConsumedEventEntryWellFormed(entry: string): boolean {
  return /^.+:\s*chapter-\d{2}$/i.test(entry.trim());
}

function parseConsumedEventName(entry: string): string {
  return entry.replace(/:\s*chapter-\d{2}$/i, '').trim().toLowerCase();
}

function parseTriggeredEventEntry(entry: string): { name: string; consumed: boolean } | null {
  const match = entry.trim().match(/^(.+?)\s*\|\s*consumed=(yes|no)$/i);
  if (!match) {
    return null;
  }

  return {
    name: match[1].trim(),
    consumed: match[2].toLowerCase() === 'yes',
  };
}

function getConsecutiveApprovedCount(project: LoadedDraftingProject): number {
  let count = 0;
  for (const plannedChapter of project.plannedChapters ?? []) {
    if (!plannedChapter.reviewFile || plannedChapter.reviewFile.decision !== '通过') {
      break;
    }
    count += 1;
  }
  return count;
}

export function checkContinuityState(
  { project, mode }: { project: LoadedDraftingProject; mode: DraftingValidationMode },
): string[] {
  if (!['Progress', 'Completion'].includes(mode)) {
    return [];
  }

  const failures: string[] = [];

  for (const plannedChapter of project.plannedChapters ?? []) {
    if (!plannedChapter.chapterFile) {
      if (mode === 'Progress') {
        break;
      }
      continue;
    }

    const chapterLabel = `chapter-${String(plannedChapter.number).padStart(2, '0')}`;
    const statePath = `30-draft/continuity/${chapterLabel}-state.md`;
    const chapterState = plannedChapter.chapterStateFile;

    if (!chapterState) {
      failures.push(formatFailure([
        `Error: Missing continuity state file for ${chapterLabel}.`,
        '',
        'Why it blocks:',
        'Each drafted chapter must record its approved continuity changes so later chapters do not restage one-time events.',
        '',
        'How to fix:',
        `Create ${statePath} with the required continuity sections before advancing drafting.`,
        '',
        'See:',
        `- 30-draft/chapters/${chapterLabel}.md`,
        `- ${statePath}`,
      ]));
      if (mode === 'Progress') {
        return failures;
      }
      continue;
    }

    if (chapterState.metadataNumber !== null && chapterState.fileNumber !== null && chapterState.metadataNumber !== chapterState.fileNumber) {
      failures.push(formatFailure([
        `Error: ${statePath} declares Chapter Number ${chapterState.metadataNumber}.`,
        '',
        'Why it blocks:',
        'Continuity state identity is ambiguous when metadata and file name disagree.',
        '',
        'How to fix:',
        'Make the state file name and Chapter Number metadata refer to the same chapter.',
        '',
        'See:',
        `- ${statePath}`,
      ]));
    }

    if (!hasRequiredChapterStateSections(chapterState)) {
      failures.push(formatFailure([
        `Error: ${statePath} is structurally incomplete.`,
        '',
        'Why it blocks:',
        'A chapter continuity state must capture new facts, knowledge changes, one-time events, and next-chapter continuity constraints.',
        '',
        'How to fix:',
        'Fill in the required continuity sections with concrete, non-placeholder content.',
        '',
        'See:',
        `- ${statePath}`,
      ]));
    }

    const malformedTriggeredEvents = chapterState.oneTimeEventsTriggered
      .map((entry) => ({ entry, parsed: parseTriggeredEventEntry(entry) }))
      .filter((record) => !record.parsed);
    if (malformedTriggeredEvents.length > 0) {
      failures.push(formatFailure([
        `Error: ${statePath} has malformed One-Time Events Triggered entries: ${malformedTriggeredEvents.map((record) => record.entry).join('; ')}`,
        '',
        'Why it blocks:',
        'Each one-time event trigger must say whether it has already been consumed into the cumulative ledger.',
        '',
        'How to fix:',
        'Rewrite each triggered event as `Event Name | consumed=yes` or `Event Name | consumed=no`.',
        '',
        'See:',
        `- ${statePath}`,
      ]));
    }
  }

  if (!project.storyState) {
    failures.push(formatFailure([
      'Error: Missing story state file: 30-draft/continuity/story-state.md.',
      '',
      'Why it blocks:',
      'Drafting needs a cumulative continuity ledger so approved revelations and one-time events persist across chapters.',
      '',
      'How to fix:',
      'Create 30-draft/continuity/story-state.md and update it after each approved chapter.',
      '',
      'See:',
      '- 30-draft/continuity/story-state.md',
    ]));
    return failures;
  }

  if (!hasRequiredStoryStateSections(project.storyState)) {
    failures.push(formatFailure([
      'Error: 30-draft/continuity/story-state.md is structurally incomplete.',
      '',
      'Why it blocks:',
      'The cumulative continuity ledger must track confirmed facts, character knowledge, consumed one-time events, and locked rules.',
      '',
      'How to fix:',
      'Fill in the required story-state sections with concrete content.',
      '',
      'See:',
      '- 30-draft/continuity/story-state.md',
    ]));
  }

  const malformedConsumedEvents = project.storyState.oneTimeEventsConsumed.filter(
    (entry) => !isConsumedEventEntryWellFormed(entry),
  );
  if (malformedConsumedEvents.length > 0) {
    failures.push(formatFailure([
      `Error: story-state.md has malformed One-Time Events Consumed entries: ${malformedConsumedEvents.join('; ')}`,
      '',
      'Why it blocks:',
      'Consumed one-time events must point to the chapter that originally triggered them, or later continuity checks cannot anchor repeats to a stable source.',
      '',
      'How to fix:',
      'Rewrite each consumed event as `Event Name: chapter-XX`.',
      '',
      'See:',
      '- 30-draft/continuity/story-state.md',
    ]));
  }

  const consumedEventNames = new Set(
    project.storyState.oneTimeEventsConsumed.map((entry) => parseConsumedEventName(entry)),
  );
  for (const plannedChapter of project.plannedChapters ?? []) {
    const chapterState = plannedChapter.chapterStateFile;
    if (!chapterState) {
      continue;
    }

    for (const entry of chapterState.oneTimeEventsTriggered) {
      const parsed = parseTriggeredEventEntry(entry);
      if (!parsed || !parsed.consumed) {
        continue;
      }

      if (!consumedEventNames.has(parsed.name.toLowerCase())) {
        failures.push(formatFailure([
          `Error: story-state.md does not archive consumed one-time event "${parsed.name}" from chapter-${String(plannedChapter.number).padStart(2, '0')}.`,
          '',
          'Why it blocks:',
          'If a chapter marks a one-time event as consumed, the cumulative story ledger must record it or later chapters cannot reliably detect repeats.',
          '',
          'How to fix:',
          `Add \`${parsed.name}: chapter-${String(plannedChapter.number).padStart(2, '0')}\` to ## One-Time Events Consumed in story-state.md, or mark the chapter event as consumed=no.`,
          '',
          'See:',
          `- 30-draft/continuity/chapter-${String(plannedChapter.number).padStart(2, '0')}-state.md`,
          '- 30-draft/continuity/story-state.md',
        ]));
      }
    }
  }

  const consecutiveApprovedCount = getConsecutiveApprovedCount(project);
  const actualLastApproved = project.storyState.lastApprovedChapter ?? 0;
  if (actualLastApproved !== consecutiveApprovedCount) {
    failures.push(formatFailure([
      `Error: Story state Last Approved Chapter is ${actualLastApproved} but should be ${consecutiveApprovedCount}.`,
      '',
      'Why it blocks:',
      'The cumulative continuity ledger must stay aligned with the highest consecutively approved chapter.',
      '',
      'How to fix:',
      'Update story-state.md after each passing review so Last Approved Chapter matches the approved continuity baseline.',
      '',
      'See:',
      '- 30-draft/continuity/story-state.md',
      '- 40-review/chapter-reviews/',
    ]));
  }

  return failures;
}
