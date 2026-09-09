import {crc32, deflateRawSync} from 'node:zlib';

/**
 * Build a single-file ZIP buffer (deflate).
 * @param {string} name File name inside the archive.
 * @param {string|Uint8Array} data File contents.
 * @return {Buffer} ZIP bytes.
 */
export function zipOne(name, data) {
  const raw = Buffer.from(data);
  const defl = deflateRawSync(raw, {level: 9});
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
