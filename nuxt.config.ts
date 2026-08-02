import pkg from './package.json'

const THIRTY_DAYS_IN_SECONDS = 60 * 60 * 24 * 30

/**
 * Build-time config comes from a secret store (Phase) or a `.env`, and values
 * pasted into either routinely pick up stray whitespace. A newline in
 * CF_ROUTE_PATTERN silently produces an invalid Worker route, so trim on read.
 */
function env(name: string, fallback = '') {
  return (import.meta.env[name] ?? fallback).trim()
}

/**
 * Both are empty for a fork deployed through the Deploy to Cloudflare button,
 * and every Worker setting below that would otherwise be built from an empty
 * string keys off that. See `nitro.cloudflare.wrangler`.
 */
const workerName = env('CF_WORKER_NAME')
const routePattern = env('CF_ROUTE_PATTERN')

export default defineNuxtConfig({
  // Scoped to Cloudflare on purpose. The bare-string form sets compatx's
  // `default`, which also gates the Vercel preset (it starts emitting
  // observability routes at >= 2025-07-15) and the `cloudflare-dev` preset that
  // `nuxt dev` would silently switch to — neither is part of this bump. Keep
  // `default` explicit: compatx back-fills an omitted one with the *highest*
  // platform date, which would reintroduce the global bump.
  //
  // Only the `cloudflare` key becomes wrangler's `compatibility_date`, and
  // wrangler.jsonc outranks it in Nitro's merge — keep the two in step.
  compatibilityDate: { default: '2025-06-06', cloudflare: '2026-08-02' },
  devtools: { enabled: true },
  modules: [
    // @nuxt/icon is deliberately absent: @nuxt/ui depends on it and registers
    // it itself, so listing it here only duplicated the registration. The
    // `icon` block below is still read by that instance.
    '@nuxt/ui',
    '@nuxt/eslint',
    '@nuxt/test-utils/module',

  ],
  css: [
    // @nuxt/ui never touches nuxt.options.css itself; without this entry the
    // build succeeds and ships a completely unstyled page.
    '~/assets/css/main.css',
  ],
  ui: {
    // Phosphor is dark-only by design, so the whole colour-mode machinery goes:
    // this stops @nuxt/ui installing @nuxtjs/color-mode, which drops its
    // localStorage bootstrap script from the bundle and removes the
    // <UColorModeButton> family of components. `colorMode: { preference:
    // 'dark' }` would keep all of that and still let a stale preference win.
    // Dark itself is switched on by `class: 'dark'` in app.head below.
    colorMode: false,
  },
  icon: {
    // The landing page is prerendered, so any icon has to be inlined at build
    // time — left to the server provider it renders an empty <span> and only
    // fills in after a runtime call the prerenderer cannot make.
    //
    // Phosphor draws most glyphs as text (♪ ● ✕ ▲ →); the GitHub CTA is the
    // exception and must be listed here. @nuxt/ui still adds its own lucide
    // icons via the `icon:clientBundleIcons` hook.
    serverBundle: false,
    clientBundle: {
      icons: [
        'lucide:github',
      ],
    },
  },
  runtimeConfig: {
    public: {
      // Rendered in the foot line. Read from package.json so it cannot drift
      // from the released version the way a hardcoded string would.
      version: pkg.version,
      // Seeds the title bar before hydration. Each environment builds with its
      // own CF_ROUTE_PATTERN, so the prerendered HTML already names the right
      // host; the client corrects it from window.location on mount.
      //
      // Deliberately under `public` — `server/routes/api/[...].ts` destructures
      // top-level `appName`/`appVersion`, and defining those would silently
      // rewrite /api/spec.json and the e2e assertion that pins its title.
      siteHost: routePattern,
    },
  },
  app: {
    buildAssetsDir: '/_chunks/',
    head: {
      // These live here rather than in layouts/default.vue because app/error.vue
      // renders *instead of* app.vue and never mounts a layout — error pages
      // previously shipped with no title, no favicons and no robots directive.
      htmlAttrs: {
        lang: 'en',
        dir: 'ltr',
        class: 'dark',
      },
      title: 'FRITZ!Box DynDNS Service',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'robots', content: 'noindex, nofollow' },
        { name: 'format-detection', content: 'telephone=no' },
        { name: 'description', content: 'A DynDNS endpoint that keeps Cloudflare A and AAAA records pointed at your FRITZ!Box.' },
      ],
      link: [
        { rel: 'shortcut icon', href: '/favicons/favicon.ico' },
        { rel: 'icon', type: 'image/x-icon', href: '/favicons/favicon.ico' },
        { rel: 'icon', type: 'image/svg+xml', href: '/favicons/favicon.svg' },
        { rel: 'icon', type: 'image/png', href: '/favicons/favicon.png' },
        { rel: 'apple-touch-icon', href: '/favicons/apple-touch-icon.png' },
        { rel: 'apple-touch-startup-image', href: '/favicons/apple-touch-icon.png' },
      ],
    },
  },
  typescript: {
    typeCheck: true,
  },
  experimental: {
    asyncContext: true,
  },
  nitro: {
    esbuild: {
      options: {
        target: 'esnext',
      },
    },
    sourceMap: true,
    compressPublicAssets: { gzip: true, brotli: true },
    experimental: {
      wasm: true,
    },
    // Only pin a preset when NITRO_PRESET is set (e.g. cloudflare_module for
    // build:cf). Leaving it unset lets Nitro auto-detect the host — the vercel
    // preset on Vercel, cloudflare_module under Workers Builds (which exports
    // WORKERS_CI). Both one-click deploy buttons run the plain `build` script
    // and have nowhere to pass NITRO_PRESET, so they depend on that detection.
    ...(env('NITRO_PRESET')
      ? { preset: env('NITRO_PRESET') }
      : {}),
    cloudflare: {
      deployConfig: true,
      nodeCompat: true,
      wrangler: {
        // Nitro merges this object *over* the root wrangler.jsonc, and defu
        // treats '' as a value rather than an absence — so setting an empty
        // name here would mask the one the deploy button writes into that file.
        ...(workerName ? { name: workerName } : {}),
        preview_urls: false,
        // Our own deployments are reached through the custom domain below, so
        // the workers.dev subdomain stays off. A fork has no domain to attach:
        // there it is the only way in, and disabling it deploys something
        // unreachable.
        workers_dev: !routePattern,
        upload_source_maps: true,
        observability: {
          enabled: env('CF_LOG_ENABLED') === 'true',
          head_sampling_rate: 1,
        },
        placement: {
          mode: 'smart',
        },
        // A custom-domain route needs only `pattern`; Cloudflare infers the zone
        // from the hostname. wrangler's own schema requires zone_name/zone_id
        // solely for non-custom-domain routes.
        //
        // Emitted only when there is a pattern to attach — `custom_domain: true`
        // against an empty pattern is a route wrangler cannot create.
        ...(routePattern
          ? { route: { pattern: routePattern, custom_domain: true } }
          : {}),
      },
    },
    routeRules: {
      // This is an API host; nothing on it should be indexed.
      //
      // As an HTTP header rather than only a meta tag, because most of what is
      // served here is not HTML — /api/health-check and /api/fritz-dyndns return
      // JSON, /api/spec.json returns a schema, and a <meta> cannot reach any of
      // them. `public/robots.txt` deliberately permits crawling so this
      // directive is actually read; blocking the fetch would hide it and leave
      // linked URLs eligible for a bare listing.
      '/**': {
        headers: {
          'x-robots-tag': 'noindex, nofollow, noarchive, nosnippet',
        },
      },
      // The landing page has no per-request state, so it is rendered once at
      // build time. `prerender` is the key Nitro actually reads; `static` is
      // read only by the Vercel preset (`isr = !static`) and is kept so the
      // one-click Vercel deploy in the README keeps its current behaviour.
      //
      // Note this must stay a per-route rule: a global `nitro.static` (what
      // `nuxt generate` sets) would flip @nuxt/icon to the remote Iconify
      // provider and turn every icon into a runtime network call.
      '/': { prerender: true, static: true },
      // Fonts are served from /_fonts/, not from `app.buildAssetsDir`, so the
      // /_chunks/** rule below does not cover them.
      '/_fonts/**': {
        headers: {
          'cache-control': `public, max-age=${THIRTY_DAYS_IN_SECONDS}, stale-if-error=900, stale-while-revalidate=900, s-maxage=${THIRTY_DAYS_IN_SECONDS}`,
        },
      },
      '/_chunks/**': {
        headers: {
          'cache-control': `public, max-age=${THIRTY_DAYS_IN_SECONDS}, stale-if-error=900, stale-while-revalidate=900, s-maxage=${THIRTY_DAYS_IN_SECONDS}`,
        },
      },
    },
  },
  eslint: {
    config: {
      standalone: false,
    },
  },
})
