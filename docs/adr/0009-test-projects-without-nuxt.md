# Most test projects run without booting Nuxt

`vitest.config.ts` defines four projects. Only `nuxt` runs inside a Nuxt environment.

- **`unit`** is plain Node and covers `server/` with the Cloudflare SDK mocked, so it is
  fast and never touches the network. Nitro auto-imports are bare globals in `server/`,
  so `tests/setup/nitro-globals.ts` puts them on `globalThis`, and Nuxt's `~~`/`@@`/`~`/`@`
  aliases are declared by hand.
- **`e2e`** boots a real server with `setup()`. It must not go through
  `defineVitestProject`, because `@nuxt/test-utils` warns when the Nuxt client environment
  is applied to an e2e suite. Its build turns off `typeCheck` (the CI typecheck job covers
  vue-tsc) and forces the `node-server` preset, because `setup()` cannot boot a Worker.
- **`browser`** is set up like `e2e`, with `browser: true`, for tests that need real layout.
  It needs a local Chromium, so it runs only through `test:browser`.

Coverage of `server/**` sits at 100%. The thresholds are set below that on purpose, so a
dependency bump that adds an unreachable branch does not fail the build.
