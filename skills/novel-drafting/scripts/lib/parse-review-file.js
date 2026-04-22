const {
  fieldValue,
  getHeadingContent,
  getTitle,
  inferNumberFromPath,
  isPlaceholderList,
  parseBulletList,
  parseInteger,
  parseLabeledList,
  trimSectionContent,
} = require('./common');

function parseReviewFile(markdown, filePath = '') {
  const metadataFields = parseLabeledList(getHeadingContent(markdown, '## Metadata'));
  const findingsSection = getHeadingContent(markdown, '## Findings');
  const findings = parseBulletList(findingsSection);
  const requiredRevisionsSection = getHeadingContent(markdown, '## Required Revisions');
  const requiredRevisions = parseBulletList(requiredRevisionsSection);
  const metadataNumber = parseInteger(fieldValue(metadataFields, 'Chapter Number'));
  const decisionMatch = String(markdown ?? '').match(/(?:^|\n)(?:-\s*)?Decision:\s*(.+)$/m);
  const decision = fieldValue(metadataFields, 'Decision')
    || (decisionMatch ? decisionMatch[1].trim() : '');

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
    requiredRevisions: requiredRevisions.length > 0
      ? requiredRevisions
      : (trimSectionContent(requiredRevisionsSection) ? [trimSectionContent(requiredRevisionsSection)] : []),
    requiredRevisionsIsPlaceholder: isPlaceholderList(
      requiredRevisions.length > 0
        ? requiredRevisions
        : (trimSectionContent(requiredRevisionsSection) ? [trimSectionContent(requiredRevisionsSection)] : []),
      trimSectionContent(requiredRevisionsSection),
    ),
    fileNumber: inferNumberFromPath(filePath) ?? parseInteger(getTitle(markdown)),
    metadataNumber,
  };
}

module.exports = {
  parseReviewFile,
};
