<template>
  <div
    class="flex justify-center w-[95vw] lg:w-[80vw] 2xl:w-[60vw] max-w-1200 mx-auto h-screen items-center flex-col"
  >
    <div class="mb-5">
      Beep Boop ... I'm a robot
    </div>
    <div class="mb-5">
      <audio controls autoplay>
        <source src="/sounds/modem-dial-up.mp3" type="audio/mpeg">
      </audio>
    </div>

    <NuxtLink class="flex justify-center cursor-pointer font-light" href="https://github.com/piscis/fritzbox-cloudflare-dyndns-vercel/" target="_blank">
      Learn more about this service: <Icon name="devicon:github" class="inline-block h-5 w-5 mx-2" />
    </NuxtLink>
  </div>
</template>
