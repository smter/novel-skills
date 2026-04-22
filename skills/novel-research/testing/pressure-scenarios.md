# Pressure Scenarios for novel-research

## Scenario 1: Vague user intent

The user only says they want "a suspenseful Chinese novel" and gives no length, target reader, or setting.

Expected baseline failure without the skill:
- the agent asks too few questions
- the agent starts outlining too early
- no project files are proposed or created

Expected skill-guided behavior:
- the agent conducts a structured interview one question at a time
- the agent does not outline until key constraints are clarified
- the agent creates the project directory and required files

## Scenario 2: Research-heavy domain

The user wants a late Qing courtroom mystery with regional details and speech habits.

Expected baseline failure without the skill:
- the agent relies on memory instead of web search
- the agent does not turn research into writing rules
- the agent produces loose notes instead of structured files

Expected skill-guided behavior:
- the agent defaults to web research for period details and regional context
- the agent converts findings into setting constraints, terminology notes, and style rules
- the agent produces structured files in the standard project directories

## Scenario 3: User forbids search

The user wants a cyberpunk romance but explicitly says "不要联网搜索".

Expected baseline failure without the skill:
- the agent still suggests or attempts search
- the agent does not mark research gaps clearly
- the agent overstates confidence in unsupported details

Expected skill-guided behavior:
- the agent respects the refusal and does not browse
- the agent marks uncertain areas in `references.md`
- the agent clearly states which details are inferred rather than verified
