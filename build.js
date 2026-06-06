import * as esbuild from 'esbuild';

await esbuild.build({
  entryPoints: ['src/server.ts'],
  bundle: true,
  platform: 'node',
  outfile: 'dist/server.js',
  format: 'esm',
  target: 'node24',
  packages: 'external',
});
