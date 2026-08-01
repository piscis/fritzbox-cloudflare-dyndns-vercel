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
    '@nuxt/image',
    '@nuxt/ui',
    '@nuxt/eslint',
    '@nuxt/test-utils/module',

  ],
  css: [
    // @nuxt/ui never touches nuxt.options.css itself; without this entry the
    // build succeeds and ships a completely unstyled page.
    '~/assets/css/main.css',
  ],
  icon: {
    // The landing page is prerendered, so its one icon has to be inlined at
    // build time. Left to the server provider it renders an empty <span> and
    // only fills in after a runtime call to /api/_nuxt_icon/devicon, which the
    // prerenderer cannot make.
    //
    // @nuxt/ui adds its own lucide icons to this same bundle via the
    // `icon:clientBundleIcons` hook. The bundle is a shared build template, so
    // SSR reads it too and no server-side collection is needed.
    clientBundle: {
      icons: ['devicon:github'],
    },
    serverBundle: false,
  },
  fonts: {
    defaults: {
      // `font-light` on the GitHub link needs weight 300; the @nuxt/fonts
      // default that @nuxt/ui configures is [400, 500, 600, 700].
      weights: [300, 400, 500, 600, 700],
    },
  },
  app: {
    buildAssetsDir: '/_chunks/',
    head: {
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
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
