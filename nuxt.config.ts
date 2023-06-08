// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: [
    '@nuxtjs/google-fonts',
    '@nuxtjs/tailwindcss',
    '@nuxt/image',
    '@nuxtjs/web-vitals',
  ],
  plugins: [{ src: '~/plugins/vercel.ts', mode: 'client' }],
  googleFonts: {
    download: true,
    base64: true,
    families: {
      Nunito: true,
    },
  },
  nitro: {
    routeRules: {
      '/': { static: true },
      '/_nuxt/**': {
        headers: {
          'cache-control': `public, max-age=${
            60 * 60 * 24 * 30
          }, stale-if-error=900, stale-while-revalidate=900, s-maxage=${
            60 * 60 * 24 * 30
          }`,
        },
      },
    },
  },
})
