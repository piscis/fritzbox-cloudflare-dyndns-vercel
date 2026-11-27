import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

function servers() {
  const contents = readFileSync(new URL('../../.mcp.json', import.meta.url), 'utf8')
  return JSON.parse(contents).mcpServers as Record<string, { type: string, url: string }>
}

describe('mcp config', () => {
  it('declares an http type on every server, without which Claude Code skips it', () => {
    for (const server of Object.values(servers())) {
      expect(server.type).toBe('http')
      expect(server.url).toMatch(/^https:\/\//)
    }
  })
})
