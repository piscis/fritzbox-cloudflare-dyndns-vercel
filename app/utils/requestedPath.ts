import type { NuxtError } from '#app'

export type RenderedError = NuxtError & { url?: string }

export function requestedPath(error: Pick<RenderedError, 'url' | 'data'> | undefined, fallback: string): string {
  const data: unknown = error?.data
  const fromData = typeof data === 'object' && data !== null && 'path' in data && typeof data.path === 'string'
    ? data.path
    : undefined

  const requested = error?.url || fromData || fallback

  return requested.split(/[?#]/)[0] || '/'
}
