# AGENTS.md

DynDNS endpoint a FRITZ!Box calls to keep Cloudflare A/AAAA records pointed at the
current home IP. Nuxt 4 + oRPC on Cloudflare Workers —
[piscis/fritzbox-cloudflare-dyndns-vercel](https://github.com/piscis/fritzbox-cloudflare-dyndns-vercel),
hosted instance at [fritzdns.piscis.dev/api](https://fritzdns.piscis.dev/api/).

## Commands

| Command | Purpose |
|---------|---------|
| `pnpm dev` | Dev server on `:3000` (via `phase run`) |
| `pnpm build` | Production build, `node-server` preset |
| `pnpm build:cf` | Cloudflare Workers build (via `phase run`) |
| `pnpm deploy:cf` | `wrangler deploy` — requires a preceding `build:cf` |
| `pnpm lint` / `pnpm lint:fix` | ESLint (Antfu + Nuxt flat config) |
| `pnpm typecheck` | `nuxt typecheck` (vue-tsc) |
| `pnpm test` / `pnpm test:watch` | Vitest, all three projects |
| `pnpm test:unit` / `pnpm test:e2e` | A single project — `unit` runs in <1s |
| `pnpm test:coverage` | Coverage over `server/**`, gated in CI |
| `pnpm release:patch` | Version bump + CHANGELOG + GitHub release (release-it) |

## Stack

- Nuxt 4 (`app/` srcDir), Vue 3, UnoCSS (`presetWind4` + attributify + icons)
- oRPC 1.x (`@orpc/server`, `@orpc/openapi`, `@orpc/zod`) + Zod 4 on every request
  and response
- `cloudflare` SDK v7 for zone and DNS access; `consola` logging; `radash` helpers
- Cloudflare Workers (`cloudflare_module` preset). Vercel is a secondary,
  out-of-band target kept alive for the one-click deploy button.
- Vitest projects `unit` / `nuxt` / `e2e` (`@nuxt/test-utils`), coverage via
  `@vitest/coverage-v8`

## Architecture

- `server/routes/api/[...].ts` — the only HTTP entry point. oRPC `OpenAPIHandler`
  mounted at `/api` with `ZodSmartCoercionPlugin` and `OpenAPIReferencePlugin`
  (Scalar UI at `/api`, spec at `/api/spec.json`). `server/routes/api/index.ts`
  re-exports it so bare `/api` also matches.
- `server/router/index.ts` — procedure registry: `{ api: { fritzDynDnsRoute, healthCheck } }`
- `server/router/procedures/fritz-dyndns.ts` — `GET /api/fritz-dyndns`: list zones →
  find the A/AAAA record by name → update `content` only when it changed. 404 for a
  missing zone or record, 503 for everything else.
- `server/router/procedures/health-check.ts` — `GET /api/health-check`
- `server/router/middlewares/noCacheHeaders.ts` — writes `Cache-Control` / `Pragma` /
  `Expires` through `context.nitroContext.node.res`
- `server/middleware/favicon.ts`, `server/plugins/x-powered-by.ts`,
  `server/utils/useLogger.ts` — Nitro-level extras, no product logic
- `app/` — a single joke landing page. Carries no product logic.
- Server code imports through the `~~/server/...` alias — never relative `../../`.
- **The Cloudflare API token arrives as a request query parameter (`?token=`), not
  from env.** Never log `query`, never echo the token into a response, an error
  message, or a test fixture.

## Workflow

1. Read `.agents/skills/orpc-api/SKILL.md` before touching anything under `server/router/`
2. Implement → `pnpm lint:fix` → `pnpm typecheck` → `pnpm test`
3. Open a PR against `main`; CI (lint / typecheck / test) must be green
4. Production deploy: merge `main` → `released`; CI runs `build:cf` + `deploy:cf`

## Tooling

- Node 24.18.1 (`.nvmrc`), pnpm 11.19.0 (`packageManager`)
- **pnpm settings live in `pnpm-workspace.yaml`, not `.npmrc`** — pnpm 11 reads only
  auth/registry settings from `.npmrc`. `@antfu/eslint-config` enforces
  `shellEmulator` and `trustPolicy` there; omitting them fails lint.
- ESLint: `@antfu/eslint-config` wrapped by `withNuxt` — **no Prettier. Run
  `pnpm lint:fix` after every source edit and treat remaining errors as blocking.**
- TypeScript is pinned to **6.x on purpose**. TS 7's Go-native compiler has no stable
  programmatic API for Volar/vue-tsc yet, so `.vue` template checking cannot use it.
- Dependency updates: Renovate owns every bump — never hand-edit versions or
  `pnpm-lock.yaml`.
- Install in CI: `pnpm install --frozen-lockfile`
- Secrets: Phase (`.phase.json`, self-hosted `https://io.vicoli.de`). `phase run`
  wraps `dev`, `build:cf` and `deploy:cf`. `phase run` spawns via `sh -c`, so use
  `pnpm exec <bin>` inside it, and quote commands that take their own flags.
- **The wrangler deploy config is generated into `.output/` at build time** from
  `nitro.cloudflare` in `nuxt.config.ts`. `CF_WORKER_NAME` and `CF_ROUTE_PATTERN`
  must be set for `build:cf`, not only for `deploy:cf`. There is no checked-in
  `wrangler.toml`.
- Agent skills live in `.agents/skills/` (canonical); `.claude/skills/<name>` are
  committed relative symlinks. Vendored skills are pinned in `skills-lock.json` —
  change them only via `npx skills add|update|remove`, never by hand. `orpc-api` is
  first-party and is deliberately absent from the lock file.

## GitHub Actions secrets and variables (production deploy)

- `PHASE_SERVICE_TOKEN` (secret) — a Phase Service Account Token scoped to Production
- `PHASE_HOST` (variable) — `https://io.vicoli.de`

Everything else (`CF_*`, `CLOUDFLARE_*`) now comes from Phase Production.
