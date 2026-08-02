export default defineNitroPlugin((nitroApp) => {
  // `response` is inferred from Nitro's own `render:response` hook signature.
  // Annotating it explicitly would mean importing `RenderResponse` from
  // `nitropack` — a transitive of `nuxt` we would then have to declare, which
  // re-resolves nitro's own `srvx` and churns the lockfile for no benefit.
  nitroApp.hooks.hook('render:response', (response) => {
    if (response.headers) {
      delete response.headers['X-Powered-By']
      delete response.headers['x-powered-by']
    }
  })
})
