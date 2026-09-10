import {angTo, BANDS, COLORS, distRay, ent, mix, scene} from './lib.js';
import {G, I} from './state.js';

export const list = [];

/**
 * Remove every rainbow entity.
 * @return {void}
 */
export function clear() {
  for (const r of list) {
    if (r.el.parentNode) r.el.parentNode.removeChild(r.el);
  }
  list.length = 0;
}

/**
 * Spawn a nearby rainbow arch facing +Z / -Z.
 * @param {number} x
 * @param {number} y
 * @param {number} z
 * @param {number} pre Starting fill 0..1.
 * @return {Object}
 */
export function spawn(x, y, z, pre) {
  const s = scene();
  const el = ent(s, {position: x + ' ' + y + ' ' + z});
  const bands = [];
  for (let i = 0; i < BANDS; i++) {
    const rad = 0.42 + i * 0.1;
    const g = ent(el, {});
    const bits = [];
    const probes = [];
    for (let k = 0; k < 7; k++) {
      const t = Math.PI * (k / 6);
      const px = Math.cos(t) * rad;
      const py = Math.sin(t) * rad;
      bits.push(ent(g, {
        geometry: 'primitive:sphere;radius:0.09',
        position: px + ' ' + py + ' 0',
      }));
      probes.push([px, py, 0]);
    }
    const b = {fill: pre, el: g, bits, probes, rad};
    bands.push(b);
    paint(b, i);
  }
  const rb = {el, x, y, z, bands, alive: true, ph: Math.random() * 6};
  list.push(rb);
  return rb;
}

/**
 * Recolor a band from fill amount.
 * @param {Object} b
 * @param {number} i
 * @return {void}
 */
export function paint(b, i) {
  const t = b.fill;
  const c = mix('#9a9690', COLORS[i], 0.5 + 0.5 * t);
  const em = mix('#444444', COLORS[i], 0.3 + 0.7 * t);
  const mat = 'color:' + c + ';emissive:' + em;
  for (const e of b.bits) e.setAttribute('material', mat);
  const pulse = t > 0.88 ? 1 + Math.sin(G.t * 10) * 0.04 : 1;
  if (b.el.object3D) b.el.object3D.scale.set(pulse, pulse, pulse);
}

const _pw = {v: null};

/**
 * Closest unfinished band in the aim cone.
 * @param {number} spread Radians.
 * @return {?{rb: Object, i: number, p: number[]}}
 */
export function pick(spread) {
  const o = I.aimOrigin;
  const d = I.aimDirection;
  let best = null;
  let bestD = 1e9;
  const tmp = [0, 0, 0];
  if (!_pw.v) _pw.v = new THREE.Vector3();
  const v = _pw.v;
  for (const rb of list) {
    if (!rb.alive || !rb.el.object3D) continue;
    const m = rb.el.object3D.matrixWorld;
    for (let i = 0; i < BANDS; i++) {
      const b = rb.bands[i];
      if (b.fill >= 1) continue;
      for (const lp of b.probes) {
        v.set(lp[0], lp[1], lp[2]).applyMatrix4(m);
        tmp[0] = v.x;
        tmp[1] = v.y;
        tmp[2] = v.z;
        const ang = angTo(o, d, tmp);
        if (ang > spread) continue;
        const dist = distRay(o, d, tmp);
        if (dist < bestD && dist < 0.35 + spread * 3) {
          bestD = dist;
          best = {rb, i, p: [tmp[0], tmp[1], tmp[2]]};
        }
      }
    }
  }
  return best;
}

/**
 * Hide a completed rainbow group.
 * @param {Object} rb
 * @return {void}
 */
export function hide(rb) {
  rb.alive = false;
  rb.el.setAttribute('visible', 'false');
}

/** Bob living rainbows in place. @return {void} */
export function float() {
  for (const r of list) {
    if (!r.alive || !r.el.object3D) continue;
    r.el.object3D.position.y = r.y + Math.sin(G.t * 1.5 + r.ph) * 0.18;
  }
}
