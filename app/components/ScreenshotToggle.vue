<script setup lang="ts">
export interface Screenshot {
  src: string
  alt: string
}

const { shots, step } = defineProps<{
  shots: readonly Screenshot[]
  step: string
}>()

const MODAL_UI = {
  overlay: () => [
    'fixed inset-0 bg-(--crt-void)/90',
    'data-[state=open]:animate-[fade-in_200ms_var(--ease-out)] data-[state=closed]:animate-[fade-out_200ms_var(--ease-out)]',
  ].join(' '),
  content: () => [
    'fixed inset-0 flex items-center justify-center focus:outline-none pointer-events-none! max-[819px]:p-2',
    'data-[state=open]:animate-[scale-in_200ms_var(--ease-out)] data-[state=closed]:animate-[scale-out_200ms_var(--ease-out)]',
  ].join(' '),
}

const enhanced = ref(false)
onMounted(() => enhanced.value = true)

const FRAME = 'max-w-[95vw] max-h-[90vh] max-[819px]:max-w-full max-[819px]:max-h-full border border-(--p-300) shadow-[0_0_22px_rgb(138_240_176/0.14)]'

const view = ref<'fitted' | 'native'>('fitted')
const nativeSize = ref<{ width: number, height: number }>()
const shrunk = ref(false)
const cursor = computed(() => view.value === 'native'
  ? 'zoom-out'
  : shrunk.value ? 'zoom-in' : undefined)
let fittedImage: HTMLImageElement | null = null

function measure() {
  const image = fittedImage
  if (view.value !== 'fitted' || !image?.naturalWidth)
    return
  nativeSize.value = { width: image.naturalWidth, height: image.naturalHeight }
  shrunk.value = image.naturalWidth > image.clientWidth || image.naturalHeight > image.clientHeight
}

function bindFittedImage(element: unknown) {
  fittedImage = element instanceof HTMLImageElement
    ? element
    : null
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
  <details class="shot" :class="{ 'shot-enhanced': enhanced }">
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
        <span v-if="enhanced" class="shot-hint" aria-hidden="true">enlarge ▸</span>
      </button>

      <template #content="{ close }">
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
        <UButton
          variant="quiet"
          aria-label="Close"
          class="pointer-events-auto absolute top-2 right-2 min-w-11 min-h-11 justify-center bg-(--crt-void) hover:bg-(--crt-raise)"
          @click="close"
        >
          ×
        </UButton>
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
}

.shot-enhanced .shot-enlarge {
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
