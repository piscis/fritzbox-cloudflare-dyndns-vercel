<script setup lang="ts">
import type { NuxtError } from '#app'

const props = defineProps<{
  error?: NuxtError
}>()

const isNotFound = computed(() => Number(props.error?.statusCode) === 404)

/**
 * The 404 artwork is a transparent PNG with black line art, so it is unreadable
 * on a dark background. `.light` re-declares Nuxt UI's --ui-* tokens for the
 * body subtree, pinning just that view to light. Every other status renders
 * <UError>, which follows the user's colour mode.
 */
useHead({
  bodyAttrs: {
    class: computed(() => (isNotFound.value ? 'light bg-gray-100' : '')),
  },
})
</script>

<template>
  <!--
    Nuxt renders error.vue *instead of* app.vue, so the <UApp> wrapper there
    does not apply here and has to be repeated.
  -->
  <UApp>
    <div
      v-if="isNotFound"
      class="flex justify-center h-screen w-[95vw] lg:w-[80vw] 2xl:w-[60vw] max-w-[1200px] mx-auto items-center"
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

    <!-- min-h-screen overrides UError's default min-h that subtracts a
         UHeader height this app does not have. -->
    <UError v-else :error="error" class="min-h-screen" />
  </UApp>
</template>
