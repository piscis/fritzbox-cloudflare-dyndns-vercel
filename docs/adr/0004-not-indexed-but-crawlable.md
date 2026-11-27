# The host is not indexed, but it stays crawlable

This is an API host, and nothing on it should appear in search results. Every response
carries `x-robots-tag: noindex, nofollow, noarchive, nosnippet` as an HTTP header, set by a
`/**` route rule. A `<meta>` tag alone cannot do this: most of what the host serves
(`/api/health-check`, `/api/fritz-dyndns`, `/api/spec.json`) is JSON.

`public/robots.txt` deliberately permits crawling. `Disallow: /` would stop crawlers
fetching the pages, so they would never see `noindex`, and a URL linked from elsewhere
(the README links this host) would stay eligible for a bare listing.
