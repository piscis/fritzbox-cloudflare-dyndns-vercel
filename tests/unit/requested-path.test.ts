import { describe, expect, it } from 'vitest'
import { requestedPath } from '~/utils/requestedPath'

describe('requestedPath', () => {
  it('strips the query and hash from a server-rendered url', () => {
    const error = { url: '/api/fritz-dyndns?token=SUPER_SECRET_TOKEN#frag' }

    expect(requestedPath(error, '/fallback')).toBe('/api/fritz-dyndns')
  })

  it('reads data.path when a client-side router 404 carries no url', () => {
    const error = {
      data: { path: '/missing?token=SUPER_SECRET_TOKEN' },
    }

    expect(requestedPath(error, '/fallback')).toBe('/missing')
  })

  it('ignores a data.path that is not a string', () => {
    expect(requestedPath({
      data: { path: 123 },
    }, '/fallback')).toBe('/fallback')
  })

  it('prefers url over data.path, because data is dropped for fatal errors', () => {
    const error = {
      url: '/from-url',
      data: { path: '/from-data' },
    }

    expect(requestedPath(error, '/fallback')).toBe('/from-url')
  })

  it('falls back to the given route, stripped the same way', () => {
    expect(requestedPath(undefined, '/current?token=SUPER_SECRET_TOKEN')).toBe('/current')
  })

  it('answers / when nothing but a query string remains', () => {
    expect(requestedPath({ url: '?token=SUPER_SECRET_TOKEN' }, '/fallback')).toBe('/')
  })
})
