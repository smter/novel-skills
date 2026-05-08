const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

function makeTempProject() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'novel-skills-'));
}

function writeFile(root, relativePath, content) {
  const fullPath = path.join(root, relativePath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content);
}

function runValidator(scriptPath, args) {
  return spawnSync(process.execPath, ['--experimental-strip-types', scriptPath, ...args], {
    encoding: 'utf8',
    cwd: path.resolve(__dirname, '..'),
  });
}

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
  fs.mkdirSync(path.join(root, '20-story', 'characters'), { recursive: true });
  writeFile(root, '20-story/characters/test-character.md', overrides.charactersCard ?? [
    '# Test',
    '',
    '## 身份定位',
    '- **身份**：Protagonist',
    '',
    '## 角色档案',
    '- **简介**：A test character',
    '',
    '## 情景设定',
    'Test scenario',
  ].join('\n'));
  writeFile(root, '20-story/character-relationships.md', overrides.characterRelationships ?? [
    '# 角色关系',
    '',
    '## Test ↔ Other',
    '- **关系类型**：Ally',
  ].join('\n'));
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

function collectFiles(root) {
  const results = [];
  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    const fullPath = path.join(root, entry.name);
    if (entry.isDirectory()) {
      results.push(...collectFiles(fullPath));
      continue;
    }
    results.push(fullPath);
  }
  return results;
}

function makeChapterContent(text, options = {}) {
  const chapterNumber = options.chapterNumber ?? 1;
  const title = options.title ?? `Chapter ${chapterNumber}`;
  const goal = options.goal ?? 'Get Lin onto the river convoy.';
  return [
    `# ${title}`,
    '',
    '## Metadata',
    `- Chapter Number: ${chapterNumber}`,
    `- Chapter Goal: ${goal}`,
    '- Target Word Range: 1200-1600',
    '- Draft Status: drafted',
    '',
    '## Summary',
    `- Summary for chapter ${chapterNumber}.`,
    '',
    '## Content',
    text,
  ].join('\n');
}

function makeContinuityStateContent(chapterNumber, overrides = {}) {
  return [
    `# Chapter ${chapterNumber} State Update`,
    '',
    '## Metadata',
    `- Chapter Number: ${chapterNumber}`,
    `- Source Chapter: 30-draft/chapters/chapter-${String(chapterNumber).padStart(2, '0')}.md`,
    `- State Status: ${overrides.stateStatus ?? 'approved'}`,
    '',
    '## New Facts Confirmed',
    ...(overrides.newFactsConfirmed ?? ['- Lin confirms the sabotage was intentional.']),
    '',
    '## Character Knowledge Changes',
    ...(overrides.characterKnowledgeChanges ?? ['- Lin | The mooring line was cut on purpose. | confirmed | source=chapter-01']),
    '',
    '## Knowledge Transition Notes',
    ...(overrides.knowledgeTransitionNotes ?? ['- Lin | The mooring line was cut on purpose. | basis=Lin inspected the cut fibers herself.']),
    '',
    '## One-Time Events Triggered',
    ...(overrides.oneTimeEventsTriggered ?? ['- First discovery of the sabotage attempt | consumed=yes']),
    '',
    '## Relationship State Changes',
    ...(overrides.relationshipStateChanges ?? ['- Lin trusts Boatmaster Qiu slightly less.']),
    '',
    '## Open Secrets Remaining',
    ...(overrides.openSecretsRemaining ?? ['- The saboteur identity remains unknown.']),
    '',
    '## Continuity Notes For Next Chapter',
    ...(overrides.continuityNotes ?? ['- Do not present the sabotage as a first-time discovery again.']),
  ].join('\n');
}

function makeStoryStateContent(lastApprovedChapter, overrides = {}) {
  return [
    '# Story State',
    '',
    '## Covered Through',
    `- Last Approved Chapter: ${lastApprovedChapter}`,
    '',
    '## Confirmed Facts',
    ...(overrides.confirmedFacts ?? ['- The sabotage attempt was intentional.']),
    '',
    '## Character Knowledge',
    ...(overrides.characterKnowledge ?? ['- Lin | The mooring line was cut on purpose. | confirmed | source=chapter-01']),
    '',
    '## One-Time Events Consumed',
    ...(overrides.oneTimeEventsConsumed ?? ['- First discovery of the sabotage attempt: chapter-01']),
    '',
    '## Relationship State',
    ...(overrides.relationshipState ?? ['- Lin is wary of Boatmaster Qiu.']),
    '',
    '## Open Secrets',
    ...(overrides.openSecrets ?? ['- The saboteur identity']),
    '',
    '## Locked Continuity Rules',
    ...(overrides.lockedRules ?? ['- Do not restage the sabotage discovery as new information.']),
  ].join('\n');
}

test('drafting parser extracts ordered planned chapters and word targets', async () => {
  const { parseChapterPlan } = await import('../skills/novel-drafting/scripts/lib/parse-chapter-plan.mts');
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

test('skill source files do not depend on repo-root shared script paths', () => {
  const skillsRoot = path.join(__dirname, '..', 'skills');
  const sourceFiles = collectFiles(skillsRoot).filter((filePath) =>
    /\.(md|mts)$/u.test(filePath)
    && !/\/tests?\//u.test(filePath)
    && !/\/testing\//u.test(filePath),
  );

  const offenders = [];

  for (const filePath of sourceFiles) {
    const content = fs.readFileSync(filePath, 'utf8');
    if (
      content.includes('../../../scripts/lib/')
      || content.includes('../../../../scripts/lib/')
      || content.includes('node --import tsx skills/novel-')
      || content.includes('skills/novel-drafting/scripts/')
      || content.includes('skills/novel-delivery/scripts/')
      || content.includes('skills/novel-research/scripts/')
    ) {
      offenders.push(path.relative(path.join(__dirname, '..'), filePath));
    }
  }

  assert.deepEqual(offenders, []);
});

test('skill runtime docs do not require tsx module resolution from the caller cwd', () => {
  const skillsRoot = path.join(__dirname, '..', 'skills');
  const markdownFiles = collectFiles(skillsRoot).filter((filePath) => /\.md$/u.test(filePath));
  const offenders = [];

  for (const filePath of markdownFiles) {
    const content = fs.readFileSync(filePath, 'utf8');
    if (
      content.includes('node --import tsx <skill-root>/scripts/')
      || content.includes('node --import tsx ../scripts/')
      || content.includes('node --import tsx scripts/')
    ) {
      offenders.push(path.relative(path.join(__dirname, '..'), filePath));
    }
  }

  assert.deepEqual(offenders, []);
});

test('research validator is invokable through the strip-types entrypoint', () => {
  const root = makeTempProject();

  writeFile(root, '00-project/project-brief.md', [
    '# Project Brief',
    '',
    '## Working Title',
    '《蛇吻》',
    '',
    '## Genre/Type',
    '都市惊悚复仇小说',
    '',
    '## Target Audience',
    '喜欢快节奏女性复仇题材的网文读者',
    '',
    '## Target Length',
    '中篇，约 12 章',
    '',
    '## Core Premise',
    '女主在一场精心设计的事故后发现自己被最亲近的人出卖，决定反向布局复仇。',
    '',
    '## Central Conflict',
    '她必须在保存证据与保护家人之间做选择，同时躲开幕后黑手的清除行动。',
    '',
    '## Protagonist Goal',
    '找出真正主谋并让对方在公众面前失去一切。',
    '',
    '## Content Boundaries',
    '不要洗白加害者，不要超自然设定。',
  ].join('\n'));
  writeFile(root, '00-project/success-criteria.md', [
    '# Success Criteria',
    '',
    '- Target Audience: 女性向悬疑读者',
    '- Length Tier: novella',
    '- Planned Chapters: 12',
    '- Target Total Words: 24000-30000',
    '- Per-Chapter Word Range: 1800-2500',
    '- Completion Rule: all planned chapters drafted and approved',
    '- Review Pass Rule: every planned chapter review must be 通过',
  ].join('\n'));
  writeFile(root, '00-project/workflow-status.md', [
    'Status: research_complete',
    'Current Stage: novel-research',
    'Planned Chapters: 12',
    'Completed Chapters: 0',
    'Blocking Issues: none',
    'Next Allowed Skill: novel-drafting',
  ].join('\n'));
  writeFile(root, '10-research/topic-research.md', [
    '# Topic Research',
    '',
    '- Legal realism: 公开举报需要留存可验证的时间线与资金流证据。',
    '- Investigation risk: 私人调查容易触发反制和证据销毁。',
  ].join('\n'));
  writeFile(root, '10-research/setting-research.md', [
    '# Setting Research',
    '',
    '- 城市环境: 沿江新一线城市，夜生活密集，监控覆盖高。',
    '- Occupational detail: 媒体从业者接触爆料时更依赖匿名信箱与线下交接。',
  ].join('\n'));
  writeFile(root, '10-research/style-research.md', [
    '# Style Research',
    '',
    '- 叙事风格: 近距离第三人称，句子偏短，强调压迫感与反击节奏。',
    '- 禁忌: 避免大段背景说明，避免自怜式独白。',
  ].join('\n'));
  writeFile(root, '10-research/references.md', [
    '## Source Entry',
    '- Source: 记者行业访谈',
    '- Type: interview',
    '- Reliability: medium',
    '- Notes: 确认匿名爆料与证据保全的常见流程。',
    '',
    '## Open Question',
    '- Question: 女主能否合法取得公司账目截图？',
    '- Status: pending',
    '- Notes: 需要补查劳动纠纷中的证据使用边界。',
    '',
    '## Inference Note',
    '- Inference: 反派会先尝试舆论抹黑，再尝试物理灭证。',
    '- Basis: 同类案件里公共关系与法律威胁通常先于暴力升级。',
    '- Confidence: medium',
    '- Notes: 可作为前三章压力来源。',
  ].join('\n'));
  fs.mkdirSync(path.join(root, '20-story', 'characters'), { recursive: true });
  writeFile(root, '20-story/characters/lin-wen.md', [
    '# 林闻',
    '',
    '## 身份定位',
    '- **身份**：媒体从业者',
    '- **年龄**：28',
    '',
    '## 角色档案',
    '- **简介**：女主，调查记者，在伴侣死后发现他参与了伪造事故',
    '- **欲望**：公开真相并复仇',
    '- **恐惧**：家人因此受害',
    '',
    '## 情景设定',
    '葬礼后收到匿名证据，发现至爱之人的背叛。',
  ].join('\n'));
  writeFile(root, '20-story/character-relationships.md', [
    '# 角色关系',
    '',
    '## 林闻 ↔ 周叙',
    '- **关系类型**：恋人→背叛者',
    '- **关系阶段**：已故/虚假',
    '- **状态**：周叙已死，但其伪造行为成为林闻复仇的起点。',
  ].join('\n'));
  writeFile(root, '20-story/plot-outline.md', [
    '# Plot Outline',
    '',
    '## Story Spine',
    '- Opening: 林闻在葬礼后收到匿名证据。',
    '- Inciting Incident: 她发现恋人参与伪造事故记录。',
    '- Midpoint: 她反向设局，诱使反派以为证据已经销毁。',
    '- Crisis: 家人被威胁，她必须决定是否提前公开。',
    '- Climax: 她在直播发布会上公开关键账本与录音。',
    '- Resolution: 反派名誉与资产崩塌，但她也失去原有生活。',
  ].join('\n'));
  writeFile(root, '20-story/foreshadowing.md', [
    '# Foreshadowing',
    '',
    '- Setup: 第一章提到被删改的监控时间戳。',
    '- Payoff: 第九章用时间戳漏洞击穿伪证链。',
  ].join('\n'));
  writeFile(root, '30-draft/chapter-plan.md', [
    '# Chapter Plan',
    '',
    '## Overview',
    '',
    '- Total Chapters: 12',
    '- Target Per Chapter: 1800-2500',
    '',
    '## Chapter List',
    '',
    '### Chapter 1',
    '- Title: 葬礼后的匿名信',
    '- POV: 林闻',
    '- Word Target: 1800-2500',
    '- Goal: 让女主拿到第一批证据并决定反击。',
    '- Key Events: 匿名信到达；发现时间戳被改；决定不报警。',
    '- Characters: 林闻, 周叙',
  ].join('\n'));

  const result = runValidator(
    path.join('skills', 'novel-research', 'scripts', 'validate-research-project.mts'),
    ['--project-root', root],
  );

  assert.equal(result.status, 0);
  assert.match(result.stdout, /Research validation passed\./);
});

test('research validator passes for a complete scaffold', () => {
  const root = makeTempProject();

  writeFile(root, '00-project/project-brief.md', [
    '# Project Brief',
    '',
    '## Working Title',
    '《河灯未熄》',
    '',
    '## Genre/Type',
    '现实向悬疑成长小说',
    '',
    '## Target Audience',
    '偏爱慢热悬疑和角色成长的读者',
    '',
    '## Target Length',
    '中篇，约 10 章',
    '',
    '## Core Premise',
    '女主在调查父亲旧案时，被迫重返自己逃离多年的故乡。',
    '',
    '## Central Conflict',
    '她想查清真相，但每靠近一步都会伤到仍住在当地的亲人。',
    '',
    '## Protagonist Goal',
    '证明父亲不是纵火案真凶，并找出真正受益者。',
    '',
    '## Content Boundaries',
    '不加入超能力和命运论反转。',
  ].join('\n'));
  writeFile(root, '00-project/success-criteria.md', [
    '# Success Criteria',
    '',
    '- Target Audience: 悬疑成长向读者',
    '- Length Tier: novella',
    '- Planned Chapters: 10',
    '- Target Total Words: 22000-28000',
    '- Per-Chapter Word Range: 1800-2400',
    '- Completion Rule: all planned chapters drafted and approved',
    '- Review Pass Rule: every planned chapter review must be 通过',
  ].join('\n'));
  writeFile(root, '00-project/workflow-status.md', [
    'Status: research_complete',
    'Current Stage: novel-research',
    'Planned Chapters: 10',
    'Completed Chapters: 0',
    'Blocking Issues: none',
    'Next Allowed Skill: novel-drafting',
  ].join('\n'));
  writeFile(root, '10-research/topic-research.md', '# Topic Research\n\n- 县域旧案重审通常受到熟人社会压力影响。\n');
  writeFile(root, '10-research/setting-research.md', '# Setting Research\n\n- 故乡临江、工厂停产后人口外流，夜间渡口空旷。\n');
  writeFile(root, '10-research/style-research.md', '# Style Research\n\n- 风格偏克制，压抑感通过细节而非说教呈现。\n');
  writeFile(root, '10-research/references.md', [
    '## Source Entry',
    '- Source: 地方新闻旧档案',
    '- Type: archive',
    '- Reliability: medium',
    '- Notes: 可为旧案时间线提供素材。',
    '',
    '## Open Question',
    '- Question: 故乡渡口夜间是否仍有人值守？',
    '- Status: open',
    '- Notes: 关系到夜探戏的可信度。',
    '',
    '## Inference Note',
    '- Inference: 真凶与旧工厂拆迁利益有关。',
    '- Basis: 父亲死亡与停产节点高度重合。',
    '- Confidence: medium',
    '- Notes: 适合在中段逐步揭示。',
  ].join('\n'));
  fs.mkdirSync(path.join(root, '20-story', 'characters'), { recursive: true });
  writeFile(root, '20-story/characters/shen-zhi.md', '# 沈枝\n\n## 身份定位\n- **身份**：记者\n\n## 角色档案\n- **简介**：女主，为父亲翻案\n- **创伤**：对故乡与亲人的长期逃避\n\n## 情景设定\n回乡奔丧，发现父亲遗物。\n');
  writeFile(root, '20-story/character-relationships.md', '# 角色关系\n\n## 沈枝 ↔ 赵屿\n- **关系类型**：旧友\n- **关系阶段**：疏远后重逢\n');
  writeFile(root, '20-story/plot-outline.md', '# Plot Outline\n\n## Story Spine\n- Opening: 沈枝回乡奔丧。\n- Inciting Incident: 她发现父亲遗物里藏有失踪证词。\n- Midpoint: 她确认旧案有人篡改消防记录。\n- Crisis: 关键证人突然失踪。\n- Climax: 她在拆迁听证会上公开录音与账本。\n- Resolution: 旧案重启调查，故乡关系却再也回不到从前。\n');
  writeFile(root, '20-story/foreshadowing.md', '# Foreshadowing\n\n- Setup: 第一章出现被雨水浸坏的旧录音笔。\n- Payoff: 第八章恢复录音后揭露篡改指令。\n');
  writeFile(root, '30-draft/chapter-plan.md', [
    '# Chapter Plan',
    '',
    '## Overview',
    '',
    '- Total Chapters: 10',
    '- Target Per Chapter: 1800-2400',
    '',
    '## Chapter List',
    '',
    '### Chapter 1',
    '- Title: 回乡',
    '- POV: 沈枝',
    '- Word Target: 1800-2400',
    '- Goal: 让女主被迫回到故乡并接触旧案线索。',
    '- Key Events: 回乡奔丧；发现录音笔；与旧友重逢。',
    '- Characters: 沈枝, 赵屿',
  ].join('\n'));

  const result = runValidator(
    path.join('skills', 'novel-research', 'scripts', 'validate-research-project.mts'),
    ['--project-root', root],
  );

  assert.equal(result.status, 0);
  assert.match(result.stdout, /Research validation passed\./);
});

test('research validator rejects a generic current stage value', () => {
  const root = makeTempProject();

  writeFile(root, '00-project/project-brief.md', '# Project Brief\n\n## Working Title\n《试作》\n\n## Genre/Type\n悬疑\n\n## Target Audience\n网文读者\n\n## Target Length\n中篇\n\n## Core Premise\n主角调查好友失踪。\n\n## Central Conflict\n调查会伤害现有关系。\n\n## Protagonist Goal\n找回好友。\n\n## Content Boundaries\n不要超自然。\n');
  writeFile(root, '00-project/success-criteria.md', '# Success Criteria\n\n- Target Audience: 网文读者\n- Length Tier: novella\n- Planned Chapters: 8\n- Target Total Words: 16000-22000\n- Per-Chapter Word Range: 1800-2400\n- Completion Rule: all planned chapters drafted and approved\n- Review Pass Rule: every planned chapter review must be 通过\n');
  writeFile(root, '00-project/workflow-status.md', 'Status: research_complete\nCurrent Stage: research\nPlanned Chapters: 8\nCompleted Chapters: 0\nBlocking Issues: none\nNext Allowed Skill: novel-drafting\n');
  writeFile(root, '10-research/topic-research.md', '# Topic Research\n\n- 线人通常不会在线上直接传递完整证据。\n');
  writeFile(root, '10-research/setting-research.md', '# Setting Research\n\n- 故事发生在沿海旅游城市的淡季。\n');
  writeFile(root, '10-research/style-research.md', '# Style Research\n\n- 叙事要求冷静克制，避免戏剧化旁白。\n');
  writeFile(root, '10-research/references.md', '## Source Entry\n- Source: 采访\n- Type: interview\n- Reliability: medium\n- Notes: 提供线人行为参考。\n\n## Open Question\n- Question: 监控保留多久？\n- Status: open\n- Notes: 影响取证窗口。\n\n## Inference Note\n- Inference: 反派会先抹黑主角。\n- Basis: 同类故事压力来源。\n- Confidence: low\n- Notes: 需后续验证。\n');
  fs.mkdirSync(path.join(root, '20-story', 'characters'), { recursive: true });
  writeFile(root, '20-story/characters/qi-yao.md', '# 祁遥\n\n## 身份定位\n- **身份**：调查者\n\n## 角色档案\n- **简介**：主角，调查好友失踪\n');
  writeFile(root, '20-story/character-relationships.md', '# 角色关系\n\n## 祁遥 ↔ 某角色\n- **关系类型**：待定\n');
  writeFile(root, '20-story/plot-outline.md', '# Plot Outline\n\n## Story Spine\n- Opening: 主角返城。\n- Midpoint: 她发现熟人撒谎。\n- Resolution: 她找到失踪者。\n');
  writeFile(root, '20-story/foreshadowing.md', '# Foreshadowing\n\n- Setup: 第一章提到坏掉的手机。\n- Payoff: 第六章恢复短信记录。\n');
  writeFile(root, '30-draft/chapter-plan.md', '# Chapter Plan\n\n## Overview\n- Total Chapters: 8\n- Target Per Chapter: 1800-2400\n\n## Chapter List\n\n### Chapter 1\n- Title: 返城\n- POV: 祁遥\n- Word Target: 1800-2400\n- Goal: 让主角接到求救信息。\n- Key Events: 返城；发现异常；决定调查。\n- Characters: 祁遥\n');

  const result = runValidator(
    path.join('skills', 'novel-research', 'scripts', 'validate-research-project.mts'),
    ['--project-root', root],
  );

  assert.equal(result.status, 1);
  assert.match(result.stdout, /Current Stage/i);
  assert.match(result.stdout, /novel-research/i);
});

test('research validator rejects thin placeholder-like scaffolds', () => {
  const root = makeTempProject();

  writeFile(root, '00-project/project-brief.md', [
    '# Project Brief',
    '',
    '## Working Title',
    '《待补》',
    '',
    '## Genre/Type',
    '悬疑',
    '',
    '## Target Audience',
    '读者',
    '',
    '## Target Length',
    '中篇',
    '',
    '## Core Premise',
    '待补充',
    '',
    '## Central Conflict',
    '待补充',
    '',
    '## Protagonist Goal',
    '待补充',
    '',
    '## Content Boundaries',
    '无',
  ].join('\n'));
  writeFile(root, '00-project/success-criteria.md', '# Success Criteria\n\n- Target Audience: 读者\n- Length Tier: novella\n- Planned Chapters: 8\n- Target Total Words: 16000-22000\n- Per-Chapter Word Range: 1800-2400\n- Completion Rule: done\n- Review Pass Rule: pass\n');
  writeFile(root, '00-project/workflow-status.md', 'Status: research_complete\nCurrent Stage: novel-research\nPlanned Chapters: 8\nCompleted Chapters: 0\nBlocking Issues: none\nNext Allowed Skill: novel-drafting\n');
  writeFile(root, '10-research/topic-research.md', 'topic');
  writeFile(root, '10-research/setting-research.md', 'setting');
  writeFile(root, '10-research/style-research.md', 'style');
  writeFile(root, '10-research/references.md', '## Source Entry\n- Source: {{source}}\n\n## Open Question\n- Question: {{question}}\n\n## Inference Note\n- Inference: {{inference}}\n');
  fs.mkdirSync(path.join(root, '20-story', 'characters'), { recursive: true });
  writeFile(root, '20-story/characters/placeholder.md', 'characters');
  writeFile(root, '20-story/character-relationships.md', 'relationships');
  writeFile(root, '20-story/plot-outline.md', '# Plot Outline\n\n## Story Spine\n- Opening: {{opening}}\n- Midpoint: {{midpoint}}\n- Resolution: {{resolution}}\n');
  writeFile(root, '20-story/foreshadowing.md', 'foreshadowing');
  writeFile(root, '30-draft/chapter-plan.md', '# Chapter Plan\n\n## Overview\n\n## Chapter List\n\n### Chapter 1\n');

  const result = runValidator(
    path.join('skills', 'novel-research', 'scripts', 'validate-research-project.mts'),
    ['--project-root', root],
  );

  assert.equal(result.status, 1);
  assert.match(result.stdout, /too thin|placeholder|insufficient/i);
});

test('drafting validator fails when a planned review is not passing', () => {
  const root = makeTempProject();

  writeFile(root, '00-project/project-brief.md', 'brief');
  writeFile(root, '00-project/success-criteria.md', 'criteria');
  writeFile(root, '00-project/workflow-status.md', [
    'Status: draft_in_progress',
    'Current Stage: drafting',
    'Completed Chapters: 0',
    'Last Completed Chapter: 0',
    'Blocking Issues: none',
    'Next Allowed Skill: novel-drafting',
  ].join('\n'));
  fs.mkdirSync(path.join(root, '20-story', 'characters'), { recursive: true });
  writeFile(root, '20-story/characters/test.md', '# Test\n\n## 身份定位\n- **身份**：Tester\n');
  writeFile(root, '20-story/character-relationships.md', '# 角色关系\n');
  writeFile(root, '20-story/plot-outline.md', 'plot');
  writeFile(root, '20-story/foreshadowing.md', 'foreshadowing');
  writeFile(root, '30-draft/chapter-plan.md', [
    '## Overview',
    '## Chapter List',
    '### Chapter 1',
  ].join('\n\n'));
  writeFile(root, '30-draft/chapters/chapter-01.md', makeChapterContent('江风推着船篷向前。'.repeat(180)));
  writeFile(root, '30-draft/continuity/chapter-01-state.md', makeContinuityStateContent(1, {
    stateStatus: 'proposed',
  }));
  writeFile(root, '30-draft/continuity/story-state.md', makeStoryStateContent(0));
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
    '- Knowledge Boundary: pass',
    '- Style Drift: pass',
    '',
    '## Findings',
    '- The chapter is still too short.',
    '',
    '## Continuity Findings',
    '- Clean: no continuity conflicts found.',
    '',
    '## Required Revisions',
    '- Expand the river convoy sequence.',
    '',
    'Decision: 不通过',
  ].join('\n'));

  fs.mkdirSync(path.join(root, '30-draft', 'chapters'), { recursive: true });
  fs.mkdirSync(path.join(root, '40-review', 'chapter-reviews'), { recursive: true });

  const result = runValidator(
    path.join('skills', 'novel-drafting', 'scripts', 'validate-drafting-project.mts'),
    ['--project-root', root],
  );

  assert.equal(result.status, 1);
  assert.match(result.stdout, /Drafting validation failed for mode Completion:/);
  assert.match(result.stdout, /does not contain a passing decision/);
});

test('drafting validator passes in progress mode when the current chapter review is not passing yet', () => {
  const root = makeTempProject();
  writeDraftingBaseProject(root, {
    workflowStatus: [
      '# Workflow Status',
      '',
      '- Project: test-book',
      '- Status: draft_in_progress',
      '- Current Stage: novel-drafting',
      '- Planned Chapters: 2',
      '- Completed Chapters: 0',
      '- Last Completed Chapter: 0',
      '- Blocking Issues:',
      '  -',
      '- Next Allowed Skill: novel-drafting',
      '- Last Updated: 2026-04-22',
    ].join('\n'),
  });
  writeFile(root, '30-draft/chapters/chapter-01.md', makeChapterContent('江风推着船篷向前。'.repeat(180)));
  writeFile(root, '30-draft/continuity/chapter-01-state.md', makeContinuityStateContent(1, {
    stateStatus: 'proposed',
  }));
  writeFile(root, '30-draft/continuity/story-state.md', makeStoryStateContent(0));
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
    '- Knowledge Boundary: pass',
    '- Style Drift: pass',
    '',
    '## Findings',
    '- The sabotage setup lands too softly.',
    '',
    '## Continuity Findings',
    '- Clean: no continuity conflicts found.',
    '',
    '## Required Revisions',
    '- Strengthen the final beat before the chapter ends.',
  ].join('\n'));

  const result = runValidator(
    path.join('skills', 'novel-drafting', 'scripts', 'validate-drafting-project.mts'),
    ['--project-root', root, '--mode', 'Progress'],
  );

  assert.equal(result.status, 0);
  assert.match(result.stdout, /Drafting validation passed for mode Progress\./);
});

test('drafting validator in completion mode fails when later chapters are still missing', () => {
  const root = makeTempProject();

  writeFile(root, '00-project/project-brief.md', 'brief');
  writeFile(root, '00-project/success-criteria.md', 'criteria');
  writeFile(root, '00-project/workflow-status.md', [
    'Status: draft_in_progress',
    'Current Stage: drafting',
    'Completed Chapters: 1',
    'Last Completed Chapter: 1',
    'Blocking Issues: none',
    'Next Allowed Skill: novel-drafting',
  ].join('\n'));
  fs.mkdirSync(path.join(root, '20-story', 'characters'), { recursive: true });
  writeFile(root, '20-story/characters/test.md', '# Test\n\n## 身份定位\n- **身份**：Tester\n');
  writeFile(root, '20-story/character-relationships.md', '# 角色关系\n');
  writeFile(root, '20-story/plot-outline.md', 'plot');
  writeFile(root, '20-story/foreshadowing.md', 'foreshadowing');
  writeFile(root, '30-draft/chapter-plan.md', [
    '## Overview',
    '## Chapter List',
    '### Chapter 1',
    '### Chapter 2',
  ].join('\n\n'));
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
    '## Continuity Findings',
    '- Clean: no continuity conflicts found.',
    '',
    '## Required Revisions',
    '- None',
  ].join('\n'));

  fs.mkdirSync(path.join(root, '30-draft', 'chapters'), { recursive: true });
  fs.mkdirSync(path.join(root, '40-review', 'chapter-reviews'), { recursive: true });

  const result = runValidator(
    path.join('skills', 'novel-drafting', 'scripts', 'validate-drafting-project.mts'),
    ['--project-root', root, '--mode', 'Completion'],
  );

  assert.equal(result.status, 1);
  assert.match(result.stdout, /Missing chapter file for planned chapter 2/);
});

test('drafting validator in entry mode fails when workflow status is not research_complete or draft_blocked', () => {
  const root = makeTempProject();
  writeDraftingBaseProject(root, {
    workflowStatus: [
      '# Workflow Status',
      '',
      '- Project: test-book',
      '- Status: initialized',
      '- Current Stage: novel-drafting',
      '- Planned Chapters: 2',
      '- Completed Chapters: 0',
      '- Last Completed Chapter:',
      '- Blocking Issues:',
      '  -',
      '- Next Allowed Skill: novel-drafting',
      '- Last Updated: 2026-04-22',
    ].join('\n'),
  });

  const result = runValidator(
    path.join('skills', 'novel-drafting', 'scripts', 'validate-drafting-project.mts'),
    ['--project-root', root, '--mode', 'Entry'],
  );

  assert.equal(result.status, 1);
  assert.match(result.stdout, /workflow status/i);
  assert.match(result.stdout, /research_complete|draft_blocked/i);
});

test('drafting validator in entry mode fails when workflow current stage is still novel-research', () => {
  const root = makeTempProject();
  writeDraftingBaseProject(root, {
    workflowStatus: [
      '# Workflow Status',
      '',
      '- Project: test-book',
      '- Status: research_complete',
      '- Current Stage: novel-research',
      '- Planned Chapters: 2',
      '- Completed Chapters: 0',
      '- Last Completed Chapter:',
      '- Blocking Issues:',
      '  -',
      '- Next Allowed Skill: novel-drafting',
      '- Last Updated: 2026-04-22',
    ].join('\n'),
  });

  const result = runValidator(
    path.join('skills', 'novel-drafting', 'scripts', 'validate-drafting-project.mts'),
    ['--project-root', root, '--mode', 'Entry'],
  );

  assert.equal(result.status, 1);
  assert.match(result.stdout, /Current Stage/i);
  assert.match(result.stdout, /novel-research|novel-drafting/i);
});

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
    '江风推着船篷向前。'.repeat(700),
  ].join('\n'));

  const result = runValidator(
    path.join('skills', 'novel-drafting', 'scripts', 'validate-drafting-project.mts'),
    ['--project-root', root, '--mode', 'Progress'],
  );

  assert.equal(result.status, 1);
  assert.match(result.stdout, /Chapter Number/i);
  assert.match(result.stdout, /chapter-01\.md/i);
});

test('drafting validator in progress mode fails when a failed review has no actionable revisions', () => {
  const root = makeTempProject();
  writeDraftingBaseProject(root);
  writeFile(root, '30-draft/chapters/chapter-01.md', makeChapterContent('江风推着船篷向前。'.repeat(700)));
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
    '## Continuity Findings',
    '- Clean: no continuity conflicts found.',
    '',
    '## Required Revisions',
    '- None',
  ].join('\n'));

  const result = runValidator(
    path.join('skills', 'novel-drafting', 'scripts', 'validate-drafting-project.mts'),
    ['--project-root', root, '--mode', 'Progress'],
  );

  assert.equal(result.status, 1);
  assert.match(result.stdout, /Required Revisions/i);
  assert.match(result.stdout, /actionable/i);
});

test('drafting validator in progress mode explains the required review decision format', () => {
  const root = makeTempProject();
  writeDraftingBaseProject(root);
  writeFile(root, '30-draft/chapters/chapter-01.md', makeChapterContent('江风推着船篷向前。'.repeat(700)));
  writeFile(root, '30-draft/continuity/chapter-01-state.md', makeContinuityStateContent(1, {
    stateStatus: 'proposed',
  }));
  writeFile(root, '30-draft/continuity/story-state.md', makeStoryStateContent(0));
  writeFile(root, '40-review/chapter-reviews/chapter-01-review.md', [
    '# Chapter 1 Review',
    '',
    '## Final Verdict',
    '- Result: 通过',
  ].join('\n'));

  const result = runValidator(
    path.join('skills', 'novel-drafting', 'scripts', 'validate-drafting-project.mts'),
    ['--project-root', root, '--mode', 'Progress'],
  );

  assert.equal(result.status, 1);
  assert.match(result.stdout, /## Metadata/i);
  assert.match(result.stdout, /Decision: 通过\|不通过/i);
  assert.match(result.stdout, /chapter-review\.md|reviewer-subagent\.md/i);
});

test('drafting validator in progress mode fails when a review omits continuity findings', () => {
  const root = makeTempProject();
  writeDraftingBaseProject(root);
  writeFile(root, '30-draft/chapters/chapter-01.md', makeChapterContent('江风推着船篷向前。'.repeat(180)));
  writeFile(root, '30-draft/continuity/chapter-01-state.md', makeContinuityStateContent(1, {
    stateStatus: 'proposed',
  }));
  writeFile(root, '30-draft/continuity/story-state.md', makeStoryStateContent(0));
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
    '- The chapter lands well.',
    '',
    '## Required Revisions',
    '- None',
  ].join('\n'));

  const result = runValidator(
    path.join('skills', 'novel-drafting', 'scripts', 'validate-drafting-project.mts'),
    ['--project-root', root, '--mode', 'Progress'],
  );

  assert.equal(result.status, 1);
  assert.match(result.stdout, /Continuity Findings/i);
  assert.match(result.stdout, /actionable/i);
});

test('drafting validator in progress mode fails when continuity findings are not structured', () => {
  const root = makeTempProject();
  writeDraftingBaseProject(root);
  writeFile(root, '30-draft/chapters/chapter-01.md', makeChapterContent('江风推着船篷向前。'.repeat(180)));
  writeFile(root, '30-draft/continuity/chapter-01-state.md', makeContinuityStateContent(1, {
    stateStatus: 'proposed',
  }));
  writeFile(root, '30-draft/continuity/story-state.md', makeStoryStateContent(0));
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
    '- The chapter lands well.',
    '',
    '## Continuity Findings',
    '- There is a continuity concern around the sabotage reveal.',
    '',
    '## Required Revisions',
    '- None',
  ].join('\n'));

  const result = runValidator(
    path.join('skills', 'novel-drafting', 'scripts', 'validate-drafting-project.mts'),
    ['--project-root', root, '--mode', 'Progress'],
  );

  assert.equal(result.status, 1);
  assert.match(result.stdout, /Continuity Findings/i);
  assert.match(result.stdout, /Clean:|Conflict:/i);
});

test('drafting validator in progress mode fails when character knowledge entries are not structured', () => {
  const root = makeTempProject();
  writeDraftingBaseProject(root, {
    workflowStatus: [
      '# Workflow Status',
      '',
      '- Project: test-book',
      '- Status: draft_in_progress',
      '- Current Stage: novel-drafting',
      '- Planned Chapters: 2',
      '- Completed Chapters: 1',
      '- Last Completed Chapter: 1',
      '- Blocking Issues:',
      '  -',
      '- Next Allowed Skill: novel-drafting',
      '- Last Updated: 2026-04-22',
    ].join('\n'),
  });
  writeFile(root, '30-draft/chapters/chapter-01.md', makeChapterContent('江风推着船篷向前。'.repeat(180)));
  writeFile(root, '30-draft/continuity/chapter-01-state.md', makeContinuityStateContent(1, {
    stateStatus: 'proposed',
    characterKnowledgeChanges: ['- Lin now knows the mooring line was cut on purpose.'],
    knowledgeTransitionNotes: ['- Lin | The mooring line was cut on purpose. | basis=Lin inspected the cut fibers herself.'],
  }));
  writeFile(root, '30-draft/continuity/story-state.md', makeStoryStateContent(1));
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
    '- Knowledge Boundary: pass',
    '- Style Drift: pass',
    '',
    '## Findings',
    '- The chapter lands well.',
    '',
    '## Continuity Findings',
    '- Clean: no continuity conflicts found.',
    '',
    '## Required Revisions',
    '- None',
  ].join('\n'));

  const result = runValidator(
    path.join('skills', 'novel-drafting', 'scripts', 'validate-drafting-project.mts'),
    ['--project-root', root, '--mode', 'Progress'],
  );

  assert.equal(result.status, 1);
  assert.match(result.stdout, /Character Knowledge/i);
  assert.match(result.stdout, /unknown\|suspected\|confirmed|source=chapter-XX/i);
});

test('drafting validator in progress mode fails when knowledge transitions are missing for confirmed knowledge changes', () => {
  const root = makeTempProject();
  writeDraftingBaseProject(root, {
    workflowStatus: [
      '# Workflow Status',
      '',
      '- Project: test-book',
      '- Status: draft_in_progress',
      '- Current Stage: novel-drafting',
      '- Planned Chapters: 2',
      '- Completed Chapters: 1',
      '- Last Completed Chapter: 1',
      '- Blocking Issues:',
      '  -',
      '- Next Allowed Skill: novel-drafting',
      '- Last Updated: 2026-04-22',
    ].join('\n'),
  });
  writeFile(root, '30-draft/chapters/chapter-01.md', makeChapterContent('江风推着船篷向前。'.repeat(180)));
  writeFile(root, '30-draft/continuity/chapter-01-state.md', makeContinuityStateContent(1, {
    stateStatus: 'proposed',
    knowledgeTransitionNotes: ['- None'],
  }));
  writeFile(root, '30-draft/continuity/story-state.md', makeStoryStateContent(1));
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
    '- Knowledge Boundary: pass',
    '- Style Drift: pass',
    '',
    '## Findings',
    '- The chapter lands well.',
    '',
    '## Continuity Findings',
    '- Clean: no continuity conflicts found.',
    '',
    '## Required Revisions',
    '- None',
  ].join('\n'));

  const result = runValidator(
    path.join('skills', 'novel-drafting', 'scripts', 'validate-drafting-project.mts'),
    ['--project-root', root, '--mode', 'Progress'],
  );

  assert.equal(result.status, 1);
  assert.match(result.stdout, /Knowledge Transition Notes/i);
  assert.match(result.stdout, /basis=/i);
});

test('drafting validator in completion mode fails when cumulative knowledge ledger contains contradictory states', () => {
  const root = makeTempProject();
  writeDraftingBaseProject(root, {
    workflowStatus: [
      '# Workflow Status',
      '',
      '- Project: test-book',
      '- Status: draft_in_progress',
      '- Current Stage: novel-drafting',
      '- Planned Chapters: 2',
      '- Completed Chapters: 2',
      '- Last Completed Chapter: 2',
      '- Blocking Issues:',
      '  -',
      '- Next Allowed Skill: novel-drafting',
      '- Last Updated: 2026-04-22',
    ].join('\n'),
  });
  writeFile(root, '30-draft/chapters/chapter-01.md', makeChapterContent('江风推着船篷向前。'.repeat(180)));
  writeFile(root, '30-draft/chapters/chapter-02.md', makeChapterContent('江风推着船篷向前。'.repeat(180), {
    chapterNumber: 2,
    title: 'Chapter 2',
    goal: 'Reveal the sabotage attempt without solving it.',
  }));
  writeFile(root, '30-draft/continuity/chapter-01-state.md', makeContinuityStateContent(1));
  writeFile(root, '30-draft/continuity/chapter-02-state.md', makeContinuityStateContent(2, {
    characterKnowledgeChanges: ['- Lin | Boatmaster Qiu sabotaged the mooring line. | suspected | source=chapter-02'],
    knowledgeTransitionNotes: ['- Lin | Boatmaster Qiu sabotaged the mooring line. | basis=Lin saw Qiu near the rope before dawn.'],
  }));
  writeFile(root, '30-draft/continuity/story-state.md', makeStoryStateContent(2, {
    characterKnowledge: [
      '- Lin | Boatmaster Qiu sabotaged the mooring line. | suspected | source=chapter-02',
      '- Lin | Boatmaster Qiu sabotaged the mooring line. | confirmed | source=chapter-02',
    ],
  }));
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
  writeFile(root, '40-review/chapter-reviews/chapter-02-review.md', [
    '# Chapter 2 Review',
    '',
    '## Metadata',
    '- Chapter Number: 2',
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

  const result = runValidator(
    path.join('skills', 'novel-drafting', 'scripts', 'validate-drafting-project.mts'),
    ['--project-root', root, '--mode', 'Completion'],
  );

  assert.equal(result.status, 1);
  assert.match(result.stdout, /Character Knowledge/i);
  assert.match(result.stdout, /conflicting|contradictory/i);
});

test('drafting validator in progress mode fails when chapter content is below the planned word range', () => {
  const root = makeTempProject();
  writeDraftingBaseProject(root);
  writeFile(root, '30-draft/chapters/chapter-01.md', makeChapterContent('短章。'.repeat(80)));

  const result = runValidator(
    path.join('skills', 'novel-drafting', 'scripts', 'validate-drafting-project.mts'),
    ['--project-root', root, '--mode', 'Progress'],
  );

  assert.equal(result.status, 1);
  assert.match(result.stdout, /word count/i);
  assert.match(result.stdout, /1200-1600/);
});

test('drafting validator in progress mode warns when em-dash usage drifts sharply upward', () => {
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
  writeFile(root, '30-draft/chapters/chapter-01.md', makeChapterContent('江风推着船篷向前，Lin看着水面，心里记下每一次晃动。'.repeat(60)));
  writeFile(root, '30-draft/chapters/chapter-02.md', makeChapterContent('船灯在雾里摇晃，Lin压低声音问了两句，又把疑心按回去。'.repeat(60), {
    chapterNumber: 2,
    title: 'Chapter 2',
    goal: 'Reveal the sabotage attempt without solving it.',
  }));
  writeFile(root, '30-draft/chapters/chapter-03.md', makeChapterContent('甲板潮湿，Lin只听，不急着下结论，也不让自己的猜测先走。'.repeat(60), {
    chapterNumber: 3,
    title: 'Chapter 3',
    goal: 'Deepen suspicion around the convoy crew.',
  }));
  writeFile(root, '30-draft/chapters/chapter-04.md', makeChapterContent('Lin盯着Boatmaster Qiu——又停住——又逼近——又断开话头——她忽然意识到他一定在撒谎——她忽然意识到每个人都在躲她——她忽然意识到整条船都在塌陷。'.repeat(25), {
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
    characterKnowledgeChanges: ['- Lin | Boatmaster Qiu is definitely the saboteur. | suspected | source=chapter-04'],
    knowledgeTransitionNotes: ['- Lin | Boatmaster Qiu is definitely the saboteur. | basis=Lin confronts him before she has proof.'],
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
  assert.match(result.stdout, /Drafting validation passed for mode Progress\./);
  assert.match(result.stdout, /Warnings:/i);
  assert.match(result.stdout, /Style Drift/i);
  assert.match(result.stdout, /em-dash|破折号/i);
});

test('drafting validator in progress mode warns when POV reasoning uses another character confirmed fact', () => {
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
      '- Characters: Lin, Shen, Boatmaster Qiu',
      '',
      '### Chapter 2',
      '- Title: Lantern Wake',
      '- POV: Lin',
      '- Word Target: 1200-1600',
      '- Goal: Reveal the sabotage attempt without solving it.',
      '- Key Events: Lin spots the cut mooring line.',
      '- Characters: Lin, Shen, Boatmaster Qiu',
      '',
      '### Chapter 3',
      '- Title: River Hush',
      '- POV: Shen',
      '- Word Target: 1200-1600',
      '- Goal: Let Shen confirm the saboteur quietly.',
      '- Key Events: Shen overhears the confession.',
      '- Characters: Lin, Shen, Boatmaster Qiu',
      '',
      '### Chapter 4',
      '- Title: Split Current',
      '- POV: Lin',
      '- Word Target: 1200-1600',
      '- Goal: Show Lin rushing to the wrong certainty.',
      '- Key Events: Lin corners Qiu too early.',
      '- Characters: Lin, Shen, Boatmaster Qiu',
    ].join('\n'),
  });
  writeFile(root, '30-draft/chapters/chapter-01.md', makeChapterContent('江风推着船篷向前，Lin看着水面，心里记下每一次晃动。'.repeat(60)));
  writeFile(root, '30-draft/chapters/chapter-02.md', makeChapterContent('船灯在雾里摇晃，Lin压低声音问了两句，又把疑心按回去。'.repeat(60), {
    chapterNumber: 2,
    title: 'Chapter 2',
    goal: 'Reveal the sabotage attempt without solving it.',
  }));
  writeFile(root, '30-draft/chapters/chapter-03.md', makeChapterContent('Shen守在舱门后，终于听清了那句压低的认罪。'.repeat(60), {
    chapterNumber: 3,
    title: 'Chapter 3',
    goal: 'Let Shen confirm the saboteur quietly.',
  }));
  writeFile(root, '30-draft/chapters/chapter-04.md', makeChapterContent('Lin忽然意识到 Boatmaster Qiu sabotaged the mooring line，她几乎把这件事当成早就坐实的结论。'.repeat(50), {
    chapterNumber: 4,
    title: 'Chapter 4',
    goal: 'Show Lin rushing to the wrong certainty.',
  }));
  writeFile(root, '30-draft/continuity/chapter-01-state.md', makeContinuityStateContent(1));
  writeFile(root, '30-draft/continuity/chapter-02-state.md', makeContinuityStateContent(2, {
    characterKnowledgeChanges: ['- Lin | Boatmaster Qiu sabotaged the mooring line. | suspected | source=chapter-02'],
    knowledgeTransitionNotes: ['- Lin | Boatmaster Qiu sabotaged the mooring line. | basis=Lin saw Qiu near the rope before dawn.'],
  }));
  writeFile(root, '30-draft/continuity/chapter-03-state.md', makeContinuityStateContent(3, {
    characterKnowledgeChanges: ['- Shen | Boatmaster Qiu sabotaged the mooring line. | confirmed | source=chapter-03'],
    knowledgeTransitionNotes: ['- Shen | Boatmaster Qiu sabotaged the mooring line. | basis=Shen heard Qiu admit it behind the cargo net.'],
  }));
  writeFile(root, '30-draft/continuity/chapter-04-state.md', makeContinuityStateContent(4, {
    stateStatus: 'proposed',
    characterKnowledgeChanges: ['- Lin | Boatmaster Qiu sabotaged the mooring line. | suspected | source=chapter-04'],
    knowledgeTransitionNotes: ['- Lin | Boatmaster Qiu sabotaged the mooring line. | basis=Lin is over-reading fragmented clues.'],
  }));
  writeFile(root, '30-draft/continuity/story-state.md', makeStoryStateContent(3, {
    characterKnowledge: [
      '- Lin | The mooring line was cut on purpose. | confirmed | source=chapter-01',
      '- Lin | Boatmaster Qiu sabotaged the mooring line. | suspected | source=chapter-02',
      '- Shen | Boatmaster Qiu sabotaged the mooring line. | confirmed | source=chapter-03',
    ],
  }));
  for (const [chapterNumber, pov] of [[1, 'Lin'], [2, 'Lin'], [3, 'Shen']]) {
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
      `- ${pov} stays on model.`,
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
  assert.match(result.stdout, /Warnings:/i);
  assert.match(result.stdout, /Knowledge Boundary/i);
  assert.match(result.stdout, /Lin/i);
  assert.match(result.stdout, /Boatmaster Qiu sabotaged the mooring line/i);
  assert.match(result.stdout, /expected=suspected|used_as=confirmed/i);
});

test('drafting validator in progress mode warns when a repeated phrase echoes across the current chapter', () => {
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
      '- Goal: Show an over-repeated narrative tic.',
      '- Key Events: Lin waits for the confrontation to snap.',
      '- Characters: Lin, Boatmaster Qiu',
    ].join('\n'),
  });
  writeFile(root, '30-draft/chapters/chapter-01.md', makeChapterContent('江风推着船篷向前，Lin看着水面，心里记下每一次晃动。'.repeat(60)));
  writeFile(root, '30-draft/chapters/chapter-02.md', makeChapterContent('船灯在雾里摇晃，Lin压低声音问了两句，又把疑心按回去。'.repeat(60), {
    chapterNumber: 2,
    title: 'Chapter 2',
    goal: 'Reveal the sabotage attempt without solving it.',
  }));
  writeFile(root, '30-draft/chapters/chapter-03.md', makeChapterContent('甲板潮湿，Lin只听，不急着下结论，也不让自己的猜测先走。'.repeat(60), {
    chapterNumber: 3,
    title: 'Chapter 3',
    goal: 'Deepen suspicion around the convoy crew.',
  }));
  writeFile(root, '30-draft/chapters/chapter-04.md', makeChapterContent('空气安静了一瞬，Lin没有动。空气安静了一瞬，她仍旧盯着门缝。空气安静了一瞬，连船板都像停住了。空气安静了一瞬，她才慢慢吸气。空气安静了一瞬，谁都没敢先开口。空气安静了一瞬，Lin才听见自己的心跳。'.repeat(15), {
    chapterNumber: 4,
    title: 'Chapter 4',
    goal: 'Show an over-repeated narrative tic.',
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
    characterKnowledgeChanges: ['- Lin | The confrontation will turn public if she keeps pushing. | suspected | source=chapter-04'],
    knowledgeTransitionNotes: ['- Lin | The confrontation will turn public if she keeps pushing. | basis=The crew has started watching in silence.'],
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
  assert.match(result.stdout, /Warnings:/i);
  assert.match(result.stdout, /Style Drift/i);
  assert.match(result.stdout, /repeated phrase|措辞回声|echo/i);
  assert.match(result.stdout, /空气安静了一瞬/i);
});

test('drafting validator supports word-count-only mode without workflow gates', () => {
  const root = makeTempProject();
  writeDraftingBaseProject(root, {
    workflowStatus: [
      '# Workflow Status',
      '',
      '- Project: test-book',
      '- Status: research_in_progress',
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
  writeFile(root, '30-draft/chapters/chapter-01.md', makeChapterContent('短章。'.repeat(80)));

  const result = runValidator(
    path.join('skills', 'novel-drafting', 'scripts', 'validate-drafting-project.mts'),
    ['--project-root', root, '--mode', 'WordCount'],
  );

  assert.equal(result.status, 1);
  assert.match(result.stdout, /Drafting validation failed for mode WordCount:/);
  assert.match(result.stdout, /word count/i);
  assert.doesNotMatch(result.stdout, /Current Stage|Completed Chapters|Next Allowed Skill/);
});

test('drafting validator supports targeting one chapter in word-count-only mode', () => {
  const root = makeTempProject();
  writeDraftingBaseProject(root);
  writeFile(root, '30-draft/chapters/chapter-01.md', makeChapterContent('短章。'.repeat(80)));
  writeFile(
    root,
    '30-draft/chapters/chapter-02.md',
    makeChapterContent('江风推着船篷向前。'.repeat(180), {
      chapterNumber: 2,
      title: 'Chapter 2',
      goal: 'Reveal the sabotage attempt without solving it.',
    }),
  );

  const result = runValidator(
    path.join('skills', 'novel-drafting', 'scripts', 'validate-drafting-project.mts'),
    ['--project-root', root, '--mode', 'WordCount', '--chapter', 'chapter-02'],
  );

  assert.equal(result.status, 0);
  assert.match(result.stdout, /Drafting validation passed for mode WordCount\./);
});

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
      '- Completed Chapters: 2',
      '- Last Completed Chapter: 2',
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
    '## Continuity Findings',
    '- Clean: no continuity conflicts found.',
    '',
    '## Required Revisions',
    '- None',
  ].join('\n'));

  const result = runValidator(
    path.join('skills', 'novel-drafting', 'scripts', 'validate-drafting-project.mts'),
    ['--project-root', root, '--mode', 'Completion'],
  );

  assert.equal(result.status, 1);
  assert.match(result.stdout, /draft_complete/i);
  assert.match(result.stdout, /all planned chapters/i);
});

test('drafting validator in progress mode rejects non-numeric last completed chapter values', () => {
  const root = makeTempProject();
  writeDraftingBaseProject(root, {
    workflowStatus: [
      '# Workflow Status',
      '',
      '- Project: test-book',
      '- Status: draft_in_progress',
      '- Current Stage: novel-drafting',
      '- Planned Chapters: 2',
      '- Completed Chapters: 1',
      '- Last Completed Chapter: chapter-01',
      '- Blocking Issues:',
      '  -',
      '- Next Allowed Skill: novel-drafting',
      '- Last Updated: 2026-04-22',
    ].join('\n'),
  });
  writeFile(root, '30-draft/chapters/chapter-01.md', makeChapterContent('江风推着船篷向前。'.repeat(180)));
  writeFile(root, '30-draft/continuity/chapter-01-state.md', makeContinuityStateContent(1));
  writeFile(root, '30-draft/continuity/story-state.md', makeStoryStateContent(1));
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
    '## Continuity Findings',
    '- Clean: no continuity conflicts found.',
    '',
    '## Required Revisions',
    '- None',
  ].join('\n'));

  const result = runValidator(
    path.join('skills', 'novel-drafting', 'scripts', 'validate-drafting-project.mts'),
    ['--project-root', root, '--mode', 'Progress'],
  );

  assert.equal(result.status, 1);
  assert.match(result.stdout, /Last Completed Chapter/i);
  assert.match(result.stdout, /integer|1, 2, 3/i);
  assert.match(result.stdout, /chapter-01/i);
});

test('drafting control docs tell the controller not to rewrite invalid review files', () => {
  const chapterLoop = fs.readFileSync(
    path.join(__dirname, '..', 'skills', 'novel-drafting', 'chapter-loop.md'),
    'utf8',
  );
  const reviewerSubagent = fs.readFileSync(
    path.join(__dirname, '..', 'skills', 'novel-drafting', 'reviewer-subagent.md'),
    'utf8',
  );

  assert.match(chapterLoop, /不得.*编辑.*review/i);
  assert.match(chapterLoop, /重新派发 reviewer|重新派发审查/i);
  assert.match(reviewerSubagent, /模板|template/i);
  assert.match(reviewerSubagent, /## Metadata/);
});

test('drafting writer docs point to fixed chapter and state templates', () => {
  const chapterLoop = fs.readFileSync(
    path.join(__dirname, '..', 'skills', 'novel-drafting', 'chapter-loop.md'),
    'utf8',
  );
  const writerSubagent = fs.readFileSync(
    path.join(__dirname, '..', 'skills', 'novel-drafting', 'writer-subagent.md'),
    'utf8',
  );
  const chapterTemplate = fs.readFileSync(
    path.join(__dirname, '..', 'skills', 'novel-drafting', 'templates', 'chapter-draft.md'),
    'utf8',
  );
  const stateTemplate = fs.readFileSync(
    path.join(__dirname, '..', 'skills', 'novel-drafting', 'templates', 'chapter-state.md'),
    'utf8',
  );

  assert.match(chapterLoop, /templates\/chapter-draft\.md/);
  assert.match(chapterLoop, /templates\/chapter-state\.md/);
  assert.match(writerSubagent, /模板|template/i);
  assert.match(chapterTemplate, /## Metadata/);
  assert.match(chapterTemplate, /## Content/);
  assert.match(stateTemplate, /## Character Knowledge Changes/);
  assert.match(stateTemplate, /unknown\|suspected\|confirmed/);
  assert.match(stateTemplate, /## Knowledge Transition Notes/);
  assert.match(stateTemplate, /## One-Time Events Triggered/);
  assert.match(stateTemplate, /## Continuity Notes For Next Chapter/);
});

test('drafting reviewer docs require explicit style adherence checks', () => {
  const reviewerSubagent = fs.readFileSync(
    path.join(__dirname, '..', 'skills', 'novel-drafting', 'reviewer-subagent.md'),
    'utf8',
  );
  const reviewTemplate = fs.readFileSync(
    path.join(__dirname, '..', 'skills', 'novel-drafting', 'templates', 'chapter-review.md'),
    'utf8',
  );

  assert.match(reviewerSubagent, /10-research\/style-research\.md/);
  assert.match(reviewerSubagent, /Style Drift/);
  assert.match(reviewerSubagent, /Style Adherence|风格一致性/);
  assert.match(reviewerSubagent, /style-research\.md.*修订项|修订项.*style-research\.md/s);
  assert.match(reviewTemplate, /Style Drift:\s*pass/);
  assert.match(reviewTemplate, /Style Adherence:\s*pass/);
});

test('drafting reviewer docs require explicit knowledge-boundary checks', () => {
  const reviewerSubagent = fs.readFileSync(
    path.join(__dirname, '..', 'skills', 'novel-drafting', 'reviewer-subagent.md'),
    'utf8',
  );
  const reviewTemplate = fs.readFileSync(
    path.join(__dirname, '..', 'skills', 'novel-drafting', 'templates', 'chapter-review.md'),
    'utf8',
  );

  assert.match(reviewerSubagent, /Knowledge Boundary/i);
  assert.match(reviewerSubagent, /POV Leak|knowledge leak|认知串台/i);
  assert.match(reviewerSubagent, /expected=suspected|used_as=confirmed/i);
  assert.match(reviewTemplate, /Knowledge Boundary:\s*pass/);
});

test('drafting reviewer docs require explicit checks for remaining research artifacts', () => {
  const reviewerSubagent = fs.readFileSync(
    path.join(__dirname, '..', 'skills', 'novel-drafting', 'reviewer-subagent.md'),
    'utf8',
  );
  const reviewTemplate = fs.readFileSync(
    path.join(__dirname, '..', 'skills', 'novel-drafting', 'templates', 'chapter-review.md'),
    'utf8',
  );

  assert.match(reviewerSubagent, /00-project\/project-brief\.md/);
  assert.match(reviewerSubagent, /10-research\/topic-research\.md/);
  assert.match(reviewerSubagent, /10-research\/setting-research\.md/);
  assert.match(reviewerSubagent, /10-research\/references\.md/);
  assert.match(reviewerSubagent, /核心 premise|禁忌内容|Content Boundaries/);
  assert.match(reviewerSubagent, /真实性|术语|topic-research|setting-research/);
  assert.match(reviewerSubagent, /inference|open question|未验证|不确定/);
  assert.match(reviewTemplate, /Premise Alignment:\s*pass/);
  assert.match(reviewTemplate, /Research Accuracy:\s*pass/);
  assert.match(reviewTemplate, /Verified Facts Only:\s*pass/);
});

test('drafting validator in progress mode fails when the current chapter is missing a continuity state file', () => {
  const root = makeTempProject();
  writeDraftingBaseProject(root, {
    workflowStatus: [
      '# Workflow Status',
      '',
      '- Project: test-book',
      '- Status: draft_in_progress',
      '- Current Stage: novel-drafting',
      '- Planned Chapters: 2',
      '- Completed Chapters: 0',
      '- Last Completed Chapter: 0',
      '- Blocking Issues:',
      '  -',
      '- Next Allowed Skill: novel-drafting',
      '- Last Updated: 2026-04-22',
    ].join('\n'),
  });
  writeFile(root, '30-draft/chapters/chapter-01.md', makeChapterContent('江风推着船篷向前。'.repeat(700)));
  writeFile(root, '30-draft/continuity/story-state.md', makeStoryStateContent(0));

  const result = runValidator(
    path.join('skills', 'novel-drafting', 'scripts', 'validate-drafting-project.mts'),
    ['--project-root', root, '--mode', 'Progress'],
  );

  assert.equal(result.status, 1);
  assert.match(result.stdout, /continuity state file/i);
  assert.match(result.stdout, /chapter-01-state\.md/i);
});

test('drafting validator in completion mode fails when story state lags behind approved chapters', () => {
  const root = makeTempProject();
  writeDraftingBaseProject(root, {
    workflowStatus: [
      '# Workflow Status',
      '',
      '- Project: test-book',
      '- Status: draft_in_progress',
      '- Current Stage: novel-drafting',
      '- Planned Chapters: 2',
      '- Completed Chapters: 2',
      '- Last Completed Chapter: 2',
      '- Blocking Issues:',
      '  -',
      '- Next Allowed Skill: novel-drafting',
      '- Last Updated: 2026-04-22',
    ].join('\n'),
  });
  writeFile(root, '30-draft/chapters/chapter-01.md', makeChapterContent('江风推着船篷向前。'.repeat(180)));
  writeFile(root, '30-draft/continuity/chapter-01-state.md', makeContinuityStateContent(1));
  writeFile(
    root,
    '30-draft/chapters/chapter-02.md',
    makeChapterContent('江风推着船篷向前。'.repeat(180), {
      chapterNumber: 2,
      title: 'Chapter 2',
      goal: 'Reveal the sabotage attempt without solving it.',
    }),
  );
  writeFile(root, '30-draft/continuity/chapter-02-state.md', makeContinuityStateContent(2));
  writeFile(root, '30-draft/continuity/story-state.md', makeStoryStateContent(1));
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
    '## Continuity Findings',
    '- Clean: no continuity conflicts found.',
    '',
    '## Required Revisions',
    '- None',
  ].join('\n'));
  writeFile(root, '40-review/chapter-reviews/chapter-02-review.md', [
    '# Chapter 2 Review',
    '',
    '## Metadata',
    '- Chapter Number: 2',
    '- Decision: 通过',
    '- Reviewer Status: completed',
    '',
    '## Checks',
    '- Word Count: pass',
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

  const result = runValidator(
    path.join('skills', 'novel-drafting', 'scripts', 'validate-drafting-project.mts'),
    ['--project-root', root, '--mode', 'Completion'],
  );

  assert.equal(result.status, 1);
  assert.match(result.stdout, /story state/i);
  assert.match(result.stdout, /Last Approved Chapter is 1 but should be 2/i);
});

test('drafting validator in completion mode fails when consumed one-time events lack chapter references', () => {
  const root = makeTempProject();
  writeDraftingBaseProject(root, {
    workflowStatus: [
      '# Workflow Status',
      '',
      '- Project: test-book',
      '- Status: draft_in_progress',
      '- Current Stage: novel-drafting',
      '- Planned Chapters: 2',
      '- Completed Chapters: 2',
      '- Last Completed Chapter: 2',
      '- Blocking Issues:',
      '  -',
      '- Next Allowed Skill: novel-drafting',
      '- Last Updated: 2026-04-22',
    ].join('\n'),
  });
  writeFile(root, '30-draft/chapters/chapter-01.md', makeChapterContent('江风推着船篷向前。'.repeat(180)));
  writeFile(root, '30-draft/chapters/chapter-02.md', makeChapterContent('江风推着船篷向前。'.repeat(180), {
    chapterNumber: 2,
    title: 'Chapter 2',
    goal: 'Reveal the sabotage attempt without solving it.',
  }));
  writeFile(root, '30-draft/continuity/chapter-01-state.md', makeContinuityStateContent(1));
  writeFile(root, '30-draft/continuity/chapter-02-state.md', makeContinuityStateContent(2));
  writeFile(root, '30-draft/continuity/story-state.md', makeStoryStateContent(2, {
    oneTimeEventsConsumed: ['- First discovery of the sabotage attempt'],
  }));
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
    '## Continuity Findings',
    '- No continuity conflicts found.',
    '',
    '## Required Revisions',
    '- None',
  ].join('\n'));
  writeFile(root, '40-review/chapter-reviews/chapter-02-review.md', [
    '# Chapter 2 Review',
    '',
    '## Metadata',
    '- Chapter Number: 2',
    '- Decision: 通过',
    '- Reviewer Status: completed',
    '',
    '## Checks',
    '- Word Count: pass',
    '',
    '## Findings',
    '- None.',
    '',
    '## Continuity Findings',
    '- No continuity conflicts found.',
    '',
    '## Required Revisions',
    '- None',
  ].join('\n'));

  const result = runValidator(
    path.join('skills', 'novel-drafting', 'scripts', 'validate-drafting-project.mts'),
    ['--project-root', root, '--mode', 'Completion'],
  );

  assert.equal(result.status, 1);
  assert.match(result.stdout, /One-Time Events Consumed/i);
  assert.match(result.stdout, /chapter-XX|chapter-01/i);
});

test('drafting validator in completion mode fails when consumed triggered events are not archived in story state', () => {
  const root = makeTempProject();
  writeDraftingBaseProject(root, {
    workflowStatus: [
      '# Workflow Status',
      '',
      '- Project: test-book',
      '- Status: draft_in_progress',
      '- Current Stage: novel-drafting',
      '- Planned Chapters: 2',
      '- Completed Chapters: 2',
      '- Last Completed Chapter: 2',
      '- Blocking Issues:',
      '  -',
      '- Next Allowed Skill: novel-drafting',
      '- Last Updated: 2026-04-22',
    ].join('\n'),
  });
  writeFile(root, '30-draft/chapters/chapter-01.md', makeChapterContent('江风推着船篷向前。'.repeat(180)));
  writeFile(root, '30-draft/chapters/chapter-02.md', makeChapterContent('江风推着船篷向前。'.repeat(180), {
    chapterNumber: 2,
    title: 'Chapter 2',
    goal: 'Reveal the sabotage attempt without solving it.',
  }));
  writeFile(root, '30-draft/continuity/chapter-01-state.md', makeContinuityStateContent(1, {
    oneTimeEventsTriggered: ['- First discovery of the sabotage attempt | consumed=yes'],
  }));
  writeFile(root, '30-draft/continuity/chapter-02-state.md', makeContinuityStateContent(2, {
    oneTimeEventsTriggered: ['- Lin confirms Boatmaster Qiu lied | consumed=yes'],
  }));
  writeFile(root, '30-draft/continuity/story-state.md', makeStoryStateContent(2, {
    oneTimeEventsConsumed: ['- First discovery of the sabotage attempt: chapter-01'],
  }));
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
    '## Continuity Findings',
    '- No continuity conflicts found.',
    '',
    '## Required Revisions',
    '- None',
  ].join('\n'));
  writeFile(root, '40-review/chapter-reviews/chapter-02-review.md', [
    '# Chapter 2 Review',
    '',
    '## Metadata',
    '- Chapter Number: 2',
    '- Decision: 通过',
    '- Reviewer Status: completed',
    '',
    '## Checks',
    '- Word Count: pass',
    '',
    '## Findings',
    '- None.',
    '',
    '## Continuity Findings',
    '- No continuity conflicts found.',
    '',
    '## Required Revisions',
    '- None',
  ].join('\n'));

  const result = runValidator(
    path.join('skills', 'novel-drafting', 'scripts', 'validate-drafting-project.mts'),
    ['--project-root', root, '--mode', 'Completion'],
  );

  assert.equal(result.status, 1);
  assert.match(result.stdout, /story-state\.md/i);
  assert.match(result.stdout, /Lin confirms Boatmaster Qiu lied/i);
});

test('delivery validator passes in output mode when required themed artifacts exist', () => {
  const workspace = makeTempProject();
  const root = path.join(workspace, 'book-slug');
  fs.mkdirSync(root, { recursive: true });

  writeFile(root, '50-delivery/metadata.md', [
    '# Metadata',
    '## Bibliographic Data',
    '## Output Targets',
    '- Produce PDF: yes',
    '- Produce EPUB: yes',
  ].join('\n\n'));
  writeFile(root, '50-delivery/book.md', [
    '# Title Page',
    '# Chapter 1',
  ].join('\n\n'));
  writeFile(root, '50-delivery/output/book-slug-latte.html', 'latte html');
  writeFile(root, '50-delivery/output/book-slug-mocha.html', 'mocha html');
  writeFile(root, '50-delivery/output/book-slug-latte.pdf', 'latte pdf');
  writeFile(root, '50-delivery/output/book-slug-mocha.pdf', 'mocha pdf');
  writeFile(root, '50-delivery/output/book-slug.epub', 'epub');

  const result = runValidator(
    path.join('skills', 'novel-delivery', 'scripts', 'validate-delivery-project.mts'),
    ['--project-root', root, '--mode', 'Output'],
  );

  assert.equal(result.status, 0);
  assert.match(result.stdout, /Delivery validation passed for mode Output\./);
});

test('delivery validator in preflight mode fails when workflow, browser, fonts, and playwright dependencies are missing', () => {
  const root = makeTempProject();
  const fakeBin = path.join(root, 'bin');
  const pathSeparator = process.platform === 'win32' ? ';' : ':';
  const originalPath = process.env.PATH ?? '';

  fs.mkdirSync(fakeBin, { recursive: true });
  if (process.platform === 'win32') {
    writeFile(fakeBin, 'pandoc.cmd', '@echo off\r\nexit /b 0\r\n');
  } else {
    writeFile(fakeBin, 'pandoc', '#!/bin/sh\nexit 0\n');
    fs.chmodSync(path.join(fakeBin, 'pandoc'), 0o755);
  }

  writeFile(root, '00-project/workflow-status.md', 'Status: research_complete\n');
  writeFile(root, '30-draft/chapter-plan.md', '## Overview\n\n## Chapter List\n\n### Chapter 1\n');
  writeFile(root, '50-delivery/metadata.md', [
    '# Metadata',
    '## Bibliographic Data',
    '## Output Targets',
    '- Produce PDF: yes',
    '- Produce EPUB: yes',
  ].join('\n\n'));
  writeFile(root, '50-delivery/frontmatter.md', [
    '# Title Page',
    '## Book Title',
    '## Author',
    '## Rights',
    '## Summary',
  ].join('\n\n'));

  process.env.PATH = `${fakeBin}${pathSeparator}${originalPath}`;
  const result = runValidator(
    path.join('skills', 'novel-delivery', 'scripts', 'validate-delivery-project.mts'),
    [
      '--project-root', root,
      '--mode', 'Preflight',
      '--pdf-browser-path', path.join(root, 'missing-browser'),
      '--installed-fonts', 'none',
    ],
  );
  process.env.PATH = originalPath;

  assert.equal(result.status, 1);
  assert.match(result.stdout, /workflow-status\.md|Status: draft_complete/i);
  assert.match(result.stdout, /Playwright/i);
  assert.match(result.stdout, /Chromium-compatible browser/i);
  assert.match(result.stdout, /Chinese font/i);
});

test('delivery validator in preflight mode rejects workflow files without a structured Status field', () => {
  const root = makeTempProject();

  writeFile(root, '00-project/workflow-status.md', '(draft_complete)\n');
  writeFile(root, '30-draft/chapter-plan.md', '## Overview\n\n## Chapter List\n\n### Chapter 1\n');
  writeFile(root, '50-delivery/metadata.md', [
    '# Metadata',
    '## Bibliographic Data',
    '## Output Targets',
    '- Produce PDF: yes',
    '- Produce EPUB: yes',
  ].join('\n\n'));
  writeFile(root, '50-delivery/frontmatter.md', [
    '# Title Page',
    '## Book Title',
    '## Author',
    '## Rights',
    '## Summary',
  ].join('\n\n'));

  const result = runValidator(
    path.join('skills', 'novel-delivery', 'scripts', 'validate-delivery-project.mts'),
    [
      '--project-root', root,
      '--mode', 'Preflight',
      '--pdf-browser-path', process.execPath,
      '--installed-fonts', 'Source Han Serif SC,Source Han Sans SC',
    ],
  );

  assert.equal(result.status, 1);
  assert.match(result.stdout, /Status: draft_complete|structured Status field/i);
});

test('delivery validator in output mode fails when themed artifacts use the wrong names', () => {
  const root = makeTempProject();

  writeFile(root, '50-delivery/metadata.md', [
    '# Metadata',
    '## Bibliographic Data',
    '## Output Targets',
    '- Produce PDF: yes',
    '- Produce EPUB: yes',
  ].join('\n\n'));
  writeFile(root, '50-delivery/book.md', [
    '# Title Page',
    '# Chapter 1',
  ].join('\n\n'));
  writeFile(root, '50-delivery/output/book-slug-latte.html', 'latte html');
  writeFile(root, '50-delivery/output/book-slug-mocha.html', 'mocha html');
  writeFile(root, '50-delivery/output/book-slug-latte.pdf', 'latte pdf');
  writeFile(root, '50-delivery/output/book-slug-mocha.pdf', 'mocha pdf');
  writeFile(root, '50-delivery/output/book-slug.epub', 'epub');
  writeFile(root, '50-delivery/output/book.html', 'html');

  const result = runValidator(
    path.join('skills', 'novel-delivery', 'scripts', 'validate-delivery-project.mts'),
    ['--project-root', root, '--mode', 'Output'],
  );

  assert.equal(result.status, 1);
  assert.match(result.stdout, /latte\.html/i);
  assert.match(result.stdout, /mocha\.html/i);
  assert.match(result.stdout, /latte\.pdf/i);
  assert.match(result.stdout, /mocha\.pdf/i);
});
