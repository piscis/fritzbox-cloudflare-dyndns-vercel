import pkg from './package.json'

const THIRTY_DAYS_IN_SECONDS = 60 * 60 * 24 * 30

function env(name: string, fallback = '') {
  return (import.meta.env[name] ?? fallback).trim()
}

const workerName = env('CF_WORKER_NAME')
const routePattern = env('CF_ROUTE_PATTERN')

export default defineNuxtConfig({
  compatibilityDate: { default: '2025-06-06', cloudflare: '2026-08-02' },
  devtools: { enabled: true },
  modules: [
    '@nuxt/ui',
    '@nuxt/eslint',
    '@nuxt/test-utils/module',

  ],
  css: [
    '~/assets/css/main.css',
  ],
  ui: {
    colorMode: false,
  },
  icon: {
    serverBundle: false,
    clientBundle: {
      icons: [
        'lucide:github',
      ],
    },
  },
  runtimeConfig: {
    public: {
      version: pkg.version,
      siteHost: routePattern,
    },
  },
  app: {
    buildAssetsDir: '/_chunks/',
    head: {
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
    ...(env('NITRO_PRESET')
      ? {
          preset: env('NITRO_PRESET'),
        }
      : {}),
    cloudflare: {
      deployConfig: true,
      nodeCompat: true,
      wrangler: {
        ...(workerName
          ? { name: workerName }
          : {}),
        preview_urls: false,
        workers_dev: !routePattern,
        upload_source_maps: true,
        observability: {
          enabled: env('CF_LOG_ENABLED') === 'true',
          head_sampling_rate: 1,
        },
        placement: {
          mode: 'smart',
        },
        ...(routePattern
          ? {
              route: { pattern: routePattern, custom_domain: true },
            }
          : {}),
      },
    },
    routeRules: {
      '/**': {
        headers: {
          'x-robots-tag': 'noindex, nofollow, noarchive, nosnippet',
        },
      },
      '/': { prerender: true, static: true },
      '/setup': { prerender: true, static: true },
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
