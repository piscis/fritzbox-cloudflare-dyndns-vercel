<script setup lang="ts">
/**
 * The dial-up easter egg: autoplay after a short beat, click to stop/restart.
 *
 * Unmuted autoplay is blocked by Chrome and Safari for most visitors, so the
 * scheduled try may no-op — the button stays the reliable path and never lies
 * about a pressed state. Markup stays SSR-safe (`<audio preload="none">`),
 * and the Web Audio graph lives in `useModemDialup` for the spectrum.
 */
const {
  sound,
  playing,
  bindAudio,
  toggle,
  stop,
  scheduleAutoplay,
  cancelAutoplay,
} = useModemDialup()

const audio = useTemplateRef<HTMLAudioElement>('audio')

watch(audio, (el) => {
  if (el) {
    bindAudio(el)
    scheduleAutoplay()
  }
}, { immediate: true })

onBeforeUnmount(() => {
  cancelAutoplay()
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
