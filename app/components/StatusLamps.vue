<script setup lang="ts">
import type { HealthState } from '~/composables/useHealthCheck'

type LampState = HealthState | 'notFound' | 'serverError'

const { state } = defineProps<{ state: LampState }>()

const LABELS: Record<LampState, string> = {
  pending: 'Checking service status…',
  ok: 'Service online',
  degraded: 'Service degraded — upstream slow',
  down: 'Service down',
  notFound: 'Page not found',
  serverError: 'Upstream did not answer',
}

const LAMPS: Record<LampState, [string, string, string]> = {
  pending: ['lamp', 'lamp', 'lamp'],
  ok: ['lamp lamp--on', 'lamp', 'lamp'],
  degraded: ['lamp', 'lamp lamp--warn lamp--pulse', 'lamp'],
  down: ['lamp', 'lamp', 'lamp lamp--err lamp--pulse'],
  notFound: ['lamp', 'lamp', 'lamp lamp--err'],
  serverError: ['lamp', 'lamp lamp--warn lamp--pulse', 'lamp'],
}

const lamps = computed(() => LAMPS[state])
const label = computed(() => LABELS[state])
</script>

<template>
  <span
    class="ml-auto flex gap-1.5"
    role="status"
    :aria-label="label"
  >
    <span
      v-for="(lamp, index) in lamps"
      :key="index"
      :class="lamp"
      aria-hidden="true"
    />
  </span>
</template>
