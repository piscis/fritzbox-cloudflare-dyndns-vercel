import { mountSuspended } from '@nuxt/test-utils/runtime'
import { expect, it } from 'vitest'
import App from './../app/app.vue'

it('can also mount an app', async () => {
  const component = await mountSuspended(App, { route: '/' })
  expect(component.html()).toBeTruthy()
})
