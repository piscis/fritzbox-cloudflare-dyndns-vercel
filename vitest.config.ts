import { fileURLToPath } from 'node:url'
import { defineVitestProject } from '@nuxt/test-utils/config'
import { defineConfig } from 'vitest/config'

const rootDir = fileURLToPath(new URL('./', import.meta.url)).replace(/\/$/, '')

const nuxtAlias = {
  '~~': rootDir,
  '@@': rootDir,
  '~': `${rootDir}/app`,
  '@': `${rootDir}/app`,
}

export default defineConfig({
  test: {
    projects: [
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

      {
        resolve: { alias: nuxtAlias },
        test: {
          name: 'browser',
          include: ['tests/browser/**/*.{test,spec}.ts'],
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
      thresholds: {
        lines: 90,
        functions: 90,
        branches: 85,
        statements: 90,
      },
    },
  },
})
