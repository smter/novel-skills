# Meta-Reference Guard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add three-layer defense against fourth-wall-breaking "第x章" style meta-references in novel-drafting output.

**Architecture:** Writer gets an explicit prohibition rule, reviewer gets a new check dimension, and the style-drift validator gets an automated detection function. Zero format or filename changes — pure additive defense layers that follow existing patterns exactly.

**Tech Stack:** TypeScript (.mts) for validator code, Markdown for skill docs, Node.js test runner for tests.

---

### Task 1: Add meta-reference rule to Writer

**Files:**
- Modify: `skills/novel-drafting/writer-subagent.md`

- [ ] **Step 1: Add prohibition rule in `## 你不得做的事` section**

Insert after the last `- ` item in the `## 你不得做的事` block (currently ends at line 42 with "如果章节目标不清晰..."):

```markdown
- 不得在正文（对话或叙述）中使用章节号、卷号等元叙事指代。
  当角色或叙述需要引用过去事件时，必须使用故事内部参照：
  时间（"那天晚上"）、地点（"在密室的时候"）、事件名（"火场那次"），而非"第x章"。
```

- [ ] **Step 2: Add requirement in `## 写作标准` section**

Insert before line 55 (`## 阻塞情形` or after the last `- ` in the 写作标准 list):

```markdown
- 引用过去线索或事件时，一律使用故事内参照，禁止出现"第x章""上一章""前文"等元叙事措辞
```

- [ ] **Step 3: Verify format with tsc**

```bash
npx tsc --noEmit
```

Expected: No errors (markdown files don't affect tsc).

---

### Task 2: Add meta-reference check to Reviewer

**Files:**
- Modify: `skills/novel-drafting/reviewer-subagent.md`

- [ ] **Step 1: Add check item in `## 你必须检查` section**

Insert after the last `- ` item in the `## 你必须检查` block (currently after "节奏与可读性" at line 57):

```markdown
- 是否出现元叙事措辞：对话或叙述中是否出现"第x章""第x卷""上一章""前文所述"等打破第四面墙的表述
```

- [ ] **Step 2: Add Checks entry in the minimal review structure**

In the `## Checks` section of the minimal review template (around lines 104-111), insert after the `- Style Drift: pass` line:

```markdown
- Meta-Reference: pass
```

- [ ] **Step 3: Add revision example after `## Required Revisions` rules**

Insert after the "如果风格问题属于后期漂移..." paragraph (around line 87):

```markdown
如果出现元叙事措辞，必须在修订项中引用原文并给出修改建议：
- 元叙事措辞：第3段对话"就像第三章那样" → 改为故事内部参照，如"就像火场那次"
```

- [ ] **Step 4: Verify format with tsc**

```bash
npx tsc --noEmit
```

Expected: No errors.

---

### Task 3: Update lint-contract self-check checklist

**Files:**
- Modify: `skills/novel-drafting/lint-contract.md`

- [ ] **Step 1: Add checklist item in `### 质量维度` section**

Insert after the line `- [ ] 无设定矛盾` (currently line 103):

```markdown
- [ ] 无元叙事措辞 — 正文中是否出现了"第x章""上一章""前文"等打破第四面墙的表述？
```

- [ ] **Step 2: Verify format with tsc**

```bash
npx tsc --noEmit
```

Expected: No errors.

---

### Task 4: Add meta-reference detection to style-drift validator

**Files:**
- Modify: `skills/novel-drafting/scripts/checks/check-style-drift.mts`

- [ ] **Step 1: Add `checkMetaReferences` function**

Insert after the `countMatches` function (after line 7):

```typescript
const META_REFERENCE_PATTERNS: Array<{ name: string; pattern: RegExp }> = [
  { name: 'chapter-number', pattern: /第[\d零一二三四五六七八九十百千]+[章节卷]/g },
  { name: 'cross-reference', pattern: /(上文|下文|前文|后文)(所述|提到|交代)/g },
  { name: 'section-index', pattern: /(上|下|本|这|那)(一)?(章|节|卷|回)/g },
];

function checkMetaReferences(content: string): Array<{ pattern: string; match: string }> {
  const hits: Array<{ pattern: string; match: string }> = [];
  for (const { name, pattern } of META_REFERENCE_PATTERNS) {
    const matches = content.match(pattern);
    if (matches) {
      for (const match of matches) {
        hits.push({ pattern: name, match });
      }
    }
  }
  return hits;
}
```

- [ ] **Step 2: Extract content from the `## Content` section**

Insert after line 66 (`const currentContent = ...`). Add:

```typescript
  const contentSection = currentContent.split('## Content')[1]?.split(/^#/m)[0] ?? currentContent;
```

- [ ] **Step 3: Call `checkMetaReferences` and generate warnings**

Insert after the repeated clause check block (after line 141, before the `return { warnings }` line):

```typescript
  const metaHits = checkMetaReferences(contentSection);
  if (metaHits.length > 0) {
    const uniqueHits = [...new Set(metaHits.map((h) => h.match))];
    warnings.push(formatFailure([
      `Warning: Style Drift in ${chapterLabel(currentChapter.number)} contains meta-referential phrasing (第四面墙 break).`,
      '',
      'Why it matters:',
      'Phrases like "第x章", "上一章", or "前文所述" break four-wall immersion. Characters and narration should reference events through story-internal cues — time, place, event name — never through the book structure.',
      '',
      'Reviewer focus:',
      `Replace every meta-reference with a story-internal reference. Check whether the knowledge ledger source=chapter-XX format is leaking into narrative text.`,
      '',
      'Observed:',
      `Found ${metaHits.length} meta-referential phrase(s): ${uniqueHits.join(', ')}`,
      '',
      'See:',
      `- 30-draft/chapters/${chapterLabel(currentChapter.number)}.md`,
      '- writer-subagent.md (meta-reference rule)',
    ]));
  }
```

- [ ] **Step 4: Verify TypeScript compilation**

```bash
npx tsc --noEmit
```

Expected: No errors.

---

### Task 5: Add test for meta-reference detection in validators

**Files:**
- Modify: `tests/validators.test.js`

- [ ] **Step 1: Write the failing test**

Insert a new test before the last `test(...)` block in the file:

```javascript
test('drafting validator in progress mode warns on meta-reference phrasing (第四面墙 break)', () => {
  const root = makeTempProject();
  writeDraftingBaseProject(root, {
    workflowStatus: [
      '# Workflow Status',
      '',
      '- Project: test-book',
      '- Status: draft_in_progress',
      '- Current Stage: novel-drafting',
      '- Planned Chapters: 4',
      '- Completed Chapters: 3',
      '- Last Completed Chapter: 3',
      '- Blocking Issues:',
      '  -',
      '- Next Allowed Skill: novel-drafting',
      '- Last Updated: 2026-04-22',
    ].join('\n'),
    chapterPlan: [
      '# Chapter Plan',
      '',
      '## Overview',
      '',
      '- Total Chapters: 4',
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
      '',
      '### Chapter 3',
      '- Title: River Hush',
      '- POV: Lin',
      '- Word Target: 1200-1600',
      '- Goal: Deepen suspicion around the convoy crew.',
      '- Key Events: Lin questions the deckhands.',
      '- Characters: Lin, Boatmaster Qiu',
      '',
      '### Chapter 4',
      '- Title: Split Current',
      '- POV: Lin',
      '- Word Target: 1200-1600',
      '- Goal: Push Lin into an overinterpreted confrontation.',
      '- Key Events: Lin confronts Qiu too early.',
      '- Characters: Lin, Boatmaster Qiu',
    ].join('\n'),
  });

  // Baseline chapters: no meta-references, normal prose
  const normalProse = '江风推着船篷向前，Lin看着水面，心里记下每一次晃动。'.repeat(60);
  writeFile(root, '30-draft/chapters/chapter-01.md', makeChapterContent(normalProse));
  writeFile(root, '30-draft/chapters/chapter-02.md', makeChapterContent(normalProse, {
    chapterNumber: 2,
    title: 'Chapter 2',
    goal: 'Reveal the sabotage attempt without solving it.',
  }));
  writeFile(root, '30-draft/chapters/chapter-03.md', makeChapterContent(normalProse, {
    chapterNumber: 3,
    title: 'Chapter 3',
    goal: 'Deepen suspicion around the convoy crew.',
  }));

  // Current chapter: contains meta-reference phrasing
  const metaContent = [
    '就像第三章发生的那样，她又感觉到了那种被人盯上的寒意。',
    '前文所述的那根缆绳，现在已经被清理干净了。',
    '他压低声音，仿佛上一章的冲突从未发生过。',
    '这是这一卷里最危险的一次试探。',
  ];
  const paddedContent = metaContent.map((line) => line.repeat(30)).join('\n');
  writeFile(root, '30-draft/chapters/chapter-04.md', makeChapterContent(paddedContent, {
    chapterNumber: 4,
    title: 'Chapter 4',
    goal: 'Push Lin into an overinterpreted confrontation.',
  }));

  writeFile(root, '30-draft/continuity/chapter-01-state.md', makeContinuityStateContent(1));
  writeFile(root, '30-draft/continuity/chapter-02-state.md', makeContinuityStateContent(2, {
    characterKnowledgeChanges: ['- Lin | The sabotage was deliberate. | suspected | source=chapter-02'],
    knowledgeTransitionNotes: ['- Lin | The sabotage was deliberate. | basis=Lin found the rope fibers cut cleanly.'],
  }));
  writeFile(root, '30-draft/continuity/chapter-03-state.md', makeContinuityStateContent(3, {
    characterKnowledgeChanges: ['- Lin | A crew member is covering for the saboteur. | suspected | source=chapter-03'],
    knowledgeTransitionNotes: ['- Lin | A crew member is covering for the saboteur. | basis=A deckhand changed his story twice.'],
  }));
  writeFile(root, '30-draft/continuity/chapter-04-state.md', makeContinuityStateContent(4, {
    stateStatus: 'proposed',
    characterKnowledgeChanges: ['- Lin | Qiu is evading direct questions. | suspected | source=chapter-04'],
    knowledgeTransitionNotes: ['- Lin | Qiu is evading direct questions. | basis=Qiu changed the subject three times.'],
  }));
  writeFile(root, '30-draft/continuity/story-state.md', makeStoryStateContent(3, {
    characterKnowledge: [
      '- Lin | The mooring line was cut on purpose. | confirmed | source=chapter-01',
      '- Lin | The sabotage was deliberate. | suspected | source=chapter-02',
      '- Lin | A crew member is covering for the saboteur. | suspected | source=chapter-03',
    ],
  }));
  for (const chapterNumber of [1, 2, 3]) {
    writeFile(root, `40-review/chapter-reviews/chapter-${String(chapterNumber).padStart(2, '0')}-review.md`, [
      `# Chapter ${chapterNumber} Review`,
      '',
      '## Metadata',
      `- Chapter Number: ${chapterNumber}`,
      '- Decision: 通过',
      '- Reviewer Status: completed',
      '',
      '## Checks',
      '- Word Count: pass',
      '- Knowledge Boundary: pass',
      '- Style Drift: pass',
      '',
      '## Findings',
      '- None.',
      '',
      '## Continuity Findings',
      '- Clean: no continuity conflicts found.',
      '',
      '## Required Revisions',
      '- None',
    ].join('\n'));
  }

  const result = runValidator(
    path.join('skills', 'novel-drafting', 'scripts', 'validate-drafting-project.mts'),
    ['--project-root', root, '--mode', 'Progress'],
  );

  assert.equal(result.status, 0);
  assert.match(result.stdout, /meta-referential/);
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
node --test tests/validators.test.js --test-name-pattern "meta-reference"
```

Expected: FAIL — the meta-reference detection code isn't written yet. The validator won't produce meta-reference warnings.

- [ ] **Step 3: Run the test after Task 4 to verify it passes**

```bash
node --test tests/validators.test.js --test-name-pattern "meta-reference"
```

Expected: PASS — the meta-reference detection function catches the phrases and produces a warning.

---

### Task 6: Run full test suite and verify

**Files:**
- None (verification only)

- [ ] **Step 1: Run full test suite**

```bash
npm test
```

Expected: All tests pass, including the new meta-reference test.

- [ ] **Step 2: Run portability guard**

```bash
node --import tsx --test tests/validators.test.js --test-name-pattern "skill source files do not depend on repo-root shared script paths"
```

Expected: PASS.

- [ ] **Step 3: Run typecheck**

```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add skills/novel-drafting/writer-subagent.md skills/novel-drafting/reviewer-subagent.md skills/novel-drafting/scripts/checks/check-style-drift.mts skills/novel-drafting/lint-contract.md tests/validators.test.js
git commit -m "feat(drafting): add three-layer meta-reference guard against fourth-wall breaks"
```

---

### Task 7: Update progress.md

**Files:**
- Modify: `progress.md`

- [ ] **Step 1: Record completion**

Add entry noting meta-reference guard implementation complete, with the files changed and test status.
