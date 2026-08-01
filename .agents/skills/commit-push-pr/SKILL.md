---
name: commit-push-pr
description: >-
  Create a branch if needed, commit working-tree changes, push to origin, and
  open a pull request on GitHub (gh) or Forgejo (MCP). Use when the user asks to
  commit-push-pr, ship a PR, or commit push and open a pull request in one go.
disable-model-invocation: true
---

# Commit, push, and open a PR

Branch, commit, push, and open a pull request. Uses **`gh`** for GitHub-hosted origins and a
**Forgejo MCP server** for anything else. Prefer git, `gh`, and the Forgejo MCP for this
workflow — do not use unrelated tools.

The local commit is cheap and amendable; the push and the PR are outward-facing and awkward to
undo. So this skill commits without asking, then **stops for confirmation before pushing**.

Gather context first (run in parallel):

```bash
git status
git status --porcelain=v1 -uall
git diff HEAD
git branch --show-current
git remote get-url origin
git symbolic-ref refs/remotes/origin/HEAD
git log -10 --oneline
```

### Step 1 — Detect the platform (before touching anything)

Parse the `origin` URL for **host**, **owner**, and **repo**:

- `https://user@github.com/acme/widgets.git` → host `github.com`, owner `acme`, repo `widgets`
- `https://user@git.example.com/team/service.git` → host `git.example.com`, owner `team`, repo `service`

Set **platform**: `github.com` → `github` (use `gh`); any other host → `forgejo` (use the
Forgejo MCP server — `user-forgejo` in this setup; if a differently-named Forgejo server is
configured, use that one).

If `platform` is `forgejo` and no Forgejo MCP server is available, **stop now** and say so.
Do not fall back to `gh` — it cannot target a non-GitHub host, and by then the branch would
already be pushed.

This step runs **before** any branch, commit, or push, so the workflow never leaves a pushed
branch with no PR.

### Step 2 — Pre-flight guards

**Stop** and tell the user, without branching, committing, or pushing:

- if `git status` reports a merge, rebase, cherry-pick, or revert in progress (`You have
  unmerged paths`, `rebase in progress`, `interactive rebase in progress`, `currently
  cherry-picking`, `You are currently reverting`);
- if there are no changes at all — nothing to commit;
- if HEAD is detached (`git branch --show-current` is empty);
- if a PR is already open for the current branch — report it and stop instead of opening a
  second one. GitHub: `gh pr view --json number,url`. Forgejo: `list_repo_pull_requests` with
  `state: "open"`, matching `head.ref` against the current branch.

### Step 3 — Determine the base branch

Take the default branch from `git symbolic-ref refs/remotes/origin/HEAD` (e.g.
`refs/remotes/origin/main` → `main`). Do not hardcode `main`. If that ref is missing, fall
back to `git remote show origin` and read `HEAD branch`.

### Step 4 — Create a branch if needed

If the current branch is the base branch, create and switch to a new one. Name it
`<type>/<short-slug>`, where `<type>` is the Conventional Commits type chosen in Step 5 and
`<short-slug>` is 2–4 kebab-case words describing the change (e.g. `fix/session-expiry-banner`,
`feat/bulk-export`). If already on a feature branch, stay on it.

### Step 5 — Commit

Compose a **Conventional Commits** subject line (subject only — no body):

- Type from: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`,
  `chore`, `revert`.
- **Scope:** infer from the dominant top-level path or package in the diff. Omit it when no
  single area dominates.
- Imperative, lowercase, no trailing period, ≤72 chars.
- `!` after the type/scope for breaking changes (e.g. `feat(api)!: drop legacy endpoint`).
- Match the tone and length of the recent commits shown in context.

Then, **in order** (each depends on the previous succeeding):

1. `git add -A`
2. `git commit -m "<subject>"`

### Step 6 — Preview and STOP

Present a single message with exactly these sections:

- **Platform:** `GitHub` or `Forgejo` (`<host>`)
- **Branch:** `<branch>` → **Base:** `<base branch>`
- **Commit:** the subject line, in a fenced code block
- **Files (N):** bullet list of the committed paths, from the `--porcelain=v1 -uall` output.
  Cap tracked entries at 30 (`- ... and N more tracked files`); never truncate untracked
  entries.
- Final line: `Reply 'yes' (or 'y') to push and open the PR, anything else to stop here.`

**STOP.** Do not call any tools after presenting the preview. The commit is already made, so
stopping here is safe and leaves the work recoverable.

### Step 7 — Push and open the PR (next turn, only on confirmation)

**Strict confirmation check.** The reply counts as confirmation **only** if, after trimming
whitespace and lowercasing, it is exactly one of: `yes`, `y`, `confirm`, `ok`. Anything else —
including `sure`, `go`, `lgtm`, `yes but ...` — stops the workflow. On abort, reply
`Stopped before push. The commit is on <branch>.` and do nothing else.

On confirmation, run these **in order**, not in parallel — each depends on the previous one:

1. `git push -u origin HEAD`
2. Open the PR:
   - **GitHub:** `gh pr create --base <base> --head <branch> --title "<subject>" --body "<body>"`
   - **Forgejo:** the Forgejo MCP pull-request-creation tool, with `owner`, `repo`,
     `head` (branch), `base`, `title`, and `body`. If you do not know the tool's exact name,
     list the server's available tools and pick the PR-creation one rather than guessing.
3. Report the PR URL. Forgejo URL shape: `https://<host>/<owner>/<repo>/pulls/<index>`.

Use the commit subject as the PR title. For the body, summarise what changed and why in a few
lines — do not paste the diff.

If a step fails, stop and report **which** step failed with its error. In particular, if the
push succeeds but PR creation fails, say so explicitly and give the branch name — the user
needs to know the branch is already on the remote.
