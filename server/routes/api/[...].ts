import { OpenAPIHandler } from '@orpc/openapi/fetch'
import { OpenAPIReferencePlugin } from '@orpc/openapi/plugins'
import { onError } from '@orpc/server'
import { ZodSmartCoercionPlugin } from '@orpc/zod'
import { ZodToJsonSchemaConverter } from '@orpc/zod/zod4'
import { router } from '~~/server/router'
import redactToken from '~~/server/utils/redactToken'
import useLogger from '~~/server/utils/useLogger'

const { logger } = useLogger()
// `public.version` is `package.json`'s version, injected by nuxt.config.ts, so
// the spec reports the released version instead of a placeholder. The landing
// page foot line reads the same key, so the two can never disagree.
//
// This used to destructure top-level `appName`/`appVersion`, which nothing ever
// declared, so every deployed environment served `info.version: "0.0.0"`.
// `public` is still undefined in the `unit` project, which stubs
// `useRuntimeConfig()` with an empty object, hence the fallback below.
const { public: publicConfig } = useRuntimeConfig()

const openAPIHandler = new OpenAPIHandler(router, {
  eventIteratorKeepAliveEnabled: true,
  eventIteratorKeepAliveInterval: 5000,
  eventIteratorKeepAliveComment: 'keep-alive',
  interceptors: [
    onError((error) => {
      // No token in scope here, so this is the pattern-based pass only — it
      // still catches `?token=…` and `Bearer …` in a serialised request.
      logger.error(redactToken(error))
    }),
  ],
  plugins: [
    new ZodSmartCoercionPlugin(),
    new OpenAPIReferencePlugin({
      schemaConverters: [
        new ZodToJsonSchemaConverter(),
      ],
      specGenerateOptions: {
        info: {
          title: 'Fritzbox Cloudflare DynDNS',
          version: publicConfig?.version as string || '0.0.0',
        },
      },
    }),
  ],
})

export default defineEventHandler(async (event) => {
  const req = toWebRequest(event)

  const { matched, response } = await openAPIHandler.handle(req, {
    prefix: '/api',
    context: {
      nitroContext: event,
    },
  })

  if (!matched) {
    setResponseStatus(event, 404, 'Not Found')
    return 'Not Found'
  }

  return response
})
