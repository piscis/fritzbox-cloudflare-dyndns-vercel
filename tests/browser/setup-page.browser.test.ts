import { createPage, setup } from '@nuxt/test-utils/e2e'
import { describe, expect, it } from 'vitest'

// One setup() for the whole file: each call builds and boots its own server.
await setup({
  setupTimeout: 300_000,
  browser: true,
  nuxtConfig: {
    // Same build options as the e2e project, for the same reasons: the CI
    // typecheck job covers vue-tsc, and setup() can only boot a node server.
    typescript: { typeCheck: false },
    nitro: { preset: 'node-server' },
  },
})

const VIEWPORTS = [
  { name: 'phone', width: 390, height: 844 },
  { name: 'desktop', width: 1440, height: 900 },
]

describe.each(VIEWPORTS)('/setup at $name width', (viewport) => {
  it('shows the Cloudflare token screenshot once step 01\'s toggle opens', async () => {
    const page = await createPage('/setup', { viewport })

    const step = page.locator('section[aria-labelledby="step-token"]')
    await step.getByText('show screenshot ▸').click()

    const shot = step.locator('img[src="/setup/cloudflare-token.png"]')
    await shot.waitFor({ state: 'visible' })
    expect(await shot.isVisible()).toBe(true)

    await page.close()
  })
})
