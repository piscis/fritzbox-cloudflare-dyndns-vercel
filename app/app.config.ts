/**
 * Phosphor's Nuxt UI theme.
 *
 * `primary` is the FRITZ! yellow rather than a green, because in this design the
 * yellow is the only non-green hue and it means "press this" and nothing else —
 * which is exactly what Nuxt UI uses `primary` for, focus rings included.
 * `neutral` carries the phosphor greens.
 *
 * Every `UButton` is a bracket button: the shared geometry, the brackets, the
 * yellow focus ring and the pressed state sit in `slots.base`. The design's
 * three tones — its colour treatments — are `variant` values: `default`,
 * `primary` and `quiet`.
 */
export default defineAppConfig({
  ui: {
    colors: {
      primary: 'fritz',
      neutral: 'phosphor',
    },
    tv: {
      // tailwind-merge only knows Tailwind's stock font sizes and files any
      // other `text-*` as a colour. Unregistered, `text-step-0` lost to the
      // tone's text colour and sat beside Nuxt UI's `text-sm`. Keep the list in
      // step with the `--text-step-*` sizes in app/assets/css/main.css.
      twMergeConfig: {
        extend: {
          theme: {
            text: [
              'step--1',
              'step-0',
              'step-1',
              'step-2',
              'step-3',
              'step-4',
            ],
          },
        },
      },
    },
    button: {
      slots: {
        // Replacer form, not a merge: the stock base carries `rounded-md
        // font-medium` and a `focus-visible:ring-2` the bracket button has to
        // drop outright. Since Nuxt UI 4.11 (nuxt/ui#6824) a replacer only
        // swaps the slot's own classes, so the variants below still merge on
        // top. Before that it swallowed them, which is why the tones once
        // lived in a wrapper component as `class` bindings.
        base: () => [
          'bracket inline-flex items-center cursor-pointer no-underline',
          'font-mono border rounded-(--radius)',
          'transition-[color,background-color,border-color,box-shadow] duration-200',
          // Focus is the one place yellow appears on a non-primary button.
          'focus-visible:outline-2 focus-visible:outline-offset-2',
          'focus-visible:outline-(--fritz-yellow) focus-visible:border-(--fritz-yellow)',
          // Persistent pressed state for the modem toggle — no class juggling.
          'aria-pressed:text-(--fritz-yellow) aria-pressed:border-(--fritz-yellow)',
          'aria-pressed:bg-[rgb(255_228_0/0.07)]',
        ].join(' '),
      },
      variants: {
        // Custom values on the stock `variant` key, so the `variant` prop
        // selects them. A new key such as `tone` never reaches the theme:
        // UButton passes only its own variant props to it.
        variant: {
          default: [
            'bg-transparent border-(--crt-line) text-(--p-100) before:text-(--p-300) after:text-(--p-300)',
            'hover:border-(--crt-line-hi) hover:bg-(--crt-raise) hover:shadow-[0_0_22px_rgb(138_240_176/0.14)]',
            'hover:before:text-current hover:after:text-current',
          ].join(' '),
          primary: [
            'bg-(--fritz-yellow) border-(--fritz-yellow) text-(--on-accent) font-bold before:opacity-45 after:opacity-45',
            'hover:brightness-[1.12] hover:shadow-[0_0_24px_rgb(255_228_0/0.3)]',
            'hover:before:opacity-100 hover:after:opacity-100',
          ].join(' '),
          quiet: [
            'bg-transparent border-(--crt-line) text-(--p-200) before:text-(--p-300) after:text-(--p-300)',
            'hover:border-(--crt-line-hi) hover:bg-(--crt-raise)',
            'hover:before:text-current hover:after:text-current',
          ].join(' '),
        },
      },
      // Every stock size adds its own padding, gap and text size after the
      // variant classes. Compound variants resolve last, so the geometry sits
      // here, keyed on the three tones, and holds at any `size`.
      compoundVariants: [
        {
          variant: ['default', 'primary', 'quiet'],
          class: 'px-[1em] py-[0.6em] gap-[0.55em] text-step-0',
        },
      ],
      // The stock `solid` default would pull in its `bg-primary` compound
      // classes; none of the stock compounds match a custom variant.
      defaultVariants: {
        variant: 'default',
      },
    },
  },
})
