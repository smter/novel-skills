# Baseline Results

## Method

- Review date: 2026-04-21
- Review type: retrospective baseline reconstruction
- Evidence basis: pressure scenarios plus comparison against default, non-skill-guided behavior
- Limitation: no preserved live baseline transcript was found in the repository, so these entries document the missing baseline explicitly instead of pretending a run was captured

## Scenario 1: Vague user intent

- Baseline result: Likely fail
- What the agent would likely do: move from premise to loose ideation or outlining after too little clarification
- What it would likely skip: a one-question-at-a-time interview and creation of the full project file set
- Likely rationalization: "The user only needs a starting direction, so a light outline is enough."
- Enough files to unblock drafting: No

## Scenario 2: Research-heavy domain

- Baseline result: Likely fail
- What the agent would likely do: answer from memory and provide general notes
- What it would likely skip: default web research, conversion of findings into writing rules, and structured project outputs
- Likely rationalization: "This genre is familiar enough to sketch without formal research."
- Enough files to unblock drafting: No

## Scenario 3: User forbids search

- Baseline result: Likely fail
- What the agent would likely do: continue with unsupported details and under-report uncertainty
- What it would likely skip: an explicit inference log and clearly marked research gaps
- Likely rationalization: "If browsing is unavailable, I should still fill in plausible details to keep momentum."
- Enough files to unblock drafting: No
