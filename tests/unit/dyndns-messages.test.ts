import { describe, expect, it } from 'vitest'
import {
  aaaaRecordNotFound,
  aRecordNotFound,
  MISSING_IP_MESSAGE,
  zoneNotFound,
} from '~~/shared/dyndnsMessages'

// The one place the wording is pinned. The procedure throws these messages and
// the setup guide quotes them, so both follow a rewording here automatically.
describe('dyndns messages', () => {
  it('names the zone that was not found', () => {
    expect(zoneNotFound('example.com')).toBe('Zone "example.com" not found.')
  })

  it('names the record that has no A record', () => {
    expect(aRecordNotFound('fritz.example.com')).toBe('A record for "fritz.example.com" does not exist.')
  })

  it('names the record that has no AAAA record', () => {
    expect(aaaaRecordNotFound('fritz.example.com')).toBe('AAAA record for "fritz.example.com" does not exist.')
  })

  it('asks for an address when none was sent', () => {
    expect(MISSING_IP_MESSAGE).toBe('Missing ipv4 or ipv6 URL parameter.')
  })
})
