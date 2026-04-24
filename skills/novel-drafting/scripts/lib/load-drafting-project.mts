import fs from 'node:fs';
import path from 'node:path';
import { parseChapterFile, type ChapterFile } from './parse-chapter-file.mts';
import { parseChapterPlan, type ChapterPlan, type PlannedChapter } from './parse-chapter-plan.mts';
import { parseReviewFile, type ReviewFile } from './parse-review-file.mts';
import { parseSuccessCriteria, type SuccessCriteria } from './parse-success-criteria.mts';
import { parseWorkflowStatus, type WorkflowStatus } from './parse-workflow-status.mts';

export interface PlannedChapterRecord extends PlannedChapter {
  chapterFile: ChapterFile | null;
  reviewFile: ReviewFile | null;
}

export interface LoadedDraftingProject {
  root: string;
  workflowStatus: WorkflowStatus | null;
  successCriteria: SuccessCriteria | null;
  chapterPlan: ChapterPlan | null;
  chapters: ChapterFile[];
  reviews: ReviewFile[];
  chaptersByNumber: Map<number, ChapterFile>;
  reviewsByNumber: Map<number, ReviewFile>;
  plannedChapters: PlannedChapterRecord[];
}

function readIfExists(root: string, relativePath: string): string | null {
  const fullPath = path.join(root, relativePath);
  if (!fs.existsSync(fullPath)) {
    return null;
  }

  return fs.readFileSync(fullPath, 'utf8');
}

function readDirectoryFiles<T extends { fileNumber?: number | null }>(
  root: string,
  relativeDir: string,
  parser: (content: string, relativePath: string) => T,
): T[] {
  const fullDir = path.join(root, relativeDir);
  if (!fs.existsSync(fullDir)) {
    return [];
  }

  return fs
    .readdirSync(fullDir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith('.md'))
    .map((entry) => {
      const relativePath = path.join(relativeDir, entry.name);
      const fullPath = path.join(root, relativePath);
      const content = fs.readFileSync(fullPath, 'utf8');
      return {
        path: relativePath,
        ...parser(content, relativePath),
      } as T;
    })
    .sort((left, right) =>
      (left.fileNumber ?? Number.MAX_SAFE_INTEGER) - (right.fileNumber ?? Number.MAX_SAFE_INTEGER));
}

function indexByNumber<T extends { fileNumber?: number | null }>(records: T[]): Map<number, T> {
  const map = new Map<number, T>();
  for (const record of records) {
    if (record.fileNumber !== null && record.fileNumber !== undefined) {
      map.set(record.fileNumber, record);
    }
  }
  return map;
}

export function loadDraftingProject(projectRoot: string): LoadedDraftingProject {
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
