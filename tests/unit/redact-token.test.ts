import { describe, expect, it } from 'vitest'
import redactToken from '~~/server/utils/redactToken'

const TOKEN = 'cf_live_9RtYq2WvKb7NxZs4'

describe('redactToken', () => {
  describe('pattern matching, without knowing the value', () => {
    it('redacts the token out of an update URL', () => {
      const url = `https://fritzdns.example.dev/api/fritz-dyndns?token=${TOKEN}&zone=example.dev`

      const result = redactToken(url) as string

      expect(result).not.toContain(TOKEN)
      expect(result).toBe('https://fritzdns.example.dev/api/fritz-dyndns?token=***&zone=example.dev')
    })

    it('redacts the token when it is not the first query parameter', () => {
      const result = redactToken(`/api/fritz-dyndns?zone=example.dev&token=${TOKEN}`) as string

      expect(result).not.toContain(TOKEN)
      expect(result).toBe('/api/fritz-dyndns?zone=example.dev&token=***')
    })

    it('redacts an Authorization bearer credential', () => {
      const result = redactToken(`Authorization: Bearer ${TOKEN}`) as string

      expect(result).not.toContain(TOKEN)
      expect(result).toBe('Authorization: Bearer ***')
    })

    it('redacts a token field in a serialised body', () => {
      const result = redactToken(`{"zone":"example.dev","token":"${TOKEN}"}`) as string

      expect(result).not.toContain(TOKEN)
      expect(result).toContain('"token":"***"')
      expect(result).toContain('"zone":"example.dev"')
    })
  })

  describe('exact-value matching, when the caller knows the token', () => {
    it('redacts the value in a shape no pattern anticipates', () => {
      const result = redactToken(`upstream rejected credential ${TOKEN} for zone`, TOKEN) as string

      expect(result).not.toContain(TOKEN)
      expect(result).toBe('upstream rejected credential *** for zone')
    })

    it('ignores a short secret rather than shredding unrelated text', () => {
      const result = redactToken('a account with an abundance of a', 'a') as string

      expect(result).toBe('a account with an abundance of a')
    })
  })

  describe('errors', () => {
    it('redacts the message and preserves the error name', () => {
      const error = new Error(`401 from https://api.cloudflare.com?token=${TOKEN}`)
      error.name = 'APIError'

      const result = redactToken(error) as Error

      expect(result).toBeInstanceOf(Error)
      expect(result.name).toBe('APIError')
      expect(result.message).not.toContain(TOKEN)
      expect(result.message).toContain('token=***')
    })

    it('redacts the stack', () => {
      const error = new Error('boom')
      error.stack = `Error: boom\n    at fetch (/app.js) Bearer ${TOKEN}`

      const result = redactToken(error) as Error

      expect(result.stack).not.toContain(TOKEN)
      expect(result.stack).toContain('Bearer ***')
    })

    it('leaves the original untouched so it can still be rethrown', () => {
      const message = `failed ?token=${TOKEN}`
      const error = new Error(message)

      redactToken(error)

      expect(error.message).toBe(message)
      expect(error.message).toContain(TOKEN)
    })

    it('walks into a nested cause', () => {
      const error = new Error('request failed', {
        cause: new Error(`Bearer ${TOKEN} rejected`),
      })

      const result = redactToken(error) as Error & { cause: Error }

      expect(result.cause.message).not.toContain(TOKEN)
      expect(result.cause.message).toBe('Bearer *** rejected')
    })
  })

  describe('structures', () => {
    it('walks nested objects and arrays', () => {
      const result = redactToken({
        request: {
          url: `/api/fritz-dyndns?token=${TOKEN}`,
          headers: [`Authorization: Bearer ${TOKEN}`],
        },
        status: 401,
      })

      expect(JSON.stringify(result)).not.toContain(TOKEN)
      expect(result).toStrictEqual({
        request: {
          url: '/api/fritz-dyndns?token=***',
          headers: ['Authorization: Bearer ***'],
        },
        status: 401,
      })
    })

    it('passes non-string primitives through untouched', () => {
      expect(redactToken(401)).toBe(401)
      expect(redactToken(true)).toBe(true)
      expect(redactToken(null)).toBeNull()
      expect(redactToken(undefined)).toBeUndefined()
    })

    it('stops descending past the depth limit instead of recursing forever', () => {
      const cyclic: Record<string, unknown> = {}
      cyclic.self = cyclic

      expect(() => redactToken(cyclic)).not.toThrow()
    })
  })
})
