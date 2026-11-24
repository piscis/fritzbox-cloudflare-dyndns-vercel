import { readFileSync } from 'node:fs'
import antfu from '@antfu/eslint-config'
import withNuxt from './.nuxt/eslint.config.mjs'

// Vendored skills change only through `npx skills`, so a lint fix must not rewrite them
// (that would break their lock hashes). First-party skills have no lock entry and stay linted.
const lock = JSON.parse(readFileSync(new URL('./skills-lock.json', import.meta.url), 'utf8')) as { skills: Record<string, unknown> }
const vendoredSkills = Object.keys(lock.skills).map(name => `.agents/skills/${name}/**`)

export default withNuxt(antfu({
  ignores: [
    '.claude/worktrees/**',
    '.nuxt/**',
    '.wrangler/**',
    '.vercel/**',
    '.output/**',
    'node_modules/**',
    ...vendoredSkills,
  ],
}))
