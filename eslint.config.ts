import antfu from '@antfu/eslint-config'
import withNuxt from './.nuxt/eslint.config.mjs'

export default withNuxt(antfu({
  ignores: [
    '.claude/worktrees/**',
    '.nuxt/**',
    '.wrangler/**',
    '.vercel/**',
    '.output/**',
    'node_modules/**',
  ],
}))
