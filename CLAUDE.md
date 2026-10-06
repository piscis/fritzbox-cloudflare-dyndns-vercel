# CLAUDE.md

DynDNS endpoint a FRITZ!Box calls to keep Cloudflare A/AAAA records on the current
home IP. Nuxt 4 + oRPC, deployed to Cloudflare Workers; Vercel is a secondary target.
`app/` is a single joke landing page. All product logic lives in `server/`.

## Rules

- **The Cloudflare API token arrives as the `?token=` query parameter.** Keep it out of
  logs, responses, error messages and fixtures, and send errors through
  `server/utils/redactToken.ts`.
- Load the `orpc-api` skill before you touch `server/router/` or `server/routes/api/`.
- Server code imports through `~~/server/...`.
- The `unit` and `e2e` test projects do not boot Nuxt. If you use a new Nitro
  auto-import as a bare global in `server/`, also register it in
  `tests/setup/nitro-globals.ts`.
- A change is done when `pnpm lint:fix`, `pnpm typecheck` and `pnpm test` all pass.
  ESLint (`@antfu/eslint-config`) is the only formatter.
- Renovate owns every version bump, including `pnpm-lock.yaml`. TypeScript stays on
  6.x on purpose, because vue-tsc cannot use TS 7's Go compiler yet.
- pnpm settings go in `pnpm-workspace.yaml`. pnpm 12 reads only auth and registry
  settings from `.npmrc`.
- Every skill, including `orpc-api`, is pinned in `skills-lock.json` and managed by
  `npx skills@latest`. Read `docs/agents/skills.md` before you add, update, remove or
  edit one.

## Workflow

- Other agents edit the main checkout at the same time. Build each change in its own
  worktree beside the repo, branched from `origin/main`:
  `git worktree add ../fritzdns-<slug> -b <type>/<slug> origin/main`. A worktree under
  `.claude/worktrees/` fails `pnpm typecheck` with TS2769, because Nuxt typechecks the
  parent checkout's `vitest.config.ts`.
- Fetch and rebase onto `origin/main` before every push. Set work aside with WIP
  commits; the stash is shared by every worktree.
- After `pnpm lint:fix`, `git diff --stat` must list only your files. Revert the rest:
  it is another agent's work in flight.
- The machine's default Node is 22. Run pnpm as `fnm exec --using=.nvmrc pnpm …`.
- Ship each change as its own PR by following
  `.agents/skills/commit-push-pr/SKILL.md` by hand (it is not model-invocable).

## Deploy

- Pull requests run CI only. Merging to `main` deploys the staging Worker, and merging
  to `released` deploys production. Both deploy through CI, never through a local
  `deploy:cf`.
- To release by hand, follow step 7 of `docs/agents/daily-dependency-release.md` with the
  bump you need in place of `patch`.
- Secrets come from a self-hosted Phase instance (`PHASE_HOST`). `phase run` spawns
  via `sh -c`, so call `pnpm exec <bin>` inside it and quote commands that take flags.
- The build generates the Worker config from `nitro.cloudflare` in `nuxt.config.ts`,
  so the `CF_*` variables must be set at build time. `wrangler.jsonc` exists only for
  the README's Deploy button. The comments in both files explain every conditional
  key, so read them before you edit either one.

## Agent skills

- **Issue tracker:** GitHub Issues via `gh`. See `docs/agents/issue-tracker.md`.
- **Triage labels:** see `docs/agents/triage-labels.md`.
- **Domain docs:** a single context, `GLOSSARY.md` plus `docs/adr/`, created lazily. See
  `docs/agents/domain.md`.
