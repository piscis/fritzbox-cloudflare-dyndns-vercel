import { mountSuspended, registerEndpoint } from '@nuxt/test-utils/runtime'
import { flushPromises } from '@vue/test-utils'
// Nitro's auto-imports do not reach test files, so h3 is imported directly.
import { defineEventHandler, setResponseStatus } from 'h3'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
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

/** Counts constructions so tests can assert Web Audio stayed untouched. */
let audioContextConstructed = 0

function stubAudioContext(): void {
  // happy-dom has no Web Audio; the composable must still play through <audio>.
  class FakeAnalyser {
    frequencyBinCount = 128
    fftSize = 256
    smoothingTimeConstant = 0.8
    minDecibels = -90
    maxDecibels = -20
    connect = vi.fn()
    getByteFrequencyData = vi.fn((target: Uint8Array) => {
      target.fill(0)
    })
  }

  class FakeAudioContext {
    state = 'running'
    constructor() {
      audioContextConstructed++
    }

    resume = vi.fn(() => Promise.resolve())
    close = vi.fn(() => Promise.resolve())
    createAnalyser = vi.fn(() => new FakeAnalyser())
    createMediaElementSource = vi.fn(() => ({ connect: vi.fn() }))
    get destination() {
      return {}
    }
  }

  vi.stubGlobal('AudioContext', FakeAudioContext)
}

describe('index page', () => {
  beforeEach(() => {
    health = { status: 200, body: { state: 'ok', timestamp: 1_700_000_000_000 } }
    // happy-dom implements no media playback.
    HTMLMediaElement.prototype.play = vi.fn(() => Promise.resolve())
    HTMLMediaElement.prototype.pause = vi.fn()
    audioContextConstructed = 0
    stubAudioContext()
  })

  describe('the modem easter egg', () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('wires up the clip without an autoplay attribute or immediate play', async () => {
      const page = await mountSuspended(IndexPage)
      const audio = page.find('audio')

      expect(audio.exists()).toBe(true)
      expect(audio.attributes('src')).toBe('/sounds/modem-dial-up.mp3')
      // 852 KB stays unfetched until the first play() — autoplay try or a click.
      expect(audio.attributes('preload')).toBe('none')
      // No HTML autoplay attribute: that path is blocked unmuted and used to
      // render as an inert grey player mid-layout.
      expect(audio.attributes()).not.toHaveProperty('controls')
      expect(audio.attributes()).not.toHaveProperty('autoplay')
      expect(HTMLMediaElement.prototype.play).not.toHaveBeenCalled()
    })

    it('autoplays two seconds after mount when the browser allows it', async () => {
      const page = await mountSuspended(IndexPage)

      await vi.advanceTimersByTimeAsync(1999)
      await flushPromises()
      expect(HTMLMediaElement.prototype.play).not.toHaveBeenCalled()

      await vi.advanceTimersByTimeAsync(1)
      await flushPromises()

      expect(HTMLMediaElement.prototype.play).toHaveBeenCalledOnce()
      expect(page.find('button[aria-pressed]').attributes('aria-pressed')).toBe('true')
    })

    it('builds no audio graph for the autoplay try, only on a gesture', async () => {
      const page = await mountSuspended(IndexPage)

      await vi.advanceTimersByTimeAsync(2000)
      await flushPromises()

      // A context built here would start suspended (Chrome logs the autoplay
      // warning) and swallow the element's output — a pressed button over
      // silence. See useModemDialup's ensureGraph.
      expect(HTMLMediaElement.prototype.play).toHaveBeenCalledOnce()
      expect(audioContextConstructed).toBe(0)

      // The gesture the composable has been waiting for lights the spectrum up.
      window.dispatchEvent(new Event('pointerdown'))
      await flushPromises()

      expect(audioContextConstructed).toBe(1)
      expect(page.find('button[aria-pressed]').attributes('aria-pressed')).toBe('true')
    })

    it('builds the graph on a click, which is already a gesture', async () => {
      const page = await mountSuspended(IndexPage)

      await page.find('button[aria-pressed]').trigger('click')
      await flushPromises()

      expect(audioContextConstructed).toBe(1)
    })

    it('does not autoplay after the visitor has already used the button', async () => {
      const page = await mountSuspended(IndexPage)
      const toggle = page.find('button[aria-pressed]')

      await toggle.trigger('click')
      await flushPromises()
      expect(HTMLMediaElement.prototype.play).toHaveBeenCalledOnce()

      // Stop, then let the scheduled delay elapse — must not restart on its own.
      await toggle.trigger('click')
      await flushPromises()
      await vi.advanceTimersByTimeAsync(2000)
      await flushPromises()

      expect(HTMLMediaElement.prototype.play).toHaveBeenCalledOnce()
      expect(toggle.attributes('aria-pressed')).toBe('false')
    })

    it('mounts a decorative spectrum canvas behind the copy', async () => {
      const page = await mountSuspended(IndexPage)
      const spectrum = page.find('canvas.modem-spectrum')

      expect(spectrum.exists()).toBe(true)
      expect(spectrum.attributes('aria-hidden')).toBe('true')
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
      expect(link.text()).toContain('GitHub')
      // Leading mark — prerendered via icon.clientBundle, not a runtime fetch.
      expect(
        link.find('svg').exists()
        || link.html().includes('i-lucide-github')
        || link.html().includes('lucide:github'),
      ).toBe(true)
    })

    it('states the privacy position in the foot line', async () => {
      const page = await mountSuspended(IndexPage)

      expect(page.text()).toContain('no cookies, no analytics, no logs of your token')
      expect(page.text()).toContain('MIT')
    })
  })
})
