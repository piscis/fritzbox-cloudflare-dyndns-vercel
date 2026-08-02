<script setup lang="ts">
export interface LogLine {
  text: string
  tone?: 'ok' | 'hot' | 'warn'
}

const { lines, replayable = false, live = false } = defineProps<{
  lines: LogLine[]
  /** Front page: the handshake replays on click. */
  replayable?: boolean
  /** Error page: the trace is announced rather than decorative. */
  live?: boolean
}>()

const listEl = useTemplateRef<HTMLElement>('list')

const TONES: Record<NonNullable<LogLine['tone']>, string> = {
  ok: 'text-(--p-leaf)',
  hot: 'text-(--sig-red)',
  warn: 'text-(--sig-amber)',
}

/**
 * Restart the CSS reveal by removing the trigger attribute, forcing a reflow,
 * and putting it back — no per-frame JS and no state churn. Under
 * `prefers-reduced-motion` the animation is off entirely, so this is a no-op
 * that leaves the log fully written.
 */
function replay(): void {
  const element = listEl.value
  if (!element) {
    return
  }

  element.removeAttribute('data-boot')
  void element.offsetWidth
  element.setAttribute('data-boot', 'run')
}

onMounted(() => {
  if (replayable) {
    replay()
  }
})
</script>

<template>
  <!--
    A real <button> when it is interactive: the design made the <ul> itself
    clickable, which is unreachable by keyboard and announces nothing.
  -->
  <component
    :is="replayable ? 'button' : 'div'"
    :type="replayable ? 'button' : undefined"
    :aria-label="replayable ? 'Replay the dial-up handshake' : undefined"
    :class="replayable ? 'block w-full cursor-pointer text-left' : undefined"
    @click="replayable ? replay() : undefined"
  >
    <ul
      ref="list"
      class="m-0 list-none p-0 text-step--1"
      :data-boot="replayable ? 'run' : undefined"
      :role="live ? 'status' : undefined"
      :aria-hidden="live ? undefined : 'true'"
    >
      <li
        v-for="(line, index) in lines"
        :key="index"
        class="log-line flex gap-(--sp-3) py-px wrap-break-word whitespace-pre-wrap text-(--p-200)"
      >
        <span class="flex-none select-none text-(--p-300)">&gt;</span>
        <span :class="line.tone ? TONES[line.tone] : undefined">{{ line.text }}</span>
      </li>
    </ul>
  </component>
</template>
