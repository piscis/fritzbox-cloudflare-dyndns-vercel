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

export default defineNuxtConfig({
  compatibilityDate: '2025-06-06',
  devtools: { enabled: true },
  modules: [
    '@nuxt/icon',
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
    // Phosphor draws its glyphs as text (♪ ● ✕ ▲ →), so there is no explicit
    // allowlist any more. @nuxt/ui still adds its own lucide icons here via the
    // `icon:clientBundleIcons` hook; anything added later must join them.
    serverBundle: false,
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
      siteHost: env('CF_ROUTE_PATTERN'),
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
    preset: env('NITRO_PRESET', 'node-server'),
    cloudflare: {
      deployConfig: true,
      nodeCompat: true,
      wrangler: {
        name: env('CF_WORKER_NAME'),
        preview_urls: false,
        workers_dev: false,
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
        route: {
          pattern: env('CF_ROUTE_PATTERN'),
          custom_domain: true,
        },
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
