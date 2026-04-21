---
name: novel-research
description: Use when starting a new Chinese novel project that needs premise clarification, background or setting research, style guidance, and a structured pre-drafting project scaffold
---

# Novel Research

## Summary

This skill initializes a single-book novel project, interviews the user one question at a time, converts research into file-backed story constraints, and blocks drafting until the knowledge base is complete.

Treat this as a controller skill. Read only the next document you need.

## Key Decisions

- One novel project per root directory. Do not mix multiple books in the same scaffold.
- Ask one question at a time until premise, audience, conflict, ending tendency, and forbidden content are stable enough to write files.
- Research findings are not done when you have links. They are done only after they are converted into constraints, terminology notes, realism risks, or style rules inside project files.
- Do not mark `research_complete` until the completion gate passes and `node scripts/validate-research-project.js --project-root <path>` reports success.

## When To Use

- The user is starting a new Chinese novel project from scratch
- The user has an idea but lacks enough structure to begin drafting
- The project needs setting research, domain realism, genre calibration, or style guidance
- The drafting stage must remain blocked until the file set is complete

## Progressive Disclosure

Load only the next layer you need:

1. Read this file to decide whether the skill applies and whether research can start.
2. Read `references/project-scaffold.md` before creating or normalizing the project structure.
3. Read `references/interview-loop.md` when running the user interview and filling project files.
4. Read `references/research-workflow.md` before using web research or converting findings into story constraints.
5. Read `references/file-contract.md` when writing or validating required files.
6. Read `references/completion-gate.md` before changing status to `research_complete`.
7. Run `node scripts/validate-research-project.js --project-root <path>` before claiming the project is ready for `novel-drafting`.

Do not front-load every detail into the initial context or into a single user message.

## Entry Gate

Before research begins:

- confirm the user wants a single-book project, not a multi-book platform
- identify a working title or temporary slug source
- decide whether web research is allowed
- check whether a project root already exists and whether it should be reused or normalized

If the project scope is unclear or the book concept is still split across incompatible directions, stay in discovery and do not force file creation prematurely.

## Controller Rules

The controller must:

- create or normalize the required directory structure
- instantiate the required template files before reporting progress
- ask one interview question at a time
- write answers into the correct project files as hard constraints
- separate verified facts from inference notes
- keep `00-project/workflow-status.md` current

The controller must not:

- jump to a chapter outline before the core premise and story constraints are stable
- dump raw search results into project files without synthesis
- mark thin, contradictory, or placeholder files as complete
- advance to drafting based only on chat text without checking files

## Status Transitions

- Start: set status to `research_in_progress`
- Blocked: set status to `research_blocked` and record the specific blocker
- Complete: set status to `research_complete` only after the completion gate and validation script both pass

## Next Step

After `research_complete`, the next allowed skill is `novel-drafting`.
