import { describe, expect, it, vi } from 'vitest'
import apiHandler from '~~/server/routes/api/[...]'
import { createH3Event } from '../helpers/h3'

// Any request reaching the real SDK would hit api.cloudflare.com, so the module
// is stubbed even though these tests only exercise routing and validation.
const cf = vi.hoisted(() => ({ ctor: vi.fn() }))

vi.mock('cloudflare', () => ({
  default: class Cloudflare {
    zones = { list: vi.fn() }
    dns = { records: { list: vi.fn(), update: vi.fn() } }
    constructor(opts: { apiToken: string }) {
      cf.ctor(opts)
    }
  },
}))

async function hit(path: string, method = 'GET') {
  const { event, res } = createH3Event(path, method)
  // toWebRequest short-circuits on event.web.request, so no socket faking.
  ;(event as unknown as { web: unknown }).web = {
    request: new Request(`http://localhost:3000${path}`, { method }),
  }

  const out = await apiHandler(event)
  return { out, res }
}

describe('api catch-all handler', () => {
  it('returns a plain 404 for an unmatched route', async () => {
    const { out, res } = await hit('/api/definitely-not-a-route')

    expect(out).toBe('Not Found')
    expect(res.statusCode).toBe(404)
  })

  it('serves the health check as JSON', async () => {
    const { out } = await hit('/api/health-check')

    expect(out).toBeInstanceOf(Response)

    const json = await (out as Response).json()
    expect(json.state).toBe('ok')
    expect(typeof json.timestamp).toBe('number')
  })

  it('threads the Nitro context so the no-cache middleware runs', async () => {
    const { res } = await hit('/api/health-check')

    expect(res.getHeader('Cache-Control')).toBe('no-store, no-cache, must-revalidate, max-age=0')
    expect(res.getHeader('Pragma')).toBe('no-cache')
    expect(res.getHeader('Expires')).toBe('0')
  })

  it('rejects a non-GET method on a GET-only route', async () => {
    const { out } = await hit('/api/health-check', 'POST')

    expect(out).toBe('Not Found')
  })

  it('publishes an OpenAPI spec covering both procedures', async () => {
    const { out } = await hit('/api/spec.json')
    const spec = await (out as Response).json()

    expect(spec.openapi).toMatch(/^3\./)
    // nuxt.config.ts declares no runtimeConfig, so both fall back.
    expect(spec.info.title).toBe('Fritzbox Cloudflare DynDNS')
    expect(spec.info.version).toBe('0.0.0')
    expect(spec.paths['/fritz-dyndns']).toBeDefined()
    expect(spec.paths['/health-check']).toBeDefined()
  })

  it('documents the DynDNS query parameters and error statuses', async () => {
    const { out } = await hit('/api/spec.json')
    const spec = await (out as Response).json()
    const op = spec.paths['/fritz-dyndns'].get

    expect(op.parameters.map((p: { name: string }) => p.name).sort())
      .toStrictEqual(['ipv4', 'ipv6', 'record', 'token', 'zone'])
    expect(op.responses['404']).toBeDefined()
    expect(op.responses['503']).toBeDefined()
  })

  it('serves the API reference UI at /api', async () => {
    const { out } = await hit('/api')

    expect((out as Response).status).toBe(200)
    expect((out as Response).headers.get('content-type')).toContain('text/html')
  })

  it('rejects a DynDNS call with no address without touching Cloudflare', async () => {
    const { out } = await hit('/api/fritz-dyndns?token=t&zone=example.com&record=fritz.example.com')

    expect((out as Response).status).toBe(400)
    expect(JSON.stringify(await (out as Response).json()))
      .toContain('Missing ipv4 or ipv6 URL parameter.')
    expect(cf.ctor).not.toHaveBeenCalled()
  })

  it('re-exports the same handler from index.ts so bare /api matches', async () => {
    const indexHandler = (await import('~~/server/routes/api/index')).default

    expect(indexHandler).toBe(apiHandler)
  })
})
