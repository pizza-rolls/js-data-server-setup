import commonjs from 'rollup-plugin-commonjs'
import babel from 'rollup-plugin-babel'
import es2015Rollup from 'babel-preset-es2015-rollup'
import json from 'rollup-plugin-json'

export default {
  entry: 'src/index.js',
  dest: 'dist/bundle.js',
  format: 'cjs', // iife, cjs, umd
  plugins: [
    babel({
      babelrc: false,
      'presets': [es2015Rollup]
    }),
    json(),
    commonjs()
  ]
}
