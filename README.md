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

| name      | type    | default     | description                                                                |
| --------- | ------- | ----------- | -------------------------------------------------------------------------- |
| writeFile | boolean | `false`     | If the generated CSS should be written to a file                           |
| filePath  | string  | `undefined` | The absolute path of the file to write to, if `writeFile` is set to `true` |
| inject    | boolean | `true`      | If the custom properties should be injected to the Uno CSS `default` layer |
| prefix    | string  | `''`        | The prefix to use for the custom properties                                |
