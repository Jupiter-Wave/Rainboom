import {ent, scene} from './lib.js';
import {G, I, tap} from './state.js';
import {angTo, distRay} from './lib.js';
import * as audio from './audio.js';
import * as wd from './wavedash.js';

/** Shared upgrade-phase flags. */
export const flags = {goNext: false};

const COST = [10, 25, 55];
const FAM = [
  ['POWER', 'power', '#f48'],
  ['SPREAD', 'spread', '#4f8'],
  ['SPLASH', 'splash', '#8cf'],
  ['CHAIN', 'chain', '#fc4'],
  ['GOLD', 'gold', '#fd0'],
  ['TIME', 'time', '#adf'],
];

const nodes = [];
let cont;
export let hover = '';

/**
 * Build upgrade constellation (hidden until show).
 * @return {void}
 */
export function create() {
  const s = scene();
  FAM.forEach((f, i) => {
    const a = -1.2 + (i / (FAM.length - 1)) * 2.4;
    const R = 2.55;
    const x = Math.sin(a) * R;
    const z = -Math.cos(a) * R;
    const y = 1.28 + (i % 2) * 0.42;
    const el = ent(s, {
      geometry: 'primitive:sphere;radius:0.22',
      position: `${x} ${y} ${z}`,
    });
    nodes.push({el, key: f[1], name: f[0], col: f[2]});
  });
  cont = ent(s, {
    geometry: 'primitive:sphere;radius:0.28',
    material: 'color:#fff;emissive:#aaa',
    position: '0 0.95 -2.05',
  });
  hide();
}

/** Hide upgrade nodes. @return {void} */
export function hide() {
  for (const n of nodes) n.el.setAttribute('visible', 'false');
  if (cont) cont.setAttribute('visible', 'false');
  hover = '';
}

/** Show upgrade nodes in front of current aim. @return {void} */
export function show() {
  const a0 = Math.atan2(I.aimDirection[0], -I.aimDirection[2]);
  FAM.forEach((_, i) => {
    const a = a0 - 0.95 + (i / (FAM.length - 1)) * 1.9;
    const y = 1.28 + (i % 2) * 0.42;
    nodes[i].el.setAttribute('position',
        Math.sin(a) * 2.4 + ' ' + y + ' ' + (-Math.cos(a) * 2.4));
    nodes[i].el.setAttribute('visible', 'true');
    tint(nodes[i]);
  });
  cont.setAttribute('position',
      Math.sin(a0) * 1.9 + ' 0.95 ' + (-Math.cos(a0) * 1.9));
  cont.setAttribute('visible', 'true');
}

/**
 * Recolor a node from affordability.
 * @param {Object} n
 * @return {void}
 */
function tint(n) {
  const lv = G.up[n.key];
  const maxed = lv >= 3;
  const cost = COST[lv] || 0;
  const ok = !maxed && G.gold >= cost;
  n.el.setAttribute('material',
      'color:' + n.col + ';emissive:' + (ok ? n.col : '#000') +
      ';opacity:' + (maxed ? 0.25 : ok ? 1 : 0.45) + ';transparent:true');
}

/**
 * Pick a node in the aim cone.
 * @return {?Object}
 */
function aimNode() {
  const o = I.aimOrigin;
  const d = I.aimDirection;
  let best = null;
  let bestD = 0.45;
  const pts = nodes.map((n) => {
    const p = n.el.object3D.position;
    return {n, p: [p.x, p.y, p.z]};
  });
  if (cont.object3D) {
    const p = cont.object3D.position;
    pts.push({n: {key: 'GO', name: 'GO', el: cont}, p: [p.x, p.y, p.z]});
  }
  for (const it of pts) {
    if (it.n.el.object3D && !it.n.el.object3D.visible) continue;
    if (angTo(o, d, it.p) > 0.24) continue;
    const dist = distRay(o, d, it.p);
    if (dist < bestD) {
      bestD = dist;
      best = it.n;
    }
  }
  return best;
}

/**
 * Handle fire-to-buy during UPGRADE.
 * @return {void}
 */
export function tick() {
  const n = aimNode();
  if (n && n.key === 'GO') {
    hover = 'NEXT ROUND';
    const gp = cont.object3D.position;
    I.hitPoint[0] = gp.x;
    I.hitPoint[1] = gp.y;
    I.hitPoint[2] = gp.z;
    if (tap()) flags.goNext = true;
    return;
  }
  if (!n) {
    hover = 'CLICK TO BUY';
    return;
  }
  const lv = G.up[n.key];
  const cost = COST[lv];
  hover = lv >= 3 ? n.name + ' MAX' : n.name + ' ' + (lv + 1) + '/3  ' +
      cost + 'g';
  const p = n.el.object3D.position;
  I.hitPoint[0] = p.x;
  I.hitPoint[1] = p.y;
  I.hitPoint[2] = p.z;
  if (!tap() || lv >= 3 || G.gold < cost) return;
  G.gold -= cost;
  G.up[n.key]++;
  audio.buy();
  wd.onBuy(G);
  for (const x of nodes) tint(x);
}
