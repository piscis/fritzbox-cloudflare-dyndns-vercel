import { mountSuspended, registerEndpoint } from '@nuxt/test-utils/runtime'
import { expect, it } from 'vitest'
import App from '~/app.vue'

// Mounting the app transitively mounts the index page, which checks service
// health on mount. Without this the request would fall through to the nuxt
// environment's empty in-memory h3 app.
registerEndpoint('/api/health-check', () => ({
  state: 'ok',
  timestamp: 1_700_000_000_000,
}))

it('can also mount an app', async () => {
  const component = await mountSuspended(App, { route: '/' })
  expect(component.html()).toBeTruthy()
})
