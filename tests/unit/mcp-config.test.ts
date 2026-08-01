import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

// The server list is duplicated per editor rather than symlinked — each editor
// watches its own path, and a symlink degrades into a JSON parse error on a
// Windows checkout. This is what stops the two copies drifting apart.
function servers(relativePath: string) {
  const contents = readFileSync(new URL(`../../${relativePath}`, import.meta.url), 'utf8')
  return JSON.parse(contents).mcpServers as Record<string, { type: string, url: string }>
}

describe('mcp config', () => {
  it('registers the same servers for Claude Code and Cursor', () => {
    expect(servers('.cursor/mcp.json')).toStrictEqual(servers('.mcp.json'))
  })

  it('declares an http type on every server', () => {
    // Claude Code reads a `url` with no `type` as a stdio server and skips it.
    for (const server of Object.values(servers('.mcp.json'))) {
      expect(server.type).toBe('http')
      expect(server.url).toMatch(/^https:\/\//)
    }
  })
})
