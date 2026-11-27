# The compatibility date is scoped to Cloudflare

`compatibilityDate` uses the object form, with `default` pinned explicitly and only the
`cloudflare` key moving. The bare-string form sets compatx's `default`, which also gates
the Vercel preset (it emits observability routes from 2025-07-15) and the
`cloudflare-dev` preset that `nuxt dev` switches to. If `default` is left out, compatx
back-fills it with the *highest* platform date, which bumps everything at once.

Only the `cloudflare` key becomes wrangler's `compatibility_date`. `wrangler.jsonc`'s own
`compatibility_date` outranks it in Nitro's merge, and that is the value that deploys, so
the two must match. `tests/unit/config-pairing.test.ts` fails the build when they differ. workerd rejects dates in the future, and each wrangler release has a
newest date it accepts, so a bump can need a wrangler upgrade first.
