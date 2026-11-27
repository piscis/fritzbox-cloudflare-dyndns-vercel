import type { Locator, Page } from 'playwright-core'
import { createPage, setup, url } from '@nuxt/test-utils/e2e'
import { afterEach, describe, expect, it } from 'vitest'

await setup({
  setupTimeout: 300_000,
  browser: true,
  nuxtConfig: {
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

const BORDER_PX_BOTH_SIDES = 2

const opened: Page[] = []

async function openSetup(options: Parameters<typeof createPage>[1]) {
  const page = await createPage('/setup', options)
  opened.push(page)
  return page
}

afterEach(async () => {
  await Promise.all(opened.splice(0).map(page => page.close()))
})

async function showScreenshot(viewport: Viewport, shot: Shot, { hasTouch = false } = {}) {
  const page = await openSetup({ viewport, hasTouch })
  const step = page.locator(`section[aria-labelledby="${shot.step}"]`)
  await step.getByText('show screenshot ▸').click()
  const button = step.getByRole('button', { name: 'Enlarge screenshot' })
    .filter({
      has: page.locator(`img[src="${shot.src}"]`),
    })
  return { page, button }
}

async function openedDialog(page: Page) {
  const dialog = page.getByRole('dialog')
  await dialog.waitFor({ state: 'visible' })
  await dialog.evaluate(el => Promise.all([
    ...el.querySelectorAll('img'),
  ].map(img => img.decode())))
  await dialog.evaluate(el => Promise.all(el.getAnimations({ subtree: true }).map(a => a.finished)))
  return dialog
}

async function enlarge(viewport: Viewport, shot: Shot, { hasTouch = false } = {}) {
  const { page, button } = await showScreenshot(viewport, shot, { hasTouch })
  await button.click()
  return { page, dialog: await openedDialog(page) }
}

function darkOverlayPoint(viewport: Viewport): [number, number] {
  return [12, viewport.height - 12]
}

function screenshotIn(dialog: Locator, shot: Shot) {
  return dialog.locator(`img[src="${shot.src}"]`)
}

async function expectCloseTopRight(close: Locator, viewport: Viewport) {
  const box = (await close.boundingBox())!
  expect(box.width).toBeGreaterThanOrEqual(44)
  expect(box.height).toBeGreaterThanOrEqual(44)
  expect(box.y).toBeGreaterThanOrEqual(0)
  expect(box.y).toBeLessThanOrEqual(24)
  expect(box.x + box.width).toBeLessThanOrEqual(viewport.width)
  expect(box.x + box.width).toBeGreaterThanOrEqual(viewport.width - 24)
  return box
}

function focusedScreenshot() {
  return document.activeElement?.querySelector('img')?.getAttribute('src')
}

describe.each(VIEWPORTS)('/setup at $name width', (viewport) => {
  it('shows the Cloudflare token screenshot once step 01\'s toggle opens', async () => {
    const page = await openSetup({ viewport })

    const step = page.locator('section[aria-labelledby="step-token"]')
    await step.getByText('show screenshot ▸').click()

    await step.locator('img[src="/setup/cloudflare-token.png"]').waitFor({ state: 'visible' })
  })

  it.each(SHOTS)('enlarges $src to fit the screen, never past its native size', async (shot) => {
    const { dialog } = await enlarge(viewport, shot)

    const image = screenshotIn(dialog, shot)
    expect(await image.isVisible()).toBe(true)
    const box = (await image.boundingBox())!
    const natural = await image.evaluate((img: HTMLImageElement) => ({ width: img.naturalWidth, height: img.naturalHeight }))

    expect(natural.width).toBeGreaterThan(0)
    expect(box.x).toBeGreaterThanOrEqual(0)
    expect(box.y).toBeGreaterThanOrEqual(0)
    expect(box.x + box.width).toBeLessThanOrEqual(viewport.width)
    expect(box.y + box.height).toBeLessThanOrEqual(viewport.height)
    expect(box.width).toBeLessThanOrEqual(natural.width + BORDER_PX_BOTH_SIDES)
    expect(box.height).toBeLessThanOrEqual(natural.height + BORDER_PX_BOTH_SIDES)
  })

  it.each(SHOTS)('puts a thumb-sized close button in the viewport\'s top-right corner over $src', async (shot) => {
    const { page, dialog } = await enlarge(viewport, shot)

    const close = dialog.getByRole('button', { name: 'Close' })
    expect(await close.isVisible()).toBe(true)
    await expectCloseTopRight(close, viewport)

    await close.click()
    await dialog.waitFor({ state: 'detached' })
    expect(await page.evaluate(focusedScreenshot)).toBe(shot.src)
  })

  it.each(['Enter', 'Space'])('enlarges a focused screenshot on %s', async (key) => {
    const shot = SHOTS[2]!
    const { page, button } = await showScreenshot(viewport, shot)

    await button.focus()
    await page.keyboard.press(key)

    expect(await screenshotIn(await openedDialog(page), shot).isVisible()).toBe(true)
  })

  it('keeps Tab inside the open modal', async () => {
    const { page, dialog } = await enlarge(viewport, SHOTS[2]!)
    const focusInDialog = () => dialog.evaluate(el => el.contains(document.activeElement))

    for (const key of ['Tab', 'Tab', 'Shift+Tab', 'Shift+Tab']) {
      await page.keyboard.press(key)
      expect(await focusInDialog(), key).toBe(true)
    }
  })

  it('keeps the page behind from scrolling while the modal is open', async () => {
    const { page } = await enlarge(viewport, SHOTS[2]!)
    const scrollY = await page.evaluate(() => window.scrollY)

    await page.mouse.move(...darkOverlayPoint(viewport))
    await page.mouse.wheel(0, 600)
    await page.waitForTimeout(300)

    expect(await page.evaluate(() => window.scrollY)).toBe(scrollY)
  })

  it('closes on Esc and hands focus back to the screenshot', async () => {
    const shot = SHOTS[2]!
    const { page, dialog } = await enlarge(viewport, shot)

    await page.keyboard.press('Escape')

    await dialog.waitFor({ state: 'detached' })
    expect(await page.evaluate(focusedScreenshot)).toBe(shot.src)
  })

  it('closes on a click beside the screenshot and hands focus back to it', async () => {
    const shot = SHOTS[2]!
    const { page, dialog } = await enlarge(viewport, shot)

    await page.mouse.click(...darkOverlayPoint(viewport))

    await dialog.waitFor({ state: 'detached' })
    expect(await page.evaluate(focusedScreenshot)).toBe(shot.src)
  })
})

function drawnSize(image: Locator) {
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

function scrollArea(image: Locator) {
  return image.evaluate((img: HTMLImageElement) => {
    const area = img.parentElement!
    return {
      left: area.scrollLeft,
      top: area.scrollTop,
      scrollWidth: area.scrollWidth,
      clientWidth: area.clientWidth,
    }
  })
}

describe('/setup at phone width, AAAA-record screenshot', () => {
  const viewport = VIEWPORTS[0]!
  const shot = SHOTS[2]!

  async function enlargeNative() {
    const { page, dialog } = await enlarge(viewport, shot, { hasTouch: true })
    const image = screenshotIn(dialog, shot)
    await image.tap()
    return { page, dialog, image }
  }

  it('switches between fitted and native size on tap', async () => {
    const { dialog } = await enlarge(viewport, shot, { hasTouch: true })
    const image = screenshotIn(dialog, shot)

    const fitted = await drawnSize(image)
    expect(fitted.cursor).toBe('zoom-in')
    expect(fitted.width).toBeLessThan(fitted.naturalWidth)
    expect(fitted.x).toBeGreaterThanOrEqual(0)
    expect(fitted.x + fitted.width).toBeLessThanOrEqual(viewport.width)
    expect(fitted.y + fitted.height).toBeLessThanOrEqual(viewport.height)

    await image.tap()
    const native = await drawnSize(image)
    expect(native.width).toBe(native.naturalWidth)
    expect(native.cursor).toBe('zoom-out')
    const area = await scrollArea(image)
    expect(area.scrollWidth).toBeGreaterThan(area.clientWidth)
    expect([area.left, area.top]).toEqual([0, 0])

    await image.tap()
    expect(await drawnSize(image)).toEqual(fitted)
  })

  it('pans the native view on a swipe or wheel and stays open', async () => {
    const { page, dialog, image } = await enlargeNative()
    const box = (await image.boundingBox())!
    const inside = { x: viewport.width / 2, y: Math.min(box.y + box.height, viewport.height) / 2 }

    const cdp = await page.context().newCDPSession(page)
    const finger = (step: number) => [
      { id: 1, x: inside.x - 20 * step, y: inside.y - 10 * step },
    ]
    await cdp.send('Input.dispatchTouchEvent', {
      type: 'touchStart',
      touchPoints: finger(0),
    })
    for (let step = 1; step <= 10; step++) {
      await cdp.send('Input.dispatchTouchEvent', {
        type: 'touchMove',
        touchPoints: finger(step),
      })
    }
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
    await expect.poll(async () => (await scrollArea(image)).left).toBeGreaterThan(0)
    expect(await dialog.isVisible()).toBe(true)

    await expect.poll(async () => {
      const left = (await scrollArea(image)).left
      await page.waitForTimeout(100)
      return (await scrollArea(image)).left === left
    }).toBe(true)
    await image.evaluate((img: HTMLImageElement) => img.parentElement!.scrollTo(0, 0))
    await page.mouse.move(inside.x, inside.y)
    await page.mouse.wheel(150, 0)
    await expect.poll(async () => (await scrollArea(image)).left).toBeGreaterThan(0)

    expect(await dialog.isVisible()).toBe(true)
    const drawn = await drawnSize(image)
    expect(drawn.width).toBe(drawn.naturalWidth)
  })

  it('keeps the close button on top and reachable in the native view', async () => {
    const { dialog, image } = await enlargeNative()
    await image.evaluate((img: HTMLImageElement) => img.parentElement!.scrollTo(300, 200))

    const close = dialog.getByRole('button', { name: 'Close' })
    await expectCloseTopRight(close, viewport)

    await close.tap()
    await dialog.waitFor({ state: 'detached' })
  })
})

describe('/setup at desktop width, Cloudflare token screenshot', () => {
  const viewport = VIEWPORTS[1]!
  const shot = SHOTS[0]!

  it('shows it 1:1 with no zoom cursor, and a click changes nothing', async () => {
    const { dialog } = await enlarge(viewport, shot)
    const image = screenshotIn(dialog, shot)

    const before = await drawnSize(image)
    expect(before.width).toBe(before.naturalWidth + BORDER_PX_BOTH_SIDES)
    expect(before.cursor).not.toMatch(/zoom/)

    await image.click()

    expect(await dialog.isVisible()).toBe(true)
    expect(await drawnSize(image)).toEqual(before)
  })
})

describe('/setup at desktop width', () => {
  it.each(SHOTS)('keeps the close button clear of $src', async (shot) => {
    const { dialog } = await enlarge(VIEWPORTS[1]!, shot)

    const close = await expectCloseTopRight(dialog.getByRole('button', { name: 'Close' }), VIEWPORTS[1]!)
    const image = (await screenshotIn(dialog, shot).boundingBox())!

    const apart = close.x >= image.x + image.width || close.y + close.height <= image.y
    expect(apart).toBe(true)
  })
})

describe('/setup with JavaScript', () => {
  it('adds the enlarge hint and zoom cursor after hydrating, without a mismatch', async () => {
    const page = await createPage(undefined, { viewport: VIEWPORTS[1]! })
    opened.push(page)
    const errors: string[] = []
    page.on('console', (message) => {
      if (message.type() === 'error' || message.type() === 'warning')
        errors.push(message.text())
    })
    await page.goto(url('/setup'), { waitUntil: 'hydration' })

    const step = page.locator('section[aria-labelledby="step-records"]')
    await step.getByText('show screenshot ▸').click()
    await step.getByText('enlarge ▸').first().waitFor({ state: 'visible' })

    expect(await step.getByText('enlarge ▸').count()).toBe(2)
    expect(await step.locator('details img').first().evaluate(img => getComputedStyle(img).cursor)).toBe('zoom-in')
    expect(errors.filter(text => /hydrat/i.test(text))).toEqual([])
  })
})

describe('/setup without JavaScript', () => {
  it.each(VIEWPORTS)('shows the screenshots at $name width but promises no enlarging', async (viewport) => {
    const page = await openSetup({ viewport, javaScriptEnabled: false })

    const step = page.locator('section[aria-labelledby="step-records"]')
    await step.getByText('show screenshot ▸').click()
    const images = step.locator('details img')
    await images.last().waitFor({ state: 'visible' })

    expect(await images.evaluateAll((imgs: HTMLImageElement[]) => imgs.map(img => [img.loading, img.alt !== '']))).toEqual([
      ['lazy', true],
      ['lazy', true],
    ])
    expect(await step.getByText('enlarge ▸').count()).toBe(0)
    expect(await images.first().evaluate(img => getComputedStyle(img).cursor)).not.toMatch(/zoom/)
  })
})
