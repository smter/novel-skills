import {
  fieldValue,
  getHeadingContent,
  getTitle,
  inferNumberFromPath,
  isPlaceholderList,
  parseBulletList,
  parseInteger,
  parseLabeledList,
  trimSectionContent,
  type ParsedFields,
} from './common.mts';

export interface ReviewMetadata {
  chapterNumber: number | null;
  decision: string;
  reviewerStatus: string;
  fields: ParsedFields;
}

export interface ReviewFile {
  title: string;
  metadata: ReviewMetadata;
  decision: string;
  reviewerStatus: string;
  findings: string[];
  requiredRevisions: string[];
  requiredRevisionsIsPlaceholder: boolean;
  fileNumber: number | null;
  metadataNumber: number | null;
}

export function parseReviewFile(markdown: string, filePath = ''): ReviewFile {
  const metadataFields = parseLabeledList(getHeadingContent(markdown, '## Metadata'));
  const findingsSection = getHeadingContent(markdown, '## Findings');
  const findings = parseBulletList(findingsSection);
  const requiredRevisionsSection = getHeadingContent(markdown, '## Required Revisions');
  const requiredRevisions = parseBulletList(requiredRevisionsSection);
  const metadataNumber = parseInteger(fieldValue(metadataFields, 'Chapter Number'));
  const decisionMatch = String(markdown ?? '').match(/(?:^|\n)(?:-\s*)?Decision:\s*(.+)$/m);
  const decision = fieldValue(metadataFields, 'Decision')
    || (decisionMatch ? decisionMatch[1].trim() : '');

  const normalizedRequiredRevisions = requiredRevisions.length > 0
    ? requiredRevisions
    : (trimSectionContent(requiredRevisionsSection) ? [trimSectionContent(requiredRevisionsSection)] : []);

  return {
    title: getTitle(markdown),
    metadata: {
      chapterNumber: metadataNumber,
      decision: fieldValue(metadataFields, 'Decision'),
      reviewerStatus: fieldValue(metadataFields, 'Reviewer Status'),
      fields: metadataFields,
    },
    decision,
    reviewerStatus: fieldValue(metadataFields, 'Reviewer Status'),
    findings: findings.length > 0 ? findings : (trimSectionContent(findingsSection) ? [trimSectionContent(findingsSection)] : []),
    requiredRevisions: normalizedRequiredRevisions,
    requiredRevisionsIsPlaceholder: isPlaceholderList(
      normalizedRequiredRevisions,
      trimSectionContent(requiredRevisionsSection),
    ),
    fileNumber: inferNumberFromPath(filePath) ?? parseInteger(getTitle(markdown)),
    metadataNumber,
  };
}
