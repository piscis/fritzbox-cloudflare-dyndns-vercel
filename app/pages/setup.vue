<script setup lang="ts">
import type { Field } from '~/components/FieldList.vue'

/**
 * The FRITZ!Box setup guide: four steps on one scrolling page, so the visitor
 * can flip between the Cloudflare dashboard, the FRITZ!Box admin page and this
 * tab without losing their place.
 *
 * Step 02 opens with a small builder: hostname, zone and IP families. Steps 02
 * and 03 then show the visitor's own values, ready to copy. Until they type,
 * and without JS, every value is a placeholder (`fritz.example.com` in
 * `example.com`, both IP families), so the prerendered HTML reads correctly on
 * its own. The token is never an input here: the Update URL keeps the
 * FRITZ!Box's own `<pass>`, and the visitor types the token into the FRITZ!Box
 * Password field. Nothing is sent anywhere or stored.
 *
 * Menu paths stay in text, because the FRITZ!Box admin UI moves between
 * firmware versions and text is the cheapest thing to update.
 */
const HOSTNAME = 'fritz.example.com'
const ZONE = 'example.com'

/** The last two labels, the zone in the common case (`example.com`). */
function guessZone(hostname: string): string {
  return hostname.split('.').slice(-2).join('.')
}

/**
 * The server compares names exactly, so a typed name is lowercased, trimmed
 * and loses one trailing dot (`Fritz.Example.com.` → `fritz.example.com`)
 * before it reaches an output, the zone guess or a check. The fields keep what
 * the visitor typed.
 */
function normalizeName(name: string): string {
  return name.trim().toLowerCase().replace(/\.$/, '')
}

// Builder state lives in memory only: no localStorage, no cookies, no query
// string. An empty field falls back to the placeholder, so the page reads the
// same before any input as it does prerendered and without JS.
const hostnameInput = ref('')
const zoneEdit = ref<string | null>(null)

const zoneInput = computed({
  // Auto-filled from the hostname until the visitor edits it; then the edit
  // sticks, for zones like `example.co.uk`.
  get: () => zoneEdit.value ?? (normalizeName(hostnameInput.value) ? guessZone(normalizeName(hostnameInput.value)) : ''),
  set: (value: string) => {
    zoneEdit.value = value
  },
})

const IP_CHOICES = [
  { value: 'both', label: 'IPv4 + IPv6' },
  { value: 'ipv4', label: 'IPv4 only' },
  { value: 'ipv6', label: 'IPv6 only' },
] as const

const ipChoice = ref<typeof IP_CHOICES[number]['value']>('both')
const wantsIpv4 = computed(() => ipChoice.value !== 'ipv6')
const wantsIpv6 = computed(() => ipChoice.value !== 'ipv4')

const hostname = computed(() => normalizeName(hostnameInput.value) || HOSTNAME)
const zone = computed(() => normalizeName(zoneInput.value) || guessZone(hostname.value))

const config = useRuntimeConfig()
const { state } = useHealthCheck()
const host = useSiteHost()

const STEPS = {
  token: { number: '01', title: 'Cloudflare token' },
  records: { number: '02', title: 'DNS records' },
  fritzbox: { number: '03', title: 'FRITZ!Box' },
  check: { number: '04', title: 'Check it' },
} as const

/**
 * One closed "show screenshot" toggle per step, for a visitor unsure whether
 * they're on the right screen. The files live in `public/setup/`, where the
 * README renders them from too, and load only once a toggle opens.
 */
const SCREENSHOTS = {
  token: [
    { src: '/setup/cloudflare-token.png', alt: 'Cloudflare\'s Create Custom Token form: the permissions Zone · Zone · Read and Zone · DNS · Edit, and Zone Resources set to Include · Specific zone' },
  ],
  records: [
    { src: '/setup/a-record.png', alt: 'Cloudflare\'s Add record form for an A record: a name, a placeholder IPv4 address, proxy status DNS only, TTL 1 min' },
    { src: '/setup/aaaa-record.png', alt: 'Cloudflare\'s Add record form for an AAAA record: a name, a placeholder IPv6 address, proxy status DNS only' },
  ],
  fritzbox: [
    { src: '/setup/fritzbox-dyndns.png', alt: 'The FRITZ!Box DynDNS tab in the German interface, under Internet → Freigaben, with DynDNS aktiv ticked and the Update-URL, Domainnamen, Benutzername and Kennwort fields filled in' },
  ],
} as const

const tokenFields = computed<Field[]>(() => [
  { label: 'Permission', value: 'Zone · Zone · Read' },
  { label: 'Permission', value: 'Zone · DNS · Edit' },
  { label: 'Zone Resources', value: `Include · Specific zone · ${zone.value}` },
])

const inZone = computed(() => hostname.value === zone.value || hostname.value.endsWith(`.${zone.value}`))

// Letters, digits and hyphens per label, no hyphen at either end of a label.
// Catches a pasted scheme or path, spaces and empty labels.
const HOSTNAME_PATTERN = /^[a-z\d](?:[a-z\d-]*[a-z\d])?(?:\.[a-z\d](?:[a-z\d-]*[a-z\d])?)*$/i

// Warnings never hide the outputs: an unusual setup may still be right.
const warnings = computed(() => [
  ...(HOSTNAME_PATTERN.test(hostname.value)
    ? []
    : [`${hostname.value} does not look like a hostname: use only letters, digits, hyphens and dots, with no https:// or path.`]),
  ...(inZone.value
    ? []
    : [`${hostname.value} is not ${zone.value} and does not end in .${zone.value}, so Cloudflare will not find the record in that zone.`]),
])

// Cloudflare's Name field takes the hostname minus the zone, `@` for the apex.
const recordName = computed<Field>(() => {
  if (hostname.value === zone.value)
    return { label: 'Name', value: '@', note: `the zone apex, ${zone.value} itself` }
  if (inZone.value) {
    const name = hostname.value.slice(0, -zone.value.length - 1)
    return { label: 'Name', value: name, note: `the part of ${hostname.value} before .${zone.value}` }
  }
  return { label: 'Name', value: hostname.value, note: `${hostname.value} is not in ${zone.value}` }
})

/** The Add record form for one IP family, with a documentation address as placeholder. */
function recordFields(type: 'A' | 'AAAA', family: 'IPv4' | 'IPv6', placeholder: string): Field[] {
  return [
    { label: 'Type', value: type },
    recordName.value,
    { label: `${family} address`, value: placeholder, note: `any ${family} works until the first update` },
    { label: 'Proxy status', value: 'DNS only' },
    { label: 'TTL', value: '1 min' },
  ]
}

const aRecord = computed(() => recordFields('A', 'IPv4', '192.0.2.1'))
const aaaaRecord = computed(() => recordFields('AAAA', 'IPv6', '2001:db8::1'))

// `<pass>`, `<ipaddr>` and `<ip6addr>` stay literal: the FRITZ!Box substitutes
// them itself on every update.
const updateUrl = computed(() =>
  `https://${host.value}/api/fritz-dyndns/?token=<pass>&record=${hostname.value}&zone=${zone.value}${
    wantsIpv4.value ? '&ipv4=<ipaddr>' : ''
  }${wantsIpv6.value ? '&ipv6=<ip6addr>' : ''}`,
)

const fritzboxFields = computed<Field[]>(() => [
  { label: 'DynDNS provider (DynDNS-Anbieter)', value: 'User-defined', note: '(Benutzerdefiniert)' },
  { label: 'Update URL (Update-URL)', value: updateUrl.value, copy: true },
  { label: 'Domain name (Domainname)', value: hostname.value, note: 'the full hostname from the Update URL', copy: true },
  { label: 'Username (Benutzername)', value: 'fritz', note: 'any value, the service ignores it', copy: true },
  { label: 'Password (Kennwort)', value: '●●●●●●', note: 'your Cloudflare API token from step 01' },
])

/**
 * Copied from the `fritz-dyndns` procedure word for word, with the
 * placeholders filled in. The page test pins these copies and the procedure
 * tests pin the originals, so a reworded server message fails one of them.
 */
const TROUBLE = [
  {
    message: `Zone "${ZONE}" not found.`,
    fix: 'The zone is misspelled, or the token is not scoped to it. Check the zone parameter against the domain name in Cloudflare, and the token\'s Zone Resources against step 01.',
  },
  {
    message: `A record for "${HOSTNAME}" does not exist.`,
    fix: 'Create the A record from step 02. If your line has no IPv4, pick IPv6 only under IP families in step 02 and copy the Update URL again.',
  },
  {
    message: `AAAA record for "${HOSTNAME}" does not exist.`,
    fix: 'Create the AAAA record from step 02. If your line has no IPv6, pick IPv4 only under IP families in step 02 and copy the Update URL again.',
  },
  {
    message: 'Missing ipv4 or ipv6 URL parameter.',
    fix: 'A placeholder got deleted from the Update URL. Copy it again from step 03.',
  },
] as const
</script>

<template>
  <PhosphorFrame>
    <template #bar>
      <HostLabel />
      <StatusLamps :state="state" />
    </template>

    <div class="setup relative z-1 text-step-0 text-(--p-200)">
      <!--
        The foot line's "← home" sits below four long steps, so the way back
        also opens the page.
      -->
      <BracketButton to="/" tone="quiet" class="mb-(--sp-4)">
        ← home
      </BracketButton>

      <p class="mb-2.5 text-step--1 tracking-[0.22em] text-(--p-300) uppercase">
        FRITZ!Box · Cloudflare
      </p>

      <h1 class="m-0 text-step-3 font-semibold tracking-[-0.035em] text-(--p-100) text-shadow-(--glow)">
        Setup<span class="cursor" aria-hidden="true" />
      </h1>

      <p class="mt-4.5 max-w-[60ch] text-step-1">
        Four steps, about ten minutes. The examples use
        <code class="text-(--p-100)">{{ HOSTNAME }}</code> in the zone
        <code class="text-(--p-100)">{{ ZONE }}</code>; put in your own wherever they appear.
      </p>

      <section aria-labelledby="step-token">
        <h2 id="step-token">
          <span class="step-number">{{ STEPS.token.number }}</span> {{ STEPS.token.title }}
        </h2>
        <p>
          In Cloudflare, open <em>My Profile → API Tokens → Create Token → Create Custom Token</em>
          and give the token these two permissions, <b>Zone.Zone Read</b> and <b>Zone.DNS Edit</b>:
        </p>
        <FieldList :fields="tokenFields" />
        <p>
          Under <em>Zone Resources → Include → Specific zone</em>, pick the one zone your FRITZ!Box
          lives in. Then a leaked token can't touch your other domains.
        </p>
        <p class="note">
          Your token travels to this Instance in the Update URL on every update. It is never
          logged, but whoever operates this Instance could read it.
          If that's not good enough,
          <ULink
            :to="RUN_YOUR_OWN_URL"
            target="_blank"
            rel="noopener noreferrer"
            class="border-b border-(--crt-line-hi) text-(--p-100) no-underline hover:text-(--fritz-yellow)"
          >
            run your own →
          </ULink>
        </p>
        <ScreenshotToggle :shots="SCREENSHOTS.token" />
      </section>

      <section aria-labelledby="step-records">
        <h2 id="step-records">
          <span class="step-number">{{ STEPS.records.number }}</span> {{ STEPS.records.title }}
        </h2>
        <div class="builder">
          <label for="setup-hostname">Hostname <span>the name your FRITZ!Box should get</span></label>
          <input
            id="setup-hostname"
            v-model="hostnameInput"
            type="text"
            inputmode="url"
            autocomplete="off"
            autocapitalize="off"
            spellcheck="false"
            :placeholder="HOSTNAME"
          >
          <label for="setup-zone">Zone <span>your domain in Cloudflare</span></label>
          <input
            id="setup-zone"
            v-model="zoneInput"
            type="text"
            inputmode="url"
            autocomplete="off"
            autocapitalize="off"
            spellcheck="false"
            :placeholder="guessZone(hostname)"
          >
          <fieldset>
            <legend>IP families <span>the ones your line has</span></legend>
            <span v-for="choice in IP_CHOICES" :key="choice.value" class="choice">
              <input
                :id="`setup-ip-${choice.value}`"
                v-model="ipChoice"
                type="radio"
                name="setup-ip"
                :value="choice.value"
              >
              <label :for="`setup-ip-${choice.value}`">{{ choice.label }}</label>
            </span>
          </fieldset>
        </div>
        <p v-for="warning in warnings" :key="warning" role="alert" class="warning">
          {{ warning }}
        </p>
        <p>
          The service only updates existing records and never creates them, so create them once by
          hand. In Cloudflare, open <em>your domain → DNS → Records → Add record</em>.
        </p>
        <template v-if="wantsIpv4">
          <h3>A record, for IPv4</h3>
          <FieldList :fields="aRecord" />
        </template>
        <template v-if="wantsIpv6">
          <h3>AAAA record, for IPv6</h3>
          <FieldList :fields="aaaaRecord" />
        </template>
        <p>
          Skip the record for an IP family your line doesn't have: pick the IP families above that
          it does have, and the Update URL in step 03 follows.
        </p>
        <ScreenshotToggle :shots="SCREENSHOTS.records" />
      </section>

      <section aria-labelledby="step-fritzbox">
        <h2 id="step-fritzbox">
          <span class="step-number">{{ STEPS.fritzbox.number }}</span> {{ STEPS.fritzbox.title }}
        </h2>
        <p>
          In the FRITZ!Box admin page, open <em>Internet → Permit Access → DynDNS</em>
          <em>(Internet → Freigaben → DynDNS)</em>, tick <em>Use DynDNS (DynDNS benutzen)</em> and
          fill in:
        </p>
        <FieldList :fields="fritzboxFields" />
        <p>
          The token goes into the Password field and nowhere else: the FRITZ!Box puts it in place
          of <code>&lt;pass&gt;</code>, and <code>&lt;ipaddr&gt;</code> /
          <code>&lt;ip6addr&gt;</code> become your current addresses. Click
          <em>Apply (Übernehmen)</em>.
        </p>
        <ScreenshotToggle :shots="SCREENSHOTS.fritzbox" />
      </section>

      <section aria-labelledby="step-check">
        <h2 id="step-check">
          <span class="step-number">{{ STEPS.check.number }}</span> {{ STEPS.check.title }}
        </h2>
        <ul class="checklist">
          <li>The FRITZ!Box DynDNS status on the same tab reports a successful update.</li>
          <li>
            In Cloudflare, the records from step 02 now hold your real IP instead of the
            placeholder.
          </li>
        </ul>
        <p>
          If not, the FRITZ!Box event log, <em>System → Event Log (System → Ereignisse)</em>, shows
          the service's answer:
        </p>
        <dl class="trouble">
          <template v-for="entry in TROUBLE" :key="entry.message">
            <dt><code>{{ entry.message }}</code></dt>
            <dd>{{ entry.fix }}</dd>
          </template>
          <dt>The record still holds the placeholder IP</dt>
          <dd>
            Proxy status is set to Proxied: switch it to DNS only. For the A record, your line may
            have no public IPv4 (DS-Lite): delete the A record, pick IPv6 only under IP families in
            step 02 and copy the Update URL again.
          </dd>
        </dl>
      </section>
    </div>

    <template #foot>
      <span>v{{ config.public.version }}</span>
      <span aria-hidden="true">·</span>
      <span>MIT</span>
      <span aria-hidden="true">·</span>
      <span>no cookies, no analytics, no logs of your token</span>
      <span class="ml-auto">
        <ULink
          to="/"
          class="border-b border-(--crt-line-hi) text-(--p-200) no-underline hover:text-(--p-100)"
        >
          ← home
        </ULink>
      </span>
    </template>
  </PhosphorFrame>
</template>

<style scoped>
.setup section {
  margin-top: clamp(36px, 6vw, 56px);
  max-width: 72ch;
}

.setup h2 {
  margin: 0 0 var(--sp-4);
  font-size: var(--text-step-2);
  font-weight: 600;
  color: var(--p-100);
}

.setup .step-number {
  color: var(--fritz-yellow);
}

.setup h3 {
  margin: var(--sp-5) 0 var(--sp-2);
  font-size: var(--text-step-0);
  font-weight: 600;
  color: var(--p-100);
}

.setup p {
  margin: var(--sp-3) 0;
}

.setup em,
.setup b {
  font-style: normal;
  color: var(--p-100);
}

.setup .builder {
  display: grid;
  gap: var(--sp-2);
  margin: var(--sp-4) 0;
  border: 1px solid var(--crt-line);
  border-radius: var(--radius);
  background: var(--crt-screen);
  padding: var(--sp-4);
}

.setup .builder label,
.setup .builder legend {
  color: var(--p-100);
}

.setup .builder label span,
.setup .builder legend span {
  color: var(--p-300);
}

.setup .builder label span::before,
.setup .builder legend span::before {
  content: '— ';
}

.setup .builder input[type='text'] {
  margin-bottom: var(--sp-2);
  border: 1px solid var(--crt-line-hi);
  border-radius: var(--radius);
  background: var(--crt-void);
  padding: 0.5em 0.75em;
  font: inherit;
  color: var(--p-100);
  caret-color: var(--fritz-yellow);
}

.setup .builder input[type='text']::placeholder {
  color: var(--p-300);
}

.setup .builder input:focus-visible {
  outline: 2px solid var(--fritz-yellow);
  outline-offset: 2px;
}

.setup .builder fieldset {
  display: flex;
  flex-wrap: wrap;
  gap: var(--sp-2) var(--sp-5);
  margin: 0;
  border: 0;
  padding: 0;
}

.setup .builder legend {
  margin-bottom: var(--sp-2);
  padding: 0;
}

.setup .builder .choice {
  display: inline-flex;
  align-items: center;
  gap: var(--sp-2);
}

.setup .builder .choice input {
  accent-color: var(--fritz-yellow);
}

.setup .builder .choice label {
  color: var(--p-200);
  cursor: pointer;
}

.setup .warning {
  border-left: 2px solid var(--sig-amber);
  padding-left: var(--sp-3);
  color: var(--sig-amber);
}

.setup .warning::before {
  content: '! ';
}

.setup .note {
  border-left: 2px solid var(--sig-amber);
  padding-left: var(--sp-3);
}

.setup .checklist {
  margin: 0;
  padding: 0;
  list-style: none;
}

.setup .checklist li::before {
  content: '✓ ';
  color: var(--p-leaf);
}

.setup .trouble dt {
  margin-top: var(--sp-3);
  color: var(--p-100);
}

.setup .trouble dt code {
  color: var(--sig-red);
}

.setup .trouble dd {
  margin: var(--sp-1) 0 0 var(--sp-4);
}
</style>
