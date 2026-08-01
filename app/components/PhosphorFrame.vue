<script setup lang="ts">
/**
 * The terminal both screens live in: a fixed phosphor grid behind a centred CRT
 * card with a title bar, a body and a foot line.
 *
 * It is a UCard — header/body/footer is exactly the shape needed — but the stock
 * `outline` variant brings `bg-default ring ring-default divide-y`, and those
 * dividers would double up with the bar's own hairline. `ui.root` therefore uses
 * the replacer form to drop the defaults outright rather than leaving
 * tailwind-merge to arbitrate.
 *
 * `status` re-points `--frame-line` and the tint variables, so the whole card
 * recolours by HTTP status from one attribute.
 */
const { status } = defineProps<{ status?: '404' | '5xx' }>()
</script>

<template>
  <div class="relative flex min-h-[100dvh] flex-col items-center justify-center gap-[clamp(16px,3vw,28px)] p-[clamp(14px,4vw,48px)]">
    <div class="crt-grid pointer-events-none fixed inset-0 z-0" aria-hidden="true" />

    <UCard
      :data-status="status"
      class="crt-scan flicker relative z-1 w-full max-w-[1000px] overflow-hidden"
      :class="status ? 'crt-glass--error' : 'crt-glass'"
      :ui="{
        root: () => 'rounded-lg',
        header: 'relative z-2 flex items-center gap-(--sp-3) border-b border-(--frame-line) px-(--sp-4) py-(--sp-3) text-step--1 text-(--p-300)',
        body: 'relative z-2 px-[clamp(20px,4.4vw,54px)] pt-[clamp(26px,5vw,52px)] pb-[clamp(30px,5vw,54px)]',
        footer: 'relative z-2 flex flex-wrap items-center gap-(--sp-2) gap-x-(--sp-4) border-t border-(--frame-line) px-[clamp(20px,4.4vw,54px)] py-(--sp-3) text-step--1 text-(--p-300)',
      }"
    >
      <template #header>
        <slot name="bar" />
      </template>

      <slot />

      <template #footer>
        <slot name="foot" />
      </template>
    </UCard>
  </div>
</template>
