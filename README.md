Generate CSS custom properties from your [Uno CSS](https://unocss.dev/) theme.

## Install

```bash
npm i -D unocss-custom-properties
# pnpm add -D unocss-custom-properties
```

## Usage

```ts
import { defineConfig } from 'unocss'
import customProperties from 'unocss-custom-properties'

export default defineConfig({
  theme: {
    // ... theme values
  },
  presets: [
    customProperties({
      /* options */
    }),
  ],
})
```
