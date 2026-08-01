import { describe, expect, it, vi } from 'vitest'
import noCacheHeaders from '~~/server/router/middlewares/noCacheHeaders'

function invoke() {
  const setHeader = vi.fn()
  const next = vi.fn().mockResolvedValue({ output: 'ok', context: {} })

  const options = {
    context: { nitroContext: { node: { res: { setHeader } } } },
    next,
    path: [],
    procedure: {},
    errors: {},
  } as never

  return { setHeader, next, result: noCacheHeaders(options, undefined as never, (o: unknown) => o as never) }
}

describe('noCacheHeaders middleware', () => {
  it('sets all three cache-busting headers', async () => {
    const { setHeader, result } = invoke()
    await result

    expect(setHeader).toHaveBeenCalledTimes(3)
    expect(setHeader).toHaveBeenNthCalledWith(1, 'Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
    expect(setHeader).toHaveBeenNthCalledWith(2, 'Pragma', 'no-cache')
    expect(setHeader).toHaveBeenNthCalledWith(3, 'Expires', '0')
  })

  it('calls next() and passes its result through', async () => {
    const { next, result } = invoke()

    await expect(result).resolves.toStrictEqual({ output: 'ok', context: {} })
    expect(next).toHaveBeenCalledOnce()
  })

  it('sets the headers before calling next()', async () => {
    const { setHeader, next, result } = invoke()
    await result

    expect(setHeader.mock.invocationCallOrder[2]).toBeLessThan(next.mock.invocationCallOrder[0]!)
  })
})
