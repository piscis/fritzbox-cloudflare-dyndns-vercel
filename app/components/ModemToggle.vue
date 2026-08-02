<script setup lang="ts">
/**
 * The dial-up easter egg: click to play, click again to stop/restart.
 *
 * Markup stays SSR-safe (`<audio preload="none">`), and the Web Audio graph
 * lives in `useModemDialup` for the spectrum — built only on a click so the
 * button never claims to be playing over silence.
 */
const {
  sound,
  playing,
  bindAudio,
  toggle,
  stop,
} = useModemDialup()

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
    :class="{ 'dialup-idle': !playing }"
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
