import {
  fieldValue,
  parseInteger,
  parseLabeledList,
  parseRange,
  type ParsedFields,
  type ParsedRange,
} from './common.mts';

export interface SuccessCriteria {
  targetAudience: string;
  lengthTier: string;
  plannedChapters: number | null;
  targetTotalWords: ParsedRange;
  perChapterWordRange: ParsedRange;
  completionRule: string;
  reviewPassRule: string;
  fields: ParsedFields;
}

export function parseSuccessCriteria(markdown: string): SuccessCriteria {
  const fields = parseLabeledList(markdown);

  return {
    targetAudience: fieldValue(fields, 'Target Audience'),
    lengthTier: fieldValue(fields, 'Length Tier'),
    plannedChapters: parseInteger(fieldValue(fields, 'Planned Chapters')),
    targetTotalWords: parseRange(fieldValue(fields, 'Target Total Words')),
    perChapterWordRange: parseRange(fieldValue(fields, 'Per-Chapter Word Range')),
    completionRule: fieldValue(fields, 'Completion Rule'),
    reviewPassRule: fieldValue(fields, 'Review Pass Rule'),
    fields,
  };
}
