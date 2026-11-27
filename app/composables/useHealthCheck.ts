import type { InferRouterOutputs } from '@orpc/server'
import type { router } from '~~/server/router'

export type HealthState = 'pending' | 'ok' | 'degraded' | 'down'

const SLOW_MS = 800

const TIMEOUT_MS = 5000

type HealthCheckBody = InferRouterOutputs<typeof router>['api']['healthCheck']['body']

export function useHealthCheck() {
  const state = ref<HealthState>('pending')

  async function check(): Promise<void> {
    const startedAt = performance.now()

    try {
      const response = await $fetch.raw<HealthCheckBody>('/api/health-check', {
        ignoreResponseError: true,
        retry: false,
        signal: AbortSignal.timeout(TIMEOUT_MS),
      })

      const elapsed = performance.now() - startedAt
      const body = response._data

      if (response.status === 200 && body?.state === 'ok') {
        state.value = elapsed >= SLOW_MS
          ? 'degraded'
          : 'ok'
      }
      else if (response.status === 503) {
        state.value = 'degraded'
      }
      else {
        state.value = 'down'
      }
    }
    catch {
      state.value = 'down'
    }
  }

  onMounted(check)

  return { state, check }
}
