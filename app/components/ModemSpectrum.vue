<script setup lang="ts">
/**
 * Phosphor frequency bars behind the CRT copy. Idle: a faint dormant baseline.
 * Playing: live AnalyserNode bins from the shared dial-up graph.
 */
const { playing, getAnalyser } = useModemDialup()

const canvas = useTemplateRef<HTMLCanvasElement>('canvas')

let raf = 0
let reducedMotion = false
let resizeObserver: ResizeObserver | null = null

function cssVar(name: string, fallback: string): string {
  if (!import.meta.client)
    return fallback
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  return value || fallback
}

function resize(): void {
  const el = canvas.value
  if (!el)
    return
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  const { width, height } = el.getBoundingClientRect()
  el.width = Math.max(1, Math.floor(width * dpr))
  el.height = Math.max(1, Math.floor(height * dpr))
}

function drawDormant(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  const bars = 48
  const gap = w / bars
  const leaf = cssVar('--p-leaf', '#4ba241')
  ctx.clearRect(0, 0, w, h)
  ctx.fillStyle = leaf
  ctx.globalAlpha = 0.38

  for (let i = 0; i < bars; i++) {
    const t = i / (bars - 1)
    // Soft hump in the middle — reads as a resting carrier, not a flat EQ.
    const hump = Math.sin(t * Math.PI)
    const barH = h * (0.04 + hump * 0.08)
    const x = i * gap + gap * 0.2
    const bw = gap * 0.55
    ctx.fillRect(x, h - barH, bw, barH)
  }

  ctx.globalAlpha = 1
}

function drawLive(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  const node = getAnalyser()
  if (!node) {
    drawDormant(ctx, w, h)
    return
  }

  const bins = node.frequencyBinCount
  const data = new Uint8Array(bins)
  node.getByteFrequencyData(data)

  // Modem handshake energy sits in the lower-mid; skip the empty top of the FFT.
  // Bars are mirrored (high → left, low → right) so the active carrier clears the
  // copy on the left and reads in the open space on the right.
  const usable = Math.floor(bins * 0.55)
  const bars = 64
  const gap = w / bars
  const leaf = cssVar('--p-leaf', '#4ba241')
  const mid = cssVar('--p-300', '#478e66')

  ctx.clearRect(0, 0, w, h)

  for (let i = 0; i < bars; i++) {
    const sample = data[Math.floor(((bars - 1 - i) / bars) * usable)] ?? 0
    const level = sample / 255
    const barH = Math.max(h * 0.03, level * h * 0.72)
    const x = i * gap + gap * 0.15
    const bw = gap * 0.6

    ctx.fillStyle = level > 0.55 ? leaf : mid
    ctx.globalAlpha = 0.4 + level * 0.55
    ctx.fillRect(x, h - barH, bw, barH)
  }

  ctx.globalAlpha = 1
}

function paint(): void {
  const el = canvas.value
  if (!el)
    return
  const ctx = el.getContext('2d')
  if (!ctx)
    return

  if (playing.value && !reducedMotion)
    drawLive(ctx, el.width, el.height)
  else
    drawDormant(ctx, el.width, el.height)
}

function tick(): void {
  paint()
  if (playing.value && !reducedMotion)
    raf = requestAnimationFrame(tick)
  else
    raf = 0
}

function startLoop(): void {
  if (raf || reducedMotion)
    return
  raf = requestAnimationFrame(tick)
}

function stopLoop(): void {
  if (raf) {
    cancelAnimationFrame(raf)
    raf = 0
  }
  paint()
}

watch(playing, (isPlaying) => {
  if (isPlaying && !reducedMotion)
    startLoop()
  else
    stopLoop()
})

onMounted(() => {
  reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  resize()
  paint()

  resizeObserver = new ResizeObserver(() => {
    resize()
    paint()
  })
  if (canvas.value)
    resizeObserver.observe(canvas.value)
})

onBeforeUnmount(() => {
  stopLoop()
  resizeObserver?.disconnect()
  resizeObserver = null
})
</script>

<template>
  <!--
    Full-bleed behind the copy. Masked at the edges so bars dissolve into the
    bezel; lower opacity under 820px so the denser mobile stack stays readable.
  -->
  <canvas
    ref="canvas"
    aria-hidden="true"
    class="modem-spectrum pointer-events-none absolute inset-0 z-0 h-full w-full"
  />
</template>
