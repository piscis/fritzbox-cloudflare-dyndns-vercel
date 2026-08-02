/**
 * Shared dial-up easter egg: one HTMLAudioElement, one Web Audio graph.
 *
 * Module-scoped on purpose — the landing page mounts a single toggle and a
 * single spectrum, and MediaElementSource can only be created once per element.
 * Lazy: AudioContext + analyser appear on the first gesture so prerender / SSR
 * never touch Web Audio. The clip stays `preload="none"` until the first play
 * (autoplay attempt or a click).
 *
 * Unmuted autoplay is still gated by the browser: we schedule a try two seconds
 * after mount, and if the UA refuses, the button stays honest and the click
 * path remains the reliable fallback. That try must not build the graph —
 * see `ensureGraph`.
 */

const SOUND = '/sounds/modem-dial-up.mp3'
const AUTOPLAY_DELAY_MS = 2000

const playing = ref(false)

let audioEl: HTMLAudioElement | null = null
let ctx: AudioContext | null = null
let analyser: AnalyserNode | null = null
let sourceBound = false
let autoplayTimer: ReturnType<typeof setTimeout> | null = null
let autoplayCancelled = false
let gestureSeen = false
let gestureBound = false

// Anything Chrome counts as activation for the autoplay policy. `keydown`
// keeps the graph reachable for visitors who never point at anything.
const GESTURE_EVENTS = ['pointerdown', 'keydown', 'touchstart'] as const

function onFirstGesture(): void {
  unbindGesture()
  gestureSeen = true

  // Only if the clip is already running: the autoplay try got through without a
  // graph, so this is the first moment we can give the spectrum real bins.
  // Otherwise the click path builds it and idle visitors pay for nothing.
  if (playing.value)
    ensureGraph()
}

function bindGesture(): void {
  if (!import.meta.client || gestureBound || gestureSeen)
    return

  for (const type of GESTURE_EVENTS)
    window.addEventListener(type, onFirstGesture, { once: true, passive: true })
  gestureBound = true
}

function unbindGesture(): void {
  if (!gestureBound)
    return

  for (const type of GESTURE_EVENTS)
    window.removeEventListener(type, onFirstGesture)
  gestureBound = false
}

/**
 * Never call this before a gesture. An AudioContext constructed without one
 * starts `suspended` (and Chrome logs the autoplay warning), while
 * `createMediaElementSource` has already rerouted the element's output into
 * that frozen graph — the clip would play silently behind a pressed button.
 */
function ensureGraph(): AnalyserNode | null {
  if (!import.meta.client || !audioEl || sourceBound || !gestureSeen)
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

/**
 * `viaGesture` marks a call that runs inside a user activation (the toggle
 * click). Only those may touch Web Audio; the scheduled autoplay try goes
 * straight to the element and waits for a gesture to pick up the graph.
 */
async function play(viaGesture = false): Promise<void> {
  if (playing.value || !audioEl)
    return

  if (viaGesture) {
    unbindGesture()
    gestureSeen = true
  }

  try {
    if (gestureSeen) {
      ensureGraph()
      if (ctx?.state === 'suspended')
        await ctx.resume()
    }
    else {
      bindGesture()
    }

    await audioEl.play()
    playing.value = true
  }
  catch {
    // NotAllowedError / NotSupportedError / AbortError — leave the button honest.
    playing.value = false
  }
}

function cancelAutoplay(): void {
  autoplayCancelled = true
  if (autoplayTimer !== null) {
    clearTimeout(autoplayTimer)
    autoplayTimer = null
  }
}

function scheduleAutoplay(delayMs = AUTOPLAY_DELAY_MS): void {
  if (autoplayTimer !== null)
    clearTimeout(autoplayTimer)

  autoplayCancelled = false
  autoplayTimer = setTimeout(() => {
    autoplayTimer = null
    if (!autoplayCancelled && !playing.value)
      void play()
  }, delayMs)
}

async function toggle(): Promise<void> {
  // Any click means the visitor took over — do not restart after they stop.
  cancelAutoplay()

  if (playing.value) {
    stop()
    return
  }

  await play(true)
}

function tearDownGraph(): void {
  unbindGesture()
  if (typeof ctx?.close === 'function')
    void ctx.close()
  ctx = null
  analyser = null
  sourceBound = false
  // Activation is tracked per graph lifetime, not per document: a remount costs
  // at most one gesture before the spectrum comes back, and the invariant
  // "no graph without a gesture we observed ourselves" stays checkable.
  gestureSeen = false
}

export function useModemDialup() {
  function bindAudio(el: HTMLAudioElement | null): void {
    if (el === audioEl)
      return

    // MediaElementSource is permanently tied to one element. Remounts (tests,
    // client navigations) get a fresh graph.
    if (audioEl) {
      cancelAutoplay()
      stop()
      tearDownGraph()
    }
    audioEl = el
  }

  return {
    sound: SOUND,
    playing: readonly(playing),
    bindAudio,
    play,
    toggle,
    stop,
    scheduleAutoplay,
    cancelAutoplay,
    getAnalyser: (): AnalyserNode | null => analyser,
  }
}
