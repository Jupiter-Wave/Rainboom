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
    const col = i % 3;
    const row = i / 3 | 0;
    const x = (col - 1) * 1.15;
    const y = 1.85 - row * 0.7;
    const el = ent(s, {
      geometry: 'primitive:sphere;radius:0.22',
      position: `${x} ${y} -3.2`,
    });
    nodes.push({el, key: f[1], name: f[0], col: f[2]});
  });
  cont = ent(s, {
    geometry: 'primitive:sphere;radius:0.28',
    material: 'color:#fff;emissive:#aaa',
    position: '0 0.85 -3.1',
  });
  hide();
}

/** Hide upgrade nodes. @return {void} */
export function hide() {
  for (const n of nodes) n.el.setAttribute('visible', 'false');
  if (cont) cont.setAttribute('visible', 'false');
  hover = '';
}

/** Show upgrade nodes. @return {void} */
export function show() {
  for (const n of nodes) {
    n.el.setAttribute('visible', 'true');
    tint(n);
  }
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
    if (angTo(o, d, it.p) > 0.18) continue;
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
    I.hitPoint[0] = 0;
    I.hitPoint[1] = 0.85;
    I.hitPoint[2] = -3.1;
    if (tap()) flags.goNext = true;
    return;
  }
  if (!n) {
    hover = 'BLAST A NODE';
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
