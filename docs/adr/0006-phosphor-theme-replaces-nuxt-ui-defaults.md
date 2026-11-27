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
  `tests/nuxt/button-tones.nuxt.test.ts` pins the classes each tone renders, including
  the stock ones that must not leak in, so a Nuxt UI update that changes how app config
  merges fails there rather than on the live page.
- **Custom font sizes**: tailwind-merge knows only Tailwind's stock font sizes and treats
  any other `text-*` as a colour, so the `step-*` sizes are registered in
  `ui.tv.twMergeConfig`. Unregistered, `text-step-0` lost to a tone's text colour.
- **Links into `/api`** pass `external`: `/api` is a Nitro route with no vue-router
  match, so a client-side navigation would render the app's own 404.

## `main.css`

- **Three layers**, and the split is load-bearing:
  1. `@theme static` holds what Tailwind must emit as utilities or theme variables.
     `static` is mandatory: a plain `@theme` is tree-shaken against the scanned source,
     and the only consumer of `--color-fritz-*` is a `<style>` Nuxt UI injects at
     runtime, which the scanner never sees. Without it the ramps vanish and every
     primary element renders transparent, with no build error.
  2. `:root` holds raw design tokens that must not become utilities. Tailwind drops
     non-namespaced custom properties from `@theme`, and its docs point to `:root`.
  3. An unlayered `.dark` block remaps Nuxt UI's semantic tokens onto the CRT surfaces.
     Nuxt UI declares its defaults in `@layer theme`, and unlayered CSS outranks any
     layer at equal specificity, so this block stays out of `@layer`. `@theme` cannot
     do it either, because it may not nest under a selector.
- **No webfont**: both screens are monospace end to end. The sans stack is declared but
  never used.
- **Ramps**: the `fritz` ramp is sampled from `public/favicons/favicon.svg`. Nuxt UI reads
  shade 400 for `primary` in dark mode, but every shade stays defined, because an
  undefined one compiles to an empty `var()` fallback that paints nothing. In the
  `phosphor` ramp, 300/400/500/700/900/950 are the design's tokens and the rest are
  interpolated.
- **Contrast**, measured against `--crt-screen`, decides what may carry text:

  | Token | Ratio | Use |
  | --- | --- | --- |
  | `--p-100` | 13.96:1 | headlines |
  | `--p-200` | 7.42:1 | body |
  | `--p-300` | 4.90:1 | meta, log prefixes |
  | `--p-400` | 2.58:1 | decorative only, never text |
  | `--p-leaf` | 6.02:1 | the "online" and `ok` state |
  | `--fritz-yellow` | 15.05:1 | the one interactive hue |
  | `--fritz-red` | 3.91:1 | display and chrome only, never body text |
  | `--sig-red` | 6.45:1 | error body text |
  | `--sig-amber` | 12.03:1 | warnings, degraded |
  | `--on-accent` | 15.73:1 on `--fritz-yellow` | the yellow button's label |

  `--ui-text-dimmed` resolves to `--p-300`, not `--p-400`, because Nuxt UI uses
  `text-dimmed` for running text.
- **Corners**: the CRT bezel is 10px (`--radius-lg`, which Nuxt UI would derive as 8px)
  and `--radius` is 4px. Barely rounded is the point.
- **Status colours**: a `data-status` attribute on the frame re-points `--frame-line` and
  the `--frame-tint*` set, so the whole card recolours from one declaration. A 404 is the
  visitor's mistake and goes red; a 5xx is ours and goes amber.
- **CRT effects stay restrained** (grid, roughly 4% scanlines, a flicker that dips opacity by at most 1.5%): legibility
  wins whenever it conflicts with nostalgia.
- **Brackets are CSS** (`.bracket::before/::after`), not `before:content-['[']`
  utilities. Tailwind's scanner reads raw file text, so inside a JS string in
  `app.config.ts` the candidate arrives with its backslashes and never generates.
- **Reduced motion** lands every animation on its end state, never on a faster version:
  the handshake log is fully written by default and the animation only adds the reveal.
