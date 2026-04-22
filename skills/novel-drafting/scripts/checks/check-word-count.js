function failure(lines) {
  return lines.join('\n');
}

function isRangeUsable(range) {
  return range && range.min !== null && range.max !== null;
}

function getExpectedRange(plannedChapter, project) {
  if (isRangeUsable(plannedChapter.wordTarget)) {
    return plannedChapter.wordTarget;
  }

  if (plannedChapter.chapterFile && isRangeUsable(plannedChapter.chapterFile.metadata.targetWordRange)) {
    return plannedChapter.chapterFile.metadata.targetWordRange;
  }

  if (project.successCriteria && isRangeUsable(project.successCriteria.perChapterWordRange)) {
    return project.successCriteria.perChapterWordRange;
  }

  return null;
}

function checkWordCount({ project, mode }) {
  const failures = [];
  let totalWordCount = 0;

  for (const plannedChapter of project.plannedChapters ?? []) {
    const chapter = plannedChapter.chapterFile;
    if (!chapter) {
      continue;
    }

    totalWordCount += chapter.contentWordCount;
    const expectedRange = getExpectedRange(plannedChapter, project);
    if (!expectedRange) {
      continue;
    }

    const shouldCheckChapter = mode === 'Completion' || (mode === 'Progress' && !plannedChapter.reviewFile);
    if (!shouldCheckChapter) {
      continue;
    }

    if (chapter.contentWordCount < expectedRange.min || chapter.contentWordCount > expectedRange.max) {
      failures.push(failure([
        `Error: 30-draft/chapters/chapter-${String(plannedChapter.number).padStart(2, '0')}.md has word count ${chapter.contentWordCount}, outside expected range ${expectedRange.raw}.`,
        '',
        'Why it blocks:',
        'Drafting cannot advance when the current chapter length is outside the planned target.',
        '',
        'How to fix:',
        'Revise the chapter body under ## Content until its actual count falls within the expected range.',
        '',
        'See:',
        `- 30-draft/chapters/chapter-${String(plannedChapter.number).padStart(2, '0')}.md`,
        '- 30-draft/chapter-plan.md',
        '- 00-project/success-criteria.md',
      ]));
    }
  }

  if (mode === 'Completion' && project.successCriteria && isRangeUsable(project.successCriteria.targetTotalWords)) {
    const expectedTotal = project.successCriteria.targetTotalWords;
    if (totalWordCount < expectedTotal.min || totalWordCount > expectedTotal.max) {
      failures.push(failure([
        `Error: Manuscript total word count ${totalWordCount} is outside expected range ${expectedTotal.raw}.`,
        '',
        'Why it blocks:',
        'The manuscript cannot be marked draft_complete until the total length matches success criteria.',
        '',
        'How to fix:',
        'Adjust chapter content so the combined manuscript falls within the target total words range.',
        '',
        'See:',
        '- 00-project/success-criteria.md',
        '- 30-draft/chapters/',
      ]));
    }
  }

  return failures;
}

module.exports = {
  checkWordCount,
};
