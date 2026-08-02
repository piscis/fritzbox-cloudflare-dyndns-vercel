<script setup lang="ts">
/**
 * The dial-up easter egg, behind a click.
 *
 * `<audio controls autoplay>` has been blocked unmuted by Chrome and Safari for
 * years, so the old page rendered an inert grey stock player mid-layout — the
 * joke invisible and the page looking broken. A button always works and never
 * ambushes anyone in an open-plan office.
 *
 * The element is declared rather than built with `new Audio()`: markup is
 * SSR-safe (no DOM API at setup, nothing to guard for prerender or the Worker)
 * and `preload="none"` keeps all 852 KB unfetched until the first press.
 * Playback + Web Audio graph live in `useModemDialup` so the spectrum can read
 * the same AnalyserNode.
 */
const { sound, playing, bindAudio, toggle, stop } = useModemDialup()

const audio = useTemplateRef<HTMLAudioElement>('audio')

watch(audio, (el) => {
  if (el)
    bindAudio(el)
}, { immediate: true })

onBeforeUnmount(() => {
  stop()
  bindAudio(null)
})
</script>

<template>
  <BracketButton
    type="button"
    :aria-pressed="playing"
    :aria-label="playing ? 'Stop the modem handshake' : 'Play the modem handshake'"
    @click="toggle"
  >
    <span
      v-if="playing"
      class="flex h-2.75 items-end gap-0.5"
      aria-hidden="true"
    >
      <i v-for="bar in 5" :key="bar" class="wave-bar" />
    </span>
    <span v-else aria-hidden="true">♪</span>
    {{ playing ? 'connecting…' : 'dial up' }}

    <audio
      ref="audio"
      preload="none"
      :src="sound"
      @ended="stop"
    />
  </BracketButton>
</template>
