/**
 * Test doubles for the Cloudflare SDK.
 *
 * Both `zones.list()` and `dns.records.list()` are consumed with `for await`,
 * so the doubles have to be async-iterable rather than plain promises.
 */

export interface CfZone {
  id: string
  name: string
}

export interface CfRecord {
  id: string
  name: string
  type: 'A' | 'AAAA'
  content: string
  proxied: boolean
  ttl: number
}

export function asyncIterable<T>(items: T[]) {
  return {
    async* [Symbol.asyncIterator]() {
      for (const item of items) {
        yield item
      }
    },
  }
}

export function throwingAsyncIterable(error: unknown) {
  return {
    async* [Symbol.asyncIterator]() {
      throw error
    },
  }
}

export const ZONE: CfZone = { id: 'zone-1', name: 'example.com' }

export const A_RECORD: CfRecord = {
  id: 'a-1',
  name: 'fritz.example.com',
  type: 'A',
  content: '1.1.1.1',
  proxied: false,
  ttl: 60,
}

export const AAAA_RECORD: CfRecord = {
  id: 'aaaa-1',
  name: 'fritz.example.com',
  type: 'AAAA',
  content: '2001:db8::1',
  proxied: false,
  ttl: 60,
}
