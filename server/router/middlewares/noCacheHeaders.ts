import type { H3Event } from 'h3'
import { os } from '@orpc/server'

export default os
  .$context<{ nitroContext: H3Event }>()
  .middleware(async ({ next, context }) => {
    context.nitroContext.node.res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
    context.nitroContext.node.res.setHeader('Pragma', 'no-cache')
    context.nitroContext.node.res.setHeader('Expires', '0')
    return next()
  })
