# Novel Drafting Reliable Lint Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild `novel-drafting` validation into a lint-supervised workflow gate with single-purpose parsers and checks for entry, progress, and completion modes.

**Architecture:** Keep `skills/novel-drafting/scripts/validate-drafting-project.js` as the only public entrypoint and move rule logic into shared parsers plus dedicated check modules. Tests stay in `tests/validators.test.js` and expand around deterministic project-artifact fixtures so each validator mode proves one workflow invariant at a time.

**Tech Stack:** Node.js built-in test runner, CommonJS modules, markdown parsing via targeted string parsing and regular expressions, existing `scripts/lib/validator-utils.js`.

---

## File Map

### Create

- `skills/novel-drafting/scripts/lib/parse-workflow-status.js`
- `skills/novel-drafting/scripts/lib/parse-success-criteria.js`
- `skills/novel-drafting/scripts/lib/parse-chapter-plan.js`
- `skills/novel-drafting/scripts/lib/parse-chapter-file.js`
- `skills/novel-drafting/scripts/lib/parse-review-file.js`
- `skills/novel-drafting/scripts/lib/count-chinese-words.js`
- `skills/novel-drafting/scripts/lib/load-drafting-project.js`
- `skills/novel-drafting/scripts/checks/check-entry-gate.js`
- `skills/novel-drafting/scripts/checks/check-workflow-state.js`
- `skills/novel-drafting/scripts/checks/check-chapter-files.js`
- `skills/novel-drafting/scripts/checks/check-review-files.js`
- `skills/novel-drafting/scripts/checks/check-word-count.js`
- `skills/novel-drafting/scripts/checks/check-completion-gate.js`
- `skills/novel-drafting/lint-contract.md`

### Modify

- `skills/novel-drafting/scripts/validate-drafting-project.js`
- `skills/novel-drafting/SKILL.md`
- `skills/novel-drafting/chapter-loop.md`
- `skills/novel-drafting/file-contract.md`
- `tests/validators.test.js`

## Shared Conventions

- Keep all new drafting validator modules in CommonJS to match the current validator and tests.
- Parse markdown contracts into explicit objects; do not scatter new regex parsing across check files.
- All checker failures must use agent-legible messages with four parts:
  - `Error:`
  - `Why it blocks:`
  - `How to fix:`
  - `See:`
- Preserve validator CLI shape:
  - `node skills/novel-drafting/scripts/validate-drafting-project.js --project-root <root> --mode <Entry|Progress|Completion>`

### Task 1: Add Test Helpers For Richer Drafting Fixtures

**Files:**
- Modify: `tests/validators.test.js`
- Test: `tests/validators.test.js`

- [ ] **Step 1: Add reusable drafting fixture builders near the top of `tests/validators.test.js`**

```js
function writeDraftingBaseProject(root, overrides = {}) {
  writeFile(root, '00-project/project-brief.md', overrides.projectBrief ?? '# Brief\n');
  writeFile(root, '00-project/success-criteria.md', overrides.successCriteria ?? [
    '# Success Criteria',
    '',
    '- Target Audience: web fiction readers',
    '- Length Tier: novella',
    '- Planned Chapters: 2',
    '- Target Total Words: 2400-3200',
    '- Per-Chapter Word Range: 1200-1600',
    '- Completion Rule: all planned chapters drafted and approved',
    '- Review Pass Rule: every planned chapter review must be 通过',
  ].join('\n'));
  writeFile(root, '00-project/workflow-status.md', overrides.workflowStatus ?? [
    '# Workflow Status',
    '',
    '- Project: test-book',
    '- Status: research_complete',
    '- Current Stage: novel-drafting',
    '- Planned Chapters: 2',
    '- Completed Chapters: 0',
    '- Last Completed Chapter:',
    '- Blocking Issues:',
    '  -',
    '- Next Allowed Skill: novel-drafting',
    '- Last Updated: 2026-04-22',
  ].join('\n'));
  writeFile(root, '20-story/characters.md', overrides.characters ?? '# Characters\n');
  writeFile(root, '20-story/plot-outline.md', overrides.plotOutline ?? '# Plot Outline\n');
  writeFile(root, '20-story/foreshadowing.md', overrides.foreshadowing ?? '# Foreshadowing\n');
  writeFile(root, '30-draft/chapter-plan.md', overrides.chapterPlan ?? [
    '# Chapter Plan',
    '',
    '## Overview',
    '',
    '- Total Chapters: 2',
    '- Target Per Chapter: 1200-1600',
    '',
    '## Chapter List',
    '',
    '### Chapter 1',
    '- Title: First Crossing',
    '- POV: Lin',
    '- Word Target: 1200-1600',
    '- Goal: Get Lin onto the river convoy.',
    '- Key Events: Lin bargains for passage.',
    '- Characters: Lin, Boatmaster Qiu',
    '',
    '### Chapter 2',
    '- Title: Lantern Wake',
    '- POV: Lin',
    '- Word Target: 1200-1600',
    '- Goal: Reveal the sabotage attempt without solving it.',
    '- Key Events: Lin spots the cut mooring line.',
    '- Characters: Lin, Boatmaster Qiu',
  ].join('\n'));

  fs.mkdirSync(path.join(root, '30-draft', 'chapters'), { recursive: true });
  fs.mkdirSync(path.join(root, '40-review', 'chapter-reviews'), { recursive: true });
}

function makeChapterContent(text) {
  return [
    '# Chapter 1',
    '',
    '## Metadata',
    '- Chapter Number: 1',
    '- Chapter Goal: Get Lin onto the river convoy.',
    '- Target Word Range: 1200-1600',
    '- Draft Status: drafted',
    '',
    '## Summary',
    '- Lin secures passage.',
    '',
    '## Content',
    text,
  ].join('\n');
}
```

- [ ] **Step 2: Run the existing test suite to verify the helper insertion did not break syntax**

Run: `npm test`
Expected: `node --test` completes and all existing tests still pass.

- [ ] **Step 3: Commit the pure test-fixture prep**

```bash
git add tests/validators.test.js
git commit -m "test: add drafting validator fixture helpers"
```

### Task 2: Lock Entry-Gate Behavior With Failing Tests

**Files:**
- Modify: `tests/validators.test.js`
- Test: `tests/validators.test.js`

- [ ] **Step 1: Add a failing test for illegal drafting entry state**

```js
test('drafting validator in entry mode fails when workflow status is not research_complete or draft_blocked', () => {
  const root = makeTempProject();
  writeDraftingBaseProject(root, {
    workflowStatus: [
      '# Workflow Status',
      '',
      '- Project: test-book',
      '- Status: initialized',
      '- Current Stage: novel-research',
      '- Planned Chapters: 2',
      '- Completed Chapters: 0',
      '- Last Completed Chapter:',
      '- Blocking Issues:',
      '  -',
      '- Next Allowed Skill: novel-research',
      '- Last Updated: 2026-04-22',
    ].join('\n'),
  });

  const result = runValidator(
    path.join('skills', 'novel-drafting', 'scripts', 'validate-drafting-project.js'),
    ['--project-root', root, '--mode', 'Entry'],
  );

  assert.equal(result.status, 1);
  assert.match(result.stdout, /workflow status/i);
  assert.match(result.stdout, /research_complete|draft_blocked/i);
});
```

- [ ] **Step 2: Add a failing test for malformed chapter plan in entry mode**

```js
test('drafting validator in entry mode fails when no valid planned chapters can be parsed', () => {
  const root = makeTempProject();
  writeDraftingBaseProject(root, {
    chapterPlan: '# Chapter Plan\n\n## Overview\n\n## Chapter List\n',
  });

  const result = runValidator(
    path.join('skills', 'novel-drafting', 'scripts', 'validate-drafting-project.js'),
    ['--project-root', root, '--mode', 'Entry'],
  );

  assert.equal(result.status, 1);
  assert.match(result.stdout, /No planned chapters|valid planned chapter/i);
});
```

- [ ] **Step 3: Run only the new entry tests to confirm they fail against current implementation**

Run: `node --test tests/validators.test.js --test-name-pattern "entry mode fails"`
Expected: both new drafting entry tests fail because the current validator only checks field presence.

- [ ] **Step 4: Commit the intentionally failing entry-gate tests**

```bash
git add tests/validators.test.js
git commit -m "test: cover drafting entry gate invariants"
```

### Task 3: Implement Shared Parsers And Word Counting

**Files:**
- Create: `skills/novel-drafting/scripts/lib/parse-workflow-status.js`
- Create: `skills/novel-drafting/scripts/lib/parse-success-criteria.js`
- Create: `skills/novel-drafting/scripts/lib/parse-chapter-plan.js`
- Create: `skills/novel-drafting/scripts/lib/parse-chapter-file.js`
- Create: `skills/novel-drafting/scripts/lib/parse-review-file.js`
- Create: `skills/novel-drafting/scripts/lib/count-chinese-words.js`
- Create: `skills/novel-drafting/scripts/lib/load-drafting-project.js`
- Modify: `tests/validators.test.js`
- Test: `tests/validators.test.js`

- [ ] **Step 1: Write a focused parser test for chapter-plan word-target extraction**

```js
test('drafting parser extracts ordered planned chapters and word targets', () => {
  const { parseChapterPlan } = require('../skills/novel-drafting/scripts/lib/parse-chapter-plan');
  const plan = parseChapterPlan([
    '# Chapter Plan',
    '',
    '## Overview',
    '',
    '## Chapter List',
    '',
    '### Chapter 1',
    '- Title: First Crossing',
    '- Word Target: 1200-1600',
    '- Goal: Get Lin onto the river convoy.',
    '',
    '### Chapter 2',
    '- Title: Lantern Wake',
    '- Word Target: 1200-1600',
    '- Goal: Reveal the sabotage attempt without solving it.',
  ].join('\n'));

  assert.deepEqual(plan.chapterNumbers, [1, 2]);
  assert.equal(plan.chapters[0].wordTarget.raw, '1200-1600');
  assert.equal(plan.chapters[1].goal, 'Reveal the sabotage attempt without solving it.');
});
```

- [ ] **Step 2: Run the parser test to verify it fails because the parser module does not exist yet**

Run: `node --test tests/validators.test.js --test-name-pattern "extracts ordered planned chapters"`
Expected: FAIL with a module resolution error for `parse-chapter-plan`.

- [ ] **Step 3: Implement the parser modules and project loader**

```js
// skills/novel-drafting/scripts/lib/parse-chapter-plan.js
function parseRange(raw) {
  const match = raw.match(/(\d+)\s*-\s*(\d+)/);
  if (!match) {
    return null;
  }

  return {
    raw,
    min: Number(match[1]),
    max: Number(match[2]),
  };
}

function parseMetadataBlock(block, labels) {
  const result = {};
  for (const label of labels) {
    const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const match = block.match(new RegExp(`^-\\s*${escaped}\\s*(.+)$`, 'im'));
    result[label] = match ? match[1].trim() : null;
  }
  return result;
}

function parseChapterPlan(content) {
  const chapters = [];
  for (const match of content.matchAll(/^###\s+Chapter\s+(\d+)([\s\S]*?)(?=^###\s+Chapter\s+\d+|$)/gm)) {
    const number = Number(match[1]);
    const body = match[2];
    const metadata = parseMetadataBlock(body, ['Title:', 'POV:', 'Word Target:', 'Goal:', 'Key Events:', 'Characters:']);
    chapters.push({
      number,
      title: metadata['Title:'],
      pov: metadata['POV:'],
      wordTarget: metadata['Word Target:'] ? parseRange(metadata['Word Target:']) ?? { raw: metadata['Word Target:'] } : null,
      goal: metadata['Goal:'],
      keyEvents: metadata['Key Events:'],
      characters: metadata['Characters:'],
    });
  }

  return {
    chapters,
    chapterNumbers: chapters.map((chapter) => chapter.number),
  };
}

module.exports = { parseChapterPlan, parseRange };
```

```js
// skills/novel-drafting/scripts/lib/count-chinese-words.js
function countChineseWords(content) {
  const normalized = content
    .replace(/\r\n/g, '\n')
    .replace(/^##\s+Content\s*$/im, '')
    .trim();

  const hanMatches = normalized.match(/\p{Script=Han}/gu) ?? [];
  const latinTokens = normalized.match(/[A-Za-z0-9]+/g) ?? [];
  return hanMatches.length + latinTokens.length;
}

module.exports = { countChineseWords };
```

```js
// skills/novel-drafting/scripts/lib/load-drafting-project.js
const { readFile } = require('../../../../scripts/lib/validator-utils');
const { parseWorkflowStatus } = require('./parse-workflow-status');
const { parseSuccessCriteria } = require('./parse-success-criteria');
const { parseChapterPlan } = require('./parse-chapter-plan');
const { parseChapterFile } = require('./parse-chapter-file');
const { parseReviewFile } = require('./parse-review-file');

function loadDraftingProject(state) {
  const workflowContent = readFile(state, '00-project/workflow-status.md') ?? '';
  const successCriteriaContent = readFile(state, '00-project/success-criteria.md') ?? '';
  const chapterPlanContent = readFile(state, '30-draft/chapter-plan.md') ?? '';

  return {
    workflow: parseWorkflowStatus(workflowContent),
    successCriteria: parseSuccessCriteria(successCriteriaContent),
    chapterPlan: parseChapterPlan(chapterPlanContent),
    parseChapterFile: (content, relativePath) => parseChapterFile(content, relativePath),
    parseReviewFile: (content, relativePath) => parseReviewFile(content, relativePath),
  };
}

module.exports = { loadDraftingProject };
```

- [ ] **Step 4: Run the parser-focused tests to verify they pass**

Run: `node --test tests/validators.test.js --test-name-pattern "drafting parser extracts ordered planned chapters"`
Expected: PASS.

- [ ] **Step 5: Commit the parser layer**

```bash
git add skills/novel-drafting/scripts/lib tests/validators.test.js
git commit -m "feat: add drafting validator parsers"
```

### Task 4: Refactor The Validator Into A Mode-Based Orchestrator

**Files:**
- Create: `skills/novel-drafting/scripts/checks/check-entry-gate.js`
- Create: `skills/novel-drafting/scripts/checks/check-workflow-state.js`
- Modify: `skills/novel-drafting/scripts/validate-drafting-project.js`
- Modify: `tests/validators.test.js`
- Test: `tests/validators.test.js`

- [ ] **Step 1: Add an orchestrator-level test that expects entry mode to pass for a valid drafting scaffold**

```js
test('drafting validator in entry mode passes for a research-complete project', () => {
  const root = makeTempProject();
  writeDraftingBaseProject(root);

  const result = runValidator(
    path.join('skills', 'novel-drafting', 'scripts', 'validate-drafting-project.js'),
    ['--project-root', root, '--mode', 'Entry'],
  );

  assert.equal(result.status, 0);
  assert.match(result.stdout, /Drafting validation passed for mode Entry\./);
});
```

- [ ] **Step 2: Run the entry-mode tests to verify the new positive case and previous negative cases capture the target behavior**

Run: `node --test tests/validators.test.js --test-name-pattern "entry mode"`
Expected: the positive case may pass, but the two new negative cases should still fail until orchestrator refactor is complete.

- [ ] **Step 3: Replace the drafting validator body with mode-driven orchestration**

```js
// skills/novel-drafting/scripts/validate-drafting-project.js
#!/usr/bin/env node

const { createValidator, finish, parseArgs, requireFile } = require('../../../scripts/lib/validator-utils');
const { loadDraftingProject } = require('./lib/load-drafting-project');
const { checkEntryGate } = require('./checks/check-entry-gate');
const { checkWorkflowState } = require('./checks/check-workflow-state');

const validModes = new Set(['Entry', 'Progress', 'Completion']);
const requiredFiles = [
  '00-project/project-brief.md',
  '00-project/success-criteria.md',
  '00-project/workflow-status.md',
  '20-story/characters.md',
  '20-story/plot-outline.md',
  '20-story/foreshadowing.md',
  '30-draft/chapter-plan.md',
];

function runChecks(state, project, checks) {
  for (const check of checks) {
    for (const failure of check({ state, project })) {
      state.errors.push(failure);
    }
  }
}

function main() {
  const args = parseArgs(process.argv.slice(2), { required: ['project-root'] });
  const mode = args.mode ?? 'Completion';
  if (!validModes.has(mode)) {
    console.log(`Drafting validation failed for mode ${mode}:\n- Invalid mode: ${mode}`);
    process.exit(1);
  }

  const state = createValidator(args['project-root']);
  for (const relativePath of requiredFiles) {
    requireFile(state, relativePath);
  }

  const project = loadDraftingProject(state);
  const checksByMode = {
    Entry: [checkEntryGate, checkWorkflowState],
    Progress: [checkWorkflowState],
    Completion: [checkWorkflowState],
  };

  runChecks(state, project, checksByMode[mode]);
  finish(state, `Drafting validation passed for mode ${mode}.`, `Drafting validation failed for mode ${mode}:`);
}

main();
```

- [ ] **Step 4: Implement `check-entry-gate.js` and `check-workflow-state.js` with remediation-rich messages**

```js
// skills/novel-drafting/scripts/checks/check-entry-gate.js
function checkEntryGate({ project }) {
  const failures = [];
  const allowedStatuses = new Set(['research_complete', 'draft_blocked']);

  if (!allowedStatuses.has(project.workflow.status)) {
    failures.push([
      `Error: Workflow status '${project.workflow.status ?? '(missing)'}' does not allow drafting entry.`,
      '',
      'Why it blocks:',
      'Drafting may begin only from research_complete or draft_blocked.',
      '',
      'How to fix:',
      'Update 00-project/workflow-status.md after research is complete, or resume from a real drafting block.',
      '',
      'See:',
      '- 00-project/workflow-status.md',
      '- skills/novel-drafting/SKILL.md',
    ].join('\n'));
  }

  if (project.chapterPlan.chapterNumbers.length === 0) {
    failures.push([
      'Error: No valid planned chapters were parsed from 30-draft/chapter-plan.md.',
      '',
      'Why it blocks:',
      'The drafting controller cannot select the first chapter without a parseable chapter plan.',
      '',
      'How to fix:',
      'Add at least one `### Chapter N` entry with Title, Word Target, and Goal fields.',
      '',
      'See:',
      '- 30-draft/chapter-plan.md',
      '- skills/novel-drafting/file-contract.md',
    ].join('\n'));
  }

  return failures;
}

module.exports = { checkEntryGate };
```

- [ ] **Step 5: Run entry-mode tests and confirm they pass**

Run: `node --test tests/validators.test.js --test-name-pattern "entry mode"`
Expected: PASS for the valid fixture and FAIL-to-pass transition for the two negative tests.

- [ ] **Step 6: Commit the orchestrator and entry-state checks**

```bash
git add skills/novel-drafting/scripts/validate-drafting-project.js skills/novel-drafting/scripts/checks tests/validators.test.js
git commit -m "feat: refactor drafting validator into mode checks"
```

### Task 5: Add Chapter And Review Artifact Consistency Checks

**Files:**
- Create: `skills/novel-drafting/scripts/checks/check-chapter-files.js`
- Create: `skills/novel-drafting/scripts/checks/check-review-files.js`
- Modify: `skills/novel-drafting/scripts/lib/load-drafting-project.js`
- Modify: `skills/novel-drafting/scripts/validate-drafting-project.js`
- Modify: `tests/validators.test.js`
- Test: `tests/validators.test.js`

- [ ] **Step 1: Add a failing test for chapter filename and metadata mismatch**

```js
test('drafting validator in progress mode fails when chapter metadata does not match the file name', () => {
  const root = makeTempProject();
  writeDraftingBaseProject(root);
  writeFile(root, '30-draft/chapters/chapter-01.md', [
    '# Chapter 1',
    '',
    '## Metadata',
    '- Chapter Number: 2',
    '- Chapter Goal: Get Lin onto the river convoy.',
    '- Target Word Range: 1200-1600',
    '- Draft Status: drafted',
    '',
    '## Summary',
    '- Lin secures passage.',
    '',
    '## Content',
    '江风推着船篷向前。'.repeat(200),
  ].join('\n'));

  const result = runValidator(
    path.join('skills', 'novel-drafting', 'scripts', 'validate-drafting-project.js'),
    ['--project-root', root, '--mode', 'Progress'],
  );

  assert.equal(result.status, 1);
  assert.match(result.stdout, /Chapter Number/i);
  assert.match(result.stdout, /chapter-01\.md/i);
});
```

- [ ] **Step 2: Add a failing test for a failed review with empty required revisions**

```js
test('drafting validator in progress mode fails when a failed review has no actionable revisions', () => {
  const root = makeTempProject();
  writeDraftingBaseProject(root);
  writeFile(root, '30-draft/chapters/chapter-01.md', makeChapterContent('江风推着船篷向前。'.repeat(200)));
  writeFile(root, '40-review/chapter-reviews/chapter-01-review.md', [
    '# Chapter 1 Review',
    '',
    '## Metadata',
    '- Chapter Number: 1',
    '- Decision: 不通过',
    '- Reviewer Status: completed',
    '',
    '## Checks',
    '- Word Count: fail',
    '',
    '## Findings',
    '- The chapter is too short.',
    '',
    '## Required Revisions',
    '- None',
  ].join('\n'));

  const result = runValidator(
    path.join('skills', 'novel-drafting', 'scripts', 'validate-drafting-project.js'),
    ['--project-root', root, '--mode', 'Progress'],
  );

  assert.equal(result.status, 1);
  assert.match(result.stdout, /Required Revisions/i);
  assert.match(result.stdout, /actionable/i);
});
```

- [ ] **Step 3: Run the new progress-mode tests to verify they fail**

Run: `node --test tests/validators.test.js --test-name-pattern "progress mode fails"`
Expected: FAIL until chapter and review consistency checks are wired in.

- [ ] **Step 4: Implement chapter and review checks and register them for `Progress` and `Completion`**

```js
// skills/novel-drafting/scripts/checks/check-chapter-files.js
function checkChapterFiles({ project }) {
  const failures = [];

  for (const chapter of project.chapters) {
    if (chapter.fileNumber !== chapter.metadataNumber) {
      failures.push([
        `Error: ${chapter.relativePath} declares Chapter Number ${chapter.metadataNumber} but the file name implies ${chapter.fileNumber}.`,
        '',
        'Why it blocks:',
        'The drafting workflow cannot trust chapter identity when file naming and metadata disagree.',
        '',
        'How to fix:',
        'Make the file name, title, and `Chapter Number` metadata all refer to the same planned chapter.',
        '',
        'See:',
        `- ${chapter.relativePath}`,
        '- skills/novel-drafting/file-contract.md',
      ].join('\n'));
    }
  }

  return failures;
}

module.exports = { checkChapterFiles };
```

```js
// skills/novel-drafting/scripts/checks/check-review-files.js
function checkReviewFiles({ project }) {
  const failures = [];

  for (const review of project.reviews) {
    if (review.decision === '不通过' && review.requiredRevisionsIsPlaceholder) {
      failures.push([
        `Error: ${review.relativePath} records Decision: 不通过 but does not list actionable required revisions.`,
        '',
        'Why it blocks:',
        'A failed review must tell the writer exactly what to revise before the chapter can be retried.',
        '',
        'How to fix:',
        'Replace placeholder revision text with concrete, chapter-specific revision items.',
        '',
        'See:',
        `- ${review.relativePath}`,
        '- skills/novel-drafting/reviewer-subagent.md',
      ].join('\n'));
    }
  }

  return failures;
}

module.exports = { checkReviewFiles };
```

- [ ] **Step 5: Run progress-mode tests and confirm they pass**

Run: `node --test tests/validators.test.js --test-name-pattern "progress mode"`
Expected: PASS for the existing allowed-in-progress scenario and the two new consistency-failure cases.

- [ ] **Step 6: Commit chapter and review consistency enforcement**

```bash
git add skills/novel-drafting/scripts/checks skills/novel-drafting/scripts/lib/load-drafting-project.js skills/novel-drafting/scripts/validate-drafting-project.js tests/validators.test.js
git commit -m "feat: add drafting artifact consistency checks"
```

### Task 6: Add Word-Count And Completion-Gate Enforcement

**Files:**
- Create: `skills/novel-drafting/scripts/checks/check-word-count.js`
- Create: `skills/novel-drafting/scripts/checks/check-completion-gate.js`
- Modify: `skills/novel-drafting/scripts/validate-drafting-project.js`
- Modify: `tests/validators.test.js`
- Test: `tests/validators.test.js`

- [ ] **Step 1: Add a failing test for chapter under target word count**

```js
test('drafting validator in progress mode fails when chapter content is below the planned word range', () => {
  const root = makeTempProject();
  writeDraftingBaseProject(root);
  writeFile(root, '30-draft/chapters/chapter-01.md', makeChapterContent('短章。'.repeat(80)));

  const result = runValidator(
    path.join('skills', 'novel-drafting', 'scripts', 'validate-drafting-project.js'),
    ['--project-root', root, '--mode', 'Progress'],
  );

  assert.equal(result.status, 1);
  assert.match(result.stdout, /word count/i);
  assert.match(result.stdout, /1200-1600/);
});
```

- [ ] **Step 2: Add a failing test for premature `draft_complete` status**

```js
test('drafting validator in completion mode fails when workflow status claims draft_complete before all chapters pass', () => {
  const root = makeTempProject();
  writeDraftingBaseProject(root, {
    workflowStatus: [
      '# Workflow Status',
      '',
      '- Project: test-book',
      '- Status: draft_complete',
      '- Current Stage: novel-drafting',
      '- Planned Chapters: 2',
      '- Completed Chapters: 1',
      '- Last Completed Chapter: 1',
      '- Blocking Issues:',
      '  -',
      '- Next Allowed Skill: novel-delivery',
      '- Last Updated: 2026-04-22',
    ].join('\n'),
  });
  writeFile(root, '30-draft/chapters/chapter-01.md', makeChapterContent('江风推着船篷向前。'.repeat(700)));
  writeFile(root, '40-review/chapter-reviews/chapter-01-review.md', [
    '# Chapter 1 Review',
    '',
    '## Metadata',
    '- Chapter Number: 1',
    '- Decision: 通过',
    '- Reviewer Status: completed',
    '',
    '## Checks',
    '- Word Count: pass',
    '',
    '## Findings',
    '- None.',
    '',
    '## Required Revisions',
    '- None',
  ].join('\n'));

  const result = runValidator(
    path.join('skills', 'novel-drafting', 'scripts', 'validate-drafting-project.js'),
    ['--project-root', root, '--mode', 'Completion'],
  );

  assert.equal(result.status, 1);
  assert.match(result.stdout, /draft_complete/i);
  assert.match(result.stdout, /all planned chapters/i);
});
```

- [ ] **Step 3: Run the new word-count and completion tests to verify they fail**

Run: `node --test tests/validators.test.js --test-name-pattern "word count|draft_complete"`
Expected: FAIL until word-count and completion-gate checks are registered.

- [ ] **Step 4: Implement word-count and completion-gate checks**

```js
// skills/novel-drafting/scripts/checks/check-word-count.js
function checkWordCount({ project, mode }) {
  const failures = [];

  for (const chapter of project.chapters) {
    const expectedRange = chapter.plannedWordTarget ?? project.successCriteria.perChapterWordRange;
    if (!expectedRange) {
      continue;
    }

    if (chapter.contentWordCount < expectedRange.min || chapter.contentWordCount > expectedRange.max) {
      failures.push([
        `Error: ${chapter.relativePath} has word count ${chapter.contentWordCount}, outside expected range ${expectedRange.raw}.`,
        '',
        'Why it blocks:',
        'The drafting workflow requires each chapter to meet its planned length target before it can be trusted in review or completion.',
        '',
        'How to fix:',
        'Revise the chapter body under ## Content until the actual count falls inside the planned range, then re-run the validator.',
        '',
        'See:',
        `- ${chapter.relativePath}`,
        '- 30-draft/chapter-plan.md',
        '- 00-project/success-criteria.md',
      ].join('\n'));
    }
  }

  if (mode === 'Completion' && project.successCriteria.targetTotalWords) {
    const total = project.chapters.reduce((sum, chapter) => sum + chapter.contentWordCount, 0);
    const range = project.successCriteria.targetTotalWords;
    if (total < range.min || total > range.max) {
      failures.push([
        `Error: Manuscript total word count ${total} is outside expected range ${range.raw}.`,
        '',
        'Why it blocks:',
        'The manuscript cannot be marked draft_complete until the total length matches the success criteria.',
        '',
        'How to fix:',
        'Adjust planned chapter content so the combined manuscript length falls inside the target total words range.',
        '',
        'See:',
        '- 00-project/success-criteria.md',
        '- 30-draft/chapters/',
      ].join('\n'));
    }
  }

  return failures;
}

module.exports = { checkWordCount };
```

```js
// skills/novel-drafting/scripts/checks/check-completion-gate.js
function checkCompletionGate({ project }) {
  const failures = [];
  const planned = project.chapterPlan.chapterNumbers;
  const approved = new Set(project.approvedChapterNumbers);

  for (const number of planned) {
    if (!approved.has(number)) {
      failures.push([
        `Error: Chapter ${number} is not fully approved, so completion gate cannot pass.`,
        '',
        'Why it blocks:',
        'Every planned chapter must have a corresponding passing review before the manuscript can be marked complete.',
        '',
        'How to fix:',
        `Add or fix chapter-${String(number).padStart(2, '0')}.md and its review until Decision: 通过 is recorded.`,
        '',
        'See:',
        '- 30-draft/chapter-plan.md',
        '- 30-draft/chapters/',
        '- 40-review/chapter-reviews/',
      ].join('\n'));
    }
  }

  if (project.workflow.status === 'draft_complete' && approved.size !== planned.length) {
    failures.push([
      'Error: Workflow status claims draft_complete before all planned chapters are approved.',
      '',
      'Why it blocks:',
      'draft_complete is only legal after the full completion gate passes.',
      '',
      'How to fix:',
      'Return workflow status to draft_in_progress or draft_blocked until every planned chapter passes review.',
      '',
      'See:',
      '- 00-project/workflow-status.md',
      '- skills/novel-drafting/chapter-loop.md',
    ].join('\n'));
  }

  return failures;
}

module.exports = { checkCompletionGate };
```

- [ ] **Step 5: Run the full validator suite and confirm all drafting and existing non-drafting tests pass**

Run: `npm test`
Expected: all tests pass under `node --test`.

- [ ] **Step 6: Commit the completion gate**

```bash
git add skills/novel-drafting/scripts/checks skills/novel-drafting/scripts/validate-drafting-project.js tests/validators.test.js
git commit -m "feat: enforce drafting word counts and completion gate"
```

### Task 7: Update Drafting Documentation To Match The Lint-Supervised Workflow

**Files:**
- Modify: `skills/novel-drafting/SKILL.md`
- Modify: `skills/novel-drafting/chapter-loop.md`
- Modify: `skills/novel-drafting/file-contract.md`
- Create: `skills/novel-drafting/lint-contract.md`
- Test: `tests/validators.test.js`

- [ ] **Step 1: Update `SKILL.md` so it points to the validator as the workflow authority**

```md
## Validation Gate

Before advancing workflow state, run:

    node skills/novel-drafting/scripts/validate-drafting-project.js --project-root <project-root> --mode Entry
    node skills/novel-drafting/scripts/validate-drafting-project.js --project-root <project-root> --mode Progress
    node skills/novel-drafting/scripts/validate-drafting-project.js --project-root <project-root> --mode Completion

The validator output is authoritative. Do not advance on chat claims alone.
```

- [ ] **Step 2: Add `lint-contract.md` with mode-specific progressive disclosure**

```md
# Lint Contract

## Summary

This file describes the deterministic workflow checks that supervise `novel-drafting`.

## Modes

### Entry

- checks workflow entry status
- checks drafting prerequisites
- checks chapter-plan parseability

### Progress

- checks workflow-state consistency
- checks chapter metadata and review metadata
- checks per-chapter word counts

### Completion

- checks all planned chapters and reviews
- checks total manuscript word count
- checks legality of `draft_complete` and `novel-delivery`
```

- [ ] **Step 3: Update `chapter-loop.md` and `file-contract.md` to reference validation-first control flow**

```md
After each writer or reviewer run:

1. read the project artifacts
2. run the drafting validator in the appropriate mode
3. advance only if the validator passes
4. otherwise stop, re-dispatch, or mark blocked
```

- [ ] **Step 4: Run the full test suite to verify docs edits did not require test changes**

Run: `npm test`
Expected: PASS.

- [ ] **Step 5: Commit the documentation alignment**

```bash
git add skills/novel-drafting/SKILL.md skills/novel-drafting/chapter-loop.md skills/novel-drafting/file-contract.md skills/novel-drafting/lint-contract.md
git commit -m "docs: align drafting skill with lint-supervised workflow"
```

## Self-Review

### Spec Coverage

- Stable validator entrypoint: covered in Tasks 4 and 6.
- Single-purpose parsers: covered in Task 3.
- Stage-specific checks: covered in Tasks 4, 5, and 6.
- Entry gate, workflow consistency, artifact consistency, word counts, completion gate: covered in Tasks 4, 5, and 6.
- Documentation realignment and lint contract: covered in Task 7.
- Tests for each class of failure: covered across Tasks 2, 3, 5, and 6.

### Placeholder Scan

- No `TBD`, `TODO`, or “implement later” placeholders remain.
- Each code-modifying task includes a concrete code block.
- Each verification step includes an exact command and expected outcome.

### Type Consistency

- `project.workflow.status`, `project.chapterPlan.chapterNumbers`, `project.approvedChapterNumbers`, `chapter.contentWordCount`, and `review.decision` are used consistently across tasks.
- Validator modes remain `Entry`, `Progress`, and `Completion` everywhere in the plan.
