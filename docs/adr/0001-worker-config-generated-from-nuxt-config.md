# The Worker config is generated from nuxt.config.ts

Every deploy uses the Worker config that `nuxt build` generates from `nitro.cloudflare` in
`nuxt.config.ts`. It writes `.output/server/wrangler.json` and a
`.wrangler/deploy/config.json` redirect that wrangler follows for `deploy`, `dev` and
`versions upload`. So the `CF_*` variables must be set at build time, not just at deploy
time.

`wrangler.jsonc` exists only for the README's "Deploy to Cloudflare" button. The button
needs a checked-in Wrangler config to recognise a Workers application, rewrites `name`
to the Worker the visitor picks, and hands the repo to Workers Builds. Editing it has no
effect on Staging or Production. Nitro merges it *under* `nitro.cloudflare.wrangler`, so
`nuxt.config.ts` wins any key set in both. It keeps `main` and `assets` even though
Nitro re-derives both: Cloudflare documents name/main/compatibility_date as the minimum,
and the button reads the file before any build exists. It has no `$schema`, because every
key is copied into the generated config, where a relative `node_modules` path no longer
resolves.

## One config for forks and for our own Instances

A fork deployed through a one-click button has no `CF_WORKER_NAME`, no
`CF_ROUTE_PATTERN` and nowhere to pass `NITRO_PRESET`. Each conditional key in
`nuxt.config.ts` exists for that case:

- **Preset**: pinned only when `NITRO_PRESET` is set. Otherwise Nitro auto-detects the
  host: `vercel` on Vercel, `cloudflare_module` under Workers Builds (`WORKERS_CI`).
- **`name`**: emitted only when `CF_WORKER_NAME` is set. defu treats `''` as a value, so
  an empty name would mask the one the button wrote into `wrangler.jsonc`.
- **`workers_dev`**: off when there is a route pattern. A fork has no custom domain, so
  workers.dev is its only way in.
- **`route`**: a custom-domain route needs only `pattern`, because Cloudflare infers the
  zone from the hostname. It is emitted only with a pattern: `custom_domain: true`
  against an empty pattern is a route wrangler cannot create.

Build-time values are trimmed on read. Values pasted into Phase or a `.env` pick up stray
whitespace, and a newline in `CF_ROUTE_PATTERN` silently produces an invalid route.
