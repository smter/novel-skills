# 完成闸门

## 概述

在将项目状态改为 `research_complete` 之前立即使用本文件。它把定性审查和机械验证脚本结合在一起。

## 关键决策

- Drafting stays blocked until both the files and the story constraints are strong enough.
- Contradictions count as incomplete work even if every file exists.
- A thin outline is not acceptable if later skills cannot infer chapter progression from it.

## 完整性清单

在标记调研完成之前，确认：

- protagonist, main conflict, and story goal are clearly defined
- target length is set and consistent with planned chapter count
- chapter plan aligns with the intended length and progression
- foreshadowing appears before planned payoff points
- style guidance is strong enough to constrain later drafting
- no critical setting or realism gaps remain unresolved
- `node --import tsx scripts/validate-research-project.mts --project-root <path>` reports success

如果任一检查失败，项目应保持在 `research_in_progress` 或 `research_blocked`。

## 退出规则

只有在清单全部通过后，才能：

- set `Status` to `research_complete`
- set `Next Allowed Skill` to `novel-drafting`
- update `Last Updated`

## 指引

- Read `file-contract.md` if the failure is structural.
- Read `research-workflow.md` if the failure is factual or stylistic.
