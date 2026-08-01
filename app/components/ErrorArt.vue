<script setup lang="ts">
/**
 * ~1 KB of inline SVG replacing a 4830 × 3213 px, 1.0 MB PNG that was served for
 * every error alike. Both quote the isometric grid of the original illustration,
 * in the palette sampled from it.
 *
 * `data-art` is the only stable hook for tests — these are decorative and
 * `aria-hidden`, so they carry no accessible name to select on.
 */
const { variant } = defineProps<{ variant: '404' | '5xx' }>()
</script>

<template>
  <!-- A dead link in the mesh: the near node lit, the far one struck out. -->
  <svg
    v-if="variant === '404'"
    data-art="404"
    viewBox="0 0 240 200"
    aria-hidden="true"
    class="hidden w-[clamp(210px,26vw,300px)] opacity-95 min-[780px]:block"
  >
    <g fill="none" stroke="var(--p-400)" stroke-width="1" opacity=".6">
      <path d="M120 26 L228 86 L120 146 L12 86 Z" />
      <path d="M120 56 L174 86 L120 116 L66 86 Z" opacity=".75" />
      <path d="M66 56 L174 116" />
      <path d="M174 56 L66 116" />
    </g>
    <circle cx="62" cy="104" r="20" fill="var(--p-leaf)" opacity=".15" />
    <path d="M62 104 C 82 96, 96 90, 108 86" fill="none" stroke="var(--p-leaf)" stroke-width="3" stroke-linecap="round" />
    <g fill="var(--sig-red)">
      <circle cx="118" cy="83" r="2.6" />
      <circle cx="128" cy="80" r="2.2" opacity=".7" />
      <circle cx="138" cy="77" r="1.8" opacity=".4" />
    </g>
    <path d="M148 74 C 160 70, 170 66, 178 62" fill="none" stroke="var(--p-400)" stroke-width="3" stroke-linecap="round" />
    <path d="M62 104 L62 122" stroke="var(--p-400)" stroke-width="1.5" opacity=".8" />
    <path d="M178 62 L178 80" stroke="var(--p-400)" stroke-width="1.5" opacity=".8" />
    <circle cx="62" cy="104" r="9" fill="var(--p-leaf)" />
    <circle cx="178" cy="62" r="9" fill="var(--crt-screen)" stroke="var(--sig-red)" stroke-width="2.5" />
  </svg>

  <!-- A busy signal: the waveform live, the onward path dashed out. -->
  <svg
    v-else
    data-art="5xx"
    viewBox="0 0 240 210"
    aria-hidden="true"
    class="hidden w-[clamp(210px,26vw,300px)] min-[780px]:block"
  >
    <g fill="none" stroke="var(--p-400)" stroke-width="1" opacity=".5">
      <path d="M120 24 L222 78 L120 132 L18 78 Z" />
      <path d="M69 51 L171 105" />
      <path d="M171 51 L69 105" />
    </g>
    <circle cx="120" cy="78" r="52" fill="none" stroke="var(--sig-amber)" stroke-width="1.5" opacity=".25" />
    <circle cx="120" cy="78" r="68" fill="none" stroke="var(--sig-amber)" stroke-width="1.5" opacity=".14" />
    <path d="M40 78 h16 v-26 h20 v52 h20 v-52 h20 v52 h20 v-26 h16" fill="none" stroke="var(--sig-amber)" stroke-width="2.5" stroke-linecap="round" />
    <path d="M152 78 h48" fill="none" stroke="var(--p-400)" stroke-width="2" stroke-dasharray="3 8" />
    <g fill="none" stroke="var(--p-400)" stroke-width="1" opacity=".22">
      <path d="M120 140 L120 168" />
      <path d="M96 156 L144 156" />
    </g>
  </svg>
</template>
