import { readFileSync } from 'node:fs'
import ts from 'typescript'
import { describe, expect, it } from 'vitest'

function read(path: string) {
  return readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8')
}

function capture(path: string, pattern: RegExp) {
  const value = read(path).match(pattern)?.[1]
  if (value === undefined)
    throw new Error(`${pattern} found nothing in ${path}`)
  return value
}

function readJsonc(path: string) {
  const { config, error } = ts.parseConfigFileTextToJson(path, read(path))
  if (error)
    throw new Error(`${path} is not valid JSONC: ${ts.flattenDiagnosticMessageText(error.messageText, '\n')}`)
  return config
}

const minutesPerUnit = {
  minute: 1,
  hour: 60,
  day: 1440,
  week: 10080,
} as const

function toMinutes(duration: string) {
  const [, amount, unit] = duration.match(/^(\d+) (\w+?)s?$/) ?? []
  if (amount === undefined || unit === undefined || !Object.hasOwn(minutesPerUnit, unit))
    throw new Error(`cannot convert renovate duration "${duration}" to minutes`)
  return Number(amount) * minutesPerUnit[unit as keyof typeof minutesPerUnit]
}

describe('paired config values', () => {
  it('deploys the same compatibility date that nuxt.config.ts declares', () => {
    const nuxt = capture('nuxt.config.ts', /compatibilityDate:\s*\{[^}]*\bcloudflare:\s*'([^']+)'/)
    const wrangler = readJsonc('wrangler.jsonc').compatibility_date

    expect(wrangler).toBe(nuxt)
  })

  it('holds packages back as long in pnpm as in renovate', () => {
    const pnpm = Number(capture('pnpm-workspace.yaml', /^minimumReleaseAge:\s*(\d+)\s*$/m))
    const renovate = toMinutes(JSON.parse(read('renovate.json')).minimumReleaseAge)

    expect(pnpm).toBe(renovate)
  })
})
