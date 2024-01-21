import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/lib.ts'],
  format: ['esm'],
  clean: true,
  dts: true,
  bundle: true,
  target: 'esnext',
  /**
   * Bundle radash with the library
   */
  noExternal: ['radash'],
})
