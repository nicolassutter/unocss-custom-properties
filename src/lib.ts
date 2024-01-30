import type { Preset } from 'unocss'
import { listify, crush, dash } from 'radash'
import { mkdir, writeFile } from 'node:fs/promises'
import { parse } from 'node:path'
import { z } from 'zod'
import chalk from 'chalk'

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

function generateVars(
  obj: Record<string, string | number>,
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
        getCSS: async ({ theme }) => {
          const stringOrNum = z.union([z.string(), z.number()])

          /** A valid record for any value in the theme */
          const themeValue = z
            .record(
              z.string(),
              stringOrNum.or(z.record(stringOrNum, stringOrNum)),
            )
            .transform(
              (value) => crush(value) as Record<string, string | number>,
            )

          /**
           * A valid theme object where we only keep the valid values (records)
           */
          const safeThemeSchema = z
            .object({
              fontSize: z
                .record(
                  stringOrNum,
                  z.union([
                    z.string(),
                    z
                      .tuple([stringOrNum, z.any()])
                      .transform((tuple) => tuple[0]),
                  ]),
                )
                .optional(),
            })
            .catchall(z.any())
            .transform((value) =>
              Object.fromEntries(
                Object.entries(value)
                  .map(([key, value]) => {
                    const parsingRes = themeValue.safeParse(value)
                    if (!parsingRes.success) return
                    return [key, parsingRes.data]
                  })
                  .filter((v): v is [string, z.infer<typeof themeValue>] =>
                    Boolean(v),
                  ),
              ),
            )

          // type Theme = z.infer<typeof safeThemeSchema>

          const parsingRes = safeThemeSchema.safeParse(theme)

          if (!parsingRes.success) {
            console.warn(
              '⚠️ ',
              chalk.yellow(
                '[unocss-custom-properties] Theme is invalid, skipping custom properties generation.',
              ),
            )

            return ''
          }

          const safeTheme = parsingRes.data

          const variables = Object.entries(safeTheme)
            .map(([key, value]) => generateVars(value, dash(key), options))
            .flat()
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
