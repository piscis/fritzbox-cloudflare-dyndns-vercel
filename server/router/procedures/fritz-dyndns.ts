import type { H3Event } from 'h3'
import { ORPCError, os } from '@orpc/server'
import Cloudflare from 'cloudflare'
import { first, select } from 'radash'
import { z } from 'zod'
import noCacheHeaders from '~~/server/router/middlewares/noCacheHeaders'
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

      // Renamed from `zone`, which shadowed the query parameter of the same name.
      for await (const cfZone of cf.zones.list()) {
        zones.push(cfZone)
      }

      // Previously fell back to '' and then issued a doomed
      // records.list({ zone_id: '' }) instead of reporting the missing zone.
      const zoneId = first(zones.filter(z => z?.name === zone), undefined)?.id

      if (!zoneId) {
        throw errors.NOT_FOUND({
          message: `Zone "${zone}" not found.`,
        })
      }

      // `dnsRecords.result` is only the first page. A zone with more records
      // than fit on one page would silently hide the target record.
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

      // Was `if (ipv4 && !aRecord && !zone)`. `zone` is a required non-empty
      // string, so `!zone` was always false and this branch was unreachable —
      // a request naming a record that does not exist returned 200 having
      // updated nothing.
      if (ipv4 && !aRecord) {
        throw errors.NOT_FOUND({
          message: `A record for "${record}" does not exist.`,
        })
      }

      if (ipv6 && !aaaaRecord) {
        throw errors.NOT_FOUND({
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
        // Was `new ORPCError('INTERNAL_SERVER_ERROR', ...)`, which resolves to
        // status 500 — the `.errors({ status: 503 })` declaration above is only
        // applied through the injected `errors` constructor map.
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
