---
name: orpc-api
description: >-
  How this repo builds its HTTP API — oRPC procedures with Zod 4 schemas,
  detailed input/output structures, typed error mapping, and the Nitro catch-all
  that mounts them under /api with a Scalar reference. Use when adding or
  changing a procedure, a route path, a query parameter, an error code, or a
  test that exercises server/router.
---

# oRPC API conventions

The whole HTTP surface is five files. There are no `defineEventHandler` route
files other than the catch-all — adding one would bypass validation and the
OpenAPI spec.

| File | Role |
| --- | --- |
| `server/routes/api/[...].ts` | The only entry point. Mounts the router at `/api`. |
| `server/routes/api/index.ts` | Re-export, so bare `/api` matches too. |
| `server/router/index.ts` | Procedure registry. |
| `server/router/procedures/*.ts` | One procedure per file. |
| `server/router/middlewares/*.ts` | oRPC middleware. |

## Adding a procedure

Write it in `server/router/procedures/`, then add the named export to
`server/router/index.ts` under `api`. That is the entire registration step —
there is no route file to create.

```ts
export const myRoute = os
  .$context<{ nitroContext: H3Event }>()
  .use(noCacheHeaders)
  .route({
    method: 'GET',
    path: '/my-route',
    tags: ['DNS'],
    successStatus: 200,
    summary: 'One line, shown in the API reference',
    description: 'Longer prose, also shown in the API reference',
    inputStructure: 'detailed',
    outputStructure: 'detailed',
  })
  .input(z.object({ query: querySchema }))
  .output(z.object({ status: z.literal(200), body: bodySchema }))
  .errors({ NOT_FOUND: { status: 404, message: 'Not Found' } })
  .handler(async ({ input: { query }, errors }) => {
    return { status: 200, body: { /* ... */ } }
  })
```

Four things bite here:

1. **`path` is relative to the `/api` prefix** set in `[...].ts`, not in this
   file. `path: '/health-check'` serves `GET /api/health-check`.
2. **`inputStructure: 'detailed'` changes the handler's argument shape.** The
   handler receives `{ query, params, headers, body }`, so the input schema must
   be `z.object({ query: … })` — not the bare query schema. Same for
   `outputStructure: 'detailed'`: the handler must return `{ status, body }`.
3. **`summary`, `description` and `tags` are the project's only API
   documentation** — they render in the Scalar reference at `/api`. Fill them in.
4. **Throw through the injected `errors` map, never `new ORPCError(...)`.** See
   below.

## Errors

`.errors({ INTERNAL_SERVER_ERROR: { status: 503 } })` is only applied through the
`errors` constructor map destructured from the handler argument. Constructing the
error directly resolves the status from oRPC's built-in defaults instead, so the
declared status is silently ignored:

```ts
// Wrong — resolves to 500, ignoring the .errors() declaration
throw new ORPCError('INTERNAL_SERVER_ERROR', { message: 'Service Unavailable' })

// Right — uses the declared 503
throw errors.INTERNAL_SERVER_ERROR({ message: 'Service Unavailable' })
```

An `ORPCError` caught from a nested call should be re-thrown unchanged; wrap
everything else. Log through `useLogger()` from `~~/server/utils/useLogger`.

**Never let an upstream error string reach the client.** Cloudflare SDK errors can
echo request parameters, and this API takes a credential as a parameter.

## Schemas

Zod 4. `.describe()` every field — it becomes the OpenAPI parameter documentation.
Cross-field rules go in `.refine()`.

Do **not** hand-roll query-string coercion. `ZodSmartCoercionPlugin` is already
registered in `[...].ts` and handles it.

## Security

The Cloudflare API token arrives as the `?token=` **query parameter** — it is
never read from the environment and never stored. Consequently:

- never log `query`, and never log a caught error object that may embed it
- never echo it into a response body or an error message
- never put a real token in a test fixture or snapshot

## Middleware

`noCacheHeaders` writes through `context.nitroContext.node.res`. Reuse it via
`.use(noCacheHeaders)` rather than setting headers ad hoc. It is Node-shaped and
works on the Cloudflare preset only because `nitro.cloudflare.nodeCompat` is on.

## Imports

Server code imports through the `~~/server/...` root alias. Never relative
`../../`.

## Testing

- `tests/unit/` — call procedures directly with `call(procedure, input, { context })`
  from `@orpc/server`. It runs middleware, input validation, handler and output
  validation with no HTTP transport. Supply
  `{ nitroContext: { node: { res: { setHeader: vi.fn() } } } }` as context, and
  remember the input is `{ query: … }` because of `inputStructure: 'detailed'`.
- `tests/e2e/` — real server. Assert the 404/503 mapping and the no-store headers.
- Mock `cloudflare` with `vi.mock`. Both `zones.list()` and `dns.records.list()`
  are consumed with `for await`, so the doubles must be **async-iterable**.
- **Never exercise the DynDNS happy path over HTTP** — the handler builds a real
  Cloudflare client from the supplied token and would hit `api.cloudflare.com`.
  Validation failures are safe, because they are rejected before the client is
  constructed.

## Known traps

- `useRuntimeConfig()` in `[...].ts` reads `appName`/`appVersion`, but
  `nuxt.config.ts` declares no `runtimeConfig`, so the OpenAPI `info` block always
  falls back to its literals. Declare them if you want real values.
- Paginated Cloudflare list endpoints must be iterated with `for await`. Reading
  `.result` gives only the first page and silently misses later records.
