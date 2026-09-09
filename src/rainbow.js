import {angTo, COLORS, distRay, ent, mix, scene} from './lib.js';
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
 * Spawn a rainbow facing the origin.
 * @param {number} x
 * @param {number} y
 * @param {number} z
 * @param {number} pre Starting fill 0..1.
 * @return {Object}
 */
export function spawn(x, y, z, pre) {
  const s = scene();
  const el = ent(s, {position: `${x} ${y} ${z}`});
  if (el.object3D) el.object3D.lookAt(0, y, 0);
  const bands = [];
  for (let i = 0; i < 6; i++) {
    const rad = 0.9 + i * 0.18;
    const te = ent(el, {
      geometry: 'primitive:torus;radius:' + rad +
          ';radiusTubular:0.055;arc:190;segmentsTubular:10;segmentsRadial:5',
      rotation: '0 0 0',
    });
    const probes = [];
    for (let k = 0; k < 6; k++) {
      const t = (k / 5) * Math.PI * 0.95 + 0.08;
      probes.push([rad * Math.cos(t), rad * Math.sin(t), 0]);
    }
    const b = {fill: pre, el: te, probes, rad};
    bands.push(b);
    paint(b, i);
  }
  const rb = {el, x, y, z, bands, alive: true};
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
  const c = mix('#221810', COLORS[i], 0.2 + 0.8 * t);
  const pulse = t > 0.88 ? 1 + Math.sin(G.t * 10) * 0.04 : 1;
  b.el.setAttribute('material',
      'color:' + c + ';opacity:' + (0.4 + 0.6 * t) +
      ';transparent:true;emissive:' + (t > 0.75 ? c : '#000'));
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
    for (let i = 0; i < 6; i++) {
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
