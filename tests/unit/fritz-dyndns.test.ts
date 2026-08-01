import type { ORPCError } from '@orpc/server'
import { call } from '@orpc/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fritzDynDnsRoute } from '~~/server/router/procedures/fritz-dyndns'
import {
  A_RECORD,
  AAAA_RECORD,
  asyncIterable,
  throwingAsyncIterable,
  ZONE,
} from '../helpers/cloudflare-mock'
import { createNitroContextStub } from '../helpers/h3'

const cf = vi.hoisted(() => ({
  ctor: vi.fn(),
  zonesList: vi.fn(),
  recordsList: vi.fn(),
  recordsUpdate: vi.fn(),
}))

vi.mock('cloudflare', () => ({
  default: class Cloudflare {
    zones = { list: cf.zonesList }
    dns = { records: { list: cf.recordsList, update: cf.recordsUpdate } }
    constructor(opts: { apiToken: string }) {
      cf.ctor(opts)
    }
  },
}))

const log = vi.hoisted(() => ({ error: vi.fn() }))
vi.mock('~~/server/utils/useLogger', () => ({ default: () => ({ logger: log }) }))

const BASE_QUERY = {
  token: 'cf-token',
  zone: 'example.com',
  record: 'fritz.example.com',
}

function invoke(query: Record<string, unknown>) {
  const { context, setHeader } = createNitroContextStub()
  return {
    setHeader,
    result: call(fritzDynDnsRoute, { query } as never, { context } as never),
  }
}

/** Both list calls default to a single-zone, both-records world. */
function arrangeHappyPath(records = [A_RECORD, AAAA_RECORD]) {
  cf.zonesList.mockReturnValue(asyncIterable([ZONE]))
  cf.recordsList.mockReturnValue(asyncIterable(records))
  cf.recordsUpdate.mockResolvedValue({})
}

async function expectOrpcError(promise: Promise<unknown>) {
  return await promise.then(
    () => {
      throw new Error('expected the procedure to reject, but it resolved')
    },
    (e: ORPCError<string, unknown>) => e,
  )
}

beforeEach(() => {
  log.error.mockClear()
})

describe('fritz-dyndns · happy paths', () => {
  it('updates only the A record when just ipv4 is supplied', async () => {
    arrangeHappyPath()

    const { result } = invoke({ ...BASE_QUERY, ipv4: '9.9.9.9' })

    await expect(result).resolves.toStrictEqual({
      status: 200,
      body: { state: 'success', message: 'Update successful.' },
    })

    expect(cf.ctor).toHaveBeenCalledExactlyOnceWith({ apiToken: 'cf-token' })
    expect(cf.recordsList).toHaveBeenCalledExactlyOnceWith({ zone_id: 'zone-1' })
    expect(cf.recordsUpdate).toHaveBeenCalledExactlyOnceWith('a-1', {
      zone_id: 'zone-1',
      name: 'fritz.example.com',
      type: 'A',
      proxied: false,
      ttl: 60,
      content: '9.9.9.9',
    })
  })

  it('updates only the AAAA record when just ipv6 is supplied', async () => {
    arrangeHappyPath()

    await invoke({ ...BASE_QUERY, ipv6: '2001:db8::99' }).result

    expect(cf.recordsUpdate).toHaveBeenCalledExactlyOnceWith('aaaa-1', expect.objectContaining({
      type: 'AAAA',
      content: '2001:db8::99',
    }))
  })

  it('updates both records when both addresses are supplied', async () => {
    arrangeHappyPath()

    await invoke({ ...BASE_QUERY, ipv4: '9.9.9.9', ipv6: '2001:db8::99' }).result

    expect(cf.recordsUpdate).toHaveBeenCalledTimes(2)
    expect(cf.recordsUpdate.mock.calls[0]?.[0]).toBe('a-1')
    expect(cf.recordsUpdate.mock.calls[1]?.[0]).toBe('aaaa-1')
  })

  it('does not call update when the content already matches', async () => {
    arrangeHappyPath()

    await expect(invoke({ ...BASE_QUERY, ipv4: A_RECORD.content }).result).resolves.toMatchObject({
      status: 200,
    })

    expect(cf.recordsUpdate).not.toHaveBeenCalled()
  })

  it('updates only the record that actually changed', async () => {
    arrangeHappyPath()

    await invoke({
      ...BASE_QUERY,
      ipv4: A_RECORD.content, // unchanged
      ipv6: '2001:db8::99', // changed
    }).result

    expect(cf.recordsUpdate).toHaveBeenCalledExactlyOnceWith('aaaa-1', expect.anything())
  })

  it('coerces the address to a string before sending it', async () => {
    arrangeHappyPath()

    await invoke({ ...BASE_QUERY, ipv4: '9.9.9.9' }).result

    expect(typeof cf.recordsUpdate.mock.calls[0]?.[1]?.content).toBe('string')
  })

  it('follows pagination when listing DNS records', async () => {
    // A record that would sit on a later page must still be found.
    cf.zonesList.mockReturnValue(asyncIterable([ZONE]))
    cf.recordsList.mockReturnValue(asyncIterable([
      { ...A_RECORD, id: 'other', name: 'other.example.com' },
      A_RECORD,
    ]))
    cf.recordsUpdate.mockResolvedValue({})

    await invoke({ ...BASE_QUERY, ipv4: '9.9.9.9' }).result

    expect(cf.recordsUpdate).toHaveBeenCalledExactlyOnceWith('a-1', expect.anything())
  })

  it('sets the no-store cache headers before doing any work', async () => {
    arrangeHappyPath()

    const { result, setHeader } = invoke({ ...BASE_QUERY, ipv4: '9.9.9.9' })
    await result

    expect(setHeader.mock.calls).toStrictEqual([
      ['Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0'],
      ['Pragma', 'no-cache'],
      ['Expires', '0'],
    ])
  })
})

describe('fritz-dyndns · not found', () => {
  it('returns 404 when the account has no zones at all', async () => {
    cf.zonesList.mockReturnValue(asyncIterable([]))

    const error = await expectOrpcError(invoke({ ...BASE_QUERY, ipv4: '9.9.9.9' }).result)

    expect(error.code).toBe('NOT_FOUND')
    expect(error.status).toBe(404)
    expect(error.message).toBe('Zone "example.com" not found.')
    expect(cf.recordsList).not.toHaveBeenCalled()
  })

  it('returns 404 when no zone matches the requested name', async () => {
    cf.zonesList.mockReturnValue(asyncIterable([{ id: 'z9', name: 'other.com' }]))

    const error = await expectOrpcError(invoke({ ...BASE_QUERY, ipv4: '9.9.9.9' }).result)

    expect(error.code).toBe('NOT_FOUND')
    expect(error.message).toBe('Zone "example.com" not found.')
    // Regression guard: zoneId used to fall back to '' and issue a doomed list call.
    expect(cf.recordsList).not.toHaveBeenCalled()
  })

  it('returns 404 when the A record does not exist', async () => {
    // Regression guard for the dead `&& !zone` term, which made this return 200.
    arrangeHappyPath([AAAA_RECORD])

    const error = await expectOrpcError(invoke({ ...BASE_QUERY, ipv4: '9.9.9.9' }).result)

    expect(error.code).toBe('NOT_FOUND')
    expect(error.status).toBe(404)
    expect(error.message).toBe('A record for "fritz.example.com" does not exist.')
    expect(cf.recordsUpdate).not.toHaveBeenCalled()
  })

  it('returns 404 when the AAAA record does not exist', async () => {
    arrangeHappyPath([A_RECORD])

    const error = await expectOrpcError(invoke({ ...BASE_QUERY, ipv6: '2001:db8::99' }).result)

    expect(error.code).toBe('NOT_FOUND')
    expect(error.message).toBe('AAAA record for "fritz.example.com" does not exist.')
    expect(cf.recordsUpdate).not.toHaveBeenCalled()
  })
})

describe('fritz-dyndns · upstream failures', () => {
  it.each([
    ['zone listing', () => cf.zonesList.mockReturnValue(throwingAsyncIterable(new Error('cf down')))],
    ['record listing', () => {
      cf.zonesList.mockReturnValue(asyncIterable([ZONE]))
      cf.recordsList.mockReturnValue(throwingAsyncIterable(new Error('403')))
    }],
    ['record update', () => {
      arrangeHappyPath()
      cf.recordsUpdate.mockRejectedValue(new Error('rate limited'))
    }],
  ])('maps a failure during %s to 503', async (_label, arrange) => {
    arrange()

    const error = await expectOrpcError(invoke({ ...BASE_QUERY, ipv4: '9.9.9.9' }).result)

    expect(error.code).toBe('INTERNAL_SERVER_ERROR')
    // Regression guard: `new ORPCError(...)` ignored the .errors() declaration
    // and produced 500 here.
    expect(error.status).toBe(503)
    expect(error.message).toBe('Service Unavailable')
    expect(log.error).toHaveBeenCalledOnce()
  })

  it('re-throws an ORPCError unchanged instead of wrapping it as 503', async () => {
    cf.zonesList.mockReturnValue(asyncIterable([]))

    const error = await expectOrpcError(invoke({ ...BASE_QUERY, ipv4: '9.9.9.9' }).result)

    expect(error.code).toBe('NOT_FOUND')
    expect(error.status).toBe(404)
  })

  it('never leaks the API token into the error message', async () => {
    cf.zonesList.mockReturnValue(throwingAsyncIterable(new Error('bad token cf-token')))

    const error = await expectOrpcError(invoke({ ...BASE_QUERY, ipv4: '9.9.9.9' }).result)

    expect(JSON.stringify(error)).not.toContain('cf-token')
  })
})
