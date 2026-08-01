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
 */
const SOUND = '/sounds/modem-dial-up.mp3'

const audio = useTemplateRef<HTMLAudioElement>('audio')
const playing = ref(false)

function stop(): void {
  const element = audio.value
  if (element) {
    element.pause()
    element.currentTime = 0
  }
  playing.value = false
}

async function toggle(): Promise<void> {
  if (playing.value) {
    stop()
    return
  }

  try {
    await audio.value?.play()
    playing.value = true
  }
  catch {
    // NotAllowedError (iOS low-power mode, Safari's per-site autoplay setting),
    // NotSupportedError, AbortError. Leave the button honest rather than
    // showing a pressed state for audio that never started.
    playing.value = false
  }
}

onBeforeUnmount(stop)
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
      :src="SOUND"
      @ended="stop"
    />
  </BracketButton>
</template>
