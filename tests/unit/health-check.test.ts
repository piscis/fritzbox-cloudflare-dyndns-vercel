import { call } from '@orpc/server'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { healthCheck, HealthCheckStatusCodes } from '~~/server/router/procedures/health-check'
import { createNitroContextStub } from '../helpers/h3'

function invoke() {
  const { context, setHeader } = createNitroContextStub()
  return { setHeader, result: call(healthCheck, undefined as never, { context } as never) }
}

afterEach(() => {
  vi.useRealTimers()
})

describe('health-check', () => {
  it('reports ok with an integer timestamp', async () => {
    const body = (await invoke().result).body

    expect(body.state).toBe(HealthCheckStatusCodes.OKAY)
    expect(Number.isInteger(body.timestamp)).toBe(true)
    expect(body.timestamp).toBeGreaterThan(0)
  })

  it('returns status 200', async () => {
    await expect(invoke().result).resolves.toMatchObject({ status: 200 })
  })

  it('stamps the current time', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'))

    const body = (await invoke().result).body

    expect(body.timestamp).toBe(1_767_225_600_000)
  })

  it('exposes both status codes', () => {
    expect(HealthCheckStatusCodes.OKAY).toBe('ok')
    expect(HealthCheckStatusCodes.ERROR).toBe('error')
  })

  it('passes its own output schema', async () => {
    // Guards z.enum(HealthCheckStatusCodes) against a Zod major bump: a schema
    // mismatch surfaces as an output-validation INTERNAL_SERVER_ERROR.
    await expect(invoke().result).resolves.toBeDefined()
  })

  it('sets the no-store cache headers', async () => {
    const { result, setHeader } = invoke()
    await result

    expect(setHeader.mock.calls).toStrictEqual([
      ['Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0'],
      ['Pragma', 'no-cache'],
      ['Expires', '0'],
    ])
  })
})
