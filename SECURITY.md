# Security Policy

## Supported versions

Only the latest release is supported. Fixes are not backported.

## Reporting a vulnerability

Please report privately rather than opening a public issue:

- GitHub → **Security** → **Report a vulnerability** (preferred), or
- email **me@piscis.dev**

You can expect an acknowledgement within 72 hours.

## Threat model

This service is unusual in that **the credential travels in the URL**, and that is
by design rather than by oversight. Understanding why matters for judging what is
and is not a vulnerability here.

The FRITZ!Box DynDNS client offers no way to send a bearer token, a custom header,
or a request body — it substitutes placeholders into a fixed URL template and issues
a GET. So the Cloudflare API token is passed as the `token` query parameter.

Consequences, all of which are accepted:

- The token appears in the request URL. Cloudflare redacts it in their logs, but no
  guarantee can be made about intermediaries on the path.
- Anyone who can observe the URL can use the token within its scope.

Mitigations that are in place:

- The token is **never read from the environment and never persisted**. It lives only
  for the duration of the request that carried it.
- It is never written to logs, echoed into a response, or included in an error
  message.
- Scope your token to the minimum: **`Zone.Zone: Read`** and **`Zone.DNS: Edit`**,
  restricted to the single zone you intend to update. A token scoped this way cannot
  read your account, touch other zones, or create or delete records — the service
  only ever updates the `content` of an A or AAAA record that already exists.

If the URL leaks, revoke the token in the Cloudflare dashboard. Because it is never
stored, revocation is immediately and completely effective.

## Out of scope

- Misconfiguration of a self-hosted deployment, including an over-scoped API token.
- Absence of rate limiting on the free hosted instance at `fritzdns.piscis.dev`. It
  is provided without warranty and without an availability guarantee; if you need
  either, self-host.
- Any impact reachable only because a token was granted permissions beyond the two
  listed above.
