/**
 * The error messages the `fritz-dyndns` procedure sends back, which the FRITZ!Box
 * shows in its event log. The setup guide quotes them in its troubleshooting
 * list, so both sides import them from here instead of keeping copies.
 */

export const MISSING_IP_MESSAGE = 'Missing ipv4 or ipv6 URL parameter.'

export function zoneNotFound(zone: string): string {
  return `Zone "${zone}" not found.`
}

export function aRecordNotFound(record: string): string {
  return `A record for "${record}" does not exist.`
}

export function aaaaRecordNotFound(record: string): string {
  return `AAAA record for "${record}" does not exist.`
}
