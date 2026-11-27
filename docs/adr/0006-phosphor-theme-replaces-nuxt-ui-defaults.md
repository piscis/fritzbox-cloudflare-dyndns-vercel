# The Phosphor theme replaces Nuxt UI's defaults

The design is a dark-only CRT terminal built on Nuxt UI.

- **Dark only**: `ui.colorMode: false` keeps `@nuxtjs/color-mode` out entirely: no
  localStorage bootstrap script, no `<UColorModeButton>`, and no stale preference that
  could win. `htmlAttrs.class: 'dark'` turns dark on. `@nuxt/ui` never touches
  `nuxt.options.css`, so `css` must list `main.css`, or the build ships an unstyled page.
- **Colours**: `primary` is the FRITZ! yellow, because yellow is the design's only
  non-green hue and means "press this", which is exactly Nuxt UI's `primary` (focus rings
  included). `neutral` carries the phosphor greens. Only one button per page is primary.
- **Replacer slots**: the button `base` slot, the frame's `UCard` root and the screenshot
  modal use the function form, which replaces Nuxt UI's classes instead of merging with
  them. The stock classes (`rounded-md`, `ring`, `divide-y`, shadows) have to go outright,
  and tailwind-merge does not reliably resolve appended overrides. Since Nuxt UI 4.11
  (nuxt/ui#6824), a replacer swaps only the slot's own classes, so variants still merge on
  top. The modal's content box passes clicks through (`!` beats Reka's inline
  `pointer-events: auto`), so a tap on the dark area around a screenshot closes it.
- **Button tones**: every `UButton` is a bracket button. Its three tones (`default`,
  `primary`, `quiet`) are custom values on the stock `variant` key, because `UButton`
  passes only its own variant props to the theme, so a new key such as `tone` would never
  arrive. `defaultVariants` points at a custom tone, because the stock `solid` default
  would pull in its `bg-primary` compound classes. Every stock `size` adds padding, gap
  and text size after the variant classes, so the tones' geometry sits in compound
  variants, which resolve last and hold at any size.
- **Custom font sizes**: tailwind-merge knows only Tailwind's stock font sizes and treats
  any other `text-*` as a colour, so the `step-*` sizes are registered in
  `ui.tv.twMergeConfig`. Unregistered, `text-step-0` lost to a tone's text colour.
- **Links into `/api`** pass `external`: `/api` is a Nitro route with no vue-router
  match, so a client-side navigation would render the app's own 404.
