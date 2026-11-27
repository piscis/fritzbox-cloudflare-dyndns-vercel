import { OpenAPIHandler } from '@orpc/openapi/fetch'
import { OpenAPIReferencePlugin } from '@orpc/openapi/plugins'
import { onError } from '@orpc/server'
import { ZodSmartCoercionPlugin } from '@orpc/zod'
import { ZodToJsonSchemaConverter } from '@orpc/zod/zod4'
import { router } from '~~/server/router'
import redactToken from '~~/server/utils/redactToken'
import useLogger from '~~/server/utils/useLogger'

const { logger } = useLogger()
const { version } = useRuntimeConfig().public

const openAPIHandler = new OpenAPIHandler(router, {
  eventIteratorKeepAliveEnabled: true,
  eventIteratorKeepAliveInterval: 5000,
  eventIteratorKeepAliveComment: 'keep-alive',
  interceptors: [
    onError((error) => {
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
          version,
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
