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
  // nuxt.config.ts declares no runtimeConfig, so this mirrors production: both
  // appName and appVersion are undefined and the OpenAPI info falls back.
  useRuntimeConfig: () => ({}),
})
