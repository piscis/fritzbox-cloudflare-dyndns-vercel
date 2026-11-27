import {
  defineEventHandler,
  getRequestURL,
  sendRedirect,
  setResponseStatus,
  toWebRequest,
} from 'h3'
import pkg from '~~/package.json'

Object.assign(globalThis, {
  defineEventHandler,
  getRequestURL,
  sendRedirect,
  setResponseStatus,
  toWebRequest,
  defineNitroPlugin: <T>(fn: T) => fn,
  useRuntimeConfig: () => ({
    public: { version: pkg.version },
  }),
})
