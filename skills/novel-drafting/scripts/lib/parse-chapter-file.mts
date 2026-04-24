import { countChineseWords } from './count-chinese-words.mts';
import {
  fieldValue,
  getHeadingContent,
  getTitle,
  inferNumberFromPath,
  parseInteger,
  parseLabeledList,
  parseRange,
  trimSectionContent,
  type ParsedFields,
  type ParsedRange,
} from './common.mts';

export interface ChapterMetadata {
  chapterNumber: number | null;
  chapterGoal: string;
  targetWordRange: ParsedRange;
  draftStatus: string;
  fields: ParsedFields;
}

export interface ChapterFile {
  title: string;
  metadata: ChapterMetadata;
  summary: string;
  content: string;
  contentWordCount: number;
  fileNumber: number | null;
  metadataNumber: number | null;
}

export function parseChapterFile(markdown: string, filePath = ''): ChapterFile {
  const metadataFields = parseLabeledList(getHeadingContent(markdown, '## Metadata'));
  const title = getTitle(markdown);
  const summary = trimSectionContent(getHeadingContent(markdown, '## Summary'));
  const content = trimSectionContent(getHeadingContent(markdown, '## Content'));
  const metadataNumber = parseInteger(fieldValue(metadataFields, 'Chapter Number'));

  return {
    title,
    metadata: {
      chapterNumber: metadataNumber,
      chapterGoal: fieldValue(metadataFields, 'Chapter Goal'),
      targetWordRange: parseRange(fieldValue(metadataFields, 'Target Word Range')),
      draftStatus: fieldValue(metadataFields, 'Draft Status'),
      fields: metadataFields,
    },
    summary,
    content,
    contentWordCount: countChineseWords(content),
    fileNumber: inferNumberFromPath(filePath) ?? parseInteger(title),
    metadataNumber,
  };
}
