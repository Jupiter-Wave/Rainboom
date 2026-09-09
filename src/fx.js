import {COLORS, ent, scene} from './lib.js';
import {G} from './state.js';

const bits = [];
const coins = [];
export let punch = 0;

/**
 * Preallocate fragment and coin pools.
 * @return {void}
 */
export function create() {
  const s = scene();
  for (let i = 0; i < 28; i++) {
    const el = ent(s, {
      geometry: 'primitive:box;width:0.12;height:0.12;depth:0.12',
      visible: 'false',
    });
    bits.push({el, t: 0, v: [0, 0, 0], p: [0, 0, 0]});
  }
  for (let i = 0; i < 14; i++) {
    const el = ent(s, {
      geometry: 'primitive:sphere;radius:0.07',
      material: 'color:#fd0;emissive:#a80',
      visible: 'false',
    });
    coins.push({el, t: 0, p: [0, 0, 0]});
  }
}

/**
 * Burst fragments and coins from a rainbow.
 * @param {Object} r
 * @return {void}
 */
export function explode(r) {
  punch = 0.16;
  let bi = 0;
  for (let i = 0; i < 6; i++) {
    for (let k = 0; k < 2; k++) {
      const b = bits[bi++ % bits.length];
      b.p[0] = r.x + (Math.random() - 0.5);
      b.p[1] = r.y + Math.random() * 0.8;
      b.p[2] = r.z + (Math.random() - 0.5);
      b.v[0] = (Math.random() - 0.5) * 6;
      b.v[1] = 2 + Math.random() * 4;
      b.v[2] = (Math.random() - 0.5) * 6;
      b.t = 0.7;
      b.el.setAttribute('visible', 'true');
      b.el.setAttribute('material', 'color:' + COLORS[i]);
    }
  }
  for (let i = 0; i < 5; i++) {
    const c = coins[i % coins.length];
    if (c.t > 0) continue;
    c.p[0] = r.x;
    c.p[1] = r.y;
    c.p[2] = r.z;
    c.t = 0.7;
    c.el.setAttribute('visible', 'true');
  }
}

/**
 * Step particles and camera punch.
 * @param {number} dt
 * @return {void}
 */
export function tick(dt) {
  punch *= Math.max(0, 1 - dt * 8);
  for (const b of bits) {
    if (b.t <= 0) continue;
    b.t -= dt;
    b.v[1] -= 8 * dt;
    b.p[0] += b.v[0] * dt;
    b.p[1] += b.v[1] * dt;
    b.p[2] += b.v[2] * dt;
    b.el.object3D.position.set(b.p[0], b.p[1], b.p[2]);
    b.el.object3D.scale.setScalar(Math.max(0.01, b.t));
    if (b.t <= 0) b.el.setAttribute('visible', 'false');
  }
  for (const c of coins) {
    if (c.t <= 0) continue;
    c.t -= dt;
    const u = 1 - c.t / 0.7;
    c.el.object3D.position.set(
        c.p[0] * (1 - u), 1 + c.p[1] * (1 - u), c.p[2] * (1 - u));
    if (c.t <= 0) c.el.setAttribute('visible', 'false');
  }
}

/**
 * Apply punch to a camera rig.
 * @param {Element} rig
 * @return {void}
 */
export function applyPunch(rig) {
  if (!rig.object3D || punch < 0.002) return;
  const o = rig.object3D.position;
  o.x += (Math.random() - 0.5) * punch;
  o.y += (Math.random() - 0.5) * punch;
}
