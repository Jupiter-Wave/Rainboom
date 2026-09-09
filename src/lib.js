/** Shared helpers and constants. */

export const COLORS = ['#e22', '#e80', '#ee0', '#2c2', '#28e', '#a2e'];

/** @return {Element} The A-Frame scene. */
export function scene() {
  return document.getElementById('sc');
}

/**
 * Create an A-Frame entity.
 * @param {Element} parent Parent node.
 * @param {Object<string, string>} attrs Attribute map.
 * @return {Element} New entity.
 */
export function ent(parent, attrs) {
  const e = document.createElement('a-entity');
  for (const k in attrs) e.setAttribute(k, attrs[k]);
  parent.appendChild(e);
  return e;
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
 * Mix two hex colors.
 * @param {string} a
 * @param {string} b
 * @param {number} t
 * @return {string}
 */
export function mix(a, b, t) {
  const p = parseInt(a.slice(1), 16);
  const q = parseInt(b.slice(1), 16);
  const m = (s, e) => {
    const x = (p >> s) & 255;
    const y = (q >> s) & 255;
    return (x + (y - x) * t) | 0;
  };
  const hex = (m(16) << 16) | (m(8) << 8) | m(0);
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
