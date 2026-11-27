export default defineAppConfig({
  ui: {
    colors: {
      primary: 'fritz',
      neutral: 'phosphor',
    },
    tv: {
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
        base: () => [
          'bracket inline-flex items-center cursor-pointer no-underline',
          'font-mono border rounded-(--radius)',
          'transition-[color,background-color,border-color,box-shadow] duration-200',
          'focus-visible:outline-2 focus-visible:outline-offset-2',
          'focus-visible:outline-(--fritz-yellow) focus-visible:border-(--fritz-yellow)',
          'aria-pressed:text-(--fritz-yellow) aria-pressed:border-(--fritz-yellow)',
          'aria-pressed:bg-[rgb(255_228_0/0.07)]',
        ].join(' '),
      },
      variants: {
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
      compoundVariants: [
        {
          variant: ['default', 'primary', 'quiet'],
          class: 'px-[1em] py-[0.6em] gap-[0.55em] text-step-0',
        },
      ],
      defaultVariants: {
        variant: 'default',
      },
    },
  },
})
