# `novel-research` 压力场景

## 场景 1：用户意图模糊

The user only says they want "a suspenseful Chinese novel" and gives no length, target reader, or setting.

没有该 skill 时的预期基线失败：
- the agent asks too few questions
- the agent starts outlining too early
- no project files are proposed or created

有该 skill 引导时的预期行为：
- the agent conducts a structured interview one question at a time
- the agent does not outline until key constraints are clarified
- the agent creates the project directory and required files

## 场景 2：重调研领域

The user wants a late Qing courtroom mystery with regional details and speech habits.

没有该 skill 时的预期基线失败：
- the agent relies on memory instead of web search
- the agent does not turn research into writing rules
- the agent produces loose notes instead of structured files

有该 skill 引导时的预期行为：
- the agent defaults to web research for period details and regional context
- the agent converts findings into setting constraints, terminology notes, and style rules
- the agent produces structured files in the standard project directories

## 场景 3：用户禁止搜索

The user wants a cyberpunk romance but explicitly says "不要联网搜索".

没有该 skill 时的预期基线失败：
- the agent still suggests or attempts search
- the agent does not mark research gaps clearly
- the agent overstates confidence in unsupported details

有该 skill 引导时的预期行为：
- the agent respects the refusal and does not browse
- the agent marks uncertain areas in `references.md`
- the agent clearly states which details are inferred rather than verified
