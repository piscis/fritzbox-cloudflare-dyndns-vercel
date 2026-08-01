import { mountSuspended, registerEndpoint } from '@nuxt/test-utils/runtime'
import { flushPromises } from '@vue/test-utils'
// Nitro's auto-imports do not reach test files, so h3 is imported directly.
import { defineEventHandler, setResponseStatus } from 'h3'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import IndexPage from '~/pages/index.vue'

/**
 * The nuxt environment routes every root-relative fetch to an in-memory h3 app,
 * so without this the page's health check would silently exercise its `down`
 * path. `registerEndpoint` has to run at module scope, hence the mutable
 * `health` the individual tests re-point.
 */
let health: { status: number, body: unknown } = {
  status: 200,
  body: { state: 'ok', timestamp: 1_700_000_000_000 },
}

registerEndpoint('/api/health-check', defineEventHandler((event) => {
  setResponseStatus(event, health.status)
  return health.body
}))

describe('index page', () => {
  beforeEach(() => {
    health = { status: 200, body: { state: 'ok', timestamp: 1_700_000_000_000 } }
    // happy-dom implements no media playback.
    HTMLMediaElement.prototype.play = vi.fn(() => Promise.resolve())
    HTMLMediaElement.prototype.pause = vi.fn()
  })

  describe('the modem easter egg', () => {
    it('wires up the clip without autoplaying or preloading it', async () => {
      const page = await mountSuspended(IndexPage)
      const audio = page.find('audio')

      expect(audio.exists()).toBe(true)
      expect(audio.attributes('src')).toBe('/sounds/modem-dial-up.mp3')
      // 852 KB stays unfetched until someone actually presses the button.
      expect(audio.attributes('preload')).toBe('none')
      // The old page shipped `controls autoplay`, which browsers block unmuted —
      // it rendered as an inert grey player mid-layout.
      expect(audio.attributes()).not.toHaveProperty('controls')
      expect(audio.attributes()).not.toHaveProperty('autoplay')
    })

    it('plays on click and reports it through aria-pressed', async () => {
      const page = await mountSuspended(IndexPage)
      const toggle = page.find('button[aria-pressed]')

      expect(toggle.attributes('aria-pressed')).toBe('false')

      await toggle.trigger('click')
      await flushPromises()

      expect(HTMLMediaElement.prototype.play).toHaveBeenCalledOnce()
      expect(toggle.attributes('aria-pressed')).toBe('true')
    })

    it('stays unpressed when the browser refuses to play', async () => {
      HTMLMediaElement.prototype.play = vi.fn(() => Promise.reject(new Error('NotAllowedError')))

      const page = await mountSuspended(IndexPage)
      const toggle = page.find('button[aria-pressed]')

      await toggle.trigger('click')
      await flushPromises()

      // A button that claims to be playing when it is not is a lying button.
      expect(toggle.attributes('aria-pressed')).toBe('false')
    })
  })

  describe('status lamps', () => {
    it('lights the green lamp when the service answers promptly', async () => {
      const page = await mountSuspended(IndexPage)
      await flushPromises()

      expect(page.find('.lamp--on').exists()).toBe(true)
      expect(page.find('[role="status"]').attributes('aria-label')).toBe('Service online')
    })

    it('goes amber when the service reports its own trouble', async () => {
      health = { status: 503, body: { state: 'error', timestamp: 1 } }

      const page = await mountSuspended(IndexPage)
      await flushPromises()

      expect(page.find('.lamp--warn').exists()).toBe(true)
    })

    it('goes red when the endpoint is unreachable', async () => {
      health = { status: 404, body: 'Not Found' }

      const page = await mountSuspended(IndexPage)
      await flushPromises()

      expect(page.find('.lamp--err').exists()).toBe(true)
    })
  })

  describe('content', () => {
    it('renders the headline and the lede', async () => {
      const page = await mountSuspended(IndexPage)

      expect(page.find('h1').text()).toContain('DynDNS')
      expect(page.text()).toContain('Beep boop')
      expect(page.text()).toContain('this is an API')
    })

    it('types out the dial-up handshake', async () => {
      const page = await mountSuspended(IndexPage)

      expect(page.text()).toContain('CONNECT 56000/ARQ/V90/LAPM/V42BIS')
      expect(page.text()).toContain('link established')
    })

    it('sends the API docs button to the live reference, not the README', async () => {
      const page = await mountSuspended(IndexPage)
      const docs = page.find('a[href="/api/"]')

      expect(docs.exists()).toBe(true)
      expect(docs.text()).toContain('API docs')
    })

    it('links to the project on GitHub in a new tab', async () => {
      const page = await mountSuspended(IndexPage)
      const link = page.find('a[href="https://github.com/piscis/fritzbox-cloudflare-dyndns-vercel"]')

      expect(link.exists()).toBe(true)
      expect(link.attributes('target')).toBe('_blank')
      expect(link.attributes('rel')).toContain('noopener')
    })

    it('states the privacy position in the foot line', async () => {
      const page = await mountSuspended(IndexPage)

      expect(page.text()).toContain('no cookies, no analytics, no logs of your token')
      expect(page.text()).toContain('MIT')
    })
  })
})
