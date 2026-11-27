# Each change ships as one squash-merged PR with a Conventional Commits title

release-it builds `CHANGELOG.md` and picks the next version from the commits on `main`,
read through the `conventionalcommits` preset in `.release-it.json`. So we ship every
change as its own pull request, squash-merge it, and make its title a Conventional
Commits subject. GitHub sets the squash commit's subject to the PR title plus ` (#<n>)`,
which turns each PR into exactly one changelog line under the section its type maps to:
`feat` → Features, `fix` → Bug Fixes, `chore(deps)` → Dependencies. `docs`, `chore`,
`refactor`, `test`, `build` and `ci` are hidden from the changelog.

The PR title is the one place the format is enforced. Commits on a branch can say
anything, because squashing discards them.

## Considered options

- **Merge commits or rebase merges.** Every branch commit would land on `main` and
  become its own changelog entry, so each commit would need a release-ready subject.
  Repository settings still allow both methods, so squash-only is a convention every
  merge has to follow.
- **A commit-message linter (commitlint, a Git hook).** It would check branch commits
  that squashing throws away, and miss the PR title, which is the subject that counts.
