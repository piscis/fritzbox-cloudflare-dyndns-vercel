/**
 * Strips the caller-supplied Cloudflare token out of anything on its way to a
 * log sink.
 *
 * The token arrives in the query string (`?token=…`) because a FRITZ!Box cannot
 * send headers, and the Cloudflare SDK then forwards it as `Authorization:
 * Bearer …`. Either form can surface inside an upstream error — in its message,
 * its stack, or a nested request object — so redaction is pattern-based and
 * recursive rather than deleting one known field.
 *
 * Errors are cloned rather than mutated: the caller still rethrows the original,
 * and only the copy handed to the logger is scrubbed.
 */

const PATTERNS: ReadonlyArray<readonly [RegExp, string]> = [
  // `?token=…` / `&token=…` — the update URL a FRITZ!Box calls.
  [/([?&]token=)[^&\s"'`]+/gi, '$1***'],
  // `"token": "…"` — the same value once a request body has been serialised.
  [/(["']token["']\s*:\s*["'])[^"']*/gi, '$1***'],
  // `Authorization: Bearer …`, however the SDK has serialised the header.
  [/(bearer\s+)[^\s"',}\]]+/gi, '$1***'],
]

/** Deep enough for an error wrapping a request wrapping headers; cheap to walk. */
const MAX_DEPTH = 6

/** Below this, an "exact value" match is more likely coincidence than the token. */
const MIN_SECRET_LENGTH = 8

function redactString(input: string, secret?: string): string {
  let output = input

  // An exact-value pass first — it catches the token in shapes no pattern anticipates.
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
      Object.entries(value).map(([key, entry]) => [key, redactToken(entry, secret, depth + 1)]),
    )
  }

  return value
}
