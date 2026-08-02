/**
 * Shared dial-up easter egg: one HTMLAudioElement, one Web Audio graph.
 *
 * Module-scoped on purpose — the landing page mounts a single toggle and a
 * single spectrum, and MediaElementSource can only be created once per element.
 * Lazy: AudioContext + analyser appear on the first successful user-gesture
 * play so prerender / SSR never touch Web Audio, and the 852 KB clip stays
 * unfetched until someone presses the button (preload="none" on the element).
 */

const SOUND = '/sounds/modem-dial-up.mp3'

const playing = ref(false)

let audioEl: HTMLAudioElement | null = null
let ctx: AudioContext | null = null
let analyser: AnalyserNode | null = null
let sourceBound = false

function ensureGraph(): AnalyserNode | null {
  if (!import.meta.client || !audioEl || sourceBound)
    return analyser

  try {
    const AC = window.AudioContext
      ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!AC)
      return null

    ctx = new AC()
    analyser = ctx.createAnalyser()
    analyser.fftSize = 256
    analyser.smoothingTimeConstant = 0.82
    analyser.minDecibels = -90
    analyser.maxDecibels = -20

    const source = ctx.createMediaElementSource(audioEl)
    source.connect(analyser)
    analyser.connect(ctx.destination)
    sourceBound = true
  }
  catch {
    // happy-dom, missing Web Audio, or a second bind attempt — play still works
    // through the element if the graph never attached.
    ctx = null
    analyser = null
  }

  return analyser
}

function stop(): void {
  if (audioEl) {
    audioEl.pause()
    audioEl.currentTime = 0
  }
  playing.value = false
}

async function toggle(): Promise<void> {
  if (playing.value) {
    stop()
    return
  }

  if (!audioEl)
    return

  try {
    ensureGraph()
    if (ctx?.state === 'suspended')
      await ctx.resume()

    await audioEl.play()
    playing.value = true
  }
  catch {
    // NotAllowedError / NotSupportedError / AbortError — leave the button honest.
    playing.value = false
  }
}

function tearDownGraph(): void {
  if (typeof ctx?.close === 'function')
    void ctx.close()
  ctx = null
  analyser = null
  sourceBound = false
}

export function useModemDialup() {
  function bindAudio(el: HTMLAudioElement | null): void {
    if (el === audioEl)
      return

    // MediaElementSource is permanently tied to one element. Remounts (tests,
    // client navigations) get a fresh graph.
    if (audioEl) {
      stop()
      tearDownGraph()
    }
    audioEl = el
  }

  return {
    sound: SOUND,
    playing: readonly(playing),
    bindAudio,
    toggle,
    stop,
    getAnalyser: (): AnalyserNode | null => analyser,
  }
}
