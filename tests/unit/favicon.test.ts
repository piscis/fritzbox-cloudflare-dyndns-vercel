import { describe, expect, it } from 'vitest'
import faviconMiddleware from '~~/server/middleware/favicon'
import { createH3Event } from '../helpers/h3'

async function request(url: string) {
  const { event, res } = createH3Event(url)
  const returned = await faviconMiddleware(event)
  return { returned, res }
}

describe('favicon middleware', () => {
  it('redirects /favicon.ico to the SVG', async () => {
    const { res } = await request('/favicon.ico')

    expect(res.statusCode).toBe(302)
    expect(res.getHeader('location')).toBe('/favicons/favicon.svg')
  })

  it('redirects a cache-busted /favicon.ico too', async () => {
    // The guard uses startsWith, not ===.
    const { res } = await request('/favicon.ico?v=2')

    expect(res.statusCode).toBe(302)
  })

  it.each([
    ['/', 'the index page'],
    ['/api/health-check', 'an API route'],
    ['/favicons/favicon.svg', 'the redirect target itself'],
  ])('passes %s through (%s)', async (url) => {
    const { returned, res } = await request(url)

    expect(returned).toBeUndefined()
    expect(res.statusCode).toBe(200)
    expect(res.getHeader('location')).toBeUndefined()
  })
})
