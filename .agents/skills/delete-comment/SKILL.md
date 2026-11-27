---
name: delete-comment
description: Sort code comments into tautology, stale, excuse or decision record, then delete them, filing issues and ADRs where needed.
disable-model-invocation: true
---

# Delete comments

This repo bans code comments with the `local/no-comments` lint rule (`eslint-rules/no-comments.ts`),
with no suppressions. This skill clears the comments the rule cannot see, and any it reports.

Arguments are optional: paths or globs to work on. With none, work on the whole repo,
plus comments the rule cannot see (step 1).

## 1. Inventory

Build the worktree first (`AGENTS.md` → Workflow). List every comment in scope:

```sh
pnpm exec eslint <paths> -f json -o /tmp/comments.json
```

Do a separate `grep` pass for comments the rule cannot parse: shell comments inside YAML `run: |`
blocks, `app/assets/css/main.css`, Vue `<style>` blocks, `.gitignore`, `.env.example`.

Done when every comment in scope is listed with its file and line, and you have read each one
together with the code under it.

## 2. Classify

Give every comment exactly one category:

- **Tautology**: the code already says it, through names, types, values or a test name.
- **Stale**: history ("was", "used to", "previously", "renamed from"), or a claim the code or
  its dependencies no longer bear out. Check the claim against the code, and against upstream
  with `gh` when it names an upstream issue or version.
- **Excuse**: it defends a workaround, a cast, a duplicated value kept "in step" by hand,
  a fallback that exists for tests, or an undiagnosed "this did not work". The fix is code.
- **Decision record**: a non-obvious *why* a future reader would otherwise undo, such as a
  constraint, a trade-off or a rejected alternative.

A comment that mixes categories takes its strongest one: excuse over decision record over
stale over tautology.

`.env.example` comments are user-facing setup docs. Leave them unless they go stale.

Done when every comment in the inventory has a category.

## 3. Act

- **Tautology, stale**: delete.
- **Excuse**: delete, and file one issue per workaround as described in
  `docs/agents/issue-tracker.md`. Check `gh issue list` for an existing one first. Say what
  the workaround is, why it was there, and a checkable "Done when". Label it
  `ready-for-agent` when the fix is clear, `needs-triage` when it needs a diagnosis first.
- **Decision record**: move it into `docs/adr/` in the format of
  `.agents/skills/domain-modeling/ADR-FORMAT.md`. Extend the ADR that already covers the topic
  before you add a new one. One ADR per decision, not one per comment.

When an agent doc (`AGENTS.md`, `docs/agents/*`, a first-party skill) points at a comment you
delete, repoint it at the ADR.

Delete by exact location (the line and column from step 1), never by a regex over the file.
Each location applies to the file as it was when the inventory ran, so strip a file once
only. Afterwards, every deleted line must be part of a comment:

```sh
git diff --no-color | grep -E '^-[^-]' | grep -v -E '^-\s*(//|#|\*|/\*|<!--|-->)|^-\s*$'
```

Anything this prints must be the inside of a multi-line comment block.

Done when every comment is gone, every excuse has an issue number, and every decision record
is in an ADR.

## 4. Check

Run `pnpm lint:fix`, `pnpm typecheck`, `pnpm test`, and `pnpm test:browser` if `app/`
changed. Never suppress the rule: a new comment gets fixed, not suppressed.

Done when all checks pass.

## 5. Ship

Ship it as a PR, as described under Pull requests in `docs/agents/issue-tracker.md`. The PR body
lists the issues filed and the ADRs added or extended, and gives each category's count.
