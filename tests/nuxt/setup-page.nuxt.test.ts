import { mountSuspended, registerEndpoint } from '@nuxt/test-utils/runtime'
import { flushPromises } from '@vue/test-utils'
// Nitro's auto-imports do not reach test files, so h3 is imported directly.
import { defineEventHandler } from 'h3'
import { describe, expect, it } from 'vitest'
import SetupPage from '~/pages/setup.vue'

// Without this the title bar's health check would silently exercise its
// `down` path against the in-memory h3 app.
registerEndpoint('/api/health-check', defineEventHandler(() => ({ state: 'ok', timestamp: 1_700_000_000_000 })))

describe('setup page', () => {
  it('walks through the four numbered steps in order', async () => {
    const page = await mountSuspended(SetupPage)
    const headings = page.findAll('h2').map(h => h.text().replace(/\s+/g, ' '))

    expect(headings).toEqual([
      '01 Cloudflare token',
      '02 DNS records',
      '03 FRITZ!Box',
      '04 Check it',
    ])
  })

  it('sits in the phosphor frame with the host label and status lamps', async () => {
    const page = await mountSuspended(SetupPage)
    await flushPromises()

    expect(page.find('.crt-glass').exists()).toBe(true)
    expect(page.find('[role="status"]').attributes('aria-label')).toBe('Service online')
    expect(page.text()).toContain(window.location.host.split('.')[0])
  })

  describe('step 01', () => {
    it('names the token permissions and the zone restriction', async () => {
      const page = await mountSuspended(SetupPage)
      const text = page.text()

      expect(text).toContain('Zone.Zone')
      expect(text).toContain('Read')
      expect(text).toContain('Zone.DNS')
      expect(text).toContain('Edit')
      expect(text).toContain('Zone Resources → Include → Specific zone')
    })

    it('says plainly that the token reaches this Instance and who could read it', async () => {
      const page = await mountSuspended(SetupPage)
      const text = page.text()

      expect(text).toContain('every update')
      expect(text).toContain('never logged')
      expect(text).toContain('could read it')
    })

    it('links to the README self-host section on GitHub', async () => {
      const page = await mountSuspended(SetupPage)
      const link = page.find('a[href="https://github.com/piscis/fritzbox-cloudflare-dyndns-vercel#use-the-service"]')

      expect(link.exists()).toBe(true)
      expect(link.attributes('target')).toBe('_blank')
      expect(link.attributes('rel')).toContain('noopener')
    })

    it('offers no deploy buttons', async () => {
      const page = await mountSuspended(SetupPage)

      expect(page.html()).not.toContain('deploy.workers.cloudflare.com')
      expect(page.html()).not.toContain('vercel.com/new')
    })
  })

  describe('step 02', () => {
    it('lists the A and AAAA record values', async () => {
      const page = await mountSuspended(SetupPage)
      const text = page.text()

      expect(text).toContain('AAAA')
      expect(text).toContain('192.0.2.1')
      expect(text).toContain('2001:db8::1')
      expect(text).toContain('DNS only')
      expect(text).toContain('1 min')
      expect(text).toContain('fritz')
    })

    it('explains that the service only updates existing records', async () => {
      const page = await mountSuspended(SetupPage)

      expect(page.text()).toContain('only updates existing records')
    })
  })

  describe('step 03', () => {
    it('shows the Update URL with the FRITZ!Box placeholders left literal', async () => {
      const page = await mountSuspended(SetupPage)

      expect(page.text()).toContain(
        `https://${window.location.host}/api/fritz-dyndns/?token=<pass>&record=fritz.example.com&zone=example.com&ipv4=<ipaddr>&ipv6=<ip6addr>`,
      )
    })

    it('gives every FRITZ!Box label its German name in parentheses', async () => {
      const page = await mountSuspended(SetupPage)
      const text = page.text()

      expect(text).toContain('(Internet → Freigaben → DynDNS)')
      expect(text).toContain('(Update-URL)')
      expect(text).toContain('(Domainname)')
      expect(text).toContain('(Benutzername)')
      expect(text).toContain('(Kennwort)')
    })

    it('fills in Domain Name, Username and Password', async () => {
      const page = await mountSuspended(SetupPage)
      const text = page.text()

      expect(text).toContain('fritz.example.com')
      expect(text).toContain('any value')
      expect(text).toContain('your Cloudflare API token')
    })
  })

  describe('step 04', () => {
    it('describes what success looks like', async () => {
      const page = await mountSuspended(SetupPage)
      const text = page.text()

      expect(text).toMatch(/DynDNS status/i)
      expect(text).toContain('real IP')
    })

    it.each([
      'Zone "example.com" not found.',
      'A record for "fritz.example.com" does not exist.',
      'AAAA record for "fritz.example.com" does not exist.',
      'Missing ipv4 or ipv6 URL parameter.',
    ])('quotes the server message %s word for word', async (message) => {
      const page = await mountSuspended(SetupPage)

      expect(page.text()).toContain(message)
    })

    it('covers a record still holding the placeholder IP', async () => {
      const page = await mountSuspended(SetupPage)
      const text = page.text()

      expect(text).toContain('placeholder IP')
      expect(text).toContain('Proxied')
      expect(text).toContain('DS-Lite')
    })
  })

  describe('screenshots', () => {
    it.each([
      ['step-token', ['/setup/cloudflare-token.png']],
      ['step-records', ['/setup/a-record.png', '/setup/aaaa-record.png']],
      ['step-fritzbox', ['/setup/fritzbox-dyndns.png']],
    ])('%s keeps its screenshots behind a closed toggle', async (step, sources) => {
      const page = await mountSuspended(SetupPage)
      const toggle = page.find(`section[aria-labelledby="${step}"] details`)

      expect(toggle.exists()).toBe(true)
      expect(toggle.find('summary').text()).toBe('show screenshot ▸')
      expect((toggle.element as HTMLDetailsElement).open).toBe(false)

      const images = toggle.findAll('img')
      expect(images.map(img => img.attributes('src'))).toEqual(sources)
      for (const img of images)
        expect(img.attributes('loading')).toBe('lazy')
    })

    it('opens a toggle on click', async () => {
      const page = await mountSuspended(SetupPage)
      const toggle = page.find('section[aria-labelledby="step-token"] details')

      await toggle.find('summary').trigger('click')

      expect((toggle.element as HTMLDetailsElement).open).toBe(true)
    })

    it('describes each screenshot in its alt text', async () => {
      const page = await mountSuspended(SetupPage)
      const alts = page.findAll('details img').map(img => img.attributes('alt'))

      expect(alts).toHaveLength(4)
      expect(alts[0]).toMatch(/Cloudflare.*token/i)
      expect(alts[1]).toMatch(/\bA record\b/)
      expect(alts[2]).toMatch(/\bAAAA record\b/)
      expect(alts[3]).toMatch(/FRITZ!Box.*DynDNS/)
    })
  })

  describe('the token', () => {
    it('is never asked for', async () => {
      const page = await mountSuspended(SetupPage)

      // Not even a field: the token goes into the FRITZ!Box and nowhere else.
      expect(page.findAll('input, textarea, select')).toHaveLength(0)
    })
  })

  it('links back home from the foot line', async () => {
    const page = await mountSuspended(SetupPage)
    const home = page.find('a[href="/"]')

    expect(home.exists()).toBe(true)
    expect(home.text()).toContain('← home')
    expect(page.text()).toContain('no cookies, no analytics, no logs of your token')
  })
})
