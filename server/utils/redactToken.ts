const PATTERNS: ReadonlyArray<readonly [RegExp, string]> = [
  [/([?&]token=)[^&\s"'`]+/gi, '$1***'],
  [/(["']token["']\s*:\s*["'])[^"']*/gi, '$1***'],
  [/(bearer\s+)[^\s"',}\]]+/gi, '$1***'],
]

const MAX_DEPTH = 6

const MIN_SECRET_LENGTH = 8

function redactString(input: string, secret?: string): string {
  let output = input

  if (secret && secret.length >= MIN_SECRET_LENGTH) {
    output = output.split(secret).join('***')
  }

  for (const [pattern, replacement] of PATTERNS) {
    output = output.replace(pattern, replacement)
  }

  return output
}

export default function redactToken(value: unknown, secret?: string, depth = 0): unknown {
  if (depth > MAX_DEPTH) {
    return value
  }

  if (typeof value === 'string') {
    return redactString(value, secret)
  }

  if (value instanceof Error) {
    const clone = new Error(redactString(value.message, secret))
    clone.name = value.name

    if (value.stack) {
      clone.stack = redactString(value.stack, secret)
    }

    if (value.cause !== undefined) {
      clone.cause = redactToken(value.cause, secret, depth + 1)
    }

    return clone
  }

  if (Array.isArray(value)) {
    return value.map(entry => redactToken(entry, secret, depth + 1))
  }

  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [
        key,
        redactToken(entry, secret, depth + 1),
      ]),
    )
  }

  return value
}
