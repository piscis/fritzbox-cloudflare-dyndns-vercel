<script setup lang="ts">
/**
 * The design's three button looks.
 *
 * These are `class` bindings rather than custom `variant` values in
 * app.config.ts. Adding a variant there is documented to work, but in practice
 * the values never reached the rendered element — every button came out with the
 * shared base and nothing else — and `class` merges onto the root
 * deterministically. The shared geometry, the brackets and the focus ring still
 * come from `ui.button.slots.base` in app.config.ts; only the colouring is here.
 */
const { tone = 'default' } = defineProps<{
  tone?: 'default' | 'primary' | 'quiet'
}>()

const TONES = {
  default: 'bg-transparent border-(--crt-line) text-(--p-100) before:text-(--p-300) after:text-(--p-300) hover:border-(--crt-line-hi) hover:bg-(--crt-raise) hover:shadow-[0_0_22px_rgb(138_240_176/0.14)] hover:before:text-current hover:after:text-current',
  primary: 'bg-(--fritz-yellow) border-(--fritz-yellow) text-(--on-accent) font-bold before:opacity-45 after:opacity-45 hover:brightness-[1.12] hover:shadow-[0_0_24px_rgb(255_228_0/0.3)] hover:before:opacity-100 hover:after:opacity-100',
  quiet: 'bg-transparent border-(--crt-line) text-(--p-200) before:text-(--p-300) after:text-(--p-300) hover:border-(--crt-line-hi) hover:bg-(--crt-raise) hover:before:text-current hover:after:text-current',
} as const

const toneClass = computed(() => TONES[tone])
</script>

<template>
  <UButton :class="toneClass">
    <slot />
  </UButton>
</template>
