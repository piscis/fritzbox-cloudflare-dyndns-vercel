import type { ORPCError } from '@orpc/server'
import { call } from '@orpc/server'
import { describe, expect, it, vi } from 'vitest'
import { fritzDynDnsRoute } from '~~/server/router/procedures/fritz-dyndns'
import { createNitroContextStub } from '../helpers/h3'

const cf = vi.hoisted(() => ({ ctor: vi.fn() }))

vi.mock('cloudflare', () => ({
  default: class Cloudflare {
    zones = { list: vi.fn() }
    dns = { records: { list: vi.fn(), update: vi.fn() } }
    constructor(opts: { apiToken: string }) {
      cf.ctor(opts)
    }
  },
}))

vi.mock('~~/server/utils/useLogger', () => ({ default: () => ({ logger: { error: vi.fn() } }) }))

const VALID = {
  token: 'cf-token',
  zone: 'example.com',
  record: 'fritz.example.com',
}

async function expectBadRequest(query: Record<string, unknown>) {
  const { context } = createNitroContextStub()

  const error: ORPCError<string, any> = await call(
    fritzDynDnsRoute,
    { query } as never,
    { context } as never,
  ).then(
    () => {
      throw new Error('expected input validation to reject, but it resolved')
    },
    (e: ORPCError<string, any>) => e,
  )

  expect(error.code).toBe('BAD_REQUEST')
  expect(error.status).toBe(400)

  return error
}

describe('fritz-dyndns · input validation', () => {
  it.each(['token', 'zone', 'record'])('rejects a request missing %s', async (field) => {
    const query: Record<string, unknown> = { ...VALID, ipv4: '9.9.9.9' }
    delete query[field]

    const error = await expectBadRequest(query)
    const issues = (error.data as { issues?: { path?: unknown[] }[] })?.issues ?? []

    expect(issues.some(i => i.path?.includes(field))).toBe(true)
  })

  it('rejects a request with neither ipv4 nor ipv6', async () => {
    const error = await expectBadRequest({ ...VALID })
    const issues = (error.data as { issues?: { message?: string }[] })?.issues ?? []

    expect(issues.some(i => i.message === 'Missing ipv4 or ipv6 URL parameter.')).toBe(true)
  })

  it('rejects a non-string ipv4', async () => {
    await expectBadRequest({ ...VALID, ipv4: { nope: true } })
  })

  it('never constructs a Cloudflare client when validation fails', async () => {
    // This is what makes it safe to exercise the validation paths over HTTP in
    // the e2e suite: no request can reach the real Cloudflare API.
    await expectBadRequest({ ...VALID })

    expect(cf.ctor).not.toHaveBeenCalled()
  })
})
