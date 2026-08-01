---
name: conventional-commit
description: >-
  Preview a Conventional Commits subject for all working-tree changes, then
  commit only after the user confirms. Use when the user asks for a conventional
  commit, commit preview, or to commit with confirmation.
disable-model-invocation: true
---

# Conventional Commit

This skill runs in **two phases**: preview, wait, commit. Do **not** run `git add` or `git commit` until the user confirms.

Gather context first (run in parallel):

```bash
git status
git status --porcelain=v1 -uall
git diff HEAD
git branch --show-current
git log -10 --oneline
```

Both status forms are needed and feed different steps:

- **`git status`** (human-readable) — step 1's pre-flight guards. Only this form prints the
  in-progress-operation phrases (`rebase in progress`, `You have unmerged paths`, …).
- **`git status --porcelain=v1 -uall`** — step 3's file list. `--porcelain=v1` emits the exact
  status codes step 3 needs, and `-uall` lists untracked files individually instead of
  collapsing a new directory to a single `dir/` entry. The preview is the only thing standing
  between the user and `git add -A`, so it must show every file that will actually be
  committed — plain `git status` hides them.

### Phase 1 — Preview (this turn)

1. **Pre-flight guards.** Stop and tell the user (do not preview, do not stage, do not commit):
   - if `git status` indicates a merge, rebase, cherry-pick, or revert is in progress (look for phrases such as `You have unmerged paths`, `rebase in progress`, `interactive rebase in progress`, `currently cherry-picking`, or `You are currently reverting`).
   - if the status output shows no changes at all — nothing to commit.
2. **Compose a Conventional Commits subject line** (subject only — no body):
   - Type from: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`.
   - **Scope:** infer from the dominant top-level path or package in the diff (e.g. `feat(theme): ...`, `fix(plugins): ...`, `chore(composer): ...`). Omit the scope when no single area dominates.
   - Imperative, lowercase subject, no trailing period, ≤72 chars.
   - Use `!` after the type/scope for breaking changes (e.g. `feat(api)!: drop legacy endpoint`). No body, no `BREAKING CHANGE:` footer.
   - Match the tone and length of the recent commits shown in context.
3. **Build the file list** that `git add -A` would commit. Use the `git status --porcelain=v1 -uall` output above — every entry there is included. Use simplified single-letter prefixes:
   - `M` modified
   - `A` added
   - `D` deleted
   - `??` untracked
   - `R` renamed (`R old -> new`) — see the rename note below

   **Renames.** Git only reports `R` for *staged* renames, and this skill deliberately stages
   nothing before confirmation, so a rename arrives as a ` D old/path` entry plus a
   `?? new/path` entry. When a `D` and a `??` entry are clearly the same file moved, collapse
   them into one `R old -> new` bullet. When you are not sure, leave both entries as-is —
   never hide a deletion behind a guess.

   Render as a plain markdown bullet list (not inside a fenced code block). Wrap each `prefix + path` in inline backticks so paths render monospaced. Example:

   - `M src/config.php`
   - `A src/inc/foo.php`
   - `?? src/new.php`

   **Cap tracked entries at 30** (`M`, `A`, `D`, `R`). If there are more, show the first 30 of
   them and add a bullet `- ... and N more tracked files`. **Never cap or truncate `??`
   entries** — untracked files are exactly the ones the user has not seen before, and hiding
   them defeats the gate. If the untracked list is enormous, that is itself worth saying out
   loud alongside the full list.
4. **Present the preview** as a single message with exactly these sections in this order:
   - **Branch:** `<current branch>`
   - **Commit message:** the proposed subject line in a fenced code block.
   - **Files (N):** the bullet list from step 3, where N is the *total* file count (not capped).
   - Final line: `Reply 'yes' (or 'y') to commit, anything else to abort.`

   Do not include diff sizes, per-directory summaries, or any other metadata.
5. **STOP.** Do not call any tools after presenting the preview. Wait for the user's reply.

### Phase 2 — Commit (next turn, only on confirmation)

6. **Strict confirmation check.** The reply counts as confirmation **only** if, after trimming whitespace and lowercasing, it is exactly one of: `yes`, `y`, `confirm`, `ok`. Anything else — including `sure`, `go`, `lgtm`, `yes but ...`, or any request to modify the message — aborts. On abort, reply `Commit aborted.` and do nothing else (no staging, no commit, no follow-up questions).
7. On confirmation, run these **in order** — each depends on the previous one succeeding, so
   they cannot be parallelised:
   1. `git add -A`
   2. `git commit -m "<message>"`
   3. `git log -1 --oneline` — report the resulting short SHA + subject to the user.

   If a step fails, stop and report which step failed with its error. Do not push. Do not
   create branches. Do not create PRs.
