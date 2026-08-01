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
    '@unocss/nuxt',
    '@nuxtjs/google-fonts',
    '@nuxt/eslint',
    '@nuxt/test-utils/module',

  ],
  css: [
    '@unocss/reset/tailwind-compat.css',
  ],
  icon: {
    serverBundle: {
      collections: ['devicon'],
    },
  },
  googleFonts: {
    download: true,
    base64: true,
    families: {
      Nunito: true,
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
      '/': { static: true },
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
