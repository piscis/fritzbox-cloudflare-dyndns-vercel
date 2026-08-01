import { defineVitestProject } from '@nuxt/test-utils/config'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    projects: [
      // End-to-end tests boot a real Nuxt server via `setup()`. They must NOT go
      // through defineVitestProject — @nuxt/test-utils warns when the Nuxt client
      // environment is applied to an e2e suite.
      {
        test: {
          name: 'e2e',
          include: ['tests/**/*.e2e.{test,spec}.ts'],
          environment: 'node',
          testTimeout: 30_000,
          hookTimeout: 300_000,
          fileParallelism: false,
        },
      },

      await defineVitestProject({
        test: {
          name: 'nuxt',
          include: ['tests/**/*.nuxt.{test,spec}.ts'],
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
  },
})
