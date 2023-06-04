import type { RenderResponse } from 'nitropack'

export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('render:response', (response: RenderResponse) => {
    delete response.headers['X-Powered-By']
    delete response.headers['x-powered-by']
  })
})
