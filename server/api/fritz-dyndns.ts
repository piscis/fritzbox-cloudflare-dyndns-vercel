import Cloudflare from 'cloudflare'
import { first, select } from 'radash'

interface DnsRecord { id: string, proxied: boolean, ttl: number, zone_id: string, name: string, type: Cloudflare.RecordTypes, content: string }

export default defineEventHandler(async (event) => {
  const token = getQuery(event).token as string
  const { zone, record, ipv4, ipv6 } = getQuery(event)

  if (!token) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing token URL parameter.',
    })
  }

  if (!zone) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing zone URL parameter.',
    })
  }

  if (!record) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing record URL parameter.',
    })
  }

  if (!ipv4 && !ipv6) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing ipv4 or ipv6 URL parameter.',
    })
  }

  const cf = new Cloudflare({ token })

  const { result: zones } = await cf.zones.browse() as { result: { id: string, name: string }[] }

  if (!zones || zones.length <= 0) {
    throw createError({
      statusCode: 404,
      statusMessage: `Zone "${zone}" not found.`,
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

  const dnsRecords = await cf.dnsRecords.browse(zoneId) as { result: DnsRecord[] }

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

  if (ipv4 && !aRecord) {
    if (!zone) {
      throw createError({
        statusCode: 404,
        statusMessage: `A record for "${record}" does not exist.`,
      })
    }
  }

  if (ipv6 && !aaaaRecord) {
    if (!zone) {
      throw createError({
        statusCode: 404,
        statusMessage: `AAAA record for "${record}" does not exist.`,
      })
    }
  }

  try {
    if (ipv4 && aRecord && aRecord?.content !== ipv4) {
      await cf.dnsRecords.edit(zoneId, aRecord.id, {
        name: aRecord.name,
        type: aRecord.type,
        proxied: aRecord.proxied,
        ttl: aRecord.ttl,
        content: `${ipv4}`,
      } as Cloudflare.DnsRecordWithoutPriority)
    }

    if (ipv6 && aaaaRecord && aaaaRecord?.content !== ipv6) {
      await cf.dnsRecords.edit(zoneId, aaaaRecord.id, {
        name: aaaaRecord.name,
        type: aaaaRecord.type,
        proxied: aaaaRecord.proxied,
        ttl: aaaaRecord.ttl,
        content: `${ipv6}`,
      } as Cloudflare.DnsRecordWithoutPriority)
    }
  }
  catch (e) {
    throw createError({
      statusCode: 500,
      statusMessage: `Error updating record "${record}".`,
    })
  }

  setResponseStatus(event, 200)
  return { status: 'success', message: 'Update successful.' }
})
