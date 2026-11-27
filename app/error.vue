<script setup lang="ts">
import type { LogLine } from '~/components/TerminalLog.vue'
import type { RenderedError } from '~/utils/requestedPath'

const props = defineProps<{
  error?: RenderedError
}>()

const REPO = 'https://github.com/piscis/fritzbox-cloudflare-dyndns-vercel'

const STATUS_MESSAGES: Record<number, string> = {
  404: 'PAGE NOT FOUND',
  500: 'INTERNAL SERVER ERROR',
  503: 'SERVICE UNAVAILABLE',
}

const router = useRouter()

const code = computed(() => Number(props.error?.statusCode) || 500)
const isNotFound = computed(() => code.value === 404)
const statusMessage = computed(() => STATUS_MESSAGES[code.value] ?? 'ERROR')

const signal = computed(() => {
  if (isNotFound.value) {
    return 'NO CARRIER'
  }
  return code.value >= 500
    ? 'LINE BUSY'
    : 'ERROR'
})

const MAX_ECHOED_PATH = 96

const path = computed(() => {
  const pathOnly = requestedPath(props.error, router.currentRoute.value.fullPath)

  return pathOnly.length > MAX_ECHOED_PATH
    ? `${pathOnly.slice(0, MAX_ECHOED_PATH)}…`
    : pathOnly
})

const trace = computed<LogLine[]>(() => (isNotFound.value
  ? [
      { text: `ATDT ${path.value}` },
      { text: 'RINGING…' },
      { text: '✕ NO CARRIER', tone: 'hot' },
    ]
  : [
      { text: `ATDT ${path.value}` },
      { text: 'CONNECT — awaiting Cloudflare' },
      { text: '▲ LINE BUSY — upstream did not answer', tone: 'warn' },
    ]))
</script>

<template>
  <!--
    Nuxt renders error.vue *instead of* app.vue, so the <UApp> wrapper there does
    not apply here and has to be repeated. Everything <head>-related now comes
    from `app.head` in nuxt.config, because this file mounts no layout.
  -->
  <UApp>
    <PhosphorFrame :status="isNotFound ? '404' : '5xx'">
      <template #bar>
        <HostLabel />
        <StatusLamps :state="isNotFound ? 'notFound' : 'serverError'" />
      </template>

      <div class="grid items-center gap-[clamp(20px,4vw,48px)] min-[780px]:grid-cols-[minmax(0,1fr)_auto]">
        <div>
          <p class="m-0 mb-3 text-step--1 tracking-[0.22em] text-(--err-color)">
            ERROR {{ code }} · {{ statusMessage }}
          </p>

          <h1 class="m-0 text-[clamp(2.4rem,1.4rem+4.4vw,5rem)] leading-[0.88] font-bold tracking-[0.02em] text-(--err-color) text-shadow-(--glow)">
            {{ signal }}
          </h1>

          <p v-if="isNotFound" class="mt-5 max-w-[44ch] text-step-1 text-(--p-200)">
            The number you dialled is not in service. This host only answers on
            <code class="text-(--p-100)">/api</code> — everything else rings out.
          </p>
          <p v-else class="mt-5 max-w-[44ch] text-step-1 text-(--p-200)">
            All circuits are in use. This one is on us, not on you — your
            FRITZ!Box will retry on its own, and the records stay as they were.
          </p>

          <TerminalLog :lines="trace" live class="mt-5.5" />

          <div class="mt-[clamp(24px,4vw,34px)] flex flex-wrap gap-(--sp-3)">
            <!--
              Plain `to="/"` is enough: Nuxt's router registers an afterEach
              that clears the error on any successful client navigation, so no
              clearError call and no `external` full reload are needed.
            -->
            <BracketButton to="/" tone="primary">
              ← Redial
            </BracketButton>
            <!--
              `external` IS required here. /api is a Nitro route with no
              vue-router match, so without it NuxtLink hands the click to the
              router, which finds nothing and shows this very 404 — and it works
              on a hard reload, so typing the URL by hand never catches it.
            -->
            <BracketButton to="/api/" external>
              API docs
            </BracketButton>
          </div>
        </div>

        <ErrorArt :variant="isNotFound ? '404' : '5xx'" />
      </div>

      <template #foot>
        <span>{{ code }}</span>
        <span aria-hidden="true">·</span>
        <span>
          {{ isNotFound ? 'if something here should have worked,' : 'persistent?' }}
          <ULink
            :to="`${REPO}/issues`"
            target="_blank"
            rel="noopener noreferrer"
            class="border-b border-(--crt-line-hi) text-(--p-200) no-underline hover:text-(--p-100)"
          >
            {{ isNotFound ? 'tell us' : 'open an issue' }}
          </ULink>
        </span>
        <span class="ml-auto">
          <ULink
            :to="REPO"
            target="_blank"
            rel="noopener noreferrer"
            class="border-b border-(--crt-line-hi) text-(--p-200) no-underline hover:text-(--p-100)"
          >
            GitHub
          </ULink>
        </span>
      </template>
    </PhosphorFrame>
  </UApp>
</template>
