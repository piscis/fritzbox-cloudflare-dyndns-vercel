import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import ErrorPage from '~/error.vue'

describe('error page', () => {
  it('renders the 404 artwork with alt text', async () => {
    const page = await mountSuspended(ErrorPage)
    const img = page.find('img')

    expect(img.exists()).toBe(true)
    expect(img.attributes('alt')).toBe('Page not found')
    expect(img.attributes('src')).toContain('404_page_not_found')
  })

  it('offers a way back to the index page', async () => {
    const page = await mountSuspended(ErrorPage)

    expect(page.find('a[href="/"]').exists()).toBe(true)
  })
})
