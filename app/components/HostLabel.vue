<script setup lang="ts">
const host = useSiteHost()

const separator = computed(() => host.value.indexOf('.'))
const lead = computed(() => (separator.value < 0
  ? host.value
  : host.value.slice(0, separator.value)))
const rest = computed(() => (separator.value < 0
  ? ''
  : host.value.slice(separator.value)))
</script>

<template>
  <span class="tracking-[0.02em] whitespace-nowrap text-(--p-200)">
    <b class="font-semibold text-(--p-100)">{{ lead }}</b>{{ rest }}
  </span>
</template>
