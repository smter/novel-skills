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
  continuityFindings: string[];
  continuityFindingsIsPlaceholder: boolean;
  requiredRevisions: string[];
  requiredRevisionsIsPlaceholder: boolean;
  fileNumber: number | null;
  metadataNumber: number | null;
}

export function parseReviewFile(markdown: string, filePath = ''): ReviewFile {
  const metadataFields = parseLabeledList(getHeadingContent(markdown, '## Metadata'));
  const findingsSection = getHeadingContent(markdown, '## Findings');
  const findings = parseBulletList(findingsSection);
  const continuityFindingsSection = getHeadingContent(markdown, '## Continuity Findings');
  const continuityFindings = parseBulletList(continuityFindingsSection);
  const requiredRevisionsSection = getHeadingContent(markdown, '## Required Revisions');
  const requiredRevisions = parseBulletList(requiredRevisionsSection);
  const metadataNumber = parseInteger(fieldValue(metadataFields, 'Chapter Number'));
  const decisionMatch = String(markdown ?? '').match(/(?:^|\n)(?:-\s*)?Decision:\s*(.+)$/m);
  const decision = fieldValue(metadataFields, 'Decision')
    || (decisionMatch ? decisionMatch[1].trim() : '');

  const normalizedRequiredRevisions = requiredRevisions.length > 0
    ? requiredRevisions
    : (trimSectionContent(requiredRevisionsSection) ? [trimSectionContent(requiredRevisionsSection)] : []);
  const normalizedContinuityFindings = continuityFindings.length > 0
    ? continuityFindings
    : (trimSectionContent(continuityFindingsSection) ? [trimSectionContent(continuityFindingsSection)] : []);

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
    continuityFindings: normalizedContinuityFindings,
    continuityFindingsIsPlaceholder: isPlaceholderList(
      normalizedContinuityFindings,
      trimSectionContent(continuityFindingsSection),
    ),
    requiredRevisions: normalizedRequiredRevisions,
    requiredRevisionsIsPlaceholder: isPlaceholderList(
      normalizedRequiredRevisions,
      trimSectionContent(requiredRevisionsSection),
    ),
    fileNumber: inferNumberFromPath(filePath) ?? parseInteger(getTitle(markdown)),
    metadataNumber,
  };
}
