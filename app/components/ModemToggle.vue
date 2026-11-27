<script setup lang="ts">
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
  <UButton
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
  </UButton>
</template>
