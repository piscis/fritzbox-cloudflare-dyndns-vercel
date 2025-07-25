import { $fetch, fetch, setup } from '@nuxt/test-utils/e2e'
import { describe, expect, it } from 'vitest'

describe('base', async () => {
  await setup()

  it('index page is callable', async () => {
    const doc = await $fetch('/')
    expect(doc).toContain('DOCTYPE')
  })

  it('should remove x-powered-by', async () => {
    const res = await fetch('/')
    expect(res.headers.has('x-powered-by')).toBeFalsy()
    expect(res.headers.has('X-Powered-By')).toBeFalsy()
    expect(res.headers.has('content-type')).toBeTruthy()
  })
})
