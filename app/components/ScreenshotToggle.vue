<script setup lang="ts">
/**
 * A closed "show screenshot" toggle, for a visitor unsure whether they're on
 * the right screen. The images load only once it opens.
 */
export interface Screenshot {
  src: string
  alt: string
}

const { shots } = defineProps<{ shots: readonly Screenshot[] }>()
</script>

<template>
  <details class="shot">
    <summary>show screenshot ▸</summary>
    <img v-for="shot in shots" :key="shot.src" :src="shot.src" :alt="shot.alt" loading="lazy">
  </details>
</template>

<style scoped>
.shot {
  margin-top: var(--sp-4);
}

.shot summary {
  display: inline-block;
  cursor: pointer;
  list-style: none;
  border-bottom: 1px solid var(--crt-line-hi);
  color: var(--p-300);
}

.shot summary::-webkit-details-marker {
  display: none;
}

.shot summary:hover,
.shot summary:focus-visible {
  color: var(--p-100);
}

.shot img {
  display: block;
  margin-top: var(--sp-3);
  max-width: 100%;
  height: auto;
  border: 1px solid var(--crt-line-hi);
}
</style>
