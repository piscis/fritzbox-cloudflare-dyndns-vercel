# The Cloudflare token never leaves the request

A FRITZ!Box cannot send headers, so the caller's Cloudflare API token arrives as the
`?token=` query parameter, and the Cloudflare SDK forwards it as
`Authorization: Bearer …`. The service never reads a token from the environment and never
stores one. Everything that could echo a request back is built so the token stays out:

- **Logs**: errors pass through `server/utils/redactToken.ts` before they reach the
  logger. Upstream errors can embed the token in their message, their stack or a nested
  request object, so redaction is recursive and pattern-based (`?token=`, a serialised
  `"token":`, `Bearer`), not a delete of one known field. When the token is in scope, an
  exact-value pass runs first to catch shapes no pattern anticipates. It skips values
  shorter than 8 characters, where a match is more likely coincidence. Recursion stops at
  depth 6, deep enough for an error wrapping a request wrapping headers. Errors are cloned,
  not mutated: the handler rethrows the original, and only the logged copy is scrubbed.
- **Error page**: `app/error.vue` strips the query and hash before echoing the path, and
  shows fixed prose rather than `error.message`. A mistyped Update URL would otherwise
  render a live token into the 404, and into any screenshot or edge log of it.
- **Setup guide**: the token is never an input. The Update URL keeps the FRITZ!Box's own
  `<pass>` placeholder, and the visitor types the token into the FRITZ!Box itself.
- **Tests**: only validation failures are exercised over HTTP. Input validation runs before
  `new Cloudflare()`, so no e2e request reaches the real API. The DynDNS happy path is
  covered only by unit tests with the SDK mocked.
