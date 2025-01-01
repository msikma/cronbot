import {defineConfig} from 'tsup'

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    util: 'src/util.ts'
  },
  outDir: 'dist',
  format: ['esm'],
  sourcemap: true,
  dts: true,
  splitting: false,
  minify: false,
  clean: true,
  shims: true,
})
