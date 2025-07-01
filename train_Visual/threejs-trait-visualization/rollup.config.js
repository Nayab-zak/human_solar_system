import typescript from '@rollup/plugin-typescript';
import dts from 'rollup-plugin-dts';
import peerDepsExternal from 'rollup-plugin-peer-deps-external';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import terser from '@rollup/plugin-terser';

const input = 'src/ThreeSceneComponent.tsx';

export default [
  // JS bundle (ESM, CJS, UMD)
  {
    input,
    output: [
      {
        file: 'dist/index.esm.js',
        format: 'esm',
        sourcemap: true,
      },
      {
        file: 'dist/index.cjs.js',
        format: 'cjs',
        sourcemap: true,
        exports: 'named',
      },
      {
        file: 'dist/index.umd.js',
        format: 'umd',
        name: 'ThreeSceneComponent',
        sourcemap: true,
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
          three: 'THREE',
        },
      },
    ],
    plugins: [
      peerDepsExternal(),
      resolve(),
      commonjs(),
      typescript({ tsconfig: './tsconfig.build.json' }),
      terser(),
    ],
    external: ['react', 'react-dom', 'three'],
  },
  // Type declarations
  {
    input: 'dist/types/ThreeSceneComponent.d.ts',
    output: [{ file: 'dist/index.d.ts', format: 'es' }],
    plugins: [dts()],
  },
];
