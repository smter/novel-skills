# Lint 契约

## 概述

本文件描述用于监督 `novel-drafting` 的确定性工作流检查。

验证器是项目产物状态的权威闸门。writer 与 reviewer 的聊天回复仅作参考；真正决定控制器能否推进的是文件状态和验证器结果。

## 命令

执行：

```bash
node --experimental-strip-types <skill-root>/scripts/validate-drafting-project.mts --project-root <project-root> --mode <Entry|Progress|Completion|WordCount>
```

## 模式

### Entry

在起草开始或恢复之前使用。

检查项：
- 工作流状态为 `research_complete` 或 `draft_blocked`
- 工作流当前阶段与起草兼容
- 起草前置条件已经存在
- `chapter-plan.md` 至少包含一个可解析的计划章节

### Progress

在 writer 或 reviewer 更新当前章节状态之后使用。

检查项：
- 工作流计数与连续通过的章节一致
- 当前章节 continuity state 文件存在且结构完整
- `story-state.md` 存在且覆盖到当前已批准基线
- 章节文件元数据与文件身份一致
- review 文件包含明确的 continuity findings
- 未通过的审查包含可执行的必改项
- `Character Knowledge Changes` 使用结构化知识账本格式
- `Knowledge Transition Notes` 能为 `confirmed` 的知识升级提供依据
- cumulative `Character Knowledge` 不包含同一角色/事实的冲突终态
- 当前进行中的章节在推进前满足字数目标

### Completion

在设置 `draft_complete` 或 `Next Allowed Skill: novel-delivery` 之前使用。

检查项：
- 所有计划章节文件都存在
- 所有已存在章节都有对应 continuity state 文件
- 所有计划章节都有对应审查文件
- 所有计划章节审查都为 `通过`
- `story-state.md` 与最后一个连续通过章节对齐
- 工作流状态字段与已批准章节一致
- 章节与书稿总字数满足目标
- `draft_complete` 与 `novel-delivery` 没有被过早设置

### WordCount

在 agent 只需要做字数检查，而不需要触发工作流、审查或完成闸门时使用。

检查项：
- 所有已有章节，或 `--chapter` 指定章节，是否落在目标字数区间内
- 不检查工作流状态
- 不检查 review 文件
- 不检查 completion gate
- 不检查全书总字数

强制使用约定：
- 只要需求是“确认字数是否达标”，就应使用 `WordCount`
- 不要为了字数检查额外实现 ad hoc 统计命令
- 不要在 `Progress` / `Completion` 之外手工复写字数规则

---

## 起草自检清单

以下维度供 agent 在提交验证前做自我审查。Writer 子代理在产出草稿后逐项自检，Reviewer 子代理在审查时逐项核实。

### 结构维度
- [ ] 章节目标达成 — 本章是否完成了 `chapter-plan.md` 中定义的本章目标？
- [ ] 前后衔接正确 — 承接的前章事件是否准确？为后章埋的线索是否到位？

### 角色维度
- [ ] 角色声线一致 — 角色说的话是否符合其对话风格定义？
- [ ] 角色行为一致 — 行为是否与角色卡的性格/特质描述一致？对照 `references/theory/mckee-character.md` 的六维度诊断体系
- [ ] 角色弧光推进 — 角色在本章中是否有可感知的变化？对照 `references/theory/harmon-story-circle.md` 的 8 阶段

### 叙事维度
- [ ] 叙事视角一致 — 是否遵守了 `narrative-structure-guide.md` 定义的视角规则？
- [ ] 节奏合理 — 本章的紧张与舒缓是否符合全篇情感曲线的预期位置？

### 风格维度
- [ ] 四层宪章逐层校验 — 神层（核心法则）/ 骨层（结构法则）/ 皮层（语言积木）/ 肉层（风格化段落）是否各有体现？对照 `style-analysis-guide.md`
- [ ] 对话功能校验 — 每段对话是否至少体现一种潜文本动词（暴露/操控/维护）？对照 `references/theory/mckee-dialogue.md`

### 质量维度
- [ ] 信息密度达标 — 本章是否提供了新信息 / 推进了至少一条线索？
- [ ] 字数达标 — 是否符合 `chapter-plan.md` 的预期字数范围？（使用 `WordCount` 模式验证）
- [ ] 无伏笔遗漏 — 是否有应在本章收束但未收束的伏笔？对照 `foreshadowing.md`
- [ ] 无设定矛盾 — 本章内容是否与 `worldbuilding-guide.md` 的设定约束冲突？
- [ ] 无元叙事措辞 — 正文中是否出现了"第x章""上一章""前文"等打破第四面墙的表述？

### 连续性维度
- [ ] 时间线一致 — 本章事件发生的时间是否与前后章一致？
- [ ] 空间转换有交代 — 场景切换时是否有转场说明？
