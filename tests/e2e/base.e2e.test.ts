import { $fetch, fetch, setup } from '@nuxt/test-utils/e2e'
import { describe, expect, it } from 'vitest'

// One setup() for the whole file: each call builds and boots its own server.
await setup({
  setupTimeout: 300_000,
  nuxtConfig: {
    // setup() does not set nuxt.options.test, so vue-tsc would otherwise run
    // inside the e2e build. The dedicated CI typecheck job covers that.
    typescript: { typeCheck: false },
    // A developer with NITRO_PRESET=cloudflare_module in their environment would
    // otherwise build a Worker that setup() cannot boot as a node server.
    nitro: { preset: 'node-server' },
  },
})

describe('pages', () => {
  it('index page is callable', async () => {
    const doc = await $fetch('/')
    expect(doc).toContain('DOCTYPE')
  })

  it('renders the 404 page for an unknown route', async () => {
    // Without an HTML Accept header Nitro answers with its JSON error payload
    // rather than rendering error.vue.
    const res = await fetch('/no-such-page', { headers: { accept: 'text/html' } })
    const body = await res.text()

    expect(res.status).toBe(404)
    expect(body).toContain('NO CARRIER')
    // The path echo is the point of the design's 404, and only a real render
    // proves it survives SSR — no component test can.
    expect(body).toContain('/no-such-page')
  })

  it('never reflects the query string into the 404', async () => {
    // A mistyped DynDNS update URL carries a live Cloudflare token. Only a real
    // render proves it does not reach the HTML.
    const res = await fetch('/api/typo?token=SUPER_SECRET_TOKEN', { headers: { accept: 'text/html' } })
    const body = await res.text()

    expect(body).not.toContain('SUPER_SECRET_TOKEN')
    expect(body).not.toContain('token=')
  })

  it('serves the API reference the front page links to', async () => {
    // The button needs `external`, because /api has no vue-router match; if it
    // ever loses that, this stays green but the click 404s. Guard the target.
    const res = await fetch('/api/')

    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toContain('text/html')
  })

  it('marks the site noindex and sets the document language', async () => {
    const html = await $fetch<string>('/')

    expect(html).toContain('noindex, nofollow')
    expect(html).toContain('<title>FRITZ!Box DynDNS Service</title>')
    expect(html).toContain('lang="en"')
  })

  it('ships dark mode in the prerendered HTML, with no client-side flash', async () => {
    const html = await $fetch<string>('/')

    expect(html).toContain('class="dark"')
  })

  it('gives the error page the same head as the rest of the site', async () => {
    // error.vue renders instead of app.vue and mounts no layout, so these come
    // from `app.head` in nuxt.config. They used to be missing entirely here.
    const html = await (await fetch('/no-such-page', { headers: { accept: 'text/html' } })).text()

    expect(html).toContain('<title>FRITZ!Box DynDNS Service</title>')
    expect(html).toContain('class="dark"')
    expect(html).toContain('favicons/favicon.svg')
  })
})

describe('headers', () => {
  it('should remove x-powered-by', async () => {
    const res = await fetch('/')
    expect(res.headers.has('x-powered-by')).toBeFalsy()
    expect(res.headers.has('X-Powered-By')).toBeFalsy()
    expect(res.headers.has('content-type')).toBeTruthy()
  })
})

describe('static assets', () => {
  it('redirects /favicon.ico to the SVG', async () => {
    const res = await fetch('/favicon.ico', { redirect: 'manual' })

    expect(res.status).toBe(302)
    expect(res.headers.get('location')).toBe('/favicons/favicon.svg')
  })

  it('serves robots.txt', async () => {
    expect((await fetch('/robots.txt')).status).toBe(200)
  })

  it('still serves the modem clip', async () => {
    // The clip is only reachable through the dial-up button now, so nothing
    // else would catch it going missing.
    expect((await fetch('/sounds/modem-dial-up.mp3')).status).toBe(200)
  })
})

describe('api', () => {
  it('answers the health check', async () => {
    const res = await fetch('/api/health-check')

    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toContain('application/json')

    const body = await res.json()
    expect(body.state).toBe('ok')
    expect(Number.isInteger(body.timestamp)).toBe(true)
  })

  it('sends no-store cache headers on API responses', async () => {
    const res = await fetch('/api/health-check')

    expect(res.headers.get('cache-control')).toBe('no-store, no-cache, must-revalidate, max-age=0')
    expect(res.headers.get('pragma')).toBe('no-cache')
    expect(res.headers.get('expires')).toBe('0')
  })

  it('returns 404 for an unknown API path', async () => {
    const res = await fetch('/api/nope')

    expect(res.status).toBe(404)
    expect(await res.text()).toBe('Not Found')
  })

  it('publishes the OpenAPI spec', async () => {
    const spec = await $fetch<Record<string, any>>('/api/spec.json')

    expect(spec.info.title).toBe('Fritzbox Cloudflare DynDNS')
    expect(spec.paths['/fritz-dyndns']).toBeDefined()
    expect(spec.paths['/health-check']).toBeDefined()
  })

  // Only validation failures are safe to exercise over HTTP: input validation
  // runs before `new Cloudflare()`, so no request reaches the real API.
  // Never e2e-test the DynDNS happy path.
  it('rejects a DynDNS call with neither ipv4 nor ipv6', async () => {
    const res = await fetch('/api/fritz-dyndns?token=x&zone=example.com&record=fritz.example.com')

    expect(res.status).toBe(400)
    expect(await res.text()).toContain('Missing ipv4 or ipv6 URL parameter.')
  })

  it('rejects a DynDNS call with no parameters at all', async () => {
    const res = await fetch('/api/fritz-dyndns')

    expect(res.status).toBe(400)
    expect(await res.text()).toContain('BAD_REQUEST')
  })
})
