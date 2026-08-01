import { fileURLToPath } from 'node:url'
import { defineVitestProject } from '@nuxt/test-utils/config'
import { defineConfig } from 'vitest/config'

const rootDir = fileURLToPath(new URL('./', import.meta.url)).replace(/\/$/, '')

// Nuxt's rootDir/srcDir aliases, for the projects that do not boot Nuxt and so
// do not get them for free.
const nuxtAlias = {
  '~~': rootDir,
  '@@': rootDir,
  '~': `${rootDir}/app`,
  '@': `${rootDir}/app`,
}

export default defineConfig({
  test: {
    projects: [
      // Plain Node. Covers everything under server/ with the Cloudflare SDK
      // mocked, so it is fast and never touches the network.
      {
        resolve: { alias: nuxtAlias },
        test: {
          name: 'unit',
          include: ['tests/unit/**/*.{test,spec}.ts'],
          environment: 'node',
          setupFiles: ['./tests/setup/nitro-globals.ts'],
          testTimeout: 5000,
          clearMocks: true,
        },
      },

      // End-to-end tests boot a real Nuxt server via `setup()`. They must NOT go
      // through defineVitestProject — @nuxt/test-utils warns when the Nuxt client
      // environment is applied to an e2e suite.
      {
        resolve: { alias: nuxtAlias },
        test: {
          name: 'e2e',
          include: ['tests/e2e/**/*.{test,spec}.ts'],
          environment: 'node',
          testTimeout: 30_000,
          hookTimeout: 300_000,
          fileParallelism: false,
        },
      },

      await defineVitestProject({
        test: {
          name: 'nuxt',
          include: ['tests/nuxt/**/*.{test,spec}.ts'],
          environment: 'nuxt',
          testTimeout: 10_000,
          environmentOptions: {
            nuxt: {
              domEnvironment: 'happy-dom',
            },
          },
        },
      }),
    ],

    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html'],
      reportsDirectory: './coverage',
      include: ['server/**/*.ts'],
      exclude: [
        '**/node_modules/**',
        '**/*.d.ts',
      ],
      // server/** currently sits at 100% across the board. These are set below
      // that on purpose, so a dependency bump that adds an unreachable branch
      // does not red the build — but far enough up to catch real regressions.
      thresholds: {
        lines: 90,
        functions: 90,
        branches: 85,
        statements: 90,
      },
    },
  },
})
