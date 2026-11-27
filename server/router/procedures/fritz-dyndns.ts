import type { H3Event } from 'h3'
import { ORPCError, os } from '@orpc/server'
import Cloudflare from 'cloudflare'
import { first, select } from 'radash'
import { z } from 'zod'
import noCacheHeaders from '~~/server/router/middlewares/noCacheHeaders'
import redactToken from '~~/server/utils/redactToken'
import useLogger from '~~/server/utils/useLogger'
import { aaaaRecordNotFound, aRecordNotFound, MISSING_IP_MESSAGE, zoneNotFound } from '~~/shared/dyndnsMessages'

const responseBodySchema = z.object({
  state: z.string(),
  message: z.string(),
})

const querySchema = z.object({
  token: z.string().describe('Cloudflare API token.'),
  zone: z.string().describe('Cloudflare zone.'),
  record: z.string().describe('Cloudflare record.'),
  ipv4: z.string().optional().describe('IPv4 address.'),
  ipv6: z.string().optional().describe('ipv6 address.'),
}).refine(data => data.ipv4 || data.ipv6, {
  message: MISSING_IP_MESSAGE,
})

export const fritzDynDnsRoute = os
  .$context<{ nitroContext: H3Event }>()
  .use(noCacheHeaders)
  .route({
    method: 'GET',
    path: '/fritz-dyndns',
    tags: ['DNS'],
    successStatus: 200,
    summary: 'Update Cloudflare DNS record',
    description: `
This endpoints updates the **A-** and **AAAA-** records of a Cloudflare DNS zone. 
It is used to update the IP address of a Fritz!Box to a **Cloudflare DNS record**. 
Please make sure to provide one value for **ipv4** or **ipv6**.
    `,
    inputStructure: 'detailed',
    outputStructure: 'detailed',
  })
  .input(z.object({
    query: querySchema,
  }))
  .output(z.object({
    status: z.literal(200).describe('If the update was successful'),
    body: responseBodySchema,
  }))
  .errors({
    INTERNAL_SERVER_ERROR: {
      status: 503,
      message: 'Service Unavailable',
    },
    NOT_FOUND: {
      status: 404,
      message: 'Not Found',
    },
  })
  .handler(async ({ input: { query }, errors }) => {
    const { logger } = useLogger()

    try {
      const { token, zone, record, ipv4, ipv6 } = query

      const cf = new Cloudflare({ apiToken: token })
      const zones: Cloudflare.Zones.Zone[] = []

      for await (const cfZone of cf.zones.list()) {
        zones.push(cfZone)
      }

      const zoneId = first(zones.filter(z => z?.name === zone), undefined)?.id

      if (!zoneId) {
        throw errors.NOT_FOUND({
          message: zoneNotFound(zone),
        })
      }

      const dnsRecords: Cloudflare.DNS.RecordResponse[] = []

      for await (const dnsRecord of cf.dns.records.list({ zone_id: zoneId })) {
        dnsRecords.push(dnsRecord)
      }

      const aRecord = first(select(
        dnsRecords,
        r => r,
        r => r.type === 'A' && r.name === record,
      ), undefined)

      const aaaaRecord = first(select(
        dnsRecords,
        r => r,
        r => r.type === 'AAAA' && r.name === record,
      ), undefined)

      if (ipv4 && !aRecord) {
        throw errors.NOT_FOUND({
          message: aRecordNotFound(record),
        })
      }

      if (ipv6 && !aaaaRecord) {
        throw errors.NOT_FOUND({
          message: aaaaRecordNotFound(record),
        })
      }

      if (ipv4 && aRecord && aRecord?.content !== ipv4) {
        await cf.dns.records.update(aRecord.id, {
          zone_id: zoneId,
          name: aRecord.name,
          type: aRecord.type,
          proxied: aRecord.proxied,
          ttl: aRecord.ttl,
          content: `${ipv4}`,
        })
      }

      if (ipv6 && aaaaRecord && aaaaRecord?.content !== ipv6) {
        await cf.dns.records.update(aaaaRecord.id, {
          zone_id: zoneId,
          name: aaaaRecord.name,
          type: aaaaRecord.type,
          proxied: aaaaRecord.proxied,
          ttl: aaaaRecord.ttl,
          content: `${ipv6}`,
        })
      }
    }
    catch (e) {
      logger.error(redactToken(e, query.token))

      if (e instanceof ORPCError) {
        throw e
      }
      else {
        throw errors.INTERNAL_SERVER_ERROR({
          message: 'Service Unavailable',
        })
      }
    }

    return {
      status: 200,
      body: {
        state: 'success',
        message: 'Update successful.',
      },
    }
  })
