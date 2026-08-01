import type { NuxtError } from '#app'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import { createError } from '#app'
import ErrorPage from '~/error.vue'

/**
 * `url` is what Nuxt sets on a server-rendered error and is how the page echoes
 * the path back. It is real at runtime but absent from the public NuxtError
 * type, so the fixture has to widen it the same way the page does.
 */
function errorWith(statusCode: number, url?: string, message = 'boom'): NuxtError {
  const error = createError({ statusCode, message }) as NuxtError & { url?: string }
  if (url) {
    error.url = url
  }
  return error
}

function mountError(statusCode: number, url?: string, message?: string) {
  return mountSuspended(ErrorPage, { props: { error: errorWith(statusCode, url, message) } })
}

describe('error page', () => {
  describe('404', () => {
    it('answers NO CARRIER with its own artwork', async () => {
      const page = await mountError(404)

      expect(page.find('h1').text()).toBe('NO CARRIER')
      expect(page.text()).toContain('ERROR 404 · PAGE NOT FOUND')
      expect(page.find('svg[data-art="404"]').exists()).toBe(true)
      expect(page.find('svg[data-art="5xx"]').exists()).toBe(false)
    })

    it('echoes the path that was actually dialled', async () => {
      const page = await mountError(404, '/no-such-page')

      expect(page.text()).toContain('ATDT /no-such-page')
    })

    // The Cloudflare token travels in the query string because a FRITZ!Box
    // cannot send headers, so a mistyped update URL must not render a live
    // credential into the page.
    it('never echoes the query string back', async () => {
      const page = await mountError(404, '/api/fritz-dyndns?token=SUPER_SECRET_TOKEN&zone=example.dev')

      expect(page.html()).not.toContain('SUPER_SECRET_TOKEN')
      expect(page.html()).not.toContain('token=')
      expect(page.text()).toContain('ATDT /api/fritz-dyndns')
    })

    it('truncates an absurdly long path rather than letting it reflow the card', async () => {
      const page = await mountError(404, `/${'a'.repeat(400)}`)

      expect(page.text()).toContain('…')
      expect(page.text()).not.toContain('a'.repeat(200))
    })

    it('says where the host does answer', async () => {
      const page = await mountError(404)

      expect(page.text()).toContain('The number you dialled is not in service')
      expect(page.text()).toContain('/api')
    })

    it('offers a way back to the index page', async () => {
      const page = await mountError(404)
      const back = page.find('a[href="/"]')

      expect(back.exists()).toBe(true)
      expect(back.text()).toContain('Redial')
    })
  })

  describe('5xx', () => {
    it('answers LINE BUSY with the server-fault artwork', async () => {
      const page = await mountError(500)

      expect(page.find('h1').text()).toBe('LINE BUSY')
      expect(page.text()).toContain('ERROR 500 · INTERNAL SERVER ERROR')
      expect(page.find('svg[data-art="5xx"]').exists()).toBe(true)
      expect(page.find('svg[data-art="404"]').exists()).toBe(false)
    })

    it('names a 503 as a service outage', async () => {
      const page = await mountError(503)

      expect(page.text()).toContain('ERROR 503 · SERVICE UNAVAILABLE')
      expect(page.text()).toContain('All circuits are in use')
    })

    it('puts the blame on the service rather than the visitor', async () => {
      const page = await mountError(503)

      expect(page.text()).toContain('This one is on us, not on you')
    })

    // Upstream Cloudflare messages can embed the caller's token, so the page
    // deliberately renders fixed prose instead of error.message.
    it('never surfaces the raw upstream message', async () => {
      const page = await mountError(503, undefined, 'Upstream unavailable')

      expect(page.text()).not.toContain('Upstream unavailable')
    })
  })

  describe('unmapped statuses', () => {
    it('falls back to a generic signal rather than inventing a message', async () => {
      const page = await mountError(418)

      expect(page.find('h1').text()).toBe('ERROR')
      expect(page.text()).toContain('ERROR 418')
    })
  })
})
