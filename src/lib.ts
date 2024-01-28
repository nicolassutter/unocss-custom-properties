import type { CSSObject, Preset } from 'unocss'
import type { Theme } from '@unocss/preset-uno'
import { listify, crush, mapEntries, shake, pick } from 'radash'
import { mkdir, writeFile } from 'node:fs/promises'
import { parse } from 'node:path'
import { kebabCase } from 'change-case'

export type Options = {
  /**
   * If the generated CSS should be written to a file
   * @default false
   */
  writeFile?: boolean
  /**
   * The path of the file to write if `writeFile` is set to `true`
   */
  filePath?: string
  /**
   * If the custom properties should be injected in the CSS `:root` selector
   * @default true
   */
  inject?: boolean
  /**
   * The prefix to use for the custom properties
   * @default ''
   */
  prefix?: string
}

function generateVars<T extends string | number | [string, string | CSSObject]>(
  obj: Record<string, T>,
  prefix: string,
  options: Options,
) {
  return listify(
    obj ?? {},
    (key, value) =>
      `--${options.prefix}${prefix}-${key.replace(/\./g, '-')}: ${value};`,
  )
}

export function customProperties(options: Options = {}): Preset {
  options = {
    inject: true,
    prefix: '',
    ...options,
  }

  return {
    name: 'custom-properties',
    preflights: [
      /**
       * Génération des variables CSS à partir du thème
       */
      {
        getCSS: async ({ theme: t }) => {
          const theme = t as Theme

          const fontSizes = mapEntries(theme.fontSize ?? {}, (key, value) => {
            const val = typeof value === 'string' ? value : value[0]
            return [key, val]
          })

          /**
           * Generate line-heights based on values from fontSize and lineHeight
           */
          const lineHeights = shake({
            ...mapEntries(theme.fontSize ?? {}, (key, value) => {
              if (typeof value === 'string') return [key, undefined]

              const [_, v] = value
              const val = typeof v === 'string' ? v : v.lineHeight
              return [key, val]
            }),
            ...(theme.lineHeight ?? {}),
          }) as Record<string, string>

          const supportedProperties = {
            ...pick(theme, [
              'spacing',
              'fontWeight',
              'fontFamily',
              'borderRadius',
              'letterSpacing',
              'colors',
            ]),
            fontSize: fontSizes,
            lineHeight: lineHeights,
          }

          const variables = Object.entries(supportedProperties)
            .reduce((acc, [key, value]) => {
              acc.push(
                ...generateVars(
                  (crush(value) as Record<string, string>) ?? {},
                  kebabCase(key),
                  options,
                ),
              )

              return acc
            }, [] as string[])
            .map((line) => `  ${line}`)
            .join('\n')

          const css = `:root {\n${variables}\n}`

          if (options.filePath && options.writeFile) {
            let p: ReturnType<typeof parse>

            try {
              p = parse(options.filePath)
            } catch (error) {
              throw new Error('Invalid file path')
            }

            try {
              await mkdir(p.dir, { recursive: true })
            } catch (error) {
              throw new Error(`Cannot create directory : ${p.dir}`)
            }

            await writeFile(options.filePath!, css, 'utf-8')
          }

          return options.inject ? css : ''
        },
        layer: 'default',
      },
    ],
  }
}

export default customProperties
