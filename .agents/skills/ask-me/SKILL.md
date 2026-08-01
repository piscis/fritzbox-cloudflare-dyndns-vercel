---
name: ask-me
description: >-
  Surface open questions the user can answer to improve the current plan or
  task. Use when the user invokes ask-me, wants clarifying questions before
  continuing, or asks what decisions are still blocking the plan.
disable-model-invocation: true
---

# Ask Me

Review the current conversation and any plan in progress, and surface the open questions that only the user can answer.

If you are already in a plan mode (Cursor Plan mode, Claude Code plan mode), stay there. Prefer
a structured multiple-choice question tool where one exists — `AskUserQuestion` in Claude Code,
`AskQuestion` in Cursor — and otherwise ask inline with labeled options.

Before asking anything, filter hard:
- Try to resolve each candidate question yourself — from the conversation, the codebase (do a quick search if needed), or an obvious default.
- Drop any question whose answer would not change what you do next.

Ask everything that remains in a **single call** when a structured tool is available (open-ended answers are covered by the built-in "Other" option). If none is available, ask the same set inline in one message:
- Order questions by impact: blocking / wasted-work risks first, then scope and approach, then polish.
- Fold the "why this matters" into the question prompt itself, in one short clause.
- Make your recommended default the first option, labeled "(Recommended)".
- **Ask at most 4 questions** — that is the per-call ceiling for `AskUserQuestion`, so anything more cannot be asked in one call. If you have more than four candidates after filtering, the extras were not important enough; drop them rather than splitting into a second call.

**Stop conditions.** If nothing meaningful remains after filtering, say exactly that and continue with the work — do not invent questions to fill the quota. If there is no plan or task in progress to improve, say so and stop rather than asking speculative questions.

After receiving the answers, update the plan or task accordingly and briefly state what changed.
