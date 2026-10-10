<script setup lang="ts">
/**
 * Field → value pairs for a form the visitor fills in somewhere else, the
 * Cloudflare dashboard or the FRITZ!Box admin page. Values are plain selectable
 * `<code>`, so they can be copied by hand.
 */
export interface Field {
  label: string
  value: string
  note?: string
}

const { fields } = defineProps<{ fields: Field[] }>()
</script>

<template>
  <dl class="m-0 grid grid-cols-1 gap-x-(--sp-5) gap-y-(--sp-2) rounded-(--radius) border border-(--crt-line) bg-(--crt-screen) p-(--sp-4) text-step-0 sm:grid-cols-[minmax(10rem,auto)_1fr]">
    <template v-for="field in fields" :key="field.label">
      <dt class="text-(--p-300)">
        {{ field.label }}
      </dt>
      <dd class="m-0 mb-(--sp-2) sm:mb-0">
        <code class="break-all text-(--p-100)">{{ field.value }}</code>
        <span v-if="field.note" class="text-(--p-300)"> — {{ field.note }}</span>
      </dd>
    </template>
  </dl>
</template>
