import type { Locator } from 'playwright-core'
import { createPage, setup } from '@nuxt/test-utils/e2e'
import { describe, expect, it } from 'vitest'

// One setup() for the whole file: each call builds and boots its own server.
await setup({
  setupTimeout: 300_000,
  browser: true,
  nuxtConfig: {
    // Same build options as the e2e project, for the same reasons: the CI
    // typecheck job covers vue-tsc, and setup() can only boot a node server.
    typescript: { typeCheck: false },
    nitro: { preset: 'node-server' },
  },
})

const VIEWPORTS = [
  { name: 'phone', width: 390, height: 844 },
  { name: 'desktop', width: 1440, height: 900 },
]

const SHOTS = [
  { step: 'step-token', src: '/setup/cloudflare-token.png' },
  { step: 'step-records', src: '/setup/a-record.png' },
  { step: 'step-records', src: '/setup/aaaa-record.png' },
  { step: 'step-fritzbox', src: '/setup/fritzbox-dyndns.png' },
]

type Viewport = (typeof VIEWPORTS)[number]
type Shot = (typeof SHOTS)[number]

/** Opens /setup, opens the screenshot's toggle and clicks the screenshot. */
async function enlarge(viewport: Viewport, shot: Shot, { hasTouch = false } = {}) {
  const page = await createPage('/setup', { viewport, hasTouch })
  const step = page.locator(`section[aria-labelledby="${shot.step}"]`)
  await step.getByText('show screenshot ▸').click()

  await step.getByRole('button', { name: 'Enlarge screenshot' })
    .filter({ has: page.locator(`img[src="${shot.src}"]`) })
    .click()

  const dialog = page.getByRole('dialog')
  await dialog.waitFor({ state: 'visible' })
  // Let the open animation finish, so boxes are measured at their final size.
  // (Only the dialog's own: the page behind it runs endless CRT animations.)
  await dialog.evaluate(el => Promise.all(el.getAnimations({ subtree: true }).map(a => a.finished)))
  return { page, dialog }
}

/** The `src` of the screenshot inside the focused element, if any. */
function focusedScreenshot() {
  return document.activeElement?.querySelector('img')?.getAttribute('src')
}

describe.each(VIEWPORTS)('/setup at $name width', (viewport) => {
  it('shows the Cloudflare token screenshot once step 01\'s toggle opens', async () => {
    const page = await createPage('/setup', { viewport })

    const step = page.locator('section[aria-labelledby="step-token"]')
    await step.getByText('show screenshot ▸').click()

    const shot = step.locator('img[src="/setup/cloudflare-token.png"]')
    await shot.waitFor({ state: 'visible' })
    expect(await shot.isVisible()).toBe(true)

    await page.close()
  })

  it.each(SHOTS)('enlarges $src to fit the screen, never past its native size', async (shot) => {
    const { page, dialog } = await enlarge(viewport, shot)

    const image = dialog.locator(`img[src="${shot.src}"]`)
    expect(await image.isVisible()).toBe(true)
    const box = (await image.boundingBox())!
    const natural = await image.evaluate((img: HTMLImageElement) => ({ width: img.naturalWidth, height: img.naturalHeight }))

    expect(natural.width).toBeGreaterThan(0)
    expect(box.x).toBeGreaterThanOrEqual(0)
    expect(box.y).toBeGreaterThanOrEqual(0)
    expect(box.x + box.width).toBeLessThanOrEqual(viewport.width)
    expect(box.y + box.height).toBeLessThanOrEqual(viewport.height)
    // The box includes the 1 px border on each side.
    expect(box.width).toBeLessThanOrEqual(natural.width + 2)
    expect(box.height).toBeLessThanOrEqual(natural.height + 2)

    await page.close()
  })

  it.each(SHOTS)('puts a thumb-sized close button top-right over $src', async (shot) => {
    const { page, dialog } = await enlarge(viewport, shot)

    const close = dialog.getByRole('button', { name: 'Close' })
    expect(await close.isVisible()).toBe(true)
    const box = (await close.boundingBox())!

    expect(box.width).toBeGreaterThanOrEqual(44)
    expect(box.height).toBeGreaterThanOrEqual(44)
    expect(box.y).toBeGreaterThanOrEqual(0)
    expect(box.x + box.width).toBeLessThanOrEqual(viewport.width)
    expect(box.x + box.width / 2).toBeGreaterThan(viewport.width * 0.75)
    expect(box.y + box.height / 2).toBeLessThan(viewport.height * 0.25)

    await close.click()
    await dialog.waitFor({ state: 'detached' })
    expect(await page.evaluate(focusedScreenshot)).toBe(shot.src)

    await page.close()
  })

  it('closes on Esc and hands focus back to the screenshot', async () => {
    const shot = SHOTS[2]!
    const { page, dialog } = await enlarge(viewport, shot)

    await page.keyboard.press('Escape')

    await dialog.waitFor({ state: 'detached' })
    expect(await page.evaluate(focusedScreenshot)).toBe(shot.src)
    await page.close()
  })

  it('closes on a click beside the screenshot and hands focus back to it', async () => {
    const shot = SHOTS[2]!
    const { page, dialog } = await enlarge(viewport, shot)

    // Near the bottom-left corner: dark overlay at every width, clear of the screenshot.
    await page.mouse.click(12, viewport.height - 12)

    await dialog.waitFor({ state: 'detached' })
    expect(await page.evaluate(focusedScreenshot)).toBe(shot.src)
    await page.close()
  })
})

/** The enlarged screenshot's drawn size and native size, and the cursor it shows. */
function measure(image: Locator) {
  return image.evaluate((img: HTMLImageElement) => {
    const box = img.getBoundingClientRect()
    return {
      x: box.x,
      y: box.y,
      width: box.width,
      height: box.height,
      naturalWidth: img.naturalWidth,
      cursor: getComputedStyle(img).cursor,
    }
  })
}

/** The scroll position and extent of the area around the enlarged screenshot. */
function scrollArea(image: Locator) {
  return image.evaluate((img: HTMLImageElement) => {
    const area = img.parentElement!
    return { left: area.scrollLeft, top: area.scrollTop, scrollWidth: area.scrollWidth, clientWidth: area.clientWidth }
  })
}

describe('/setup at phone width, AAAA-record screenshot', () => {
  const viewport = VIEWPORTS[0]!
  const shot = SHOTS[2]!

  /** Enlarges the screenshot on a touch screen and taps it once, to native size. */
  async function enlargeNative() {
    const { page, dialog } = await enlarge(viewport, shot, { hasTouch: true })
    const image = dialog.locator(`img[src="${shot.src}"]`)
    await image.tap()
    return { page, dialog, image }
  }

  it('switches between fitted and native size on tap', async () => {
    const { page, dialog } = await enlarge(viewport, shot, { hasTouch: true })
    const image = dialog.locator(`img[src="${shot.src}"]`)

    const fitted = await measure(image)
    expect(fitted.cursor).toBe('zoom-in')
    expect(fitted.width).toBeLessThan(fitted.naturalWidth)
    expect(fitted.x).toBeGreaterThanOrEqual(0)
    expect(fitted.x + fitted.width).toBeLessThanOrEqual(viewport.width)
    expect(fitted.y + fitted.height).toBeLessThanOrEqual(viewport.height)

    await image.tap()
    const native = await measure(image)
    expect(native.width).toBe(native.naturalWidth)
    expect(native.cursor).toBe('zoom-out')
    const area = await scrollArea(image)
    expect(area.scrollWidth).toBeGreaterThan(area.clientWidth)
    expect([area.left, area.top]).toEqual([0, 0])

    await image.tap()
    expect(await measure(image)).toEqual(fitted)

    await page.close()
  })

  it('pans the native view on a swipe or wheel and stays open', async () => {
    const { page, dialog, image } = await enlargeNative()
    const box = (await image.boundingBox())!
    const inside = { x: viewport.width / 2, y: Math.min(box.y + box.height, viewport.height) / 2 }

    // A finger swipe right-to-left, upwards.
    const cdp = await page.context().newCDPSession(page)
    await cdp.send('Input.synthesizeScrollGesture', {
      ...inside,
      xDistance: -200,
      yDistance: -100,
      gestureSourceType: 'touch',
    })
    await expect.poll(async () => (await scrollArea(image)).left).toBeGreaterThan(0)

    await page.mouse.move(inside.x, inside.y)
    await page.mouse.wheel(150, 0)
    await expect.poll(async () => (await scrollArea(image)).left).toBeGreaterThan(200)

    expect(await dialog.isVisible()).toBe(true)
    expect((await measure(image)).width).toBe((await measure(image)).naturalWidth)
    await page.close()
  })

  it('keeps the close button on top and reachable in the native view', async () => {
    const { page, dialog, image } = await enlargeNative()
    await image.evaluate((img: HTMLImageElement) => img.parentElement!.scrollTo(300, 200))

    const close = dialog.getByRole('button', { name: 'Close' })
    const box = (await close.boundingBox())!
    expect(box.x + box.width).toBeLessThanOrEqual(viewport.width)
    expect(box.x + box.width / 2).toBeGreaterThan(viewport.width * 0.75)
    expect(box.y + box.height / 2).toBeLessThan(viewport.height * 0.25)

    await close.tap()
    await dialog.waitFor({ state: 'detached' })
    await page.close()
  })
})

describe('/setup at desktop width, Cloudflare token screenshot', () => {
  const viewport = VIEWPORTS[1]!
  const shot = SHOTS[0]!

  it('shows it 1:1 with no zoom cursor, and a click changes nothing', async () => {
    const { page, dialog } = await enlarge(viewport, shot)
    const image = dialog.locator(`img[src="${shot.src}"]`)

    const before = await measure(image)
    // The box includes the 1 px border on each side.
    expect(before.width).toBe(before.naturalWidth + 2)
    expect(before.cursor).not.toMatch(/zoom/)

    await image.click()

    expect(await dialog.isVisible()).toBe(true)
    expect(await measure(image)).toEqual(before)
    await page.close()
  })
})
