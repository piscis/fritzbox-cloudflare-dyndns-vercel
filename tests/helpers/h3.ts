import type { H3Event } from 'h3'
import { createEvent } from 'h3'
import { IncomingMessage, ServerResponse } from 'node-mock-http'
import { vi } from 'vitest'

export function createH3Event(url = '/', method = 'GET', host = 'localhost:3000') {
  const req = new IncomingMessage()
  req.url = url
  req.method = method
  req.headers.host = host

  const res = new ServerResponse(req)
  const event = createEvent(req as never, res as never)

  return { event: event as H3Event, req, res }
}

/**
 * The only part of the Nitro context an oRPC procedure touches is
 * `nitroContext.node.res.setHeader`, via the noCacheHeaders middleware.
 */
export function createNitroContextStub() {
  const setHeader = vi.fn()

  return {
    setHeader,
    context: {
      nitroContext: { node: { res: { setHeader } } } as unknown as H3Event,
    },
  }
}
