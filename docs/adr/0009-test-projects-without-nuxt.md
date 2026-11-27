# Most test projects run without booting Nuxt

`vitest.config.ts` defines four projects. Only `nuxt` runs inside a Nuxt environment.

- **`unit`** is plain Node and covers `server/` with the Cloudflare SDK mocked, so it is
  fast and never touches the network. Nitro auto-imports are bare globals in `server/`,
  so `tests/setup/nitro-globals.ts` puts them on `globalThis`, and Nuxt's `~~`/`@@`/`~`/`@`
  aliases are declared by hand. Its `useRuntimeConfig` stub returns the keys server code
  reads, in the shape it declares, with `public.version` from `package.json`. A test that
  must tell the runtime config from `package.json` hoists its own stub with a sentinel
  version, before the handler reads the config at module load.
- **`nuxt`** routes every root-relative fetch to an in-memory h3 app. Both pages check
  `/api/health-check` on mount, so a test that mounts one registers that endpoint with
  `registerEndpoint` at module scope, re-pointing a mutable response per test.
  Unregistered, the check silently takes its `down` path.
- **`e2e`** boots a real server with `setup()`. It must not go through
  `defineVitestProject`, because `@nuxt/test-utils` warns when the Nuxt client environment
  is applied to an e2e suite. Its build turns off `typeCheck` (the CI typecheck job covers
  vue-tsc) and forces the `node-server` preset, because `setup()` cannot boot a Worker.
- **`browser`** is set up like `e2e`, with `browser: true`, for tests that need real layout.
  It needs a local Chromium, so it runs only through `test:browser`.
  Touch pans are sent as raw CDP `Input.dispatchTouchEvent`s, because CDP's
  `synthesizeScrollGesture` never scrolls in Linux's headless shell.

Each `e2e` and `browser` file calls `setup()` once at module scope, because every call
builds and boots its own server.

Coverage of `server/**` sits at 100%. The thresholds are set below that on purpose, so a
dependency bump that adds an unreachable branch does not fail the build.
