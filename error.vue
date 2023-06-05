<script setup lang="ts">
const bodyCls = computed(() => {
  const classList = ['antialiased']
  if (process.env.NODE_ENV === 'development') {
    classList.push('debug-screens')
  }
  classList.push('light')
  classList.push('bg-gray-100')

  return classList
})

useHead({
  bodyAttrs: {
    class: bodyCls,
  },
})
</script>

<template>
  <div
    class="flex justify-center h-screen w-[95vw] lg:w-[80vw] 2xl:w-[60vw] max-w-1200 mx-auto items-center"
  >
    <NuxtLink to="/" class="cursor-pointer">
      <NuxtImg
        class="block w-full"
        src="/images/404_page_not_found.png"
        preload
        width="4830"
        height="3213"
        format="webp"
        quality="80"
        decoding="async"
        loading="eager"
        alt="Page not found"
        sizes="xs:95vw sm:95vw md:95vw lg:80vw xl:80vw 2xl:60vw 1200px"
      />
    </NuxtLink>
  </div>
</template>
