import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import { createError } from '#app'
import ErrorPage from '~/error.vue'

describe('error page', () => {
  describe('404', () => {
    it('renders the 404 artwork with alt text', async () => {
      const page = await mountSuspended(ErrorPage, {
        props: { error: createError({ statusCode: 404, message: 'Page not found' }) },
      })
      const img = page.find('img')

      expect(img.exists()).toBe(true)
      expect(img.attributes('alt')).toBe('Page not found')
      expect(img.attributes('src')).toContain('404_page_not_found')
    })

    it('offers a way back to the index page', async () => {
      const page = await mountSuspended(ErrorPage, {
        props: { error: createError({ statusCode: 404, message: 'Page not found' }) },
      })

      expect(page.find('a[href="/"]').exists()).toBe(true)
    })
  })

  describe('other statuses', () => {
    // The page used to show the "page not found" artwork for every failure,
    // including 500s. Anything that is not a 404 now reports its real status.
    it('reports the status instead of showing the 404 artwork', async () => {
      const page = await mountSuspended(ErrorPage, {
        props: { error: createError({ statusCode: 500, message: 'Something exploded' }) },
      })

      expect(page.find('img').exists()).toBe(false)
      expect(page.text()).toContain('500')
    })

    it('surfaces the error message', async () => {
      const page = await mountSuspended(ErrorPage, {
        props: { error: createError({ statusCode: 503, message: 'Upstream unavailable' }) },
      })

      expect(page.text()).toContain('Upstream unavailable')
    })
  })
})
