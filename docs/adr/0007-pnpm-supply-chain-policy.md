# pnpm enforces a minimum release age and a no-downgrade trust policy

Renovate owns every version bump, and pnpm backs it up at install time.

- **Minimum release age**: `minimumReleaseAge: 1440` (minutes) is pnpm's default, set
  explicitly so it stays equal to `minimumReleaseAge: "1 day"` in `renovate.json`.
  `tests/unit/config-pairing.test.ts` fails the build when they differ. CI
  installs with `--frozen-lockfile`, which skips resolution, so the embargo can never fail
  a build.
- **`trustPolicy: no-downgrade`** rejects a version whose provenance is weaker than an
  earlier release. Each exclusion was checked by hand. The cssnano packages are all
  published from `github.com/cssnano/cssnano` by trusted publishing, but 9.x dropped the
  human approver that 8.0.3–8.0.10 named. They are excluded by name, so each new release
  needs no new entry. Re-check the publisher before widening the list.
- **`minimumReleaseAgeExcludePrune`, `shellEmulator` and `trustPolicy`** are required by
  `@antfu/eslint-config` (`pnpm/yaml-enforce-settings`), so removing any fails lint.
- **`allowBuilds: vue-demi`**: its postinstall points the package at the Vue 3 entry
  points. Without it, the Vue 2 shim stays in place.
