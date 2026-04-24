import { formatFailure } from '../lib/validator-utils.mts';
import type { LoadedDraftingProject } from '../lib/load-drafting-project.mts';

export function checkEntryGate({ project }: { project: LoadedDraftingProject }): string[] {
  const failures: string[] = [];
  const workflow = project.workflowStatus;
  const chapterPlan = project.chapterPlan;

  if (!workflow) {
    failures.push(formatFailure([
      'Error: Missing parseable workflow status for drafting entry.',
      '',
      'Why it blocks:',
      'Drafting entry requires a readable workflow status file.',
      '',
      'How to fix:',
      'Populate 00-project/workflow-status.md with the required drafting workflow fields.',
      '',
      'See:',
      '- 00-project/workflow-status.md',
    ]));
    return failures;
  }

  if (!['research_complete', 'draft_blocked'].includes(workflow.status)) {
    failures.push(formatFailure([
      `Error: workflow status '${workflow.status || '(missing)'}' does not allow drafting entry.`,
      '',
      'Why it blocks:',
      'Drafting may begin only from research_complete or draft_blocked.',
      '',
      'How to fix:',
      'Set workflow status to research_complete when research is done, or draft_blocked when resuming a blocked chapter.',
      '',
      'See:',
      '- 00-project/workflow-status.md',
      '- SKILL.md',
    ]));
  }

  if (!['novel-drafting', 'drafting'].includes(workflow.currentStage)) {
    failures.push(formatFailure([
      `Error: Current Stage '${workflow.currentStage || '(missing)'}' is not valid for drafting entry.`,
      '',
      'Why it blocks:',
      'Entry mode requires Current Stage to indicate drafting rather than novel-research.',
      '',
      'How to fix:',
      'Set Current Stage to novel-drafting before starting drafting work.',
      '',
      'See:',
      '- 00-project/workflow-status.md',
      '- SKILL.md',
    ]));
  }

  if (!chapterPlan || chapterPlan.chapterNumbers.length === 0) {
    failures.push(formatFailure([
      'Error: No valid planned chapters were found in 30-draft/chapter-plan.md.',
      '',
      'Why it blocks:',
      'The drafting workflow cannot begin without at least one parseable chapter target.',
      '',
      'How to fix:',
      'Add one or more `### Chapter N` entries with Title, Word Target, and Goal fields.',
      '',
      'See:',
      '- 30-draft/chapter-plan.md',
    ]));
  }

  return failures;
}
