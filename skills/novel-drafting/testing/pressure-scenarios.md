# `novel-drafting` 压力场景

## 场景 1：调研产物缺失

项目中有 `characters.md` 和 `plot-outline.md`，但没有 `success-criteria.md`。

预期基线失败：
- agent 仍然直接开始写作
- 没有明确报告阻塞

有该 skill 引导时的预期行为：
- agent 拒绝继续，并报告缺失文件
- agent 列出解除起草阻塞所需的条件

## 场景 2：中后段连续性压力

已经存在 6 章，但第 7 章提前引入了原计划放在第 10 章的揭示。

预期基线失败：
- agent 只顾推进进度
- 审查步骤过于含糊，放过了这次提前揭示

有该 skill 引导时的预期行为：
- reviewer 检查 `foreshadowing.md` 中计划的揭示时机
- 审查返回 `不通过`，并指出具体连续性违规
- writer 接收审查结论后执行修订

## 场景 3：无限修订循环

第 3 章反复未通过节奏与字数检查。

预期基线失败：
- agent 无限制地反复重写
- 没有发出 `draft_blocked` 状态

有该 skill 引导时的预期行为：
- 3 次尝试后，agent 标记 `draft_blocked`
- agent 报告被阻塞的章节和原因
- agent 请求用户介入

## 场景 4：一次性真相被重复发现

第 3 章已经把“假溺女是诱导施救的加害者”写成首次发现事件，第 4 章又把同一真相重新写成主角第一次发现，只是细节版本不同。

预期基线失败：
- agent 只参考模糊摘要或前文印象
- reviewer 没有正式状态账本可对照
- 重复发现被误判为“强化戏剧性”而放过

有该 skill 引导时的预期行为：
- writer 读取 `story-state.md` 与 `chapter-03-state.md`
- reviewer 对照 continuity state，指出“一次性事件重复触发”
- 审查返回 `不通过`，要求将该段改成复盘、确认或向他人解释，而不是再次首次发现
