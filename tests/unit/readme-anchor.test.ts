import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { REPO_URL, SELF_HOST_URL } from '~/utils/repo'

/**
 * GitHub's heading anchors, as github-slugger derives them: lowercase, drop
 * everything but letters, digits, spaces, hyphens and underscores, turn each
 * space into a hyphen, and number repeats `-1`, `-2`, …
 */
function readmeSlugs(): Set<string> {
  const readme = readFileSync(new URL('../../README.md', import.meta.url), 'utf8')
  const slugs = new Set<string>()
  const seen = new Map<string, number>()
  let inFence = false

  for (const line of readme.split('\n')) {
    // Shell comments inside fenced blocks look like headings and are not.
    if (/^\s*(?:```|~~~)/.test(line)) {
      inFence = !inFence
      continue
    }

    const heading = inFence ? null : /^#{1,6} (\S.*)$/.exec(line)

    if (!heading)
      continue

    const base = heading[1]!
      .trim()
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\p{M}\s_-]/gu, '')
      .replace(/ /g, '-')
    const count = seen.get(base) ?? 0

    seen.set(base, count + 1)
    slugs.add(count ? `${base}-${count}` : base)
  }

  return slugs
}

describe('the README self-host link', () => {
  it('points at the repository on GitHub', () => {
    expect(SELF_HOST_URL.startsWith(`${REPO_URL}#`)).toBe(true)
  })

  it('names a heading that exists in README.md', () => {
    const anchor = new URL(SELF_HOST_URL).hash.slice(1)

    expect(readmeSlugs()).toContain(anchor)
  })
})
