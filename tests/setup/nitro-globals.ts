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
import pkg from '../../package.json'

Object.assign(globalThis, {
  defineEventHandler,
  getRequestURL,
  sendRedirect,
  setResponseStatus,
  toWebRequest,
  defineNitroPlugin: <T>(fn: T) => fn,
  // The `unit` project never builds Nuxt, so nuxt.config.ts's `runtimeConfig`
  // is not in play. Return the keys server code reads, in the shape it declares,
  // so the handler reads them exactly as it does in production.
  useRuntimeConfig: () => ({
    public: { version: pkg.version },
  }),
})
