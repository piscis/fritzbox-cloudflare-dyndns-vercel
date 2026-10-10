<script setup lang="ts">
/**
 * The host in the title bar, first label emphasised.
 *
 * The host comes from `useSiteHost`: the build's own host in the prerendered
 * HTML, the visitor's real one once mounted.
 *
 * The lamps sit on `margin-left: auto`, so the label changing width moves
 * nothing.
 */
const host = useSiteHost()

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
