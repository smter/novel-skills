import {
  fieldItems,
  fieldValue,
  parseInteger,
  parseLabeledList,
  type ParsedFields,
} from './common.mts';

export interface WorkflowStatus {
  project: string;
  status: string;
  currentStage: string;
  plannedChapters: number | null;
  completedChapters: number | null;
  lastCompletedChapter: number | null;
  blockingIssues: string[];
  nextAllowedSkill: string;
  lastUpdated: string;
  fields: ParsedFields;
}

export function parseWorkflowStatus(markdown: string): WorkflowStatus {
  const fields = parseLabeledList(markdown);
  const blockingItems = fieldItems(fields, 'Blocking Issues').filter(Boolean);
  const blockingValue = fieldValue(fields, 'Blocking Issues');
  const blockingIssues = blockingItems.length > 0
    ? blockingItems
    : (blockingValue && blockingValue.toLowerCase() !== 'none' ? [blockingValue] : []);

  return {
    project: fieldValue(fields, 'Project'),
    status: fieldValue(fields, 'Status'),
    currentStage: fieldValue(fields, 'Current Stage'),
    plannedChapters: parseInteger(fieldValue(fields, 'Planned Chapters')),
    completedChapters: parseInteger(fieldValue(fields, 'Completed Chapters')),
    lastCompletedChapter: parseInteger(fieldValue(fields, 'Last Completed Chapter')),
    blockingIssues,
    nextAllowedSkill: fieldValue(fields, 'Next Allowed Skill'),
    lastUpdated: fieldValue(fields, 'Last Updated'),
    fields,
  };
}
