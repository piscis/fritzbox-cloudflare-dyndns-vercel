import { describe, expect, it, vi } from 'vitest'
import xPoweredByPlugin from '~~/server/plugins/x-powered-by'

function register() {
  const hook = vi.fn()
  xPoweredByPlugin({ hooks: { hook } } as never)

  const [event, callback] = hook.mock.calls[0] as [string, (r: unknown) => void]
  return { hook, event, callback }
}

describe('x-powered-by plugin', () => {
  it('registers a render:response hook', () => {
    const { hook, event, callback } = register()

    expect(hook).toHaveBeenCalledOnce()
    expect(event).toBe('render:response')
    expect(typeof callback).toBe('function')
  })

  it('deletes both header casings and leaves the rest alone', () => {
    const { callback } = register()
    const response = {
      headers: {
        'X-Powered-By': 'Nuxt',
        'x-powered-by': 'Nitro',
        'content-type': 'text/html',
      },
    }

    callback(response)

    expect(response.headers).toStrictEqual({ 'content-type': 'text/html' })
  })

  it('deletes the lowercase header on its own', () => {
    const { callback } = register()
    const response = { headers: { 'x-powered-by': 'Nitro' } }

    callback(response)

    expect(response.headers).toStrictEqual({})
  })

  it('is a no-op when the response carries no headers', () => {
    const { callback } = register()

    expect(() => callback({})).not.toThrow()
    expect(() => callback({ headers: undefined })).not.toThrow()
  })
})
