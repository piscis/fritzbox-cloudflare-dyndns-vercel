// uno.config.ts
import { defineConfig, presetAttributify, presetIcons, presetUno, transformerDirectives } from 'unocss'

export default defineConfig({
  presets: [
    presetAttributify({ /* preset options */}),
    presetUno(),
    presetIcons(),
    // ...custom presets
  ],
  transformers: [
    transformerDirectives(),
  ],
  theme: {
    fontFamily: {
      nunito: ['"Nunito", sans-serif'],
    },
  },
})
