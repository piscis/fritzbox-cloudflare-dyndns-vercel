import { describe, expect, it, vi } from 'vitest'
import apiHandler from '~~/server/routes/api/[...]'
import { createH3Event } from '../helpers/h3'

vi.hoisted(() => {
  Object.assign(globalThis, {
    useRuntimeConfig: () => ({
      public: { version: '9.8.7-sentinel' },
    }),
  })
})

describe('openAPI spec version', () => {
  it('reports the runtime config\'s public.version', async () => {
    const { event } = createH3Event('/api/spec.json', 'GET')
    ;(event as unknown as { web: unknown }).web = {
      request: new Request('http://localhost:3000/api/spec.json'),
    }

    const spec = await ((await apiHandler(event)) as Response).json()

    expect(spec.info.version).toBe('9.8.7-sentinel')
  })
})
