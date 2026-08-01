<script setup lang="ts">
import type { NuxtError } from '#app'
import type { LogLine } from '~/components/TerminalLog.vue'

const props = defineProps<{
  error?: NuxtError
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
  return code.value >= 500 ? 'LINE BUSY' : 'ERROR'
})

/**
 * Echoing the path back is the single most useful thing a 404 can do, and it
 * has three sources depending on how we got here.
 *
 * `url` is set on every server-rendered error but is absent on client-side
 * navigation, where Nuxt's router 404 puts the path in `data.path` instead. It
 * is real at runtime yet missing from the public `NuxtError` type, hence the
 * cast. `data` itself is dropped for unhandled or fatal errors, so `url` leads.
 */
const MAX_ECHOED_PATH = 96

const path = computed(() => {
  const error = props.error as (NuxtError & { url?: string }) | undefined
  const data = error?.data
  const fromData = typeof data === 'object' && data !== null
    ? (data as { path?: string }).path
    : undefined

  const requested = error?.url || fromData || router.currentRoute.value.fullPath

  /**
   * Strip the query and hash before echoing anything back.
   *
   * `error.url` is `pathname + search + hash`, and this service's Cloudflare
   * credential travels in the query string (`?token=…`) because a FRITZ!Box
   * cannot send headers. A mistyped update URL would otherwise render a live,
   * unexpired API token into the 404 — and into any screenshot or edge log of
   * that render. Same reason server/utils/redactToken.ts exists.
   */
  const pathOnly = requested.split(/[?#]/)[0] || '/'

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
