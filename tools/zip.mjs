import {crc32, deflateRawSync} from 'node:zlib';
import zopfli from '@gfx/zopfli';
import {execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {dirname, join} from 'node:path';
import {existsSync, writeFileSync, readFileSync, unlinkSync} from 'node:fs';
import {fileURLToPath} from 'node:url';

const TMP = 'dist/_pack.zip';
const require = createRequire(import.meta.url);
const root = dirname(fileURLToPath(import.meta.url));
let ectBin;
try {
  ectBin = require('ect-bin');
} catch (e) {}
if (!ectBin) {
  const local = join(root, '..', 'node_modules', 'ect-bin', 'vendor',
      process.platform === 'win32' ? 'ect.exe' : 'ect');
  if (existsSync(local)) ectBin = local;
}

/**
 * Assemble a single-file ZIP from raw + compressed payloads.
 * @param {string} name
 * @param {Buffer} raw
 * @param {Buffer} defl
 * @return {Buffer}
 */
function packZip(name, raw, defl) {
  const crc = crc32(raw) >>> 0;
  const nameBuf = Buffer.from(name);
  const local = Buffer.alloc(30);
  local.writeUInt32LE(0x04034b50, 0);
  local.writeUInt16LE(20, 4);
  local.writeUInt16LE(8, 8);
  local.writeUInt32LE(crc, 14);
  local.writeUInt32LE(defl.length, 18);
  local.writeUInt32LE(raw.length, 22);
  local.writeUInt16LE(nameBuf.length, 26);
  const central = Buffer.alloc(46);
  central.writeUInt32LE(0x02014b50, 0);
  central.writeUInt16LE(20, 4);
  central.writeUInt16LE(20, 6);
  central.writeUInt16LE(8, 10);
  central.writeUInt32LE(crc, 16);
  central.writeUInt32LE(defl.length, 20);
  central.writeUInt32LE(raw.length, 24);
  central.writeUInt16LE(nameBuf.length, 28);
  const eocd = Buffer.alloc(22);
  const cOff = 30 + nameBuf.length + defl.length;
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(1, 8);
  eocd.writeUInt16LE(1, 10);
  eocd.writeUInt32LE(46 + nameBuf.length, 12);
  eocd.writeUInt32LE(cOff, 16);
  return Buffer.concat([
    local, nameBuf, defl, central, nameBuf, eocd,
  ]);
}

/**
 * Fast zlib-9 ZIP for comparing payloads.
 * @param {string} name
 * @param {string|Uint8Array} data
 * @return {Buffer}
 */
export function zipQuick(name, data) {
  const raw = Buffer.from(data);
  return packZip(name, raw, deflateRawSync(raw, {level: 9}));
}

/**
 * Recompress a ZIP with ECT or ADVZIP when those tools exist.
 * @param {Buffer} zip
 * @return {Buffer}
 */
function recompress(zip) {
  writeFileSync(TMP, zip);
  const tries = [];
  if (ectBin) {
    tries.push([ectBin, ['-10009', '-strip', '-zip', TMP]]);
    tries.push([ectBin, ['-9', '-zip', TMP]]);
  }
  tries.push(
      ['ect', ['-10009', '-strip', '-zip', TMP]],
      ['ect', ['-9', '-zip', TMP]],
      ['ect.exe', ['-9', '-zip', TMP]],
      ['advzip', ['-z', '-4', TMP]],
      ['advzip.exe', ['-z', '-4', TMP]],
  );
  for (const [bin, args] of tries) {
    try {
      execFileSync(bin, args, {stdio: 'ignore'});
      const next = readFileSync(TMP);
      if (next.length && next.length < zip.length) {
        console.log('ect      ' + zip.length + ' -> ' + next.length);
        zip = next;
      }
    } catch (e) {}
  }
  if (existsSync(TMP)) {
    try {
      unlinkSync(TMP);
    } catch (e) {}
  }
  return zip;
}

/**
 * Build a ZIP with Zopfli DEFLATE, then ECT/ADVZIP if present.
 * @param {string} name File name inside the archive.
 * @param {string|Uint8Array} data File contents.
 * @return {Promise<Buffer>} ZIP bytes.
 */
export async function zipOne(name, data) {
  const raw = Buffer.from(data);
  const zlib = packZip(name, raw, deflateRawSync(raw, {level: 9}));
  let best = recompress(zlib);
  try {
    const defl = Buffer.from(await zopfli.deflateAsync(raw, {numiterations: 15}));
    const zop = recompress(packZip(name, raw, defl));
    if (zop.length < best.length) best = zop;
  } catch (e) {}
  return best;
}
