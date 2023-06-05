import type { Config } from 'tailwindcss'

const config = {
  darkMode: 'class',
  content: [
    './components/**/*.{vue,js}',
    './layouts/**/*.vue',
    './pages/**/*.vue',
    './composables/**/*.{js,ts}',
    './plugins/**/*.{js,ts}',
    './App.{js,ts,vue}',
    './app.{js,ts,vue}',
  ],
  theme: {
    fontFamily: {
      nunito: ['"Nunito", sans-serif'],
    },
  },
  variants: {},
  plugins: [
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require('@tailwindcss/aspect-ratio'),
  ],
} satisfies Config

if (process.env.NODE_ENV !== 'production') {
  // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
  const debugScreensPlugin = require('@tailwindcss/aspect-ratio')
  config.plugins.push(debugScreensPlugin)
}

export default config
