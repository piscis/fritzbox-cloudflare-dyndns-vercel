const THIRTY_DAYS_IN_SECONDS = 60 * 60 * 24 * 30

export default defineNuxtConfig({
  compatibilityDate: '2025-06-06',
  devtools: { enabled: true },
  modules: [
    '@unocss/nuxt',
    '@nuxt/icon',
    '@nuxtjs/google-fonts',
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
  nitro: {
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
