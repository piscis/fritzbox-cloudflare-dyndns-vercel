# `.ai_review/` configuration

Optional per-project configuration read by the `ai-review` skill in Step 5. Both files live in
the **reviewed repository**, not in this skills repo, and both are optional — with neither, the
skill uses its built-in defaults.

```
.ai_review/project.md     # what to review in this project (optional)
.ai_review/config.yml     # what to exclude from review (optional)
```

## `project.md`

Free-form markdown describing what a reviewer of *this* project should care about. When present,
its focus areas **replace** the skill's built-in focus areas entirely (Step 7, branch 1) — so it
is the right place to encode project-specific rules rather than trying to generalise them into
the skill.

Useful sections:

- **Architecture** — the layers, and which direction dependencies flow.
- **Focus areas** — what to always flag, grouped by severity.
- **Anti-patterns** — mistakes this codebase has made before and does not want repeated.
- **Known false positives** — settled decisions a reviewer should stop re-litigating.

```markdown
# Review context

## Architecture
Go service, hexagonal. `internal/domain` must not import `internal/adapters`.

## Critical — always flag
- Handlers that do not propagate `context.Context`.
- SQL built by string concatenation instead of parameterised queries.
- Missing `defer rows.Close()`.

## Known false positives
- We use `database/sql` deliberately. Do not suggest an ORM.
```

## `config.yml`

```yaml
exclude_patterns:
  - "*.lock"
  - "pnpm-lock.yaml"
  - "*.min.js"
  - "*.min.css"
  - "node_modules/**"
  - "dist/**"
  - ".nuxt/**"
  - ".next/**"
  - ".output/**"
  - ".turbo/**"
  # Add project-specific generated or vendored trees, e.g.:
  # - "src/generated/**"
  # - "internal/gen/**"
  # - "vendor/**"
```

`exclude_patterns` is the only key the skill reads. When the file is absent, the skill uses the
list above minus the commented project-specific entries. Note this **replaces** the defaults
rather than extending them — repeat the entries you still want.

Glob patterns are matched against repo-relative paths of changed files. Excluded files are
dropped before the diff is analysed and before any file is read, so this is also the lever for
keeping large generated trees out of the Step 5 read budget.
