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
 * as outside and closes the modal. The screenshot, its native-size scroll area
 * and the close button take clicks.
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

/** The frame both views draw around the screenshot: a phosphor border and glow, never past the modal. */
const FRAME = 'max-w-[95vw] max-h-[90vh] max-[819px]:max-w-full max-[819px]:max-h-full border border-(--p-300) shadow-[0_0_22px_rgb(138_240_176/0.14)]'

/**
 * The open modal's view. It opens `fitted`; when the screenshot is drawn
 * smaller than its native size, a click shows it at `native` size in a
 * scroll area, and another click fits it again. Only one modal is open at a
 * time, so one state serves them all, reset on every open and close.
 */
const view = ref<'fitted' | 'native'>('fitted')
/** The screenshot's native size, once the fitted one has loaded. */
const nativeSize = ref<{ width: number, height: number }>()
/** Whether the fitted screenshot is drawn smaller than its native size. */
const shrunk = ref(false)
/** The zoom the next click gives; none when the screenshot already shows 1:1. */
const cursor = computed(() => view.value === 'native' ? 'zoom-out' : shrunk.value ? 'zoom-in' : undefined)
let fittedImage: HTMLImageElement | null = null

function measure() {
  const image = fittedImage
  // Nothing to measure before the screenshot has decoded.
  if (view.value !== 'fitted' || !image?.naturalWidth)
    return
  nativeSize.value = { width: image.naturalWidth, height: image.naturalHeight }
  shrunk.value = image.naturalWidth > image.clientWidth || image.naturalHeight > image.clientHeight
}

function bindFittedImage(element: unknown) {
  fittedImage = element instanceof HTMLImageElement ? element : null
  // A screenshot already in the cache may finish loading before the listener exists.
  if (fittedImage?.complete)
    measure()
}

function toggleView() {
  measure()
  if (view.value === 'native')
    view.value = 'fitted'
  else if (shrunk.value)
    view.value = 'native'
}

/** Starts every open and close fitted, and re-measures on resizes only while open. */
function onOpenChange(open: boolean) {
  view.value = 'fitted'
  nativeSize.value = undefined
  shrunk.value = false
  if (open)
    window.addEventListener('resize', measure)
  else
    window.removeEventListener('resize', measure)
}

onBeforeUnmount(() => window.removeEventListener('resize', measure))
</script>

<template>
  <details class="shot">
    <summary>show screenshot ▸</summary>
    <UModal
      v-for="shot in shots"
      :key="shot.src"
      :title="`Screenshot · step ${step}`"
      :ui="MODAL_UI"
      @update:open="onOpenChange"
    >
      <button type="button" class="shot-enlarge" :aria-label="`Enlarge screenshot: ${shot.alt}`">
        <img :src="shot.src" :alt="shot.alt" loading="lazy">
        <span class="shot-hint" aria-hidden="true">enlarge ▸</span>
      </button>

      <template #content="{ close }">
        <!-- Native: drawn at natural size in a scroll area that takes the pans itself, so they never reach the overlay. -->
        <div
          v-if="view === 'native'"
          class="pointer-events-auto overflow-auto overscroll-contain"
          :class="FRAME"
        >
          <img
            :src="shot.src"
            :alt="shot.alt"
            :width="nativeSize?.width"
            :height="nativeSize?.height"
            class="block max-w-none"
            :style="{ cursor }"
            @click="toggleView"
          >
        </div>
        <!-- Fitted: never cropped, and an <img> left at auto size never grows past its native size. -->
        <img
          v-else
          :ref="bindFittedImage"
          :src="shot.src"
          :alt="shot.alt"
          class="block w-auto h-auto pointer-events-auto"
          :class="FRAME"
          :style="{ cursor }"
          @load="measure"
          @click="toggleView"
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
