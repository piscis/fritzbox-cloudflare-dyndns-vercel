import { describe, expect, it, vi } from 'vitest'
import apiHandler from '~~/server/routes/api/[...]'
import { createH3Event } from '../helpers/h3'

// The default stub in tests/setup/nitro-globals.ts mirrors package.json, so a
// test against it cannot tell "forwards the runtime config" from "reads
// package.json". A sentinel only the config holds can. The handler reads the
// config at module load, so the stub must be in place before the import.
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
