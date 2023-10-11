import { inject } from '@vercel/analytics'

export default defineNuxtPlugin({
  name: 'vercel',
  parallel: true,
  async setup(_nuxtApp) {
    // the next plugin will be executed immediately
    inject()
  },
})
