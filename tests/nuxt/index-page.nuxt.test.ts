import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import IndexPage from '~/pages/index.vue'

describe('index page', () => {
  it('renders the dial-up audio player', async () => {
    const page = await mountSuspended(IndexPage)
    const audio = page.find('audio')

    expect(audio.exists()).toBe(true)
    expect(audio.attributes()).toHaveProperty('controls')
    expect(page.find('audio source').attributes('src')).toBe('/sounds/modem-dial-up.mp3')
    expect(page.find('audio source').attributes('type')).toBe('audio/mpeg')
  })

  it('links to the project on GitHub in a new tab', async () => {
    const page = await mountSuspended(IndexPage)
    const link = page.find('a[href="https://github.com/piscis/fritzbox-cloudflare-dyndns-vercel/"]')

    expect(link.exists()).toBe(true)
    expect(link.attributes('target')).toBe('_blank')
    expect(page.text()).toContain('Learn more about this service')
  })

  it('renders the robot greeting', async () => {
    const page = await mountSuspended(IndexPage)

    expect(page.text()).toContain('Beep Boop')
  })
})
