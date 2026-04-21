# Chapter Loop

## Purpose

This file defines the controller flow for one chapter and for whole-book completion. It is written for the controller, not for writer or reviewer subagents.

## Loop Start

Before dispatching any subagent:

1. Read `00-project/workflow-status.md`.
2. Read `30-draft/chapter-plan.md`.
3. Inspect `30-draft/chapters/`.
4. Inspect `40-review/chapter-reviews/`.

Determine the first chapter that matches any of these conditions:

- chapter file does not exist
- chapter file exists but no review file exists
- review file exists and `Decision` is `不通过`
- review file is missing a valid decision

If no chapter matches those conditions, run the whole-book completion gate.

## Writer Dispatch

Before dispatching the writer:

1. Read `writer-subagent.md`.
2. Read only the writer-relevant sections of `file-contract.md`.
3. Pass the writer:
   - current chapter identifier
   - target file path
   - only the allowed supporting file paths
   - the current chapter goal from `30-draft/chapter-plan.md`
   - current retry count for this chapter

After the writer returns:

1. Do not trust the chat text alone.
2. Check that the chapter file exists at the reported path.
3. Check that the chapter file satisfies the chapter-file contract.
4. If the writer returned `BLOCKED`, update `workflow-status.md` to `draft_blocked` and stop.
5. Only dispatch the reviewer if the chapter file exists and passes structural validation.

## Reviewer Dispatch

Before dispatching the reviewer:

1. Read `reviewer-subagent.md`.
2. Read only the reviewer-relevant sections of `file-contract.md`.
3. Pass the reviewer:
   - current chapter identifier
   - current chapter file path
   - only the allowed supporting file paths
   - current review target path

After the reviewer returns:

1. Do not trust the chat text alone.
2. Check that the review file exists at the reported path.
3. Check that the review file satisfies the review-file contract.
4. Confirm that `Decision` is either `通过` or `不通过`.
5. If the reviewer returned `BLOCKED`, update `workflow-status.md` to `draft_blocked` and stop.

## Retry Rule

If the review decision is `不通过`:

1. Increment the retry count for the current chapter.
2. Extract only the required revision items from the review file.
3. Re-dispatch the writer with:
   - the chapter file path
   - the review file path
   - the revision list
   - the same minimal supporting file paths
4. Do not paste the full chapter text or full review back into the controller message unless the writer is explicitly blocked on that content.

If the chapter reaches three total draft attempts and still does not pass:

- update `00-project/workflow-status.md` to `draft_blocked`
- record the blocked chapter and blocking reason
- stop the loop

## Advance Rule

Advance to the next chapter only if:

- the chapter file exists
- the review file exists
- the review file has `Decision: 通过`

When a chapter passes:

- update `Completed Chapters`
- update `Last Completed Chapter`
- keep `Status` as `draft_in_progress` until the whole-book gate passes

## Whole-Book Completion Gate

After all planned chapters appear to be passed:

1. Compare planned chapter entries in `30-draft/chapter-plan.md` to files in `30-draft/chapters/`.
2. Confirm each chapter has a corresponding passed review in `40-review/chapter-reviews/`.
3. Compare unresolved setup items in `20-story/foreshadowing.md` against the completed manuscript and review state.
4. Compare the manuscript length against `00-project/success-criteria.md`.

Only after all four checks pass:

- set `Status` to `draft_complete`
- set `Next Allowed Skill` to `novel-delivery`

If any whole-book check fails:

- keep the project in `draft_in_progress` or `draft_blocked`, whichever matches the failure
- record the blocking issue in `workflow-status.md`
