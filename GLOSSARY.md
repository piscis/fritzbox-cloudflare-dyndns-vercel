# FRITZ!Box Cloudflare DynDNS

A DynDNS endpoint a FRITZ!Box calls to keep Cloudflare A/AAAA records on its current home
IP, plus the path that ships changes to it.

## Language

### Service

**Update URL**:
The URL the FRITZ!Box calls on every IP change. It carries the FRITZ!Box's own `<pass>`,
`<ipaddr>` and `<ip6addr>` placeholders, which the FRITZ!Box fills in on each call.
_Avoid_: DynDNS URL, callback URL, endpoint

**Instance**:
Any running deployment of the service, whoever operates it. **Staging** and
**Production** are the maintainer's two Instances.
_Avoid_: server, host, self-hosted copy

### Delivery

**Staging**:
The Worker that runs whatever is on `main`. It is where a change is proven before it
reaches users.
_Avoid_: dev, preview, test environment

**Production**:
The Worker the FRITZ!Box actually calls. It runs whatever is on `released`.
_Avoid_: live, prod Worker

**Release**:
A tagged, changelogged version whose commit has been fast-forwarded onto `released`. A
merge to `main` is not a Release.
_Avoid_: deploy, ship (when you mean a Release)

**Minimum release age**:
How long a dependency version must have been published before this repo installs it.
Renovate and pnpm each enforce it, and the two values always match.
_Avoid_: cooldown, stability days
