import { readFileSync } from 'node:fs'
import antfu from '@antfu/eslint-config'
import withNuxt from './.nuxt/eslint.config.mjs'
import noComments from './eslint-rules/no-comments'

const lock = JSON.parse(readFileSync(new URL('./skills-lock.json', import.meta.url), 'utf8')) as { skills: Record<string, unknown> }
const vendoredSkills = Object.keys(lock.skills).map(name => `.agents/skills/${name}/**`)

export default withNuxt(antfu({
  ignores: [
    '.claude/worktrees/**',
    'eslint-suppressions.json',
    '.nuxt/**',
    '.wrangler/**',
    '.vercel/**',
    '.output/**',
    'node_modules/**',
    ...vendoredSkills,
  ],
}, {
  name: 'local/no-comments',
  files: ['**/*.{js,mjs,cjs,ts,mts,cts,vue,json,jsonc,json5,yml,yaml}'],
  ignores: ['**/*.md/**'],
  plugins: {
    local: {
      rules: { 'no-comments': noComments },
    },
  },
  rules: {
    'local/no-comments': 'error',
  },
}))
