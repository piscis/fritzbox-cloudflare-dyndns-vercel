import { mountSuspended, registerEndpoint } from '@nuxt/test-utils/runtime'
import { expect, it } from 'vitest'
import App from '~/app.vue'

registerEndpoint('/api/health-check', () => ({
  state: 'ok',
  timestamp: 1_700_000_000_000,
}))

it('can also mount an app', async () => {
  const component = await mountSuspended(App, { route: '/' })
  expect(component.html()).toBeTruthy()
})
