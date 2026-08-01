import { describe, expect, it } from 'vitest'
import { router } from '~~/server/router'
import useLogger from '~~/server/utils/useLogger'

describe('router', () => {
  it('exposes exactly the two API procedures', () => {
    expect(Object.keys(router)).toStrictEqual(['api'])
    expect(Object.keys(router.api).sort()).toStrictEqual(['fritzDynDnsRoute', 'healthCheck'])
  })

  it('declares the documented routes', () => {
    const dyndns = (router.api.fritzDynDnsRoute as never as { '~orpc': { route: Record<string, unknown> } })['~orpc'].route
    const health = (router.api.healthCheck as never as { '~orpc': { route: Record<string, unknown> } })['~orpc'].route

    expect(dyndns.path).toBe('/fritz-dyndns')
    expect(dyndns.method).toBe('GET')
    expect(health.path).toBe('/health-check')
    expect(health.method).toBe('GET')
  })

  it('maps its error codes to the documented statuses', () => {
    const errorMap = (router.api.fritzDynDnsRoute as never as {
      '~orpc': { errorMap: Record<string, { status: number }> }
    })['~orpc'].errorMap

    expect(errorMap.NOT_FOUND?.status).toBe(404)
    expect(errorMap.INTERNAL_SERVER_ERROR?.status).toBe(503)
  })
})

describe('useLogger', () => {
  it('returns a logger with the console methods', () => {
    const { logger } = useLogger()

    expect(typeof logger.error).toBe('function')
    expect(typeof logger.info).toBe('function')
  })

  it('creates a fresh instance per call', () => {
    expect(useLogger().logger).not.toBe(useLogger().logger)
  })
})
