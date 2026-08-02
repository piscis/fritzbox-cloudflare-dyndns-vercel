<script setup lang="ts">
import type { LogLine } from '~/components/TerminalLog.vue'

const REPO = 'https://github.com/piscis/fritzbox-cloudflare-dyndns-vercel'

const HANDSHAKE: LogLine[] = [
  { text: 'ATDT 0192658' },
  { text: 'CONNECT 56000/ARQ/V90/LAPM/V42BIS' },
  { text: '● link established', tone: 'ok' },
]

const config = useRuntimeConfig()
const { state } = useHealthCheck()
</script>

<template>
  <PhosphorFrame>
    <template #bar>
      <HostLabel />
      <StatusLamps :state="state" />
    </template>

    <ModemSpectrum />

    <div class="relative z-1">
      <TerminalLog :lines="HANDSHAKE" replayable />

      <p class="mt-[clamp(24px,4vw,40px)] mb-2.5 text-step--1 tracking-[0.22em] text-(--p-300) uppercase">
        FRITZ!Box · Cloudflare
      </p>

      <!--
        The only glowing text on either page: bloom sells the CRT at display
        sizes and destroys anything smaller.
      -->
      <h1 class="m-0 text-step-3 font-semibold tracking-[-0.035em] text-(--p-100) text-shadow-(--glow)">
        DynDNS<span class="cursor" aria-hidden="true" />
      </h1>

      <p class="mt-4.5 max-w-[46ch] text-step-1 text-(--p-200)">
        Beep boop. There's nothing to see here — this is an API. Point your
        FRITZ!Box at it and it keeps your Cloudflare
        <b class="font-semibold text-(--p-100)">A</b> and
        <b class="font-semibold text-(--p-100)">AAAA</b> records aimed at home,
        every time your IP changes.
      </p>

      <div class="mt-[clamp(26px,4vw,38px)] flex flex-wrap gap-(--sp-3)">
        <!--
          The live Scalar reference rather than the README: it is one path away
          and it is what a visitor actually came for. The clickdummy pointed both
          buttons at the repo only because /api was out of prototype scope.
        -->
        <BracketButton to="/api/" tone="primary" external>
          API docs →
        </BracketButton>
        <BracketButton :to="REPO" target="_blank" rel="noopener noreferrer" external>
          GitHub
        </BracketButton>
        <ModemToggle />
      </div>
    </div>

    <template #foot>
      <span>v{{ config.public.version }}</span>
      <span aria-hidden="true">·</span>
      <span>MIT</span>
      <span aria-hidden="true">·</span>
      <!--
        All three clauses are true of this codebase: colour mode is disabled so
        nothing is persisted, there is no analytics, and errors are scrubbed
        before they reach a log (server/utils/redactToken.ts).
      -->
      <span>no cookies, no analytics, no logs of your token</span>
      <span class="ml-auto">
        <ULink
          :to="`${REPO}#readme`"
          target="_blank"
          rel="noopener noreferrer"
          class="border-b border-(--crt-line-hi) text-(--p-200) no-underline hover:text-(--p-100)"
        >
          self-host it →
        </ULink>
      </span>
    </template>
  </PhosphorFrame>
</template>
