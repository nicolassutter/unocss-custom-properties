import type { Preset } from 'unocss'
import type { Theme } from '@unocss/preset-uno'
import type { LiteralUnion, Merge } from 'type-fest'
import { listify, crush, dash, pick } from 'radash'
import { mkdir, writeFile } from 'node:fs/promises'
import { parse } from 'node:path'
import { z } from 'zod'
import chalk from 'chalk'

const optionsSchema = z.object({
  writeFile: z.boolean().optional().default(false),
  filePath: z.string().optional(),
  inject: z.boolean().optional().default(true),
  prefix: z.string().optional().default(''),
  generateOnly: z.array(z.string()).optional().default([]),
})

export type Options = Merge<
  z.input<typeof optionsSchema>,
  {
    generateOnly?: LiteralUnion<keyof Theme, string>[]
  }
>

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

export function customProperties(opts?: Options): Preset {
  const options = optionsSchema.parse(opts ?? {})

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
              z.string().refine((value) => !value.startsWith('--')),
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

          let safeTheme = parsingRes.data

          if (options.generateOnly && options.generateOnly.length) {
            safeTheme = pick(safeTheme, options.generateOnly)
          }

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
