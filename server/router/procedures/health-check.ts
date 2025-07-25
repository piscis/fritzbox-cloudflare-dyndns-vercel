import type { H3Event } from 'h3'
import { os } from '@orpc/server'
import { z } from 'zod'
import noCacheHeaders from '~~/server/router/middlewares/noCacheHeaders'

export enum HealthCheckStatusCodes {
  OKAY = 'ok',
  ERROR = 'error',
}

const HealthCheckSchema = z.object({
  state: z.nativeEnum(HealthCheckStatusCodes),
  timestamp: z.number().int().min(0).max(Number.MAX_SAFE_INTEGER),
})

export const healthCheck = os
  .$context<{ nitroContext: H3Event }>()
  .use(noCacheHeaders)
  .route({
    method: 'GET',
    path: '/health-check',
    tags: ['Metrics'],
    successStatus: 200,
    summary: 'Health Check',
    description: 'Check if the backend is healthy',
    outputStructure: 'detailed',
  })
  .output(
    z.object({
      status: z.literal(200).describe('If the backend is healthy'),
      body: HealthCheckSchema,
    }),
  )
  .errors({
    INTERNAL_SERVER_ERROR: {
      description: 'Health check failed.',
      status: 503,
      message: 'Service Unavailable',
    },
  })
  .handler(async () => {
    return {
      status: 200,
      body: {
        state: HealthCheckStatusCodes.OKAY,
        timestamp: Date.now(),
      },
    }
  })
