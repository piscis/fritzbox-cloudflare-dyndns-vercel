# Issue tracker: GitHub

Issues and specs for this repo live as GitHub issues on
`piscis/fritzbox-cloudflare-dyndns-vercel`. Use the `gh` CLI for all operations; run it
inside a clone so it infers the repo from `git remote -v`.

File issues only into this repo. Never file into `mattpocock/skills` (the repo these
skills come from). Before the first `gh issue create` of a session, check the target with
`gh repo view --json nameWithOwner`.

## Create an issue

Pass title, body and labels in one call. A label that doesn't exist fails the whole call,
so check the repo's labels first with `gh label list --limit 200`.

```sh
gh issue create --title "..." --label "ready-for-agent" --body-file - <<'EOF'
...
EOF
```

## Read an issue

Read the body and all comments, newest comment first. A later triage comment can
re-scope the ticket, and the body is never edited to match.

```sh
gh issue view <number> --json number,title,state,body,labels,comments \
  --jq '{number, title, state, labels: [.labels[].name], body, comments: (.comments | reverse | map({author: .author.login, createdAt, body}))}'
```

## Other operations

- **List issues**: `gh issue list --state open --json number,title,body,labels,comments --jq '[.[] | {number, title, body, labels: [.labels[].name], comments: [.comments[].body]}]'` with `--label` and `--state` filters.
- **Comment on an issue**: `gh issue comment <number> --body "..."`.
- **Apply / remove labels**: `gh issue edit <number> --add-label "..."` / `--remove-label "..."`.
- **Make an issue a sub-issue of a parent**: `gh issue create --parent <parent> ...`, or `gh issue edit <parent> --add-sub-issue <child>` afterwards (`gh` 2.94+). Older `gh`: `gh api --method POST repos/piscis/fritzbox-cloudflare-dyndns-vercel/issues/<parent>/sub_issues -F sub_issue_id=<child-db-id>` (database id, as in **Blocking**).
- **Blocking**: GitHub's native issue dependencies. Add an edge with `gh issue create --blocked-by <n>,<n> ...` or `gh issue edit <child> --add-blocked-by <blocker>` (`gh` 2.94+). Older `gh`: `gh api --method POST repos/piscis/fritzbox-cloudflare-dyndns-vercel/issues/<child>/dependencies/blocked_by -F issue_id=<blocker-db-id>`, where `<blocker-db-id>` is the blocker's numeric database id (`gh api repos/piscis/fritzbox-cloudflare-dyndns-vercel/issues/<n> --jq .id`, not the `#number` or `node_id`). A ticket is unblocked when every blocker is closed.
- **Count open blockers**: `gh api repos/piscis/fritzbox-cloudflare-dyndns-vercel/issues/<n> --jq .issue_dependencies_summary.blocked_by` (open blockers only; 0 means startable).

## Close an issue

1. Post the write-up: `gh issue comment <number> --body-file - <<'EOF' ... EOF`.
2. Close: `gh issue close <number>`. Don't use `gh issue close --comment`: on an
   already-closed issue it drops the comment and still exits 0.
3. Check that the comment landed:
   `gh issue view <number> --json state,comments --jq '{state, last: .comments[-1].body}'`.

Closing leaves the labels alone: the triage role stays as the record of who the issue was
for, and every queue lists only open issues.

In a PR body, write "#N stays open" rather than "does not close #N" (GitHub's closing
keywords match the latter), and check the issue's state after merging with
`gh issue view <N> --json state`.

## Not triage material

The **`no-triage`** label marks machinery issues that nobody resolves, such as Renovate's
Dependency Dashboard. `/triage` drops them from all of its buckets. Never give them a
category or state role, never close them, and never file them under `.out-of-scope/`.

List them with `gh issue list --label no-triage`.

## Specs

The **`spec`** label marks a spec.

- `/to-spec` passes both labels in the same create call:
  `gh issue create --label spec,ready-for-agent ...`. `spec` says what the issue is,
  `ready-for-agent` who it is for.
- The tickets `/to-tickets` cuts from a spec start their body with `## Parent` followed by
  `#<spec>`, and never carry `spec`. Also attach each ticket as a native sub-issue of the
  spec (`gh issue create --parent <spec> ...`, see **Make an issue a sub-issue**).
- A spec split out of a larger spec is labelled `spec` too, with a `Part of #<n>` line
  naming the parent, and is attached as its sub-issue.
- List specs with `gh issue list --label spec`.

## Pull requests

Why every change ships this way: [ADR 0010](../adr/0010-squash-merge-conventional-commit-prs.md).

- **Open**: push the branch, then open the PR against `main`:
  `gh pr create --base main --title "<subject>" --body-file -`. The title is a
  conventional-commit subject (`feat(api): …`, `fix(web): …`, `chore(deps): …`) scoped to
  the area it touches, because the squash commit takes it plus ` (#<n>)`. The body
  carries `Closes #<n>` for the issue it finishes.
- **CI**: read the checks of the head SHA with `gh pr checks <pr> --watch`; failed logs
  come from `gh run view <run-id> --log-failed`. A skipped check counts as passed.
  Re-run a flake (`gh run rerun <run-id> --failed`) only once its log shows the failure
  has nothing to do with the change.
- **Merge**: squash only, with the branch deleted, and only on green. Before merging,
  check that the head SHA is still the one you polled
  (`gh pr view <pr> --json headRefOid`), and pass it as
  `gh pr merge <pr> --squash --delete-branch --match-head-commit <sha>`. Never pass
  `--admin`: an admin token gets past every check that way. Confirm the merge with
  `gh pr view <pr> --json state,mergeCommit` (`state` is `MERGED`), then clean up the
  local branch.

## Pull requests as a triage surface

**PRs as a request surface: no.** _(Set to `yes` if this repo treats external PRs as feature requests.)_

When set to `yes`, PRs run through the same labels and states as issues, using the `gh pr`
equivalents:

- **Read a PR**: `gh pr view <number>`, then `gh pr view <number> --comments` (off a TTY, `--comments` prints only the comments, not the body), and `gh pr diff <number>` for the diff.
- **List external PRs for triage**: `gh api --paginate 'repos/{owner}/{repo}/pulls?state=open' --jq '.[] | select(.author_association | IN("OWNER","MEMBER","COLLABORATOR") | not) | {number, title, author: .user.login, author_association, labels: [.labels[].name]}'`.
- **Comment / label / close**: `gh pr comment`, `gh pr edit --add-label`/`--remove-label`, `gh pr close`.

GitHub shares one number space across issues and PRs, so a bare `#42` may be either:
resolve with `gh pr view 42` and fall back to `gh issue view 42`.

## When a skill says "publish to the issue tracker"

Create an issue on `piscis/fritzbox-cloudflare-dyndns-vercel`, as in
**Create an issue**. A spec also gets `spec` (see **Specs**).

## When a skill says "fetch the relevant ticket"

Read it as in **Read an issue**.

## Wayfinding operations

Used by `/wayfinder`. The **map** is a single issue with **child** issues as tickets.

- **Map**: one issue labelled `wayfinder:map`, holding the Notes / Decisions so far / Fog
  body: `gh issue create --label wayfinder:map ...`.
- **Children**: each carries `wayfinder:<type>` (`research`, `prototype`, `grilling` or
  `task`), starts its body with `Part of #<map>`, sits in a task list in the map body, and
  is attached as a native sub-issue of the map (`gh issue create --parent <map> ...`).
- **Blocking**: GitHub's native "blocked by" relation (see **Blocking** above). A child is
  unblocked when every blocker is closed.
- **Frontier**: the map's open children with no open blocker (see **Count open
  blockers**) and no assignee, first in map order.
- **Claim**: `gh issue edit <n> --add-assignee @me`; this is the session's first write.
- **Resolve**: comment the answer (`gh issue comment <n> ...`), close the child
  (`gh issue close <n>`), then append the gist and a link to the map's "Decisions so far".
