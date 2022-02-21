import { nodeResolve } from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import { terser } from 'rollup-plugin-terser'
const banner = '#!/usr/bin/env node'
export default {
  input: './index.js',
  output: {
    exports: 'auto',
    file: './dist/index.js',
    format: 'cjs',
    name: 'load-markdown-image',
    banner,
  },
  plugins: [
    commonjs(),
    nodeResolve({
      preferBuiltins: true,
    }),
    terser(),
  ],
}
