# Daily dependency release

A Paseo schedule runs this procedure once a day in a fresh, unattended Claude Code agent
on the maintainer's Mac. It ships the dependency updates Renovate has already picked,
verifies them on Staging, and makes a Release to Production. No human is watching, so
every step ends in a state you can check, and every failure leaves a trail on GitHub.

The schedule's prompt is a single line: `Follow docs/agents/daily-dependency-release.md.`

## Hard rules

- **Minimum release age.** Every version you merge or install, transitive ones
  included, must be older than the minimum release age: `minimumReleaseAge: "1 day"` in
  `renovate.json` and `minimumReleaseAge: 1440` in `pnpm-workspace.yaml`. An update that
  is too young waits for tomorrow's run. The age gate stays exactly as configured. Leave
  both age keys untouched, add no `minimumReleaseAgeExclude` entries or CLI overrides,
  and leave every Dependency Dashboard checkbox unticked.
- **Renovate decides what to bump.** Apply only updates that Renovate lists. Renovate
  owns every version bump in this repo. You are replaying its decisions on a daily clock.
- **Workflow.** CLAUDE.md's Workflow rules (worktree isolation, rebasing, Node via
  `fnm`) hold for every step.
- **Token hygiene.** CLAUDE.md's rule on the `?token=` query parameter holds in PR
  bodies, comments and issues too.

## Steps

`<date>` below is today as `YYYY-MM-DD`.

### 1. Guard

Run `git fetch --prune origin`, then stop with a one-line status and change nothing if
either of these holds:

- an open PR has the `dependencies` label and is not authored by `app/renovate`
  (yesterday's run, or a human's sweep, is still in flight);
- an `origin/chore/deps-*` branch exists.

Then remove `../fritzdns-deps-*` worktrees older than 7 days with `git worktree remove`.

Done when: nothing in flight, and stale worktrees are gone.

### 2. Collect

Read the Dependency Dashboard with `gh issue view 1`. Sort its entries:

- **Awaiting Schedule**: apply these. The target versions are in the "Detected
  Dependencies" section (`→ [Updates: …]`).
- **Open**: Renovate's own PRs (for example lock file maintenance). Ship these as they
  are.
- **Pending Status Checks**: still inside the age window. Skip them.

For each Awaiting Schedule target, confirm its age yourself:
`npm view <pkg> time --json` must show the target published more than 24 hours ago.
GitHub Actions targets must have a release at least that old.

Mark an update as **major** when its major version changes (or its minor version, while
it is below 1.0). Majors ship to Staging only. See step 6.

Done when: every dashboard entry is either applicable (age confirmed) or skipped with a
reason.

If nothing is applicable and no Renovate PR is open, go to step 6, which may still
release earlier unreleased commits.

### 3. Apply

`git worktree add ../fritzdns-deps-<date> -b chore/deps-<date> origin/main`, then work
inside it. Run `fnm exec --using=.nvmrc pnpm install` once first, then record the
baseline audit before you edit anything:
`fnm exec --using=.nvmrc pnpm audit --json > /tmp/audit-base-<date>.json`.

Apply the non-major updates as a single commit titled like Renovate's group
(`chore(deps): update all non-major dependencies`). Give each major its own branch
`chore/deps-<date>-<pkg>`, and title it like Renovate would (for example
`chore(deps): update devdependency h3 to v2`). For each update:

- Edit the file Renovate detected it in. Keep the existing range style (`^x.y.z`). A
  `pnpm` update changes `packageManager` in `package.json`.
- Run `fnm exec --using=.nvmrc pnpm install`. If pnpm rejects a transitive dependency
  as too young, drop that update from today's run.
- If install leaves auto-installed peers stale, delete **both** `pnpm-lock.yaml` and
  `node_modules` and install again. Deleting only the lockfile rebuilds it from
  `node_modules/.pnpm/lock.yaml`.

Then run `pnpm audit --json` again, compare its advisories against the baseline file, and
note any new ones in the PR body.

Done when: each branch installs cleanly with no age rejections.

### 4. Verify locally

On each branch, run `pnpm lint:fix`, `pnpm typecheck` and `pnpm test` through `fnm exec`.
`git diff --stat` must show only the files you meant to change. If `lint:fix` touched
anything else, revert those files.

If a check fails, fix it only when the fix is a direct consequence of the update (a
renamed import, a changed type). Otherwise drop that update and record why. Never weaken
a test or a lint rule to get to green.

Done when: all three commands are green on every branch you still intend to ship.

### 5. Pull request and merge

Follow the steps of the `commit-push-pr` skill
(`.agents/skills/commit-push-pr/SKILL.md`), but skip its Step 6 preview-and-STOP. This
procedure is your standing confirmation. The PR body lists every update as
`pkg from → to`, plus any updates you dropped and why.

Before each push: `git fetch origin && git rebase origin/main`, then rerun step 4 if the
lockfile changed. Then:

1. `gh pr checks <pr> --watch`. `lint`, `typecheck` and `test` must all pass.
2. `gh pr merge <pr> --squash --delete-branch`. This also deletes the PR's worktree.
3. For each open Renovate PR from step 2: check out its branch, run step 4 on it, then
   do the same two steps. If the PR conflicts with `main`, skip it silently: Renovate
   rebases its own branches.

Merge PRs one at a time, and rebase each remaining one onto the new `origin/main`
before merging it.

A PR that fails CI is not merged. Leave it open, add a `gh pr comment` explaining the
failure, carry on with the others, and handle it in step 8.

Done when: every PR is merged, left open with a comment, or skipped as conflicting.

### 6. Staging

Each merge to `main` deploys Staging. Watch the push run for the merge commit
(`gh run list --branch main --workflow cicd.yml`, then `gh run watch <id>`). After the
last merge, `curl -fsS https://stage-fritzdns.piscis.dev/api/health-check` must succeed.

Done when: the latest `main` run is green and Staging is healthy.

### 7. Release

Release only if all of these hold:

- `git log <last tag>..origin/main` is non-empty. Tags have no `v` prefix:
  `git describe --tags --abbrev=0 origin/main`.
- Staging is healthy (step 6).
- No major update is on `main` since the last tag. A major is a `chore(deps)` commit
  whose title ends in `to v<N>`. Otherwise open (or update) a
  `ready-for-human` issue titled `Release pending: major dependency update`, naming the
  majors, and stop here. Production rollout of a major is the maintainer's call.

Then release from a new worktree. Step 5's merge deleted the deps worktree, so create
this one first and run every command below inside it:

1. `git worktree add ../fritzdns-release-<date> -b chore/release-<date> origin/main`,
   then `fnm exec --using=.nvmrc pnpm install --frozen-lockfile`.
2. `fnm exec --using=.nvmrc pnpm exec release-it -i patch --ci --no-git.requireUpstream --no-git.push --no-github.release`.
   Plain `pnpm release:patch` fails in a worktree. `.release-it.json` lists
   `chore(deps)` commits under `### Dependencies`, so the new `CHANGELOG.md` section is
   complete as generated.
3. `git push origin HEAD:main`, then `git push origin <version>`.
4. Write the new section without its `## [<version>]` heading to
   `/tmp/release-notes-<version>.md`, then
   `gh release create <version> --title v<version> --notes-file /tmp/release-notes-<version>.md`.
5. `git merge-base --is-ancestor origin/released HEAD` must succeed. Then
   `git push origin HEAD:released`. This is a fast-forward, which deploys Production.
6. Watch the `released` run until it is green. Then
   `curl -fsS https://fritzdns.piscis.dev/api/health-check` must succeed.

Done when: Production runs the new version and is healthy.

### 8. Failures and report

- If an update or PR stays broken, open a `needs-triage` issue with the failing command
  and its output. Keep the open PR. When an issue already tracks it, comment only on
  news: a different error, a new blocking package, or a blocker that cleared. An
  unchanged blocker needs no comment; list it in the report instead.
- If Production is unhealthy after a release, open a `needs-triage` issue titled
  `Production unhealthy after <version>`. Do not roll back yourself.
- On success, remove the release worktree and delete its `chore/release-<date>` branch.
- Keep a failing worktree for inspection only when you opened a new issue for it, or
  commented with news. Otherwise the issue already holds the output, so remove the
  worktree.

Finish with one short paragraph for Paseo: what shipped (versions, PRs, release), what
was skipped and why, and links to any issues you opened.
