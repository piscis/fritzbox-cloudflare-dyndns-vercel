export type HealthState = 'pending' | 'ok' | 'degraded' | 'down'

/**
 * Above this, the service answered but is not answering well. The request is
 * same-origin on a connection the page has already opened, `noCacheHeaders`
 * forces `no-store` so nothing short-circuits, and the handler itself does no
 * I/O — so this is roughly one round trip plus Worker dispatch. A healthy edge
 * is 10–60 ms and a poor mobile link 150–400 ms, which puts 800 ms above the
 * p99 of "healthy but far away" and below the point a person calls it broken.
 */
const SLOW_MS = 800

/** So the lamp cannot sit pending forever behind a captive portal. */
const TIMEOUT_MS = 5000

/**
 * The endpoint only reports `ok | error`, so the design's third lamp has to be
 * synthesised from the transport. Deliberately one sample on mount, not a poll:
 * this is a landing page, and a repeating request per open tab is not worth a
 * live dot.
 *
 * Shape is redeclared rather than imported from the procedure — importing it
 * would pull @orpc/server and zod into the client bundle.
 */
interface HealthCheckBody {
  state: 'ok' | 'error'
  timestamp: number
}

export function useHealthCheck() {
  const state = ref<HealthState>('pending')

  async function check(): Promise<void> {
    const startedAt = performance.now()

    try {
      const response = await $fetch.raw<HealthCheckBody>('/api/health-check', {
        // Read the status ourselves rather than having ofetch throw on it: a
        // 503 is "degraded", not "down".
        ignoreResponseError: true,
        retry: false,
        signal: AbortSignal.timeout(TIMEOUT_MS),
      })

      const elapsed = performance.now() - startedAt
      const body = response._data

      if (response.status === 200 && body?.state === 'ok') {
        state.value = elapsed >= SLOW_MS ? 'degraded' : 'ok'
      }
      else if (response.status === 503 || body?.state === 'error') {
        // Reachable, and self-reporting upstream trouble.
        state.value = 'degraded'
      }
      else {
        state.value = 'down'
      }
    }
    catch {
      // Offline, DNS, TLS, or the AbortSignal timeout.
      state.value = 'down'
    }
  }

  // onMounted, never useFetch: '/' is prerendered, and useFetch({ server: false })
  // schedules its first call in onBeforeMount and sets status synchronously —
  // so the first client render would disagree with the static HTML.
  onMounted(check)

  return { state, check }
}
