import {angTo, COLORS, distRay, ent, scene, writeRgb} from './lib.js';
import {G, I, setHit, tap} from './state.js';
import * as audio from './audio.js';
import * as fx from './fx.js';
import * as wd from './wavedash.js';
import {
  apply, cost, DEF, edgeList, hoverText, localPos, nodeCol, relayout,
  reset, revealed, sphere, unlocked,
} from './nodes.js';
import {fillRoot} from './tree3d.js';

/** Shared upgrade-phase flags. */
export const flags = {goNext: false};
export let hover = '';
let snapView = null;

/** @return {?Object} Pending rig snap, if any. */
export function peekSnap() {
  return snapView;
}

/** Clear a consumed rig snap. @return {void} */
export function clearSnap() {
  snapView = null;
}

const GO_AIM = 0.13;
const GO_POP_DUR = 0.55;
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
let goPop = 0;
const _wp = {v: null};

/** Build meshes once object3D exists. @return {void} */
function setup() {
  if (built || !rootEl || !rootEl.object3D) return;
  built = true;
  const built3d = fillRoot(rootEl.object3D, [0, 0, 0], EDGES);
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

/** Set opacity on a mesh or group. @param {THREE.Object3D} o @param {number} op */
function setOp(o, op) {
  if (o.material) o.material.opacity = op;
  for (const c of o.children) {
    if (c.material) c.material.opacity = op;
  }
}

/** Scale and fade the GO orb. popT>0 runs the select pop. @return {void} */
function paintGo(sc, op, popT) {
  if (!cont) return;
  if (popT > 0) {
    const t = popT;
    if (t < 0.2) {
      const u = t / 0.2;
      sc = 1 + (1 - Math.pow(1 - u, 4)) * 1.45;
    } else if (t < 0.34) {
      sc = 2.45 + Math.sin((t - 0.2) / 0.14 * Math.PI) * 0.3;
    } else {
      sc = 2.45 * Math.pow(1 - (t - 0.34) / 0.66, 2.2);
    }
    op = t > 0.34 ? Math.pow(1 - (t - 0.34) / 0.66, 1.6) : 1;
  }
  cont.scale.setScalar(Math.max(0.001, sc));
  setOp(cont, op);
}

/** Hide the tree. @return {void} */
export function hide() {
  if (rootEl) rootEl.setAttribute('visible', 'false');
  if (rootEl && rootEl.object3D) rootEl.object3D.visible = false;
  hover = '';
  hoverI = -1;
  goPop = 0;
  paintGo(1, 0.9);
}

/** Yaw/pitch to look at the POWER node from the rig. @return {Object} */
function focusPower() {
  relayout();
  const p = localPos(0);
  const ty = 1.38;
  const eye = 1.4;
  const dx = p[0];
  const dy = ty + p[1] - eye;
  const dz = p[2];
  const h = Math.hypot(dx, dz);
  const yaw = Math.atan2(dx, -dz);
  const pitch = Math.atan2(dy, h || 1);
  const len = Math.hypot(dx, dy, dz) || 1;
  I.aimDirection[0] = dx / len;
  I.aimDirection[1] = dy / len;
  I.aimDirection[2] = dz / len;
  return {yaw, pitch};
}

/** Open the tree centered on POWER. @return {void} */
export function show() {
  setup();
  if (!rootEl || !rootEl.object3D) return;
  rootEl.object3D.position.set(0, 1.38, 0);
  rootEl.object3D.rotation.set(0, 0, 0);
  rootEl.object3D.visible = true;
  rootEl.setAttribute('visible', 'true');
  tintAll();
  snapView = focusPower();
  goPop = 0;
  placeGo();
}

/** Park GO on the dome below the current look heading. @return {void} */
function placeGo() {
  if (!cont) return;
  const az = Math.atan2(I.aimDirection[0], -I.aimDirection[2]);
  const p = sphere(az, -0.34);
  cont.position.set(p[0], p[1], p[2]);
  cont.lookAt(0, 0, 0);
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
    let dim = !show ? 0 : owned ? 1 : 0.58;
    if (hot) dim = Math.min(1.2, dim + 0.45 + pulseT * 0.4);
    writeRgb(lineCol, i * 6, nodeCol(a), dim);
    writeRgb(lineCol, i * 6 + 3, nodeCol(b), dim);
  }
  lines.geometry.attributes.position.needsUpdate = true;
  lines.geometry.attributes.color.needsUpdate = true;
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
  const gp = worldP(cont);
  const ga = angTo(o, d, gp);
  const gd = distRay(o, d, gp);
  let best = null;
  let bestD = 0.48;
  for (const n of nodes) {
    if (!n.g.visible) continue;
    const p = worldP(n.g);
    if (angTo(o, d, p) > 0.26) continue;
    const dist = distRay(o, d, p);
    if (dist < bestD) {
      bestD = dist;
      best = {kind: 'n', i: n.i, p};
    }
  }
  if (ga < GO_AIM && gd < 0.38 && (!best || gd <= bestD + 0.06)) {
    return {kind: 'GO', i: -1, p: gp};
  }
  return best;
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
  if (goPop) {
    if (goPop < 0) {
      paintGo(0, 0);
      return;
    }
    goPop = Math.min(1, goPop + dt / GO_POP_DUR);
    paintGo(0, 0, goPop);
    hover = 'GO';
    setHit(worldP(cont));
    tintLines();
    if (goPop >= 1) {
      goPop = -1;
      flags.goNext = true;
    }
    return;
  }
  placeGo();
  const hit = aimNode();
  const hot = hit && hit.kind === 'GO';
  paintGo(hot ? 1.28 + Math.sin(G.t * 5) * 0.14 : 1 + Math.sin(G.t * 2) * 0.05,
      hot ? 1 : 0.9);
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
  if (hot) {
    hover = 'GO';
    setHit(hit.p);
    if (tap()) {
      goPop = 0.001;
      G.blast = 0.22;
      audio.buy();
      fx.spark(hit.p[0], hit.p[1], hit.p[2]);
    }
    return;
  }
  if (!hit) {
    hover = 'AIM';
    return;
  }
  hover = hoverText(hit.i);
    setHit(hit.p);
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
