---
name: update-issue
description: >-
  Refine an issue's title, description, and acceptance criteria through a
  planning conversation, then update it after explicit approval. Works on GitHub
  and Forgejo. Use when the user asks to update-issue, update-github-issue,
  improve an issue, or rewrite issue acceptance criteria.
disable-model-invocation: true
---

# Update Issue

Refine an existing issue's title, description, and acceptance criteria through a planning
conversation, then update the issue after explicit approval. Works on **GitHub** (GitHub MCP)
and **Forgejo** (Forgejo MCP).

Gather context first:

```bash
git remote get-url origin
```

### Step 1 — Resolve the target issue

- Parse the `origin` URL for **host**, **owner**, and **repo**:
  - `https://user@github.com/acme/widgets.git` → host `github.com`, owner `acme`, repo `widgets`
  - `https://user@git.example.com/team/service.git` → host `git.example.com`, owner `team`, repo `service`
- Set **platform**: `github.com` → `github`; any other host → `forgejo`.

  The host matters as much as owner/repo. `owner/repo` alone is ambiguous — handing a Forgejo
  `team/service` to the GitHub API would edit an unrelated `github.com/team/service` belonging
  to a stranger. If the remote is ambiguous or there are multiple remotes, ask the user.
- If the required MCP server for the detected platform is unavailable, **stop** and say which
  one is missing. Do not substitute the other platform's API.
- Ask the user for the **issue number** (if not already provided). Accept a full issue URL and
  extract the number from it — but if the URL's host/owner/repo disagree with `origin`, stop
  and ask which one is correct.
- Fetch the current issue:
  - **GitHub:** GitHub MCP `issue_read` (method `get`) with owner, repo, issue_number.
  - **Forgejo:** the Forgejo MCP issue-read tool with owner, repo, index. If you do not know
    its exact name, list the server's tools and pick the issue-read one rather than guessing.
- **Echo the target before going further:** `<host>/<owner>/<repo>#<number>` plus the fetched
  title. This is the user's chance to catch a wrong-repo resolution before anything is written.
- Summarize the current title and body so the user has context.

### Step 2 — Gather context

Ask the user up to **4** concise questions (the structured question tool accepts at most four
per call — `AskUserQuestion` in Claude Code, `AskQuestion` in Cursor). Pick the four that
matter most from:

1. **Problem statement** — What problem does this issue solve?
2. **Desired outcome** — What should be true when this is done?
3. **Scope** — What is in scope and what is explicitly out of scope?
4. **Implementation approach** — Any known technical direction or constraints?
5. **Definition of done** — How do we verify this is complete?

Adapt or skip questions the existing issue body already answers clearly. If nothing meaningful
remains unanswered, skip this step entirely rather than inventing questions.

### Step 3 — Explore the codebase (if needed)

If the issue involves code changes, briefly explore the relevant parts of the codebase to inform
the description and acceptance criteria. Keep this lightweight — only do it if it improves the
quality of the output.

### Step 4 — Propose the updated issue

Present the following for the user's review:

- **New title** — Must follow **conventional commits** style: `<type>(<scope>): <short description>`. Use lowercase. Types: `feat`, `fix`, `refactor`, `chore`, `docs`, `perf`, `test`, `ci`, `style`, `build`, `revert`. Scope is optional but encouraged (e.g. `feat(gallery): add session expiry warning banner`).
- **New description** — Structured with:
  - **Problem / Context** — Why this issue exists.
  - **Desired outcome** — What the end result should look like.
  - **Scope** — What is in and out of scope.
  - **Technical notes** — Implementation hints, affected files/layers, or constraints (if applicable).
- **Acceptance criteria** — A numbered or bulleted checklist. Each item should be testable and scoped. Use checkbox format (`- [ ]`).

Format acceptance criteria as concrete, verifiable statements, for example:
- `- [ ] User sees a warning banner 5 minutes before session expiry`
- `- [ ] Banner includes a "Refresh session" button that extends the session`

End with: `Reply 'yes' (or 'y') to update the issue, anything else to abort.`

### Step 5 — Wait for approval

**Strict confirmation check.** The reply counts as approval **only** if, after trimming
whitespace and lowercasing, it is exactly one of: `yes`, `y`, `confirm`, `ok`. Anything else —
including `sure`, `go`, `lgtm`, `looks good`, `yes but ...` — is not approval.

Step 6 replaces the issue's title and body wholesale and the old text is not recoverable
through this skill, so the gate is deliberately at least as strict as the one guarding a local
commit in `conventional-commit`.

If the user requests changes, revise the proposal and present it again. On a plain abort, reply
`Issue update aborted.` and do nothing else.

### Step 6 — Update the issue

**Re-fetch first.** Immediately before writing, fetch the issue again and compare its title and
body with what you fetched in Step 1. If either changed, **stop**, show what changed, and ask
whether to rebase the proposal onto the new text — someone edited it while this conversation was
running, and a wholesale overwrite would silently discard their work.

If unchanged, write:

- **GitHub:** GitHub MCP `issue_write` with `method: update`, `owner`, `repo`, `issue_number`,
  the approved `title`, and the approved `body` (including the acceptance criteria section).
- **Forgejo:** the Forgejo MCP issue-edit tool with `owner`, `repo`, `index`, `title`, `body`.

Confirm success and provide the issue URL:

- **GitHub:** `https://github.com/<owner>/<repo>/issues/<number>`
- **Forgejo:** `https://<host>/<owner>/<repo>/issues/<number>`
