import {angTo, COLORS, distRay, ent, scene} from './lib.js';
import {G, I} from './state.js';
import * as audio from './audio.js';
import * as wd from './wavedash.js';

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
  for (let i = 0; i < 16; i++) {
    const el = ent(s, {
      geometry: 'primitive:sphere;radius:0.11',
      material: 'color:#fd0;emissive:#a80',
      visible: 'false',
    });
    coins.push({el, live: false, p: [0, 0, 0], val: 0, ph: 0, age: 0});
  }
}

/**
 * Burst fragments and drop a collectible coin.
 * @param {Object} r
 * @param {number} val Coin gold value.
 * @return {void}
 */
export function explode(r, val) {
  punch = 0.16;
  let bi = 0;
  for (let i = 0; i < 7; i++) {
    const b = bits[bi++ % bits.length];
    b.p[0] = r.x + (Math.random() - 0.5) * 0.45;
    b.p[1] = r.y + Math.random() * 0.4;
    b.p[2] = r.z + (Math.random() - 0.5) * 0.45;
    b.v[0] = (Math.random() - 0.5) * 4;
    b.v[1] = 1.6 + Math.random() * 2.4;
    b.v[2] = (Math.random() - 0.5) * 4;
    b.t = 0.7;
    b.el.setAttribute('visible', 'true');
    b.el.setAttribute('material', 'color:' + COLORS[i % COLORS.length]);
  }
  let c = coins.find((x) => !x.live) || coins[0];
  if (c) {
    c.p[0] = r.x;
    c.p[1] = r.y + 0.22;
    c.p[2] = r.z;
    c.val = val;
    c.ph = Math.random() * 6;
    c.age = 0;
    c.live = true;
    c.el.setAttribute('visible', 'true');
  }
}

/**
 * Collect a coin the aim ray is hovering over.
 * @param {number} spread Radians.
 * @return {void}
 */
export function vacuum(spread) {
  const o = I.aimOrigin;
  const d = I.aimDirection;
  for (const c of coins) {
    if (!c.live) continue;
    if (angTo(o, d, c.p) > spread + 0.08) continue;
    if (distRay(o, d, c.p) > 0.45) continue;
    grab(c);
  }
}

/**
 * Grant coin gold and hide the pickup.
 * @param {Object} c
 * @return {void}
 */
function grab(c) {
  G.gold += c.val;
  c.live = false;
  c.el.setAttribute('visible', 'false');
  audio.coin();
  wd.onGold(c.val);
}

/** Hide leftover coins. @return {void} */
export function clearCoins() {
  for (const c of coins) {
    c.live = false;
    c.el.setAttribute('visible', 'false');
  }
}

/**
 * Step particles, coin bob, and camera punch.
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
    if (b.el.object3D) {
      b.el.object3D.position.set(b.p[0], b.p[1], b.p[2]);
      b.el.object3D.scale.setScalar(Math.max(0.01, b.t));
    }
    if (b.t <= 0) b.el.setAttribute('visible', 'false');
  }
  for (const c of coins) {
    if (!c.live || !c.el.object3D) continue;
    c.age += dt;
    const y = c.p[1] + Math.sin(G.t * 3 + c.ph) * 0.12;
    c.el.object3D.position.set(c.p[0], y, c.p[2]);
    c.el.object3D.rotation.y += dt * 2;
    if (c.age > 1.5) grab(c);
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
