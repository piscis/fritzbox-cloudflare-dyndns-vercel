<script setup lang="ts">
/**
 * A closed "show screenshot" toggle, for a visitor unsure whether they're on
 * the right screen. The images load only once it opens. Each one is a button
 * that opens it alone, enlarged, in a modal. Without JavaScript the toggle and
 * the inline images still work; only the enlarging needs it.
 */
export interface Screenshot {
  src: string
  alt: string
}

const { shots, step } = defineProps<{
  shots: readonly Screenshot[]
  /** The step's number, such as `02`, which names the enlarged screenshot's dialog. */
  step: string
}>()

/**
 * UModal restyled in the CRT look. Replacer form, so none of Nuxt UI's card
 * look (rounded corners, ring, shadow, `max-w-lg`) survives to be merged away.
 * Below the page's 820px breakpoint the modal fills the screen less a thin margin.
 *
 * The content box lets clicks through (`!` beats the inline `pointer-events:
 * auto` Reka sets), so a tap on the dark area around a fitted screenshot counts
 * as outside and closes the modal. The screenshot and close button take clicks.
 */
const MODAL_UI = {
  overlay: () => [
    'fixed inset-0 bg-(--crt-void)/90',
    'data-[state=open]:animate-[fade-in_200ms_var(--ease-out)] data-[state=closed]:animate-[fade-out_200ms_var(--ease-out)]',
  ].join(' '),
  content: () => [
    'fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center focus:outline-none pointer-events-none!',
    'max-w-[95vw] max-h-[90vh]',
    'max-[819px]:w-[calc(100vw-1rem)] max-[819px]:h-[calc(100dvh-1rem)] max-[819px]:max-w-none max-[819px]:max-h-none',
    'data-[state=open]:animate-[scale-in_200ms_var(--ease-out)] data-[state=closed]:animate-[scale-out_200ms_var(--ease-out)]',
  ].join(' '),
}
</script>

<template>
  <details class="shot">
    <summary>show screenshot ▸</summary>
    <UModal v-for="shot in shots" :key="shot.src" :title="`Screenshot · step ${step}`" :ui="MODAL_UI">
      <button type="button" class="shot-enlarge" aria-label="Enlarge screenshot">
        <img :src="shot.src" :alt="shot.alt" loading="lazy">
        <span class="shot-hint" aria-hidden="true">enlarge ▸</span>
      </button>

      <template #content="{ close }">
        <!-- Fitted: never cropped, and an <img> left at auto size never grows past its native size. -->
        <img
          :src="shot.src"
          :alt="shot.alt"
          class="block w-auto h-auto max-w-[95vw] max-h-[90vh] max-[819px]:max-w-full max-[819px]:max-h-full pointer-events-auto border border-(--p-300) shadow-[0_0_22px_rgb(138_240_176/0.14)]"
        >
        <BracketButton
          tone="quiet"
          aria-label="Close"
          class="pointer-events-auto absolute top-2 right-2 min-w-11 min-h-11 justify-center bg-(--crt-void) hover:bg-(--crt-raise)"
          @click="close"
        >
          ×
        </BracketButton>
      </template>
    </UModal>
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

.shot-enlarge {
  display: block;
  margin-top: var(--sp-3);
  padding: 0;
  border: 0;
  background: none;
  font: inherit;
  text-align: left;
  cursor: zoom-in;
}

.shot-enlarge:focus-visible {
  outline: 2px solid var(--fritz-yellow);
  outline-offset: 2px;
}

.shot-enlarge img {
  display: block;
  max-width: 100%;
  height: auto;
  border: 1px solid var(--crt-line-hi);
  transition: border-color 0.2s;
}

.shot-hint {
  display: inline-block;
  margin-top: var(--sp-2);
  border-bottom: 1px solid var(--crt-line-hi);
  color: var(--p-300);
}

.shot-enlarge:hover img,
.shot-enlarge:focus-visible img {
  border-color: var(--p-100);
}

.shot-enlarge:hover .shot-hint,
.shot-enlarge:focus-visible .shot-hint {
  color: var(--p-100);
}
</style>
