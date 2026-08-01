<template>
  <div
    class="flex justify-center w-[95vw] lg:w-[80vw] 2xl:w-[60vw] max-w-[1200px] mx-auto h-screen items-center flex-col"
  >
    <!--
      Renders both icons and swaps them with CSS (dark:hidden /
      hidden dark:inline-block), so it is safe on the prerendered page. Do not
      wrap it in <ClientOnly>: that trades a cosmetic aria-label warning for a
      real layout shift.
    -->
    <UColorModeButton class="fixed top-4 right-4" />

    <div class="mb-5">
      Beep Boop ... I'm a robot
    </div>
    <div class="mb-5">
      <audio controls autoplay>
        <source src="/sounds/modem-dial-up.mp3" type="audio/mpeg">
      </audio>
    </div>

    <!--
      Deliberately NuxtLink, not ULink: ULink's theme paints inactive links
      with `text-muted`, which would recolour this one.
    -->
    <NuxtLink class="flex justify-center cursor-pointer font-light" href="https://github.com/piscis/fritzbox-cloudflare-dyndns-vercel/" target="_blank">
      Learn more about this service: <UIcon name="i-devicon-github" class="inline-block h-5 w-5 mx-2" />
    </NuxtLink>
  </div>
</template>
