const fs = require('node:fs');
const path = require('node:path');
const { parseChapterFile } = require('./parse-chapter-file');
const { parseChapterPlan } = require('./parse-chapter-plan');
const { parseReviewFile } = require('./parse-review-file');
const { parseSuccessCriteria } = require('./parse-success-criteria');
const { parseWorkflowStatus } = require('./parse-workflow-status');

function readIfExists(root, relativePath) {
  const fullPath = path.join(root, relativePath);
  if (!fs.existsSync(fullPath)) {
    return null;
  }

  return fs.readFileSync(fullPath, 'utf8');
}

function readDirectoryFiles(root, relativeDir, parser) {
  const fullDir = path.join(root, relativeDir);
  if (!fs.existsSync(fullDir)) {
    return [];
  }

  return fs.readdirSync(fullDir)
    .filter((entry) => entry.endsWith('.md'))
    .map((entry) => {
      const relativePath = path.join(relativeDir, entry);
      const fullPath = path.join(root, relativePath);
      const content = fs.readFileSync(fullPath, 'utf8');
      return {
        path: relativePath,
        ...parser(content, relativePath),
      };
    })
    .sort((left, right) => (left.fileNumber ?? Number.MAX_SAFE_INTEGER) - (right.fileNumber ?? Number.MAX_SAFE_INTEGER));
}

function indexByNumber(records) {
  const map = new Map();
  for (const record of records) {
    if (record.fileNumber !== null && record.fileNumber !== undefined) {
      map.set(record.fileNumber, record);
    }
  }
  return map;
}

function loadDraftingProject(projectRoot) {
  const successCriteriaMarkdown = readIfExists(projectRoot, '00-project/success-criteria.md');
  const workflowStatusMarkdown = readIfExists(projectRoot, '00-project/workflow-status.md');
  const chapterPlanMarkdown = readIfExists(projectRoot, '30-draft/chapter-plan.md');
  const chapters = readDirectoryFiles(projectRoot, '30-draft/chapters', parseChapterFile);
  const reviews = readDirectoryFiles(projectRoot, '40-review/chapter-reviews', parseReviewFile);
  const chaptersByNumber = indexByNumber(chapters);
  const reviewsByNumber = indexByNumber(reviews);
  const chapterPlan = chapterPlanMarkdown ? parseChapterPlan(chapterPlanMarkdown) : null;
  const plannedChapters = (chapterPlan?.chapters ?? []).map((chapter) => ({
    ...chapter,
    chapterFile: chaptersByNumber.get(chapter.number) ?? null,
    reviewFile: reviewsByNumber.get(chapter.number) ?? null,
  }));

  return {
    root: path.resolve(projectRoot),
    workflowStatus: workflowStatusMarkdown ? parseWorkflowStatus(workflowStatusMarkdown) : null,
    successCriteria: successCriteriaMarkdown ? parseSuccessCriteria(successCriteriaMarkdown) : null,
    chapterPlan,
    chapters,
    reviews,
    chaptersByNumber,
    reviewsByNumber,
    plannedChapters,
  };
}

module.exports = {
  loadDraftingProject,
};
