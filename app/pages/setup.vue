<script setup lang="ts">
import type { Field } from '~/components/FieldList.vue'

/**
 * The FRITZ!Box setup guide: four steps on one scrolling page, so the visitor
 * can flip between the Cloudflare dashboard, the FRITZ!Box admin page and this
 * tab without losing their place.
 *
 * Everything is a placeholder (`fritz.example.com` in `example.com`, both IP
 * families), so the prerendered HTML reads correctly on its own. The token is
 * never an input here: the Update URL keeps the FRITZ!Box's own `<pass>`, and
 * the visitor types the token into the FRITZ!Box Password field.
 *
 * Menu paths stay in text, because the FRITZ!Box admin UI moves between
 * firmware versions and text is the cheapest thing to update.
 */
const HOSTNAME = 'fritz.example.com'
const ZONE = 'example.com'
const RECORD_NAME = 'fritz'

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
    { src: '/setup/fritzbox-dyndns.png', alt: 'The FRITZ!Box DynDNS tab under Internet → Permit Access, with Use DynDNS ticked and the Update URL, domain name, username and password fields filled in' },
  ],
} as const

const TOKEN_FIELDS: Field[] = [
  { label: 'Permission', value: 'Zone · Zone · Read' },
  { label: 'Permission', value: 'Zone · DNS · Edit' },
  { label: 'Zone Resources', value: `Include · Specific zone · ${ZONE}` },
]

const RECORD_DEFAULTS: Field[] = [
  { label: 'Name', value: RECORD_NAME, note: `the part of ${HOSTNAME} before .${ZONE}` },
]

const A_RECORD: Field[] = [
  { label: 'Type', value: 'A' },
  ...RECORD_DEFAULTS,
  { label: 'IPv4 address', value: '192.0.2.1', note: 'any IPv4 works until the first update' },
  { label: 'Proxy status', value: 'DNS only' },
  { label: 'TTL', value: '1 min' },
]

const AAAA_RECORD: Field[] = [
  { label: 'Type', value: 'AAAA' },
  ...RECORD_DEFAULTS,
  { label: 'IPv6 address', value: '2001:db8::1', note: 'any IPv6 works until the first update' },
  { label: 'Proxy status', value: 'DNS only' },
  { label: 'TTL', value: '1 min' },
]

// `<pass>`, `<ipaddr>` and `<ip6addr>` stay literal: the FRITZ!Box substitutes
// them itself on every update.
const updateUrl = computed(() =>
  `https://${host.value}/api/fritz-dyndns/?token=<pass>&record=${HOSTNAME}&zone=${ZONE}&ipv4=<ipaddr>&ipv6=<ip6addr>`,
)

const fritzboxFields = computed<Field[]>(() => [
  { label: 'DynDNS provider (DynDNS-Anbieter)', value: 'User-defined', note: '(Benutzerdefiniert)' },
  { label: 'Update URL (Update-URL)', value: updateUrl.value },
  { label: 'Domain name (Domainname)', value: HOSTNAME, note: 'the full hostname from the Update URL' },
  { label: 'Username (Benutzername)', value: 'fritz', note: 'any value, the service ignores it' },
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
    fix: 'Create the A record from step 02, or remove ipv4=<ipaddr> from the Update URL if you only want IPv6.',
  },
  {
    message: `AAAA record for "${HOSTNAME}" does not exist.`,
    fix: 'Create the AAAA record from step 02, or remove ipv6=<ip6addr> from the Update URL if you only want IPv4.',
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
        <FieldList :fields="TOKEN_FIELDS" />
        <p>
          Under <em>Zone Resources → Include → Specific zone</em>, pick the one zone your FRITZ!Box
          lives in. Then a leaked token can't touch your other domains.
        </p>
        <p class="note">
          Your token travels to this Instance in the Update URL on every update. It is never
          logged, but whoever operates this Instance could read it.
          If that's not good enough,
          <ULink
            :to="SELF_HOST_URL"
            target="_blank"
            rel="noopener noreferrer"
            class="border-b border-(--crt-line-hi) text-(--p-100) no-underline hover:text-(--fritz-yellow)"
          >
            run your own →
          </ULink>
        </p>
        <details class="shot">
          <summary>show screenshot ▸</summary>
          <img v-for="shot in SCREENSHOTS.token" :key="shot.src" :src="shot.src" :alt="shot.alt" loading="lazy">
        </details>
      </section>

      <section aria-labelledby="step-records">
        <h2 id="step-records">
          <span class="step-number">{{ STEPS.records.number }}</span> {{ STEPS.records.title }}
        </h2>
        <p>
          The service only updates existing records and never creates them, so create them once by
          hand. In Cloudflare, open <em>your domain → DNS → Records → Add record</em>.
        </p>
        <h3>A record, for IPv4</h3>
        <FieldList :fields="A_RECORD" />
        <h3>AAAA record, for IPv6</h3>
        <FieldList :fields="AAAA_RECORD" />
        <p>
          Skip the record for an IP family your line doesn't have, and drop its parameter from the
          Update URL in step 03.
        </p>
        <details class="shot">
          <summary>show screenshot ▸</summary>
          <img v-for="shot in SCREENSHOTS.records" :key="shot.src" :src="shot.src" :alt="shot.alt" loading="lazy">
        </details>
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
        <details class="shot">
          <summary>show screenshot ▸</summary>
          <img v-for="shot in SCREENSHOTS.fritzbox" :key="shot.src" :src="shot.src" :alt="shot.alt" loading="lazy">
        </details>
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
            have no public IPv4 (DS-Lite): delete the A record and drop
            <code>ipv4=&lt;ipaddr&gt;</code> from the Update URL.
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

.setup .shot {
  margin-top: var(--sp-4);
}

.setup .shot summary {
  display: inline-block;
  cursor: pointer;
  list-style: none;
  border-bottom: 1px solid var(--crt-line-hi);
  color: var(--p-300);
}

.setup .shot summary::-webkit-details-marker {
  display: none;
}

.setup .shot summary:hover,
.setup .shot summary:focus-visible {
  color: var(--p-100);
}

.setup .shot img {
  display: block;
  margin-top: var(--sp-3);
  max-width: 100%;
  height: auto;
  border: 1px solid var(--crt-line-hi);
}
</style>
