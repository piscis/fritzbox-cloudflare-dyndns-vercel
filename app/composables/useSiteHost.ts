export function useSiteHost() {
  const config = useRuntimeConfig()

  const host = ref(config.public.siteHost || 'fritzdns.piscis.dev')

  onMounted(() => {
    host.value = window.location.host
  })

  return host
}
