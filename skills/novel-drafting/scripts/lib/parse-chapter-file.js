const { countChineseWords } = require('./count-chinese-words');
const {
  fieldValue,
  getHeadingContent,
  getTitle,
  inferNumberFromPath,
  parseInteger,
  parseLabeledList,
  parseRange,
  trimSectionContent,
} = require('./common');

function parseChapterFile(markdown, filePath = '') {
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

module.exports = {
  parseChapterFile,
};
