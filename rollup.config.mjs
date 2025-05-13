import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';

export default [
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/page-integrity.js',
      format: 'iife',
      name: 'PageIntegrity',
      sourcemap: true,
      globals: {
        'window': 'window',
        'document': 'document',
        'navigator': 'navigator'
      }
    },
    plugins: [
      resolve({
        browser: true
      }),
      commonjs(),
      typescript({
        tsconfig: './tsconfig.json',
        sourceMap: true
      })
    ]
  },
  {
    input: 'src/service-worker.ts',
    output: {
      file: 'dist/service-worker.js',
      format: 'iife',
      name: 'ServiceWorker',
      sourcemap: true
    },
    plugins: [
      resolve({
        browser: true
      }),
      commonjs(),
      typescript({
        tsconfig: './tsconfig.sw.json',
        sourceMap: true
      })
    ]
  }
]; 