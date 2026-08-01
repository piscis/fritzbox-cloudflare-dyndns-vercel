<script setup lang="ts">
/**
 * The host in the title bar, first label emphasised.
 *
 * Two-stage on purpose. `/` is prerendered, and `useRequestURL()` at prerender
 * time reports the *build* host — nitro renders through node-mock-http, which
 * defaults `Host` to `localhost`. So the static HTML is seeded from the build's
 * own `CF_ROUTE_PATTERN`, and the visitor's real host replaces it in onMounted,
 * after the hydration render, where it cannot cause a mismatch.
 *
 * The lamps sit on `margin-left: auto`, so the label changing width moves
 * nothing.
 */
const config = useRuntimeConfig()

const host = ref(config.public.siteHost || 'fritzdns.piscis.dev')

onMounted(() => {
  host.value = window.location.host
})

// indexOf rather than split('.'), so `localhost:3000` degrades to a single bold
// label instead of an empty tail.
const separator = computed(() => host.value.indexOf('.'))
const lead = computed(() => (separator.value < 0 ? host.value : host.value.slice(0, separator.value)))
const rest = computed(() => (separator.value < 0 ? '' : host.value.slice(separator.value)))
</script>

<template>
  <span class="tracking-[0.02em] whitespace-nowrap text-(--p-200)">
    <b class="font-semibold text-(--p-100)">{{ lead }}</b>{{ rest }}
  </span>
</template>
