/**
 * Nitro/Nuxt auto-imports used as bare identifiers in `server/`.
 *
 * The `unit` project runs in plain Node with no Nuxt build, so these would
 * otherwise be ReferenceErrors. Putting them on `globalThis` reproduces what
 * Nitro's auto-import does at build time.
 */
import {
  defineEventHandler,
  getRequestURL,
  sendRedirect,
  setResponseStatus,
  toWebRequest,
} from 'h3'

Object.assign(globalThis, {
  defineEventHandler,
  getRequestURL,
  sendRedirect,
  setResponseStatus,
  toWebRequest,
  defineNitroPlugin: <T>(fn: T) => fn,
  // The `unit` project never builds Nuxt, so nuxt.config.ts's `runtimeConfig`
  // is not in play. An empty object exercises the fallback in
  // `server/routes/api/[...].ts`: with no `public.version`, the OpenAPI info
  // reports 0.0.0. The real version is asserted in tests/e2e, which builds.
  useRuntimeConfig: () => ({}),
})
