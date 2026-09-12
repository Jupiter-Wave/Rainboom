import {angTo, COLORS, distRay, ent, scene} from './lib.js';
import {G, I} from './state.js';
import * as audio from './audio.js';
import * as wd from './wavedash.js';

const bits = [];
const coins = [];
export let punch = 0;
let ring;
let ringEl;
let ringT = 0;
let ringR = 1;
const _rv = {v: null, z: null};

/** Turn the shockwave ring to face the player. @return {void} */
function aimRing() {
  const o = ringEl && ringEl.object3D;
  if (!o) return;
  if (!_rv.v) {
    _rv.v = new THREE.Vector3();
    _rv.z = new THREE.Vector3(0, 0, 1);
  }
  _rv.v.set(
      I.aimOrigin[0] - o.position.x,
      I.aimOrigin[1] - o.position.y,
      I.aimOrigin[2] - o.position.z).normalize();
  o.quaternion.setFromUnitVectors(_rv.z, _rv.v);
}

/**
 * Vertex-colored torus so the shockwave reads as a rainbow circle.
 * @return {THREE.Mesh}
 */
function makeRing() {
  const geo = new THREE.TorusGeometry(1, 0.032, 5, 32);
  const pos = geo.attributes.position;
  const col = new Float32Array(pos.count * 3);
  for (let i = 0; i < pos.count; i++) {
    const h = ((Math.atan2(pos.getY(i), pos.getX(i)) /
        (Math.PI * 2) + 1) * 7 | 0) % 7;
    const n = parseInt(COLORS[h].slice(1), 16);
    col[i * 3] = (n >> 16) / 255;
    col[i * 3 + 1] = ((n >> 8) & 255) / 255;
    col[i * 3 + 2] = (n & 255) / 255;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  return new THREE.Mesh(geo, new THREE.MeshBasicMaterial({
    vertexColors: true, transparent: true, opacity: 0.9,
    side: THREE.DoubleSide, depthWrite: false,
  }));
}

/**
 * Preallocate fragment and coin pools.
 * @return {void}
 */
export function create() {
  const s = scene();
  for (let i = 0; i < 18; i++) {
    const el = ent(s, {
      geometry: 'primitive:sphere;radius:0.16',
      material: 'color:#ddd;opacity:0.28;transparent:true;emissive:#889',
      visible: 'false',
    });
    bits.push({el, t: 0, v: [0, 0, 0], p: [0, 0, 0], kind: 0});
  }
  for (let i = 0; i < 22; i++) {
    const el = ent(s, {
      geometry: 'primitive:sphere;radius:0.028',
      visible: 'false',
    });
    bits.push({el, t: 0, v: [0, 0, 0], p: [0, 0, 0], kind: 1});
  }
  for (let i = 0; i < 16; i++) {
    const el = ent(s, {
      geometry: 'primitive:sphere;radius:0.11',
      material: 'color:#fd0;emissive:#a80',
      visible: 'false',
    });
    coins.push({el, live: false, p: [0, 0, 0], val: 0, ph: 0, age: 0});
  }
  ring = makeRing();
  ring.visible = false;
  ringEl = ent(s, {visible: 'false'});
  const add = () => {
    if (ringEl.object3D && !ring.parent) ringEl.object3D.add(ring);
  };
  ringEl.addEventListener('loaded', add);
  add();
}

/**
 * Burst fragments and drop a collectible coin.
 * @param {Object} r
 * @param {number} val Coin gold value.
 * @return {void}
 */
export function explode(r, val) {
  punch = 0.14;
  const idle = bits.filter((b) => b.t <= 0);
  let n = 0;
  for (const b of idle) {
    if (n >= 26) break;
    const smoke = b.kind === 0;
    b.p[0] = r.x + (Math.random() - 0.5) * 0.35;
    b.p[1] = r.y + 0.1 + Math.random() * 0.25;
    b.p[2] = r.z + (Math.random() - 0.5) * 0.35;
    const spd = smoke ? 0.55 : 2.4;
    b.v[0] = (Math.random() - 0.5) * spd;
    b.v[1] = smoke ? 0.35 + Math.random() * 0.45 : 1.1 + Math.random() * 1.6;
    b.v[2] = (Math.random() - 0.5) * spd;
    b.t = smoke ? 1.15 : 0.75;
    b.el.setAttribute('visible', 'true');
    if (smoke) {
      const c = COLORS[n % COLORS.length];
      b.el.setAttribute('material',
          'color:' + c + ';emissive:#667;opacity:0.22;transparent:true');
    } else {
      const c = COLORS[n % COLORS.length];
      b.el.setAttribute('material',
          'color:#fff;emissive:' + c + ';opacity:0.95;transparent:true');
    }
    n++;
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

/**
 * Gold spark at a spent-node position.
 * @param {number} x
 * @param {number} y
 * @param {number} z
 * @return {void}
 */
export function spark(x, y, z) {
  const b = bits.find((it) => it.t <= 0 && it.kind === 1);
  if (!b) return;
  b.p[0] = x;
  b.p[1] = y;
  b.p[2] = z;
  b.v[0] = 0;
  b.v[1] = 1.5;
  b.v[2] = 0;
  b.t = 0.4;
  b.el.setAttribute('visible', 'true');
  b.el.setAttribute('material',
      'color:#fd0;emissive:#fd0;opacity:1;transparent:true');
}

/**
 * Expanding shockwave ring around a rainboom.
 * @param {Object} r
 * @param {number} rad
 * @return {void}
 */
export function wave(r, rad) {
  if (!ring) return;
  const o = ringEl && ringEl.object3D;
  if (o) o.position.set(r.x, r.y + 0.12, r.z);
  aimRing();
  ringT = 0.32;
  ringR = Math.max(1.2, rad);
  ring.visible = true;
  if (ringEl) ringEl.setAttribute('visible', 'true');
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
  if (ringT > 0) {
    ringT -= dt;
    aimRing();
    const u = 1 - ringT / 0.32;
    const sc = 0.25 + u * ringR;
    ring.scale.set(sc, sc, 1);
    if (ringT <= 0) {
      ring.visible = false;
      if (ringEl) ringEl.setAttribute('visible', 'false');
    }
  }
  for (const b of bits) {
    if (b.t <= 0) continue;
    b.t -= dt;
    if (b.kind === 0) {
      b.v[1] += 0.35 * dt;
      b.v[0] *= 1 - dt * 0.8;
      b.v[2] *= 1 - dt * 0.8;
    } else {
      b.v[1] -= 3.2 * dt;
    }
    b.p[0] += b.v[0] * dt;
    b.p[1] += b.v[1] * dt;
    b.p[2] += b.v[2] * dt;
    if (b.el.object3D) {
      b.el.object3D.position.set(b.p[0], b.p[1], b.p[2]);
      const sc = b.kind === 0 ?
          0.7 + (1.15 - b.t) * 1.4 :
          0.35 + Math.abs(Math.sin(G.t * 22 + b.p[0] * 8)) * 0.85;
      b.el.object3D.scale.setScalar(Math.max(0.02, sc));
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
