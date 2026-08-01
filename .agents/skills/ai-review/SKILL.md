---
name: ai-review
description: >-
  Run an automated code review on the current branch's pull request and post
  findings as a formal PR review with inline comments. Use when the user asks
  for ai-review, PR review posting, or to review the open PR on the current
  branch (GitHub via gh, Forgejo via user-forgejo MCP).
disable-model-invocation: true
---

# AI Review

Perform an automated code review of the current branch's pull request and post the results as a formal PR review with inline comments. Use **GitHub CLI (`gh`)** for GitHub-hosted repos and a **Forgejo MCP server** for Forgejo-hosted repos. Use a **Context7 MCP server** for library documentation lookups when needed.

MCP server names are per-machine configuration, not portable identifiers. In this setup they
are `user-forgejo` and `user-context7`; if servers with different names provide the same
capability, use those. If a required server is missing, say so rather than improvising.

### Step 1 — Validate branch and detect platform

Gather context first (run in parallel):

```bash
git branch --show-current
git remote get-url origin
git symbolic-ref refs/remotes/origin/HEAD
```

- Determine the **default branch** from `git symbolic-ref refs/remotes/origin/HEAD` (e.g.
  `refs/remotes/origin/main` → `main`). If the current branch is the default branch — or a
  protected release branch such as `released` — **stop immediately** and tell the user: "This
  command can only run on a feature branch with an open PR."
- Parse the git remote URL to extract **owner**, **repo**, and **host**:
  - `https://user@github.com/acme/widgets.git` → host: `github.com`, owner: `acme`, repo: `widgets`
  - `https://user@git.example.com/team/service.git` → host: `git.example.com`, owner: `team`, repo: `service`
- Set **platform**:
  - `github.com` → `github` (use `gh` for all PR operations below)
  - any other host → `forgejo` (use the Forgejo MCP server)

### Step 2 — Find the PR

#### GitHub (`platform: github`)

Run:

```bash
gh pr view --json number,title,body,url,headRefOid,headRefName,baseRefName
```

If that fails (no PR for current branch), run:

```bash
gh pr list --head <branch> --json number,title,body,url,headRefOid,headRefName,baseRefName
```

- If no matching open PR exists, **stop** and tell the user: "No open PR found for branch `<branch>`."
- Record the PR **number**, **title**, **body**, **url**, and **headRefOid** (`commit_id` for posting reviews).

#### Forgejo (`platform: forgejo`)

Call Forgejo MCP `list_repo_pull_requests` with the owner, repo, and `state: "open"`.

Find the PR whose `head.ref` (head branch) matches the current branch name.

- If no matching open PR exists, **stop** and tell the user: "No open PR found for branch `<branch>`."
- Record the PR **index** (number) for subsequent calls.

### Step 3 — Read PR description

Use the PR **title** and **body** from Step 2 to understand the intent and scope of the changes before reviewing the diff.

- **GitHub:** already returned by `gh pr view`
- **Forgejo:** call `get_pull_request_by_index` with owner, repo, and the PR index

### Step 4 — Reconcile previous AI reviews

#### GitHub

```bash
gh api --paginate repos/{owner}/{repo}/pulls/{number}/reviews \
  --jq '.[] | {id, body, user: .user.login}'
```

`--paginate` is required — a PR with more than 30 reviews would otherwise hide the older ones
from this reconcile step, and the skill would re-post findings it has already made.

For each review whose `body` contains the marker `<!-- ai-review -->`:

1. Fetch inline comments:
   ```bash
   gh api --paginate repos/{owner}/{repo}/pulls/{number}/reviews/{review_id}/comments \
     --jq '.[] | {path, line, body}'
   ```
2. For each inline comment, check whether the issue has been **actually resolved** in the current code:
   - Read the file at the comment's `path` locally and inspect the code around the referenced line.
   - Compare with the current PR diff to see if the flagged code has been changed, removed, or fixed.
   - A finding is resolved if the problematic code no longer exists or has been corrected.
3. GitHub does not support dismissing `COMMENT` reviews. If **every** inline comment from a previous AI review is resolved, note that in the new review summary (e.g. "All findings from previous AI review are resolved."). If any finding is still unresolved, do not claim resolution and avoid re-posting the same finding unless it still applies.

Leave all non-marker reviews (human reviews, CI bot reviews) untouched.

#### Forgejo

Call Forgejo MCP `list_pull_reviews` with owner, repo, and the PR index.

For each review whose `body` contains the marker `<!-- ai-review -->`:

1. Call `list_pull_review_comments` to retrieve all inline comments from that review.
2. For each inline comment, check whether the issue it flagged has been **actually resolved** in the current code (same rules as GitHub above).
3. Mark a review as **eligible for dismissal** only if **every** inline comment in it has been
   addressed. If any finding is still unresolved, it stays undismissed.

**This step decides; it does not act.** Do not call `dismiss_pull_review` here — dismissal is a
mutation on a shared PR, so it happens in Step 9, after the user has confirmed the preview that
lists which reviews will be dismissed.

Leave all non-marker reviews (human reviews, CI bot reviews) untouched.

### Step 5 — Gather review data

Run these in parallel:

#### GitHub

1. `gh pr diff {number}` — full unified diff
2. `gh pr diff {number} --name-only` — changed file paths

#### Forgejo

1. Forgejo MCP `get_pull_request_diff` (owner, repo, index)
2. Forgejo MCP `list_pull_request_files` (owner, repo, index)

#### Both platforms

3. Read `.ai_review/project.md` for project-specific review context (architecture, focus areas, anti-patterns). If missing, infer focus areas from the changed file paths.
4. Read `.ai_review/config.yml` and extract the `exclude_patterns` list. If missing, use these defaults:

   `*.lock`, `pnpm-lock.yaml`, `*.min.js`, `*.min.css`, `node_modules/**`, `dist/**`,
   `.nuxt/**`, `.next/**`, `.output/**`, `.turbo/**`

   Filter out any changed file matching an exclude pattern.

Both files are optional. See
[`references/ai-review-config.md`](references/ai-review-config.md) for their schema and for how
to add generated-data directories to `exclude_patterns` in a specific project.

**Then read source files for context, within these bounds.** A review that exhausts its context
window part-way through produces a worse review than one that admits it sampled:

- Read at most **15 files** in full, prioritised by number of changed lines.
- Skip any file over **~800 lines**; for those, and for any file past the 15-file cap, read only
  **±60 lines around each diff hunk** instead.
- Never read deleted files.
- If any file was skipped or partially read, **say so in the Step 8 review summary** (e.g.
  "Reviewed 15 of 42 changed files in full; the rest from diff context only."). Silent
  truncation reads as full coverage.

### Step 6 — Look up library docs

When the diff uses a library API you are not confident about, use the Context7 MCP server to
look up its documentation:

1. Call `resolve-library-id` with the library name to get its Context7 ID.
2. Call `get-library-docs` with that ID and a focused topic query.

Look up whichever libraries the diff actually imports — do not work from a fixed list, and do
not look up every library mentioned. Only reach for docs when uncertain about correct usage.

### Step 7 — Analyze the diff

**Choose the focus areas first.** Take the first branch that applies — do not stack them:

1. **`.ai_review/project.md` exists** → its focus areas **replace** everything below. It is the
   project's own statement of what matters; trust it over any default.
2. **No `project.md`, but the repo matches a stack with a focus-area reference** → read that
   reference and use it. Currently available:
   [`references/focus-areas-nuxt-payload-wordpress.md`](references/focus-areas-nuxt-payload-wordpress.md),
   which applies when the repo depends on Nuxt, Payload CMS, ORPC, or is a WordPress/PHP
   codebase. Detect this from `package.json` dependencies or the presence of
   `composer.json` / `wp-content` — **not** from a hunch about the file paths.
3. **Neither** → use only the generic framework below. Do not import review rules from a stack
   this repo does not use; a Nuxt SSR rule applied to a Go service produces confident nonsense.

**Generic framework (always applies).**

Flag, in descending priority:

- **Security** — hardcoded secrets or credentials, secrets reaching a client bundle, missing
  authentication or authorization checks, unvalidated input crossing a trust boundary, injection
  (SQL/command/template), unsafe deserialization.
- **Correctness** — logic that does not do what the surrounding code and PR description say it
  should, off-by-one and boundary errors, unhandled error paths, resource leaks, broken
  invariants, race conditions in concurrent or async flows.
- **Data loss** — destructive operations without a guard, migrations without a reverse path,
  wholesale overwrites of state that may have changed concurrently.
- **Contract breaks** — a changed public signature, response shape, or config key whose callers
  were not updated in the same diff.

Report when meaningful: missing error handling on external calls, accessibility gaps on
user-facing markup (missing labels, keyboard handlers, focus management), and performance
problems with a plausible real-world impact (N+1 queries, unbounded loops over remote data).

**Skip entirely** — in every repo:

- Pure style and formatting nits. Assume the project has a formatter and linter; if it does not,
  that is one comment, not thirty.
- Library or framework swaps the project has clearly already decided against. Suggesting a
  codebase's established stack be replaced is noise, not review.
- Restating what the diff already says, or praise.

For each finding, record:
- `path`: file path relative to repo root
- `line`: line number on the **new** side of the diff where the issue occurs (parse from unified diff `@@` hunk headers and `+` line counts)
- `body`: the finding in markdown, prefixed with a severity tag: **Security:**, **Bug:**, **Performance:**, or **Suggestion:**
- `fix_prompt`: a minimal one-line action statement for a Cursor agent to fix the issue (e.g. `Fix double period typo in README.md line 3`)

For Forgejo-only field naming: Forgejo inline comments use `new_position` instead of `line` — record both mentally, use the field name required by the target platform in Step 8.

### Step 8 — Preview and confirm

Posting a review is outward-facing: it notifies every PR subscriber, and on Forgejo Step 9 may
also dismiss earlier reviews. Show the user what will be published, then stop.

Present a single message with:

- **Platform:** `GitHub` or `Forgejo` (`<host>`) — **PR:** `#<number> <title>`
- **Coverage:** how many changed files were reviewed in full vs from diff context only
  (from Step 5's read bounds), and any excluded paths worth mentioning
- **Previous AI reviews:** how many carry the marker, and which will be noted as resolved or
  dismissed
- **Findings (N):** one line per finding — `severity · path:line · one-line summary`
- Final line: `Reply 'yes' (or 'y') to post the review, anything else to abort.`

**STOP.** Do not call any tools after presenting the preview.

**Strict confirmation check.** The reply counts as confirmation **only** if, after trimming
whitespace and lowercasing, it is exactly one of: `yes`, `y`, `confirm`, `ok`. Anything else
aborts. On abort, reply `Review not posted.` and do nothing else — no posting, no dismissing.

### Step 9 — Post the review (only on confirmation)

Always end the review body with the marker `<!-- ai-review -->` on its own line.

Example summary with findings:

```
**AI Review Summary**

Found 3 issues across 2 files (1 bug, 2 suggestions).

<!-- ai-review -->
```

Example summary with no findings:

```
**AI Review Summary**

No issues found. All changes look good.

<!-- ai-review -->
```

Each inline comment body must include the severity-tagged finding followed by a collapsed fix prompt block:

````markdown
**Bug:** Description of the issue.

<details>
<summary>Fix prompt</summary>

```text
Fix the issue in path/to/file.ts line 42
```

</details>
````

#### GitHub (`platform: github`)

**With inline comments** — use the REST API (requires `commit_id` from Step 2):

```bash
gh api repos/{owner}/{repo}/pulls/{number}/reviews --method POST --input - <<'EOF'
{
  "commit_id": "<headRefOid>",
  "event": "COMMENT",
  "body": "**AI Review Summary**\n\n...\n\n<!-- ai-review -->",
  "comments": [
    {
      "path": "path/to/file.ts",
      "line": 42,
      "side": "RIGHT",
      "body": "**Bug:** Description.\n\n<details>\n<summary>Fix prompt</summary>\n\n```text\nFix ...\n```\n\n</details>"
    }
  ]
}
EOF
```

**Without inline comments** — pipe the body in on stdin, so nothing is written into the user's
working tree:

```bash
gh pr review {number} --comment --body-file - <<'EOF'
**AI Review Summary**

...

<!-- ai-review -->
EOF
```

**If the POST fails.** `POST /pulls/{number}/reviews` is atomic: if any single comment's
`line`/`side` pair is not part of the PR diff, GitHub rejects the whole request with `422` and
posts **nothing** — not even the summary. Since Step 7 derives `line` by hand-counting hunks,
this is the most likely failure. On a non-2xx response:

1. Read the error to find which comment(s) were rejected (`line must be part of the diff`).
2. Retry **once** without those comments.
3. If it still fails, post the summary alone via the `--body-file -` form above, and list the
   findings that could not be anchored inline as plain text in the summary body.

Do not report success until a request has actually returned 2xx.

#### Forgejo (`platform: forgejo`)

Call Forgejo MCP `create_pull_review` with:

- `owner`, `repo`, `index`: from earlier steps
- `state`: `"COMMENT"`
- `body`: review summary (with `<!-- ai-review -->` marker)
- `comments`: JSON string array of inline comments using `new_position` (not `line`):

  ```json
  [{"path": "src/api/handlers/create.ts", "body": "**Security:** Missing input validation.\n\n<details>\n<summary>Fix prompt</summary>\n\n```text\nAdd an input schema to the handler in src/api/handlers/create.ts line 42\n```\n\n</details>", "new_position": 42}]
  ```

  Omit `comments` entirely if there are no findings.

If the call fails, apply the same degradation as GitHub: retry once without the rejected
comments, then post the summary alone with the unanchored findings listed as plain text.

**Then dismiss the reviews marked eligible in Step 4** — call `dismiss_pull_review` with message
`"All findings resolved"` for each. Do this only after the new review has posted successfully, so
a failed post never leaves the PR with its previous findings dismissed and nothing to replace
them.

### Step 10 — Report

Only after a call has returned successfully, tell the user:
- The platform used (`GitHub` or `Forgejo`)
- The PR number and title
- How many findings were posted, and how many had to be listed in the summary instead of inline
- How many changed files were reviewed in full vs from diff context only
- How many previous AI reviews were reconciled (and dismissed on Forgejo, or noted as resolved on GitHub)
- A link to the PR:
  - **GitHub:** URL from `gh pr view`
  - **Forgejo:** `https://<host>/<owner>/<repo>/pulls/<index>`

If posting failed at every attempt, say that plainly instead — do not describe an unposted
review as posted.
