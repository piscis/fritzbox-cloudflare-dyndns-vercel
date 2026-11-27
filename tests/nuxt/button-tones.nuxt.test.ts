import type { ButtonProps } from '@nuxt/ui'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import { defineComponent, h } from 'vue'
import { UButton } from '#components'

async function classesOf(props: ButtonProps): Promise<string[]> {
  const wrapper = await mountSuspended(defineComponent({
    render: () => h(UButton, props, () => 'press'),
  }))
  return wrapper.find('button').classes()
}

const TONES = [
  {
    tone: 'default',
    props: {},
    colour: ['bg-transparent', 'text-(--p-100)', 'border-(--crt-line)'],
  },
  {
    tone: 'primary',
    props: { variant: 'primary' },
    colour: ['bg-(--fritz-yellow)', 'text-(--on-accent)', 'font-bold'],
  },
  {
    tone: 'quiet',
    props: { variant: 'quiet' },
    colour: ['bg-transparent', 'text-(--p-200)', 'border-(--crt-line)'],
  },
] as const

describe.each(TONES)('the $tone button tone', ({ props, colour }) => {
  it('renders its colour treatment', async () => {
    expect(await classesOf(props)).toEqual(expect.arrayContaining([...colour]))
  })

  it.each(['xs', 'md', 'xl'] as const)('keeps the bracket geometry at size %s instead of Nuxt UI\'s', async (size) => {
    const classes = await classesOf({ ...props, size })

    expect(classes).toEqual(expect.arrayContaining([
      'bracket',
      'px-[1em]',
      'py-[0.6em]',
      'gap-[0.55em]',
      'text-step-0',
    ]))
    expect(classes.filter(name => /^(?:px|py|gap)-\d|^text-(?:xs|sm|base)$/.test(name))).toEqual([])
  })

  it('carries none of Nuxt UI\'s stock colour classes', async () => {
    const classes = await classesOf(props)

    expect(classes.filter(name => /\bprimary\b|\binverted\b/.test(name))).toEqual([])
  })

  it('keeps the 2px yellow focus ring instead of Nuxt UI\'s 3px one', async () => {
    const classes = await classesOf(props)

    expect(classes).toEqual(expect.arrayContaining(['focus-visible:outline-2', 'focus-visible:outline-(--fritz-yellow)']))
    expect(classes).not.toContain('focus-visible:outline-3')
  })
})
