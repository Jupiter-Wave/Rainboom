import {mkdirSync, writeFileSync} from 'node:fs';
import {build} from 'esbuild';
import {page} from './html.mjs';
import {zipOne} from './zip.mjs';

const LIMIT = 13312;

mkdirSync('dist', {recursive: true});

const bundled = await build({
  entryPoints: ['src/main.js'],
  bundle: true,
  write: false,
  format: 'iife',
  minify: true,
  legalComments: 'none',
});
const js = bundled.outputFiles[0].text;
const html = page(`<script>${js}</script>`)
    .replace(/\n\s*/g, '')
    .replace(/>\s+</g, '><');
writeFileSync('dist/index.prod.html', html);

const zip = zipOne('index.html', html);
writeFileSync('dist/game.zip', zip);

const n = zip.length;
const pct = ((n / LIMIT) * 100).toFixed(1);
console.log(`index.html  ${html.length} bytes`);
console.log(`game.zip    ${n} / ${LIMIT}  (${pct}%)`);
if (n > LIMIT) {
  console.error(`FAIL: ZIP exceeds ${LIMIT} bytes`);
  process.exit(1);
}
console.log(`OK  ${LIMIT - n} bytes remaining`);
