/**
 * The host of the Instance serving the page.
 *
 * Two-stage on purpose. `/` and `/setup` are prerendered, and `useRequestURL()`
 * at prerender time reports the *build* host — nitro renders through
 * node-mock-http, which defaults `Host` to `localhost`. So the static HTML is
 * seeded from the build's own `CF_ROUTE_PATTERN`, and the visitor's real host
 * replaces it in onMounted, after the hydration render, where it cannot cause a
 * mismatch.
 */
export function useSiteHost() {
  const config = useRuntimeConfig()

  const host = ref(config.public.siteHost || 'fritzdns.piscis.dev')

  onMounted(() => {
    host.value = window.location.host
  })

  return host
}
