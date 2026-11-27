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

async function play(): Promise<void> {
  if (playing.value || !audioEl)
    return

  try {
    ensureGraph()
    if (ctx?.state === 'suspended')
      await ctx.resume()

    await audioEl.play()
    playing.value = true
  }
  catch {
    playing.value = false
  }
}

async function toggle(): Promise<void> {
  if (playing.value) {
    stop()
    return
  }

  await play()
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
    play,
    toggle,
    stop,
    getAnalyser: (): AnalyserNode | null => analyser,
  }
}
