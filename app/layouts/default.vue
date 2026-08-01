<script setup lang="ts">
const metaTags = computed(() => {
  const meta = [
    { name: 'title', content: 'FRITZ!Box DynDNS Service' },
    { 'http-equiv': 'content-type', 'content': 'text/html; charset=utf-8' },
    { 'http-equiv': 'Cache-Control', 'content': 'private, no-transform' },
    { 'http-equiv': 'X-UA-Compatible', 'content': 'IE=edge' },
    { name: 'format-detection', content: 'telephone=no' },
    { name: 'robots', content: 'noindex, nofollow' },
    { name: 'viewport', content: 'width=device-width, initial-scale=1.0, user-scalable=yes, minimal-ui' },
  ]
  return meta
})

useHead({
  title: 'FRITZ!Box DynDNS Service',
  htmlAttrs: {
    lang: 'en',
    dir: 'ltr',
  },
  meta: metaTags,
  link: [
    { rel: 'shortcut icon', href: '/favicons/favicon.ico' },
    {
      rel: 'icon',
      type: 'image/x-icon',
      href: '/favicons/favicon.ico',
    },
    {
      rel: 'icon',
      type: 'image/svg+xml',
      href: '/favicons/favicon.svg',
    },
    {
      rel: 'icon',
      type: 'image/png',
      href: '/favicons/favicon.png',
    },
    {
      rel: 'apple-touch-icon',
      href: '/favicons/apple-touch-icon.png',
    },
    {
      rel: 'apple-touch-startup-image',
      href: '/favicons/apple-touch-icon.png',
    },
  ],
})
</script>

<template>
  <!--
    @nuxt/ui styles <body> itself (antialiased, bg-default, and the font from
    --font-sans), so the old bodyAttrs classes are gone. Text colour is kept
    explicit here because Nuxt UI's `text-default` is slate-700/slate-200
    rather than the pure black/white this page used.
  -->
  <div class="w-full text-base text-black dark:text-white">
    <slot />
  </div>
</template>
