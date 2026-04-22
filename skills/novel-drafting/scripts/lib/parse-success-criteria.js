const {
  fieldValue,
  parseInteger,
  parseLabeledList,
  parseRange,
} = require('./common');

function parseSuccessCriteria(markdown) {
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

module.exports = {
  parseSuccessCriteria,
};
