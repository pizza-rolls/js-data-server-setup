
import resolve from 'rollup-plugin-node-resolve'
import commonjs from 'rollup-plugin-commonjs'
import babel from 'rollup-plugin-babel'
import es2015Rollup from 'babel-preset-es2015-rollup'
import json from 'rollup-plugin-json'

export default {
  entry: 'src/index.js',
  dest: 'dist/bundle.js',
  format: 'cjs', // iife, cjs, umd
  plugins: [
    // get node_module packages for the bundle
    resolve({
      jsnext: true,
      main: true
      // browser: true
    }),
    json(),
    // // convert commonjs modules to es2015 module imports
    commonjs(),
    // transform code with babel
    babel({
      babelrc: false,
      'presets': [es2015Rollup]
    })
  ]
}
