/**
 * Phosphor's Nuxt UI theme.
 *
 * `primary` is the FRITZ! yellow rather than a green, because in this design the
 * yellow is the only non-green hue and it means "press this" and nothing else —
 * which is exactly what Nuxt UI uses `primary` for, focus rings included.
 * `neutral` carries the phosphor greens.
 *
 * This covers every button's shared geometry — the bracket, the padding, the
 * yellow focus ring, the pressed state. The three colour treatments live in
 * app/components/BracketButton.vue.
 */
export default defineAppConfig({
  ui: {
    colors: {
      primary: 'fritz',
      neutral: 'phosphor',
    },
    button: {
      slots: {
        // Replacer form, not a merge: the stock base carries `rounded-md
        // font-medium` and a `focus-visible:ring-2` the bracket button has to
        // drop outright. Appending would leave tailwind-merge to arbitrate,
        // which it does not always resolve the way you want.
        base: () => [
          'bracket inline-flex items-center gap-[0.55em] cursor-pointer no-underline',
          'font-mono text-step-0 border rounded-(--radius) px-[1em] py-[0.6em]',
          'transition-[color,background-color,border-color,box-shadow] duration-200',
          // Focus is the one place yellow appears on a non-primary button.
          'focus-visible:outline-2 focus-visible:outline-offset-2',
          'focus-visible:outline-(--fritz-yellow) focus-visible:border-(--fritz-yellow)',
          // Persistent pressed state for the modem toggle — no class juggling.
          'aria-pressed:text-(--fritz-yellow) aria-pressed:border-(--fritz-yellow)',
          'aria-pressed:bg-[rgb(255_228_0/0.07)]',
        ].join(' '),
      },
    },
  },
})
