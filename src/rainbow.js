import {angTo, BANDS, COLORS, distRay, mix, prim, scene} from './lib.js';
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
 * Spawn a rainbow arch in front of the first-person view.
 * @param {number} x
 * @param {number} y
 * @param {number} z
 * @param {number} pre Starting fill of the one missing band.
 * @return {Object}
 */
export function spawn(x, y, z, pre) {
  const el = prim('a-entity', scene(), {
    position: x + ' ' + y + ' ' + z,
  });
  const bands = [];
  const gap = (Math.random() * BANDS) | 0;
  for (let i = 0; i < BANDS; i++) {
    const rad = 0.3 + i * 0.07;
    const te = prim('a-torus', el, {
      radius: '' + rad,
      'radius-tubular': '0.032',
      arc: '210',
      'segments-tubular': '18',
      'segments-radial': '8',
    });
    const probes = [];
    for (let k = 0; k < 7; k++) {
      const t = Math.PI * (0.05 + 0.9 * k / 6);
      probes.push([rad * Math.cos(t), rad * Math.sin(t), 0]);
    }
    const b = {fill: i === gap ? pre : 1, el: te, probes, rad};
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
  const c = mix('#9aa09a', COLORS[i], t);
  const em = mix('#222222', COLORS[i], t);
  b.el.setAttribute('color', c);
  b.el.setAttribute('material', 'emissive:' + em + ';opacity:1');
  const pulse = t > 0.88 && t < 1 ? 1 + Math.sin(G.t * 10) * 0.04 : 1;
  if (b.el.object3D) b.el.object3D.scale.set(pulse, pulse, pulse);
}

const _pw = {v: null};

/**
 * Closest rainbow in the aim cone; hits its missing band.
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
    let gap = -1;
    for (let i = 0; i < BANDS; i++) {
      if (rb.bands[i].fill < 1) gap = i;
    }
    if (gap < 0) continue;
    for (let i = 0; i < BANDS; i++) {
      const b = rb.bands[i];
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
          best = {rb, i: gap, p: [tmp[0], tmp[1], tmp[2]]};
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
    const y = r.y + Math.sin(G.t * 1.5 + r.ph) * 0.12;
    r.el.setAttribute('position', r.x + ' ' + y + ' ' + r.z);
  }
}
