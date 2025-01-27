import { createRollupLicensePlugin } from 'rollup-license-plugin';
import commonjs from '@rollup/plugin-commonjs';
import { nodeResolve } from '@rollup/plugin-node-resolve';
export default [
{
  input: 'src/app.js',
  output: { file: 'dist/app.bundle.js', inlineDynamicImports: true, sourcemap: false }
},
{
  input: 'src/tool.js',
  output: { file: 'dist/tool.bundle.js', inlineDynamicImports: true, sourcemap: false },
  plugins: [commonjs(),nodeResolve(), createRollupLicensePlugin({ outputFilename: 'tool_licenses.json' })]
}]
