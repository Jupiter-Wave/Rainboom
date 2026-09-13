/** Shared helpers and constants. */

export const COLORS = [
  '#ee2222', '#ee8800', '#eeee00', '#22cc22',
  '#00aaaa', '#2288ee', '#aa22ee',
];
export const BANDS = 7;

/** @return {Element} The A-Frame scene. */
export function scene() {
  return document.getElementById('sc');
}

/**
 * Create an A-Frame node. Defaults to a-entity.
 * @param {Element} parent
 * @param {Object<string, string>} attrs
 * @param {string=} tag
 * @return {Element}
 */
export function ent(parent, attrs, tag) {
  const e = document.createElement(tag || 'a-entity');
  for (const k in attrs) e.setAttribute(k, attrs[k]);
  parent.appendChild(e);
  return e;
}

/** @param {number} w @param {number} h @return {HTMLCanvasElement} */
export function canvas2d(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

/**
 * Canvas text on a world plane (Go label, HUD textures).
 * @param {string} text
 * @param {number} size
 * @return {THREE.Mesh}
 */
export function labelMesh(text, size) {
  const c = canvas2d(64, 64);
  const x = c.getContext('2d');
  x.fillStyle = '#111';
  x.font = 'bold 36px sans-serif';
  x.textAlign = 'center';
  x.textBaseline = 'middle';
  x.fillText(text, 32, 34);
  return new THREE.Mesh(
      new THREE.PlaneGeometry(size, size),
      new THREE.MeshBasicMaterial({
        map: new THREE.CanvasTexture(c),
        transparent: true,
        depthTest: false,
      }));
}

/** @param {Element} el @param {boolean} on */
export function vis(el, on) {
  if (el) el.setAttribute('visible', on ? 'true' : 'false');
}

/**
 * Clamp v to [a, b].
 * @param {number} v
 * @param {number} a
 * @param {number} b
 * @return {number}
 */
export function clamp(v, a, b) {
  return v < a ? a : v > b ? b : v;
}

/**
 * Hex color to 0..255 RGB.
 * @param {string} c
 * @return {number[]}
 */
export function hexRgb(c) {
  const n = parseInt(c.slice(1), 16);
  return [n >> 16, (n >> 8) & 255, n & 255];
}

/**
 * Write dimmed hex RGB into a float buffer.
 * @param {Float32Array} out
 * @param {number} o
 * @param {string} hex
 * @param {number=} dim
 * @return {void}
 */
export function writeRgb(out, o, hex, dim) {
  const rgb = hexRgb(hex);
  const s = (dim == null ? 1 : dim) / 255;
  out[o] = rgb[0] * s;
  out[o + 1] = rgb[1] * s;
  out[o + 2] = rgb[2] * s;
}

/**
 * Mix two hex colors.
 * @param {string} a
 * @param {string} b
 * @param {number} t
 * @return {string}
 */
export function mix(a, b, t) {
  const p = hexRgb(a);
  const q = hexRgb(b);
  const m = (i) => (p[i] + (q[i] - p[i]) * t) | 0;
  const hex = (m(0) << 16) | (m(1) << 8) | m(2);
  return '#' + hex.toString(16).padStart(6, '0');
}

/**
 * Distance from point p to ray (o, d).
 * @param {number[]} o
 * @param {number[]} d
 * @param {number[]} p
 * @return {number}
 */
export function distRay(o, d, p) {
  const vx = p[0] - o[0];
  const vy = p[1] - o[1];
  const vz = p[2] - o[2];
  const t = vx * d[0] + vy * d[1] + vz * d[2];
  const ux = vx - d[0] * t;
  const uy = vy - d[1] * t;
  const uz = vz - d[2] * t;
  return Math.hypot(ux, uy, uz);
}

/**
 * Angle in radians between unit dir and o→p.
 * @param {number[]} o
 * @param {number[]} d
 * @param {number[]} p
 * @return {number}
 */
export function angTo(o, d, p) {
  const vx = p[0] - o[0];
  const vy = p[1] - o[1];
  const vz = p[2] - o[2];
  const len = Math.hypot(vx, vy, vz) || 1;
  const dot = (vx * d[0] + vy * d[1] + vz * d[2]) / len;
  return Math.acos(clamp(dot, -1, 1));
}
