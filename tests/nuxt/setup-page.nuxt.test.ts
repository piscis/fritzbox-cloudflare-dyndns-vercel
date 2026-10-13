import type { VueWrapper } from '@vue/test-utils'
import { mountSuspended, registerEndpoint } from '@nuxt/test-utils/runtime'
import { flushPromises } from '@vue/test-utils'
// Nitro's auto-imports do not reach test files, so h3 is imported directly.
import { defineEventHandler } from 'h3'
import { afterEach, describe, expect, it, vi } from 'vitest'
import SetupPage from '~/pages/setup.vue'

type Page = Pick<VueWrapper, 'findAll' | 'get'>

/** The form control a visitor finds by its visible label. */
function field(page: Page, label: string) {
  const match = page.findAll('label').find(l => l.text().replace(/\s+/g, ' ').trim().startsWith(label))
  if (!match)
    throw new Error(`no label "${label}"`)
  return page.get(`#${match.attributes('for')}`)
}

/** The value shown next to a field label in one of the field lists. */
function valueOf(page: Page, label: string, term?: Element): string {
  term ??= page.findAll('dt').find(dt => dt.text().startsWith(label))?.element
  if (!term)
    throw new Error(`no field "${label}"`)
  return term.nextElementSibling!.querySelector('code')!.textContent ?? ''
}

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

    it('links to the README section on running your own', async () => {
      const page = await mountSuspended(SetupPage)
      const link = page.find('a[href="https://github.com/piscis/fritzbox-cloudflare-dyndns-vercel#use-the-service"]')

      expect(link.exists()).toBe(true)
      expect(link.attributes('target')).toBe('_blank')
      expect(link.attributes('rel')).toContain('noopener')
    })

    it('scopes the token to the zone being built for', async () => {
      const page = await mountSuspended(SetupPage)
      expect(valueOf(page, 'Zone Resources')).toBe('Include · Specific zone · example.com')

      await field(page, 'Hostname').setValue('home.example.org')

      expect(valueOf(page, 'Zone Resources')).toBe('Include · Specific zone · example.org')
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
      expect(text).toContain('2001:0db8:85a3:0000:0000:8a2e:0370:7334')
      expect(text).toContain('DNS only')
      expect(text).toContain('1 min')
    })

    it('uses the same placeholder IPs as the screenshots and the README', async () => {
      const page = await mountSuspended(SetupPage)

      expect(valueOf(page, 'IPv4 address')).toBe('192.0.2.1')
      expect(valueOf(page, 'IPv6 address')).toBe('2001:0db8:85a3:0000:0000:8a2e:0370:7334')
      expect(page.text()).not.toContain('2001:db8::1')
    })

    it('points a missing IP family at the IP choice instead of editing the URL by hand', async () => {
      const page = await mountSuspended(SetupPage)
      const text = page.get('section[aria-labelledby="step-records"]').text().replace(/\s+/g, ' ')

      expect(text).not.toMatch(/\b(?:remove|drop) .*from the Update URL/i)
      expect(text).toContain('IP families')
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
        `https://${window.location.host}/api/fritz-dyndns/?token=<pass>&record=home.example.com&zone=example.com&ipv4=<ipaddr>&ipv6=<ip6addr>`,
      )
    })

    it('gives every FRITZ!Box label its German name in parentheses', async () => {
      const page = await mountSuspended(SetupPage)
      const text = page.text()

      expect(text).toContain('(Internet → Freigaben → DynDNS)')
      expect(text).toContain('(DynDns aktiv)')
      expect(text).toContain('(Update-URL)')
      expect(text).toContain('(Domainnamen)')
      expect(text).toContain('(Benutzername)')
      expect(text).toContain('(Kennwort)')
      expect(text).toContain('(Übernehmen)')
      expect(text).not.toContain('DynDNS benutzen')
    })

    it('lists only the fields the FRITZ!Box DynDNS tab shows, without a provider row', async () => {
      const page = await mountSuspended(SetupPage)
      const terms = page.findAll('section[aria-labelledby="step-fritzbox"] dt').map(dt => dt.text())

      expect(terms).toEqual([
        'Update URL (Update-URL)',
        'Domain name (Domainnamen)',
        'Username (Benutzername)',
        'Password (Kennwort)',
      ])
      expect(page.text()).not.toMatch(/DynDNS-Anbieter\)|Benutzerdefiniert|User-defined/)
    })

    it('fills in Domain Name, Username and Password', async () => {
      const page = await mountSuspended(SetupPage)
      const text = page.text()

      expect(valueOf(page, 'Domain name')).toBe('home.example.com')
      expect(valueOf(page, 'Username')).toBe('fritz')
      expect(text).toContain('any value')
      expect(text).toContain('your Cloudflare API token')
    })
  })

  describe('step 04', () => {
    it('describes what success looks like', async () => {
      const page = await mountSuspended(SetupPage)
      const text = page.text()

      // FRITZ!OS shows the DynDNS state on the overview page, not on the DynDNS tab.
      expect(text).toContain('Übersicht')
      expect(text).toContain('Komfortfunktionen')
      expect(text).toContain('IPv4-Status: angemeldet')
      expect(text).not.toMatch(/status on the same tab/i)
      expect(text).toContain('real IP')
    })

    it('points at DynDNS-Fehler entries in the event log', async () => {
      const page = await mountSuspended(SetupPage)

      expect(page.text()).toContain('System → Ereignisse')
      expect(page.text()).toContain('DynDNS-Fehler')
    })

    it('explains the FRITZ!Box error when the Domainnamen does not resolve', async () => {
      const page = await mountSuspended(SetupPage)
      const entry = page.findAll('.trouble dt').find(dt => dt.text().includes('nicht aufgelöst werden'))!

      expect(entry.text()).toContain('Der angegebene Domainname kann trotz erfolgreicher Aktualisierung nicht aufgelöst werden.')
      expect(entry.element.nextElementSibling!.textContent).toContain('home.example.com')
    })

    it.each([
      'Zone "example.com" not found.',
      'A record for "home.example.com" does not exist.',
      'AAAA record for "home.example.com" does not exist.',
      'Missing ipv4 or ipv6 URL parameter.',
    ])('quotes the server message %s word for word', async (message) => {
      const page = await mountSuspended(SetupPage)

      expect(page.text()).toContain(message)
    })

    it.each([
      'A record for "home.example.com" does not exist.',
      'AAAA record for "home.example.com" does not exist.',
      'The record still holds the placeholder IP',
    ])('answers %s with the step 02 IP choice, not a hand-edited URL', async (message) => {
      const page = await mountSuspended(SetupPage)
      const term = page.findAll('.trouble dt').find(dt => dt.text() === message)
      const fix = term?.element.nextElementSibling?.textContent?.replace(/\s+/g, ' ') ?? ''

      expect(fix).toContain('step 02')
      expect(fix).toContain('copy the Update URL again')
      expect(fix).not.toMatch(/\b(?:remove|drop) .*from the Update URL/i)
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
      // The screenshot shows the German interface, so the alt text names its labels.
      expect(alts[3]).toContain('Internet → Freigaben')
      expect(alts[3]).toContain('DynDns aktiv')
      // Both record screenshots show the TTL step 02 asks for.
      expect(alts[1]).toContain('TTL 1 min')
      expect(alts[2]).toContain('TTL 1 min')
    })

    describe('enlarged in a modal', () => {
      let mounted: VueWrapper | undefined

      /** The page attached to the document, so focus behaves as in a browser. */
      async function mountAttached() {
        mounted = await mountSuspended(SetupPage, { attachTo: document.body })
        return mounted
      }

      /** Lets Vue and Reka finish: Reka arms outside clicks and returns focus a macrotask later. */
      async function settle() {
        await flushPromises()
        await new Promise(resolve => setTimeout(resolve, 0))
      }

      /** Focuses and clicks a screenshot button, as a click in a browser does. */
      async function enlarge(button: ReturnType<VueWrapper['get']>) {
        ;(button.element as HTMLButtonElement).focus()
        await button.trigger('click')
        await settle()
      }

      // The dialog is teleported into document.body, outside the page wrapper.
      const dialog = () => document.querySelector<HTMLElement>('[role="dialog"]')

      /** The dialog's accessible name, read from the element aria-labelledby names. */
      function dialogName(element: HTMLElement) {
        return document.getElementById(element.getAttribute('aria-labelledby')!)?.textContent?.trim()
      }

      /** Step 02's two screenshot buttons: the A record, then the AAAA record. */
      function recordButtons(page: Page) {
        return page.findAll('section[aria-labelledby="step-records"] details button')
      }

      function pressEscape() {
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
      }

      afterEach(async () => {
        mounted?.unmount()
        mounted = undefined
        await settle()
        vi.restoreAllMocks()
      })

      it.each([
        ['step-token', 0, '/setup/cloudflare-token.png', '01'],
        ['step-records', 0, '/setup/a-record.png', '02'],
        ['step-records', 1, '/setup/aaaa-record.png', '02'],
        ['step-fritzbox', 0, '/setup/fritzbox-dyndns.png', '03'],
      ])('%s screenshot %i opens alone in a dialog titled by its step', async (step, index, src, number) => {
        const page = await mountAttached()
        const button = page.findAll(`section[aria-labelledby="${step}"] details button`)[index]!
        expect(dialog()).toBeNull()

        await enlarge(button)

        const open = dialog()
        expect(open).not.toBeNull()
        expect(dialogName(open!)).toBe(`Screenshot · step ${number}`)
        const images = [...open!.querySelectorAll('img')]
        expect(images).toHaveLength(1)
        expect(images[0]!.getAttribute('src')).toBe(src)
        expect(images[0]!.getAttribute('alt')).toBe(button.get('img').attributes('alt'))
      })

      it.each([
        ['the close button', (open: HTMLElement) => {
          const close = [...open.querySelectorAll('button')].find(b => b.getAttribute('aria-label') === 'Close')
          expect(close?.textContent).toContain('×')
          close!.click()
        }],
        ['Esc', pressEscape],
        ['an overlay click', () => {
          document.querySelector('[data-slot="overlay"]')!
            .dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerType: 'mouse', button: 0 }))
        }],
      ])('closes on %s and hands focus back to the screenshot', async (_, close) => {
        const page = await mountAttached()
        const button = recordButtons(page)[1]!

        await enlarge(button)
        close(dialog()!)
        await settle()

        expect(dialog()).toBeNull()
        expect(document.activeElement).toBe(button.element)
      })

      describe('fitted or at native size', () => {
        /** The enlarged screenshot, laid out as a browser would: happy-dom computes no layout. */
        async function layOut(natural: [number, number], rendered: [number, number], { event = 'load' } = {}) {
          const image = dialog()!.querySelector('img')!
          const sizes = { naturalWidth: natural[0], naturalHeight: natural[1], clientWidth: rendered[0], clientHeight: rendered[1] }
          for (const [key, value] of Object.entries(sizes))
            Object.defineProperty(image, key, { configurable: true, value })
          ;(event === 'resize' ? window : image).dispatchEvent(new Event(event))
          await settle()
        }

        /** Lays out the AAAA-record screenshot shrunk to a phone's width. */
        function layOutShrunk(options?: { event?: string }) {
          return layOut([1537, 741], [370, 178], options)
        }

        /** Clicks the enlarged screenshot the way a mouse does. */
        async function clickScreenshot() {
          const image = dialog()!.querySelector('img')!
          image.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerType: 'mouse', button: 0 }))
          image.click()
          await settle()
        }

        /** What the visitor sees: the zoom cursor offered, and the width the screenshot is drawn at. */
        function shown() {
          const image = dialog()!.querySelector('img')!
          return { cursor: image.style.cursor, width: image.getAttribute('width') }
        }

        const FITTED = { cursor: 'zoom-in', width: null }
        const NATIVE = { cursor: 'zoom-out', width: '1537' }

        /** Opens step 02's AAAA-record screenshot, shrunk to a phone's width. */
        async function enlargeShrunk(page: VueWrapper) {
          await enlarge(recordButtons(page)[1]!)
          await layOutShrunk()
        }

        it('switches a shrunk screenshot to native size and back on click', async () => {
          const page = await mountAttached()
          await enlargeShrunk(page)
          expect(shown()).toEqual(FITTED)

          await clickScreenshot()
          expect(shown()).toEqual(NATIVE)
          expect(dialog()).not.toBeNull()

          await clickScreenshot()
          expect(shown()).toEqual(FITTED)
          expect(dialog()).not.toBeNull()
        })

        it.each([
          ['the same screenshot', 1],
          ['another screenshot', 0],
        ])('opens %s fitted after one was closed at native size', async (_, index) => {
          const page = await mountAttached()
          await enlargeShrunk(page)
          await clickScreenshot()
          expect(shown()).toEqual(NATIVE)

          pressEscape()
          await settle()
          expect(dialog()).toBeNull()

          await enlarge(recordButtons(page)[index]!)
          expect(shown().width).toBeNull()
          await layOutShrunk()
          expect(shown()).toEqual(FITTED)
        })

        it('offers zoom once a window resize shrinks the screenshot', async () => {
          const page = await mountAttached()
          await enlarge(recordButtons(page)[1]!)
          await layOut([1537, 741], [1537, 741])
          expect(shown().cursor).toBe('')

          await layOutShrunk({ event: 'resize' })

          expect(shown()).toEqual(FITTED)
        })

        it('listens for window resizes only while a screenshot is enlarged', async () => {
          const listening = new Set<unknown>()
          const add = window.addEventListener.bind(window)
          const remove = window.removeEventListener.bind(window)
          vi.spyOn(window, 'addEventListener').mockImplementation((type: string, listener: any, options?: any) => {
            if (type === 'resize')
              listening.add(listener)
            add(type, listener, options)
          })
          vi.spyOn(window, 'removeEventListener').mockImplementation((type: string, listener: any, options?: any) => {
            if (type === 'resize')
              listening.delete(listener)
            remove(type, listener, options)
          })

          const page = await mountAttached()
          expect(listening.size).toBe(0)

          await enlarge(recordButtons(page)[1]!)
          expect(listening.size).toBe(1)

          pressEscape()
          await settle()
          expect(listening.size).toBe(0)

          await enlarge(recordButtons(page)[0]!)
          expect(listening.size).toBe(1)
          page.unmount()
          mounted = undefined
          expect(listening.size).toBe(0)
        })

        it('offers no zoom and stays open when the screenshot already shows 1:1', async () => {
          const page = await mountAttached()
          await enlarge(page.get('section[aria-labelledby="step-token"] details button'))
          await layOut([884, 784], [884, 784])
          expect(shown()).toEqual({ cursor: '', width: null })

          await clickScreenshot()

          expect(dialog()).not.toBeNull()
          expect(shown()).toEqual({ cursor: '', width: null })
        })
      })

      it('makes every screenshot in a toggle an enlarge button with a hint', async () => {
        const page = await mountSuspended(SetupPage)

        const buttons = page.findAll('details').flatMap(toggle => toggle.findAll('button'))
        expect(buttons).toHaveLength(4)
        for (const button of buttons) {
          expect(button.attributes('type')).toBe('button')
          expect(button.attributes('aria-label')).toMatch(/^Enlarge screenshot/)
          expect(button.find('img').exists()).toBe(true)
          expect(button.text()).toContain('enlarge ▸')
        }
      })

      it('names each enlarge button after its screenshot, so step 02\'s two differ', async () => {
        const page = await mountSuspended(SetupPage)

        const buttons = recordButtons(page)
        const names = buttons.map(button => button.attributes('aria-label'))
        expect(names).toHaveLength(2)
        expect(names[0]).not.toBe(names[1])
        buttons.forEach((button, i) => {
          expect(names[i]).toMatch(/^Enlarge screenshot/)
          expect(names[i]).toContain(button.get('img').attributes('alt'))
        })
      })
    })
  })

  describe('the builder', () => {
    it('starts empty and shows the placeholder values', async () => {
      const page = await mountSuspended(SetupPage)

      expect((field(page, 'Hostname').element as HTMLInputElement).value).toBe('')
      expect(field(page, 'Hostname').attributes('placeholder')).toBe('home.example.com')
      expect((field(page, 'Zone').element as HTMLInputElement).value).toBe('')
      expect(field(page, 'Zone').attributes('placeholder')).toBe('example.com')
      expect((field(page, 'IPv4 + IPv6').element as HTMLInputElement).checked).toBe(true)
      expect(valueOf(page, 'Name')).toBe('home')
      expect(valueOf(page, 'Domain name')).toBe('home.example.com')
    })

    it('keeps everything in memory: no storage, no cookies, no query string', async () => {
      const setItem = vi.spyOn(Storage.prototype, 'setItem')
      const before = { search: window.location.search, cookie: document.cookie }
      const page = await mountSuspended(SetupPage)

      await field(page, 'Hostname').setValue('home.example.org')
      await field(page, 'Zone').setValue('example.org')
      await field(page, 'IPv6 only').setValue(true)
      await flushPromises()

      expect(setItem).not.toHaveBeenCalled()
      expect(window.localStorage).toHaveLength(0)
      expect(window.location.search).toBe(before.search)
      expect(document.cookie).toBe(before.cookie)
      setItem.mockRestore()
    })

    it('fills the zone from the hostname and builds the Update URL from both', async () => {
      const page = await mountSuspended(SetupPage)

      await field(page, 'Hostname').setValue('home.example.org')

      expect((field(page, 'Zone').element as HTMLInputElement).value).toBe('example.org')
      expect(valueOf(page, 'Update URL')).toBe(
        `https://${window.location.host}/api/fritz-dyndns/?token=<pass>&record=home.example.org&zone=example.org&ipv4=<ipaddr>&ipv6=<ip6addr>`,
      )
    })

    it('keeps an edited zone when the hostname changes', async () => {
      const page = await mountSuspended(SetupPage)

      await field(page, 'Hostname').setValue('fritz.example.co.uk')
      await field(page, 'Zone').setValue('example.co.uk')
      await field(page, 'Hostname').setValue('box.example.co.uk')

      expect((field(page, 'Zone').element as HTMLInputElement).value).toBe('example.co.uk')
      expect(valueOf(page, 'Update URL')).toContain('&record=box.example.co.uk&zone=example.co.uk&')
    })

    it('fills the zone from the hostname again once the edited zone is cleared', async () => {
      const page = await mountSuspended(SetupPage)

      await field(page, 'Hostname').setValue('fritz.example.co.uk')
      await field(page, 'Zone').setValue('example.co.uk')
      await field(page, 'Zone').setValue('')
      await field(page, 'Hostname').setValue('home.example.org')

      expect(field(page, 'Zone').attributes('placeholder')).toBe('example.org')
      expect(valueOf(page, 'Update URL')).toContain('&record=home.example.org&zone=example.org&')
    })

    it('lowercases the hostname and zone, as the server compares names exactly', async () => {
      const page = await mountSuspended(SetupPage)

      await field(page, 'Hostname').setValue('Fritz.Example.com')

      expect((field(page, 'Hostname').element as HTMLInputElement).value).toBe('Fritz.Example.com')
      expect(valueOf(page, 'Update URL')).toContain('&record=fritz.example.com&zone=example.com&')
      expect(valueOf(page, 'Domain name')).toBe('fritz.example.com')
      expect(page.findAll('[role="alert"]')).toHaveLength(0)

      await field(page, 'Zone').setValue(' Example.COM. ')

      expect((field(page, 'Zone').element as HTMLInputElement).value).toBe(' Example.COM. ')
      expect(valueOf(page, 'Update URL')).toContain('&record=fritz.example.com&zone=example.com&')
      expect(page.findAll('[role="alert"]')).toHaveLength(0)
    })

    it('drops a trailing dot before guessing the zone', async () => {
      const page = await mountSuspended(SetupPage)

      await field(page, 'Hostname').setValue(' fritz.example.com. ')

      expect((field(page, 'Zone').element as HTMLInputElement).value).toBe('example.com')
      expect(valueOf(page, 'Update URL')).toContain('&record=fritz.example.com&zone=example.com&')
      expect(valueOf(page, 'Name')).toBe('fritz')
      expect(page.findAll('[role="alert"]')).toHaveLength(0)
    })
  })

  it('sets the FRITZ!Box Domain Name to the hostname', async () => {
    const page = await mountSuspended(SetupPage)

    await field(page, 'Hostname').setValue('home.example.org')

    expect(valueOf(page, 'Domain name')).toBe('home.example.org')
  })

  describe('warnings', () => {
    function warnings(page: Page): string[] {
      return page.findAll('[role="alert"]').map(w => w.text())
    }

    it('shows none for the placeholders or a hostname inside its zone', async () => {
      const page = await mountSuspended(SetupPage)
      expect(warnings(page)).toEqual([])

      await field(page, 'Hostname').setValue('fritz.example.co.uk')
      await field(page, 'Zone').setValue('example.co.uk')
      expect(warnings(page)).toEqual([])
    })

    it('flags a hostname outside the zone and still shows the values', async () => {
      const page = await mountSuspended(SetupPage)

      await field(page, 'Hostname').setValue('fritz.example.com')
      await field(page, 'Zone').setValue('example.org')

      expect(warnings(page).join(' ')).toContain('fritz.example.com is not example.org and does not end in .example.org')
      expect(valueOf(page, 'Update URL')).toContain('&record=fritz.example.com&zone=example.org&')
      expect(valueOf(page, 'Domain name')).toBe('fritz.example.com')
    })

    it.each([
      'https://fritz.example.com',
      'https://fritz.example.com/',
      'fritz.example.com/path',
      'fritz example.com',
      'fritz_box.example.com',
      '-fritz.example.com',
      'fritz..example.com',
    ])('flags %s as not a hostname and still shows the values', async (input) => {
      const page = await mountSuspended(SetupPage)

      await field(page, 'Hostname').setValue(input)

      expect(warnings(page).join(' ')).toContain('does not look like a hostname')
      expect(valueOf(page, 'Domain name')).toBe(input)
      expect(valueOf(page, 'Update URL')).toContain(`&record=${input}&`)
    })
  })

  describe('copy buttons', () => {
    afterEach(() => {
      vi.restoreAllMocks()
    })

    function stubClipboard(writeText: (text: string) => Promise<void>) {
      return vi.spyOn(navigator.clipboard, 'writeText').mockImplementation(writeText)
    }

    it.each([
      ['Update URL'],
      ['Domain name'],
      ['Username'],
    ])('copies the shown %s', async (label) => {
      const writeText = stubClipboard(() => Promise.resolve())
      const page = await mountSuspended(SetupPage)
      await field(page, 'Hostname').setValue('home.example.org')

      const button = page.get(`button[aria-label^="Copy ${label}"]`)
      await button.trigger('click')
      await flushPromises()

      expect(writeText).toHaveBeenCalledWith(valueOf(page, label))
      expect(button.text()).toContain('copied')
    })

    it('says so when the browser blocks the clipboard, and the value stays selectable text', async () => {
      stubClipboard(() => Promise.reject(new Error('NotAllowedError')))
      const page = await mountSuspended(SetupPage)

      const button = page.get('button[aria-label^="Copy Update URL"]')
      await button.trigger('click')
      await flushPromises()

      expect(button.text()).toContain('select it')
      expect(valueOf(page, 'Update URL')).toContain('/api/fritz-dyndns/')
    })
  })

  describe('the IP choice', () => {
    const base = 'https://HOST/api/fritz-dyndns/?token=<pass>&record=home.example.com&zone=example.com'

    it.each([
      ['IPv4 + IPv6', `${base}&ipv4=<ipaddr>&ipv6=<ip6addr>`],
      ['IPv4 only', `${base}&ipv4=<ipaddr>`],
      ['IPv6 only', `${base}&ipv6=<ip6addr>`],
    ])('%s builds the matching Update URL', async (choice, url) => {
      const page = await mountSuspended(SetupPage)

      await field(page, 'IPv6 only').setValue(true)
      await field(page, choice).setValue(true)

      expect(valueOf(page, 'Update URL')).toBe(url.replace('HOST', window.location.host))
    })
  })

  describe('the DNS records', () => {
    function recordTypes(page: Page): string[] {
      return page.findAll('dt').filter(dt => dt.text() === 'Type').map(dt => valueOf(page, 'Type', dt.element))
    }

    it('names the record after the subdomain', async () => {
      const page = await mountSuspended(SetupPage)

      await field(page, 'Hostname').setValue('home.lab.example.org')

      expect(valueOf(page, 'Name')).toBe('home.lab')
    })

    it('uses @ for the zone apex', async () => {
      const page = await mountSuspended(SetupPage)

      await field(page, 'Hostname').setValue('example.org')

      expect(valueOf(page, 'Name')).toBe('@')
    })

    it.each([
      ['IPv4 + IPv6', ['A', 'AAAA']],
      ['IPv4 only', ['A']],
      ['IPv6 only', ['AAAA']],
    ])('%s shows only the matching records', async (choice, types) => {
      const page = await mountSuspended(SetupPage)

      await field(page, choice).setValue(true)

      expect(recordTypes(page)).toEqual(types)
    })
  })

  describe('the token', () => {
    it('is never asked for', async () => {
      const page = await mountSuspended(SetupPage)
      const labels = page.findAll('label').map(l => l.text().toLowerCase())

      // Not even a field: the token goes into the FRITZ!Box and nowhere else.
      expect(page.findAll('input[type="password"], textarea')).toHaveLength(0)
      expect(labels.length).toBeGreaterThan(0)
      for (const label of labels) {
        expect(label).not.toMatch(/token|password|pass\b/)
      }
    })
  })

  it('opens with a back button to home, above the heading', async () => {
    const page = await mountSuspended(SetupPage)
    const back = page.findAll('a[href="/"]')[0]!
    const heading = page.find('h1').element

    expect(back.text()).toContain('← home')
    expect(back.element.compareDocumentPosition(heading) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it('links back home from the foot line', async () => {
    const page = await mountSuspended(SetupPage)
    const links = page.findAll('a[href="/"]')
    const home = links.at(-1)!

    expect(links).toHaveLength(2)
    expect(home.text()).toContain('← home')
    expect(page.find('#step-check').element.compareDocumentPosition(home.element) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(page.text()).toContain('no cookies, no analytics, no logs of your token')
  })
})
