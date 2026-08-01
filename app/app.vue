<template>
  <!--
    No <NuxtLayout>: the only layout was a wrapper div setting a text colour that
    now comes from Nuxt UI's tokens, and every <head> tag it owned moved to
    `app.head` in nuxt.config so app/error.vue — which renders instead of this
    file and never mounts a layout — inherits them too.
  -->
  <UApp>
    <NuxtRouteAnnouncer />
    <NuxtPage />
  </UApp>
</template>
