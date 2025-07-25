// uno.config.ts
import { defineConfig, presetAttributify, presetIcons, presetWind4, transformerDirectives } from 'unocss'

export default defineConfig({
  presets: [
    presetAttributify(),
    presetWind4(),
    presetIcons(),
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
