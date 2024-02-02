# unocss-custom-properties

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

## Options

By default, the custom properties will be generated in the `:root` selector and added to the Uno CSS `default` layer.

| name         | type     | default     | description                                                                                                                                      |
| ------------ | -------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| writeFile    | boolean  | `false`     | If the generated CSS should be written to a file                                                                                                 |
| filePath     | string   | `undefined` | The absolute path of the file to write to, if `writeFile` is set to `true`                                                                       |
| inject       | boolean  | `true`      | If the custom properties should be injected to the Uno CSS `default` layer                                                                       |
| prefix       | string   | `''`        | The prefix to use for the custom properties                                                                                                      |
| generateOnly | string[] | `undefined` | If specified, only the corresponding theme keys will be generated as custom properties. This should be an Array of keys available in the `theme` |

## Supported properties

Anything listed in the Uno CSS theme object can generate custom properties as long as `theme[property]` is a valid record.

⚠️ If the theme is invalid, custom properties will not be generated.

```ts
// uno.config.ts

export default defineConfig({
  theme: {
    spacing: {
      1: '0.25rem'
      2: '0.5rem'
    }, // works, this is a valid object
    colors: {
      gray: {
        100: '#f7fafc',
      }
      blue: 'blue'
    }, // works, this is a valid object
    lineHeight: false // will not work, this needs to be a object
  }
})
```
