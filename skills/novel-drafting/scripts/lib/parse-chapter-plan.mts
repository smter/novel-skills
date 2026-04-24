import {
  fieldValue,
  getHeadingContent,
  parseChapterSections,
  parseInteger,
  parseLabeledList,
  parseRange,
  splitCommaList,
  type ParsedFields,
  type ParsedRange,
} from './common.mts';

export interface PlannedChapter {
  number: number;
  title: string;
  pov: string;
  wordTarget: ParsedRange;
  goal: string;
  keyEvents: string[];
  characters: string[];
  fields: ParsedFields;
}

export interface ChapterPlan {
  totalChapters: number | null;
  targetPerChapter: ParsedRange;
  chapterNumbers: number[];
  chapters: PlannedChapter[];
  fields: ParsedFields;
}

export function parseChapterPlan(markdown: string): ChapterPlan {
  const overviewFields = parseLabeledList(getHeadingContent(markdown, '## Overview'));
  const chapterSections = parseChapterSections(markdown);
  const chapters = chapterSections.map((section) => {
    const fields = parseLabeledList(section.body);
    return {
      number: section.number,
      title: fieldValue(fields, 'Title'),
      pov: fieldValue(fields, 'POV'),
      wordTarget: parseRange(fieldValue(fields, 'Word Target')),
      goal: fieldValue(fields, 'Goal'),
      keyEvents: splitCommaList(fieldValue(fields, 'Key Events')),
      characters: splitCommaList(fieldValue(fields, 'Characters')),
      fields,
    };
  });

  return {
    totalChapters: parseInteger(fieldValue(overviewFields, 'Total Chapters')),
    targetPerChapter: parseRange(fieldValue(overviewFields, 'Target Per Chapter')),
    chapterNumbers: chapters.map((chapter) => chapter.number),
    chapters,
    fields: overviewFields,
  };
}
