import {mkdirSync, writeFileSync} from 'node:fs';
import {build} from 'esbuild';
import {Packer} from 'roadroller';
import {page} from './html.mjs';
import {zipOne, zipQuick} from './zip.mjs';

const LIMIT = 13312;

/**
 * Crush minified JS with Roadroller. ROADROLL=0 skips; 2 is slower/tighter.
 * @param {string} js
 * @return {Promise<string>}
 */
async function roll(js) {
  const level = Number(process.env.ROADROLL ?? 1);
  if (!level) return js;
  const packer = new Packer([{data: js, type: 'js', action: 'eval'}]);
  await packer.optimize(level);
  const {firstLine, secondLine} = packer.makeDecoder();
  return firstLine + secondLine;
}

/**
 * Inline JS into the page shell and strip markup whitespace.
 * @param {string} js
 * @return {string}
 */
function htmlOf(js) {
  return page(`<script>${js}</script>`)
      .replace(/\n\s*/g, '')
      .replace(/>\s+</g, '><');
}

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
const plain = htmlOf(js);
const rolled = htmlOf(await roll(js));
const useRoll = zipQuick('index.html', rolled).length <=
    zipQuick('index.html', plain).length;
const html = useRoll ? rolled : plain;
writeFileSync('dist/index.prod.html', html);
mkdirSync('dist/web', {recursive: true});
writeFileSync('dist/web/index.html', html);
const zip = await zipOne('index.html', html);
writeFileSync('dist/game.zip', zip);

const n = zip.length;
const pct = ((n / LIMIT) * 100).toFixed(1);
console.log(`index.html  ${useRoll ? rolled.length : plain.length} bytes` +
    (useRoll ? '  (roadroller)' : ''));
console.log(`game.zip    ${n} / ${LIMIT}  (${pct}%)`);
if (n > LIMIT) {
  console.error(`FAIL: ZIP exceeds ${LIMIT} bytes`);
  process.exit(1);
}
console.log(`OK  ${LIMIT - n} bytes remaining`);
