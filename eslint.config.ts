import antfu from '@antfu/eslint-config'
import withNuxt from './.nuxt/eslint.config.mjs'

const baseConf = antfu()

export default withNuxt(baseConf)
