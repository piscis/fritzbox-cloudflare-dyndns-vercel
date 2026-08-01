<template>
  <!--
    A carrier decaying across the card. Masked at both ends so it fades into the
    bezel rather than being clipped, and hidden below 820px where it would run
    under the copy.
  -->
  <svg
    viewBox="0 0 560 150"
    aria-hidden="true"
    class="pointer-events-none absolute right-[-40px] bottom-[44px] z-0 hidden h-[150px] w-[560px] fill-none stroke-(--p-leaf) opacity-50 min-[820px]:block"
    style="stroke-width: 1.25; -webkit-mask-image: linear-gradient(to right, transparent, #000 45%, #000 78%, transparent); mask-image: linear-gradient(to right, transparent, #000 45%, #000 78%, transparent)"
  >
    <path d="M0 75 Q 10 20 20 75 T 40 75 T 60 75 T 80 75 T 100 75 T 120 75 T 140 75 T 160 75 T 180 75 T 200 75" />
    <path d="M200 75 Q 210 32 220 75 T 240 75 T 260 75 T 280 75 T 300 75 T 320 75 T 340 75" opacity=".7" />
    <path d="M340 75 Q 350 52 360 75 T 380 75 T 400 75 T 420 75 T 440 75" opacity=".45" />
    <path d="M440 75 Q 450 66 460 75 T 480 75 T 500 75 T 520 75 T 560 75" opacity=".25" />
  </svg>
</template>
