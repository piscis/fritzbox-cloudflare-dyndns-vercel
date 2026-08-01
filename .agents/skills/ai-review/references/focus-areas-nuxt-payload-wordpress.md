# Focus areas — Nuxt / Payload CMS / ORPC / WordPress

Stack-specific review rules for the `ai-review` skill. **Opt-in:** read this file only when
`.ai_review/project.md` is absent *and* the repo actually uses this stack — detect from
`package.json` dependencies (`nuxt`, `payload`, `@orpc/*`, `@nuxtjs/i18n`) or from
`composer.json` / `wp-content` for the WordPress rules.

If the repo does not use these technologies, none of this applies. Applying a Nuxt SSR rule to
an unrelated codebase produces confident nonsense — fall back to the generic framework in
`SKILL.md` Step 7 instead.

These rules are **in addition to** the generic framework, not a replacement for it.

## Critical (always flag)

**ORPC / API layer**
- Procedures missing Zod input/output schemas.
- Incorrect CMS data transformation between the API layer and the frontend.
- Missing locale passthrough on localized content.

**Payload CMS**
- Access control: `overrideAccess: false` missing when `user` is passed.
- Transaction safety: nested Payload operations inside hooks missing `req`.
- Hook loop risk: hooks that update their own collection without a `context.skipHooks` guard.
- Lexical virtual fields being persisted.

**Vue / Nuxt SSR**
- `window` / `document` access outside `onMounted`.
- `useFetch` called from an event handler.
- i18n inconsistency between CMS localization and frontend `@nuxtjs/i18n`.

**Security**
- Hardcoded secrets or API keys reaching a client bundle.
- Missing bot/captcha validation (e.g. Turnstile) on public form endpoints.
- Shared secrets exposed to browser JavaScript.

**WordPress / PHP**
- Missing capability checks (`current_user_can`).
- Missing nonce verification on state-changing requests.
- Server-side-only secrets used in code reachable from the client.

## Report when meaningful

- Missing error handling in ORPC procedures or outbound HTTP calls.
- Accessibility gaps: missing `aria-label`, unmanaged `tabindex`, absent keyboard handlers.
- Image URLs bypassing the project's image proxy.
- Race conditions in async admin or editor flows.

## Skip entirely (known false positives here)

- Style and formatting nits — these projects use `@antfu/eslint-config` with a `lint:fix` script.
- Suggestions to adopt Prettier, axios, Vuex, TanStack Vue Query, the Options API, TypeScript
  enums, GraphQL, manual Vue/Nuxt imports, or custom `<style>` blocks. All are settled decisions
  in a Nuxt-centric codebase; raising them wastes the review.
