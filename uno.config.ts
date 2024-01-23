import { defineConfig } from 'unocss'
import { customProperties } from './src/lib'
import type { Theme } from '@unocss/preset-uno'

export default defineConfig({
  theme: {
    spacing: {
      1: '0.25rem',
      2: '0.5rem',
    },
    colors: {
      gray: {
        100: '#f7fafc',
      },
    },
    fontSize: {
      1: '0.75rem',
      2: ['0.875rem', '1.25'],
      3: ['0.875rem', { lineHeight: '1.25' }],
    },
    lineHeight: {
      1: '1.25',
      2: '1.5',
    },
    borderRadius: {
      md: '1rem',
    },
  } satisfies Theme,
  presets: [customProperties()],
})
