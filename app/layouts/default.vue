<script setup lang="ts">

const bodyCls = computed(() => {
  const cls = [
    'font-nunito text-base text-black dark:text-white dark:bg-slate-900 antialiased',
  ]
  if (import.meta.dev) {
    cls.push('debug-screens')
  }
  return cls
})

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
  bodyAttrs: {
    class: bodyCls,
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
  <slot />
</template>
