import {angTo, COLORS, distRay, ent, scene} from './lib.js';
import {G, I, tap} from './state.js';
import * as audio from './audio.js';
import * as fx from './fx.js';
import * as wd from './wavedash.js';
import {
  apply, cost, DEF, edgeList, hoverText, localPos, nodeCol, relayout,
  reset, revealed, unlocked,
} from './nodes.js';
import {fillRoot} from './tree3d.js';

/** Shared upgrade-phase flags. */
export const flags = {goNext: false};
export let hover = '';

const GOP = [0, -0.88, -1.48];
const nodes = [];
const EDGES = edgeList();
let rootEl;
let built = false;
let cont;
let lines;
let lineCol;
let linePos;
let hoverI = -1;
let pulseI = -1;
let pulseT = 0;
const _wp = {v: null};

/** Build meshes once object3D exists. @return {void} */
function setup() {
  if (built || !rootEl || !rootEl.object3D) return;
  built = true;
  const built3d = fillRoot(rootEl.object3D, GOP, EDGES);
  nodes.push(...built3d.nodes);
  cont = built3d.cont;
  lines = built3d.lines;
  lineCol = built3d.lineCol;
  linePos = lines.geometry.attributes.position.array;
  tintAll();
}

/** Spawn hidden constellation root. @return {void} */
export function create() {
  reset();
  rootEl = ent(scene(), {visible: 'false'});
  rootEl.addEventListener('loaded', setup);
  setup();
}

/** Hide the tree. @return {void} */
export function hide() {
  if (rootEl) rootEl.setAttribute('visible', 'false');
  if (rootEl && rootEl.object3D) rootEl.object3D.visible = false;
  hover = '';
  hoverI = -1;
}

/** Face the compact sky graph and park GO in view. @return {void} */
export function show() {
  setup();
  if (!rootEl || !rootEl.object3D) return;
  const a0 = Math.atan2(I.aimDirection[0], -I.aimDirection[2]);
  rootEl.object3D.position.set(0, 1.38, 0);
  rootEl.object3D.rotation.set(0, a0, 0);
  if (cont) cont.position.set(GOP[0], GOP[1], GOP[2]);
  rootEl.object3D.visible = true;
  rootEl.setAttribute('visible', 'true');
  tintAll();
}

/** Recolor nodes and edges. @return {void} */
function tintAll() {
  relayout();
  for (const n of nodes) {
    if (revealed(n.i)) {
      const p = localPos(n.i);
      n.g.position.set(p[0], p[1], p[2]);
      n.g.lookAt(0, 0, 0);
    }
    tintNode(n);
  }
  tintLines();
}

/** Paint one node from level / lock / gold. @param {Object} n */
function tintNode(n) {
  n.g.visible = revealed(n.i);
  if (!n.g.visible) return;
  const d = DEF[n.i];
  const lv = G.lv[n.i];
  const maxed = lv >= d[4];
  const open = unlocked(n.i);
  const ok = open && !maxed && G.gold >= cost(n.i);
  const col = nodeCol(n.i);
  const fill = d[4] ? lv / d[4] : 0;
  n.core.material.color.set(lv ? col : '#111');
  n.core.material.opacity = open ? 0.25 + 0.7 * fill : 0.12;
  n.outline.material.color.set(col);
  n.outline.material.opacity = !open ? 0.14 : maxed ? 1 : ok ? 0.85 : 0.4;
  setOp(n.icon, open ? (maxed ? 1 : 0.7 + 0.25 * fill) : 0.12);
  for (let k = 0; k < n.pips.length; k++) {
    n.pips[k].material.color.set(col);
    n.pips[k].material.opacity = k < lv ? 0.95 : open ? 0.18 : 0.06;
  }
}

/** Set opacity on a mesh or group. @param {THREE.Object3D} o @param {number} op */
function setOp(o, op) {
  if (o.material) o.material.opacity = op;
  for (const c of o.children) {
    if (c.material) c.material.opacity = op;
  }
}

/** Update per-vertex edge colors. @return {void} */
function tintLines() {
  if (!lines) return;
  for (let i = 0; i < EDGES.length; i++) {
    const [a, b] = EDGES[i];
    const show = revealed(a) && revealed(b);
    const pa = localPos(a);
    linePos.set(pa, i * 6);
    linePos.set(show ? localPos(b) : pa, i * 6 + 3);
    const owned = G.lv[b] > 0;
    const hot = hoverI === a || hoverI === b ||
        (pulseT > 0 && (pulseI === a || pulseI === b));
    let dim = !show ? 0 : owned ? 0.95 : 0.42;
    if (hot) dim = Math.min(1.2, dim + 0.45 + pulseT * 0.4);
    paintEnd(i * 6, nodeCol(a), dim);
    paintEnd(i * 6 + 3, nodeCol(b), dim);
  }
  lines.geometry.attributes.position.needsUpdate = true;
  lines.geometry.attributes.color.needsUpdate = true;
}

/** Write one RGB vertex. @param {number} o @param {string} hex @param {number} dim */
function paintEnd(o, hex, dim) {
  const n = parseInt(hex.slice(1), 16);
  lineCol[o] = (n >> 16) / 255 * dim;
  lineCol[o + 1] = ((n >> 8) & 255) / 255 * dim;
  lineCol[o + 2] = (n & 255) / 255 * dim;
}

/** World position of a group. @param {THREE.Object3D} g @return {number[]} */
function worldP(g) {
  if (!_wp.v) _wp.v = new THREE.Vector3();
  g.getWorldPosition(_wp.v);
  return [_wp.v.x, _wp.v.y, _wp.v.z];
}

/** Aim-pick a node or GO. @return {?{kind: string, i: number, p: number[]}} */
function aimNode() {
  if (!built) return null;
  const o = I.aimOrigin;
  const d = I.aimDirection;
  let best = null;
  let bestD = 0.48;
  const pts = nodes.map((n) => ({kind: 'n', i: n.i, p: worldP(n.g)}));
  pts.push({kind: 'GO', i: -1, p: worldP(cont)});
  for (const it of pts) {
    if (it.kind === 'n' && !nodes[it.i].g.visible) continue;
    if (angTo(o, d, it.p) > 0.26) continue;
    const dist = distRay(o, d, it.p);
    if (dist < bestD) {
      bestD = dist;
      best = it;
    }
  }
  return best;
}

/** Copy a point into the shared hit target. @param {number[]} p */
function aimAt(p) {
  I.hitPoint[0] = p[0];
  I.hitPoint[1] = p[1];
  I.hitPoint[2] = p[2];
}

/**
 * Pulse majors, hover scale, aim, and fire-to-buy.
 * @param {number} dt
 * @return {void}
 */
export function tick(dt) {
  setup();
  if (!built || !rootEl.object3D.visible) return;
  if (G.blast > 0) G.blast -= dt;
  if (pulseT > 0) pulseT -= dt;
  const hit = aimNode();
  hoverI = hit && hit.kind === 'n' ? hit.i : -1;
  for (const n of nodes) {
    if (!n.g.visible) continue;
    const d = DEF[n.i];
    const maxed = G.lv[n.i] >= d[4];
    const ok = unlocked(n.i) && !maxed && G.gold >= cost(n.i);
    if (d[7] === 1 && unlocked(n.i)) {
      n.outline.material.color.set(COLORS[(G.t * 3 + n.i | 0) % 7]);
    }
    let sc = 1;
    if (ok) sc += Math.sin(G.t * 4) * 0.035;
    if (hoverI === n.i) sc += 0.16;
    if (pulseI === n.i && pulseT > 0) sc += pulseT * 0.35;
    n.g.scale.setScalar(sc);
  }
  tintLines();
  if (hit && hit.kind === 'GO') {
    hover = 'GO';
    aimAt(hit.p);
    if (tap()) flags.goNext = true;
    return;
  }
  if (!hit) {
    hover = 'AIM';
    return;
  }
  hover = hoverText(hit.i);
  aimAt(hit.p);
  const d = DEF[hit.i];
  const c = cost(hit.i);
  if (!tap() || !unlocked(hit.i) || G.lv[hit.i] >= d[4] || G.gold < c) {
    return;
  }
  G.gold -= c;
  G.lv[hit.i]++;
  apply(hit.i);
  G.blast = 0.22;
  pulseI = hit.i;
  pulseT = 0.45;
  audio.buy();
  wd.onBuy(G);
  fx.spark(hit.p[0], hit.p[1], hit.p[2]);
  tintAll();
}
