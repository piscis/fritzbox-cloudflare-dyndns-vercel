<script setup lang="ts">
/**
 * Field → value pairs for a form the visitor fills in somewhere else, the
 * Cloudflare dashboard or the FRITZ!Box admin page. Values are plain selectable
 * `<code>`, so they can be copied by hand.
 *
 * A field with `copy` also gets a `[copy]` button. It only appears once the page
 * runs in a browser with the Clipboard API, so the prerendered HTML and a page
 * without JS carry no button that does nothing.
 */
export interface Field {
  label: string
  value: string
  note?: string
  copy?: boolean
}

const { fields } = defineProps<{ fields: Field[] }>()

const canCopy = ref(false)
onMounted(() => {
  canCopy.value = Boolean(navigator.clipboard)
})

// Keyed by row, since labels can repeat (two `Permission` rows in step 01).
const copyState = ref<{ row: number, result: 'copied' | 'failed' } | null>(null)
let reset: ReturnType<typeof setTimeout> | undefined

async function copy(field: Field, row: number): Promise<void> {
  clearTimeout(reset)
  try {
    await navigator.clipboard.writeText(field.value)
    copyState.value = { row, result: 'copied' }
  }
  catch {
    copyState.value = { row, result: 'failed' }
  }
  reset = setTimeout(() => {
    copyState.value = null
  }, 2500)
}

onBeforeUnmount(() => clearTimeout(reset))

function buttonText(row: number): string {
  if (copyState.value?.row !== row)
    return 'copy'
  return copyState.value.result === 'copied' ? 'copied' : 'blocked, select it'
}
</script>

<template>
  <dl class="m-0 grid grid-cols-1 gap-x-(--sp-5) gap-y-(--sp-2) rounded-(--radius) border border-(--crt-line) bg-(--crt-screen) p-(--sp-4) text-step-0 sm:grid-cols-[minmax(10rem,auto)_1fr]">
    <template v-for="(field, row) in fields" :key="row">
      <dt class="text-(--p-300)">
        {{ field.label }}
      </dt>
      <dd class="m-0 mb-(--sp-2) sm:mb-0">
        <code class="break-all text-(--p-100)">{{ field.value }}</code>
        <span v-if="field.note" class="text-(--p-300)"> — {{ field.note }}</span>
        <button
          v-if="field.copy && canCopy"
          type="button"
          :aria-label="`Copy ${field.label}`"
          class="bracket ml-(--sp-2) cursor-pointer border-0 bg-transparent p-0 font-mono text-step--1 text-(--p-300) hover:text-(--p-100) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--fritz-yellow)"
          @click="copy(field, row)"
        >
          {{ buttonText(row) }}
        </button>
        <span v-if="field.copy && copyState?.row === row" class="sr-only" aria-live="polite">
          {{ copyState.result === 'copied' ? 'Copied.' : 'The browser blocked copying. Select the text instead.' }}
        </span>
      </dd>
    </template>
  </dl>
</template>
