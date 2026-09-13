import {angTo, BANDS, COLORS, distRay, ent, popEase, scene, vis} from './lib.js';
import {G, I} from './state.js';

/** Max living rainbows from round + GOLD branch. @return {number} */
export function maxCount() {
  return Math.min(12, 4 + (G.round / 2 | 0) + (G.lv[8] | 0));
}

/**
 * Optional fat / rich spawn from later rounds and VALUE stat.
 * @param {number} round
 * @return {Object}
 */
export function rollKind(round) {
  if (round < 2) return {};
  const v = G.st[11] || 0;
  const r = Math.random();
  if (r < 0.1 + round * 0.015 + v * 0.12) {
    return {fillMul: 1.85, goldMul: 1.6, size: 1.2};
  }
  if (r < 0.22 + v * 0.08) {
    return {fillMul: 1.35, goldMul: 1.25, size: 1.08};
  }
  return {};
}

export const list = [];

const GREY = '#8a8a8a';

/**
 * One torus band (outline, grey body, or color fill).
 * @param {Element} el
 * @param {number} rad
 * @param {number} tube
 * @param {string} col
 * @param {string} em
 * @return {Element}
 */
function band(el, rad, tube, col, em) {
  return ent(el, {
    radius: '' + rad,
    'radius-tubular': '' + tube,
    arc: '210',
    'segments-tubular': '14',
    'segments-radial': '5',
    color: col,
    material: 'emissive:' + em + ';opacity:0.92;transparent:true',
  }, 'a-torus');
}

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
 * Spawn a rainbow arch facing the player.
 * @param {number} x
 * @param {number} y
 * @param {number} z
 * @param {Object=} opts pre, fillMul, goldMul, size, valMul.
 * @return {Object}
 */
export function spawn(x, y, z, opts) {
  opts = opts || {};
  const size = opts.size || 1;
  const yaw = Math.atan2(x, -z) * 180 / Math.PI;
  const el = ent(scene(), {
    position: x + ' ' + y + ' ' + z,
    rotation: '0 ' + yaw + ' 0',
    scale: size + ' ' + size + ' ' + size,
  });
  const bands = [];
  for (let i = 0; i < BANDS; i++) {
    const rad = (0.11 + i * 0.03) / size;
    const col = COLORS[i];
    band(el, rad, 0.007, col, col);
    band(el, rad, 0.018, GREY, '#444');
    const te = band(el, rad, 0.018, col, col);
    const probes = [];
    for (let k = 0; k < 7; k++) {
      const t = Math.PI * (0.05 + 0.9 * k / 6);
      probes.push([rad * Math.cos(t), rad * Math.sin(t), 0]);
    }
    bands.push({el: te, probes, rad});
  }
  const aimY = (0.11 + (BANDS - 1) * 0.03) / size * 0.78;
  const birth = opts.birth != null ? opts.birth : 1;
  const rb = {
    el, x, y, z, bands, aim: [0, aimY, 0], fill: opts.pre || 0, alive: true,
    ph: Math.random() * 6, fillMul: opts.fillMul || 1,
    goldMul: opts.goldMul || 1, size, valMul: opts.valMul || 1, over: 0,
    birth, wait: opts.wait || 0,
  };
  paint(rb);
  if (birth < 1 && el.object3D) {
    el.object3D.scale.set(0.001, 0.001, 0.001);
  }
  list.push(rb);
  return rb;
}

/**
 * Grow rainbows that are still popping in.
 * @param {number} dt
 * @return {void}
 */
export function tickPop(dt) {
  for (const r of list) {
    if (!r.alive || !r.el.object3D) continue;
    if (r.wait > 0) {
      r.wait -= dt;
      r.el.object3D.scale.set(0.001, 0.001, 0.001);
      continue;
    }
    if (r.birth >= 1) continue;
    r.birth = Math.min(1, r.birth + dt / 0.42);
    const s = r.size * Math.max(0.001, popEase(r.birth));
    r.el.object3D.scale.set(s, s, s);
  }
}

/**
 * Color-fill the arch center; leftover body stays grey.
 * @param {Object} r
 * @return {void}
 */
export function paint(r) {
  const t = r.fill;
  const arc = Math.max(4, 210 * t);
  const rot = (210 - arc) * 0.5;
  const pulse = t > 0.88 && t < 1 ? 1 + Math.sin(G.t * 8) * 0.035 : 1;
  for (const b of r.bands) {
    vis(b.el, t > 0.02);
    b.el.setAttribute('arc', '' + arc);
    b.el.setAttribute('rotation', '0 0 ' + rot);
    if (b.el.object3D) b.el.object3D.scale.set(pulse, pulse, pulse);
  }
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
    if (!rb.alive || rb.fill >= 1 || rb.birth < 1 || rb.wait > 0 ||
        !rb.el.object3D) continue;
    const m = rb.el.object3D.matrixWorld;
    const tol = 0.38 + spread * 4.5 + rb.size * 0.14;
    const tryPt = (lp, angMul) => {
      v.set(lp[0], lp[1], lp[2]).applyMatrix4(m);
      tmp[0] = v.x;
      tmp[1] = v.y;
      tmp[2] = v.z;
      if (angTo(o, d, tmp) > spread * angMul) return;
      const dist = distRay(o, d, tmp);
      if (dist < bestD && dist < tol) {
        bestD = dist;
        best = {rb, i: 0, p: [tmp[0], tmp[1], tmp[2]]};
      }
    };
    tryPt(rb.aim, 1.25);
    for (const b of rb.bands) {
      for (const lp of b.probes) tryPt(lp, 1);
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
  vis(rb.el, false);
}

/**
 * Side cue only when no living rainbow is on-screen.
 * @param {number} yaw Rig yaw radians.
 * @param {number} half Visible half-FOV radians.
 * @return {number} -1 left, 1 right, 0 none.
 */
export function sense(yaw, half) {
  const fx = Math.sin(yaw);
  const fz = -Math.cos(yaw);
  let best = 0;
  let bestA = 1e9;
  let seen = 0;
  for (const r of list) {
    if (!r.alive) continue;
    const dist = Math.hypot(r.x, r.z);
    if (dist < 0.1) continue;
    const a = Math.atan2(fx * (r.z / dist) - fz * (r.x / dist),
        fx * (r.x / dist) + fz * (r.z / dist));
    if (Math.abs(a) <= half) seen++;
    if (Math.abs(a) < bestA) {
      bestA = Math.abs(a);
      best = a;
    }
  }
  if (seen || bestA > 3) return 0;
  return best > 0 ? 1 : -1;
}

/** Bob living rainbows in place. @return {void} */
export function float() {
  for (const r of list) {
    if (!r.alive || !r.el.object3D) continue;
    const y = r.y + Math.sin(G.t * 1.5 + r.ph) * 0.12;
    r.el.setAttribute('position', r.x + ' ' + y + ' ' + r.z);
  }
}
