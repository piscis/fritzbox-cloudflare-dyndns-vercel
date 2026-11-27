---
name: delete-comment
description: Sort code comments into tautology, stale, excuse or decision record, then delete them, filing issues and ADRs where needed.
disable-model-invocation: true
---

# Delete comments

This repo bans code comments with the `local/no-comments` lint rule (`eslint-rules/no-comments.ts`).
`eslint-suppressions.json` is the ratchet: it lists how many comments each file may still
carry, and lint fails when a file goes above its count or below it without a prune. Each run
of this skill shrinks that file.

Arguments are optional: paths or globs to work on. With none, work on every file in
`eslint-suppressions.json`, plus comments the rule cannot see (step 1).

## 1. Inventory

Build the worktree first (`AGENTS.md` → Workflow). List every comment in scope:

```sh
echo '{}' > /tmp/no-suppressions.json
pnpm exec eslint <paths> --suppressions-location /tmp/no-suppressions.json -f json -o /tmp/comments.json
```

The empty suppressions file makes the rule report the comments the ratchet hides.

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

## 4. Ratchet down

```sh
pnpm exec eslint . --prune-suppressions
```

Then run `pnpm lint:fix`, `pnpm typecheck`, `pnpm test`, and `pnpm test:browser` if `app/`
changed. Never add entries to `eslint-suppressions.json` or raise a count. A new comment gets
fixed, not suppressed.

Done when all checks pass and `eslint-suppressions.json` has shrunk, or is gone because its
last entry went.

## 5. Ship

Ship it as a PR following `.agents/skills/commit-push-pr/SKILL.md`. The PR body lists the issues
filed and the ADRs added or extended, and gives each category's count.
