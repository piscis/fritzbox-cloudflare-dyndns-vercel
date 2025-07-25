import type { RenderResponse } from 'nitropack'

export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('render:response', (response: Partial<RenderResponse>) => {
    if (response.headers) {
      delete response.headers['X-Powered-By']
      delete response.headers['x-powered-by']
    }
  })
})
