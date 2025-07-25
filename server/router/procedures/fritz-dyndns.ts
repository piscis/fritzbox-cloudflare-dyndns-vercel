import { ORPCError, os } from '@orpc/server'
import Cloudflare from 'cloudflare'
import { first, select } from 'radash'
import { z } from 'zod'
import useLogger from '~~/server/utils/useLogger'

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
  message: 'Missing ipv4 or ipv6 URL parameter.',
})

export const fritzDynDnsRoute = os
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
  .handler(async ({ input: { query } }) => {
    const { logger } = useLogger()

    try {
      const { token, zone, record, ipv4, ipv6 } = query

      const cf = new Cloudflare({ apiToken: token })
      const zones: Cloudflare.Zones.Zone[] = []

      for await (const zone of cf.zones.list()) {
        zones.push(zone)
      }

      if (!zones || zones.length <= 0) {
        throw new ORPCError('NOT_FOUND', {
          message: `Zone "${zone}" not found.`,
        })
      }

      const zoneId = first(zones.filter((z) => {
        if (z?.name === zone) {
          return true
        }
        else {
          return false
        }
      }), undefined)?.id || ''

      const dnsRecords = await cf.dns.records.list({ zone_id: zoneId })

      const aRecord = first(select(
        dnsRecords.result,
        r => r,
        r => r.type === 'A' && r.name === record,
      ), undefined)

      const aaaaRecord = first(select(
        dnsRecords.result,
        r => r,
        r => r.type === 'AAAA' && r.name === record,
      ), undefined)

      if (ipv4 && !aRecord && !zone) {
        throw new ORPCError('NOT_FOUND', {
          message: `A record for "${record}" does not exist.`,
        })
      }

      if (ipv6 && !aaaaRecord && !zone) {
        throw new ORPCError('NOT_FOUND', {
          message: `AAAA record for "${record}" does not exist.`,
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
      logger.error(e)

      if (e instanceof ORPCError) {
        throw e
      }
      else {
        throw new ORPCError('INTERNAL_SERVER_ERROR', {
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
