import {
  fieldValue,
  getHeadingContent,
  getTitle,
  inferNumberFromPath,
  parseBulletList,
  parseInteger,
  parseLabeledList,
  trimSectionContent,
} from './common.mts';

export interface ChapterStateFile {
  title: string;
  fileNumber: number | null;
  metadataNumber: number | null;
  stateStatus: string;
  newFactsConfirmed: string[];
  characterKnowledgeChanges: string[];
  knowledgeTransitionNotes: string[];
  oneTimeEventsTriggered: string[];
  continuityNotes: string[];
}

export interface StoryStateFile {
  title: string;
  lastApprovedChapter: number | null;
  confirmedFacts: string[];
  characterKnowledge: string[];
  oneTimeEventsConsumed: string[];
  openSecrets: string[];
  lockedContinuityRules: string[];
}

function parseSectionList(markdown: string, heading: string): string[] {
  const content = getHeadingContent(markdown, heading);
  const items = parseBulletList(content);
  if (items.length > 0) {
    return items;
  }

  const trimmed = trimSectionContent(content);
  return trimmed ? [trimmed] : [];
}

export function parseChapterStateFile(markdown: string, filePath = ''): ChapterStateFile {
  const metadataFields = parseLabeledList(getHeadingContent(markdown, '## Metadata'));

  return {
    title: getTitle(markdown),
    fileNumber: inferNumberFromPath(filePath),
    metadataNumber: parseInteger(fieldValue(metadataFields, 'Chapter Number')),
    stateStatus: fieldValue(metadataFields, 'State Status'),
    newFactsConfirmed: parseSectionList(markdown, '## New Facts Confirmed'),
    characterKnowledgeChanges: parseSectionList(markdown, '## Character Knowledge Changes'),
    knowledgeTransitionNotes: parseSectionList(markdown, '## Knowledge Transition Notes'),
    oneTimeEventsTriggered: parseSectionList(markdown, '## One-Time Events Triggered'),
    continuityNotes: parseSectionList(markdown, '## Continuity Notes For Next Chapter'),
  };
}

export function parseStoryStateFile(markdown: string): StoryStateFile {
  const coveredThroughFields = parseLabeledList(getHeadingContent(markdown, '## Covered Through'));

  return {
    title: getTitle(markdown),
    lastApprovedChapter: parseInteger(fieldValue(coveredThroughFields, 'Last Approved Chapter')),
    confirmedFacts: parseSectionList(markdown, '## Confirmed Facts'),
    characterKnowledge: parseSectionList(markdown, '## Character Knowledge'),
    oneTimeEventsConsumed: parseSectionList(markdown, '## One-Time Events Consumed'),
    openSecrets: parseSectionList(markdown, '## Open Secrets'),
    lockedContinuityRules: parseSectionList(markdown, '## Locked Continuity Rules'),
  };
}
