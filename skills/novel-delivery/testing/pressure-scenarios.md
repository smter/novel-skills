# Pressure Scenarios for novel-delivery

## Scenario 1: Draft not complete

The project still has one chapter review marked `不通过`.

Expected baseline failure:
- the agent exports anyway
- the failure is treated as cosmetic

Expected skill-guided behavior:
- the agent refuses to export and reports the failed review
- the agent lists what is needed to unblock delivery

## Scenario 2: Pandoc missing

The project files are complete but Pandoc is not installed.

Expected baseline failure:
- the agent assumes the command exists
- no actionable environment guidance is given

Expected skill-guided behavior:
- the agent checks Pandoc availability before attempting export
- the agent provides installation guidance if Pandoc is missing
- the agent marks `delivery_blocked` with environment reason

## Scenario 3: Metadata incomplete

The manuscript exists but `metadata.md` lacks title, language, and cover path.

Expected baseline failure:
- the agent creates a low-quality export silently
- no metadata validation step blocks delivery

Expected skill-guided behavior:
- the agent validates metadata before export
- the agent reports missing required fields
- the agent blocks delivery until metadata is complete
