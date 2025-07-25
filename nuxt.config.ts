const THIRTY_DAYS_IN_SECONDS = 60 * 60 * 24 * 30

export default defineNuxtConfig({
  compatibilityDate: '2025-06-06',
  devtools: { enabled: true },
  modules: [
    '@unocss/nuxt',
    '@nuxt/icon',
    '@nuxtjs/google-fonts',
    '@nuxt/test-utils/module',
    '@nuxt/image',
    '@nuxt/eslint',
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
    preset: import.meta.env.NITRO_PRESET || 'node-server',
    cloudflare: {
      deployConfig: true,
      nodeCompat: true,
      wrangler: {
        name: import.meta.env.CF_WORKER_NAME || '',
        preview_urls: false,
        workers_dev: false,
        upload_source_maps: true,
        observability: {
          enabled: false,
          head_sampling_rate: 1,
        },
        placement: {
          mode: 'smart',
        },
        route: {
          pattern: import.meta.env.CF_ROUTE_PATTERN || '',
          zone_name: import.meta.env.CF_ROUTE_ZONE_NAME || '',
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
