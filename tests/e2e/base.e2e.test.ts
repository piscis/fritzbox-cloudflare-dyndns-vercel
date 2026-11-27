import { $fetch, fetch, setup } from '@nuxt/test-utils/e2e'
import { describe, expect, it } from 'vitest'
import pkg from '~~/package.json'
import { MISSING_IP_MESSAGE } from '~~/shared/dyndnsMessages'

await setup({
  setupTimeout: 300_000,
  nuxtConfig: {
    typescript: { typeCheck: false },
    nitro: { preset: 'node-server' },
  },
})

function fetchHtml(path: string) {
  return fetch(path, {
    headers: { accept: 'text/html' },
  })
}

describe('pages', () => {
  it('index page is callable', async () => {
    const doc = await $fetch('/')
    expect(doc).toContain('DOCTYPE')
  })

  it('renders the 404 page, echoing the path, for an unknown route', async () => {
    const res = await fetchHtml('/no-such-page')
    const body = await res.text()

    expect(res.status).toBe(404)
    expect(body).toContain('NO CARRIER')
    expect(body).toContain('/no-such-page')
  })

  it('never reflects the query string into the 404', async () => {
    const res = await fetchHtml('/api/typo?token=SUPER_SECRET_TOKEN')
    const body = await res.text()

    expect(body).not.toContain('SUPER_SECRET_TOKEN')
    expect(body).not.toContain('token=')
  })

  it('serves the API reference the front page links to', async () => {
    const res = await fetch('/api/')

    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toContain('text/html')
  })

  it('sends X-Robots-Tag on every kind of response, not just HTML', async () => {
    const paths = [
      '/',
      '/setup',
      '/no-such-page',
      '/api/health-check',
      '/api/spec.json',
      '/api/',
    ]

    for (const path of paths) {
      const tag = (await fetchHtml(path)).headers.get('x-robots-tag')

      expect(tag, `missing on ${path}`).toBeTruthy()
      expect(tag, `not noindex on ${path}`).toContain('noindex')
      expect(tag, `not nofollow on ${path}`).toContain('nofollow')
    }
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

  it('links the setup guide from the index page', async () => {
    const html = await $fetch<string>('/')

    expect(html).toContain('href="/setup"')
  })

  it('serves the setup guide prerendered, with the same head as the index page', async () => {
    const res = await fetchHtml('/setup')
    const html = await res.text()

    expect(res.status).toBe(200)
    expect(res.headers.get('last-modified'), 'prerendered assets carry Last-Modified').toBeTruthy()
    expect(html).toContain('04')
    expect(html).toContain('Check it')
    expect(html).toContain('noindex, nofollow')
    expect(html).toContain('lang="en"')
    expect(html).toContain('class="dark"')
  })

  it('gives the error page the same head as the rest of the site', async () => {
    const html = await (await fetchHtml('/no-such-page')).text()

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

  it('lets crawlers fetch, so they can actually read the noindex', async () => {
    const body = await (await fetch('/robots.txt')).text()
    const directives = body
      .split('\n')
      .map(line => line.trim())
      .filter(line => line && !line.startsWith('#'))

    expect(directives.some(line => /^disallow:\s*\/\s*$/i.test(line))).toBe(false)
    expect(directives.some(line => /^allow:\s*\//i.test(line))).toBe(true)
  })

  it.each([
    '/setup/cloudflare-token.png',
    '/setup/a-record.png',
    '/setup/aaaa-record.png',
    '/setup/fritzbox-dyndns.png',
  ])('serves the lazy-loaded setup screenshot %s', async (path) => {
    const res = await fetch(path)

    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toContain('image/png')
  })

  it('serves the modem clip the dial-up button plays', async () => {
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
    expect(spec.info.version).toBe(pkg.version)
    expect(spec.paths['/fritz-dyndns']).toBeDefined()
    expect(spec.paths['/health-check']).toBeDefined()
  })

  it('rejects a DynDNS call with neither ipv4 nor ipv6', async () => {
    const res = await fetch('/api/fritz-dyndns?token=x&zone=example.com&record=fritz.example.com')

    expect(res.status).toBe(400)
    expect(await res.text()).toContain(MISSING_IP_MESSAGE)
  })

  it('rejects a DynDNS call with no parameters at all', async () => {
    const res = await fetch('/api/fritz-dyndns')

    expect(res.status).toBe(400)
    expect(await res.text()).toContain('BAD_REQUEST')
  })
})
