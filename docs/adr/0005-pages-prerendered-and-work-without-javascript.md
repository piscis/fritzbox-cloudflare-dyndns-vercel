# The pages are prerendered and work without JavaScript

`/` and `/setup` have no per-request state, so they are prerendered at build time. The
prerendered HTML has to read correctly on its own, and hydration must never disagree with it.

## Prerendering

- Each page gets a per-route `{ prerender: true, static: true }` rule. Nitro reads
  `prerender`. `static` is read only by the Vercel preset (`isr = !static`), and stays so
  the one-click Vercel deploy keeps its behaviour. A global `nitro.static` (what
  `nuxt generate` sets) would switch the icon module to the remote Iconify provider and
  make every icon a runtime fetch.
- Icons are inlined at build time (`icon.serverBundle: false`, `clientBundle.icons`).
  Left to the server provider, an icon prerenders as an empty `<span>`. The design draws
  most glyphs as text, so only `lucide:github` is listed.
- Everything in `<head>` lives in `app.head` in `nuxt.config.ts`, not in a layout.
  `app/error.vue` renders *instead of* `app.vue` and mounts no layout, so that is the only
  place error pages inherit the title, favicons and robots directive from. For the same
  reason, `error.vue` repeats the `<UApp>` wrapper.

## Hydration-safe values

- **Host**: `useRequestURL()` reports the build host at prerender time, because Nitro
  renders through node-mock-http, which defaults `Host` to `localhost`. So the HTML is
  seeded from the build's `CF_ROUTE_PATTERN` (`runtimeConfig.public.siteHost`), and
  `useSiteHost` swaps in the visitor's real host in `onMounted`, after the hydration render.
- **Health lamp**: checked once in `onMounted`, not with `useFetch({ server: false })`,
  which sets its status synchronously before mount and would make the first client render
  disagree with the static HTML. One sample, no polling: a repeating request from every
  open tab is not worth a live dot. The endpoint answers only 200 `ok` or a 503 error,
  so the third state comes from the transport: a 503 or a reply slower than 800 ms is "degraded", no
  reply within 5 s is "down". A healthy edge answers in 10–60 ms and a poor mobile link in
  150–400 ms, so 800 ms sits above the p99 of "healthy but far away". The response type
  comes from the router through a type-only import, which is erased at build time, so
  neither `@orpc/server` nor zod reaches the client bundle.

## JavaScript-only affordances appear only once mounted

Prerendered HTML carries no control that needs JavaScript to work. The `[copy]` buttons
appear only with the Clipboard API, and the screenshot zoom hint only after mount. The
screenshot toggles and their inline images work without JavaScript. The setup builder
falls back to the placeholders the screenshots and README use (`home.example.com` in
`example.com`, both IP families). Its state lives in memory only: no localStorage, no
cookies, no query string.

The dial-up clip is `preload="none"`, and its Web Audio graph is built on the first click,
never at prerender or mount. An `AudioContext` built without a user activation starts
suspended, and `createMediaElementSource` would already have rerouted the element into
that frozen graph, so the clip would play silently behind a pressed button. The graph is
module-scoped, because a media element source can be created only once per element. If
the graph cannot be built, playback falls back to the plain `<audio>` element.
