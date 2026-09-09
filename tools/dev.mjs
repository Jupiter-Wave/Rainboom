import {mkdirSync, writeFileSync} from 'node:fs';
import {context} from 'esbuild';
import {page} from './html.mjs';

mkdirSync('dist', {recursive: true});
writeFileSync('dist/index.html', page('<script src=game.js></script>'));

const ctx = await context({
  entryPoints: ['src/main.js'],
  bundle: true,
  outfile: 'dist/game.js',
  format: 'iife',
  sourcemap: true,
});
await ctx.watch();
const server = await ctx.serve({servedir: 'dist', port: 8080});
console.log(`RAINBOOM  http://localhost:${server.port}`);
