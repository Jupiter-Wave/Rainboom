import {COLORS, mix} from './lib.js';
import {G} from './state.js';

/** Branch colors: R O Y G B V (skip cyan). */
const BRCOL = [
  COLORS[0], COLORS[1], COLORS[2], COLORS[3], COLORS[5], COLORS[6],
];

/** Stat slots written by common nodes. */
export const S = {
  PWR: 0, WID: 1, CRT: 2, SWF: 3, SWR: 4, SWS: 5,
  CHR: 6, OVR: 7, SEC: 8, GLD: 9, CGD: 10, RBV: 11,
  TIM: 12, PFL: 13, AUR: 14, ATO: 15,
};
const NS = 16;

/** Major ability bitflags. */
export const F = {
  PRISM: 1, SHOCK: 2, CHAIN: 4, POT: 8, CASC: 16, BORROW: 32,
  AURA: 64, NOVA: 128, DBL: 256, AFTER: 512, CHROMA: 1024, ETERN: 2048,
};

/**
 * Packed defs (ints).
 * [brA, brB, t100, y100, max, base, sc100, kind, id, amt1000, ic,
 *  name, hint, pId, pLv...]
 * kind 0 = stat, 1 = flag.
 */
export const DEF = [
  [0, 0, 30, 18, 5, 5, 160, 0, S.PWR, 220, 0, 'POWER', '+FILL'],
  [0, 0, 55, 38, 3, 8, 170, 0, S.WID, 80, 0, 'WIDTH', '+AIM', 0, 1],
  [0, 0, 78, 12, 5, 12, 160, 0, S.CRT, 70, 0, 'CRIT', '+CRIT', 0, 2],
  [0, 0, 102, 32, 1, 40, 100, 1, F.PRISM, 0, 6, 'PRISM', 'NEAR', 0, 3],
  [1, 1, 30, 42, 1, 15, 100, 1, F.SHOCK, 0, 6, 'SHOCK', 'WAVE', 0, 1],
  [1, 1, 55, 16, 5, 8, 155, 0, S.SWF, 50, 1, 'FILL', '+WAVE', 4, 1],
  [1, 1, 78, 40, 5, 8, 155, 0, S.SWR, 200, 1, 'RAD', '+SIZE', 4, 1],
  [1, 1, 102, 14, 3, 12, 170, 0, S.SWS, 150, 1, 'BLAST', '+DMG', 4, 1],
  [2, 2, 30, 10, 5, 8, 155, 0, S.GLD, 120, 2, 'GOLD', '+G', 0, 1],
  [2, 2, 55, 36, 3, 12, 170, 0, S.CGD, 180, 2, 'COMBO', '+COMBO', 8, 1],
  [2, 2, 78, 8, 5, 10, 155, 0, S.RBV, 100, 2, 'VALUE', '+RB', 8, 2],
  [2, 2, 102, 34, 1, 40, 100, 1, F.POT, 0, 6, 'POT', 'x5', 8, 3, 10, 2],
  [3, 3, 30, 40, 5, 10, 155, 0, S.PFL, 4, 5, 'TICK', '+TICK', 0, 2],
  [3, 3, 58, 18, 1, 40, 100, 1, F.AURA, 0, 6, 'AURA', 'NEAR', 12, 2],
  [3, 3, 80, 44, 3, 12, 170, 0, S.AUR, 250, 5, 'REACH', '+R', 13, 1],
  [3, 3, 104, 16, 5, 12, 155, 0, S.ATO, 12, 5, 'AUTO', '+AUTO', 13, 1],
  [4, 4, 30, 14, 5, 8, 150, 0, S.TIM, 500, 3, 'TIME', '+SEC', 0, 2],
  [4, 4, 102, 36, 1, 40, 100, 1, F.BORROW, 0, 6, 'BORROW', '+SEC', 16, 3],
  [5, 5, 32, 36, 3, 10, 170, 0, S.CHR, 250, 4, 'RANGE', '+RNG', 4, 1],
  [5, 5, 56, 12, 5, 12, 155, 0, S.OVR, 100, 4, 'OVER', 'SPILL', 18, 1],
  [5, 5, 80, 40, 1, 45, 100, 1, F.CHAIN, 0, 6, 'CHAIN', 'CHAIN', 4, 1, 5, 2],
  [5, 5, 104, 18, 3, 15, 170, 0, S.SEC, 120, 4, 'ECHO', '+ECHO', 20, 1],
  [2, 5, 122, 50, 1, 55, 100, 1, F.CASC, 0, 6, 'CASC', '+G', 20, 1, 9, 2],
  [0, 1, 120, 48, 1, 60, 100, 1, F.NOVA, 0, 6, 'NOVA', 'OVER', 0, 3, 5, 3],
  [2, 5, 142, 22, 1, 60, 100, 1, F.DBL, 0, 6, 'DBL', 'SPAWN', 10, 3, 20, 1],
  [0, 3, 128, 8, 1, 55, 100, 1, F.AFTER, 0, 6, 'GHOST', 'GHOST', 0, 3, 13, 1],
  [1, 5, 132, 52, 1, 60, 100, 1, F.CHROMA, 0, 6, 'CHROMA', 'RAMP', 4, 1, 20, 1],
  [4, 5, 122, 6, 1, 60, 100, 1, F.ETERN, 0, 6, 'ETERN', '+SEC', 17, 1, 20, 1],
];

const R = 2.2;
const STEP = 0.28;
const POS = new Map();

/** @param {number} i @return {number} First parent id or -1. */
function par(i) {
  const d = DEF[i];
  return d.length > 13 ? d[13] : -1;
}

/** @param {number} br Branch index 0..5. @return {number} Base azimuth. */
function branchAz(br) {
  return (br / 6) * Math.PI * 1.4 - Math.PI * 0.7;
}

/** Map az/el to a point on the sky sphere. @param {number} az @param {number} el */
export function sphere(az, el) {
  const c = Math.cos(el);
  return [Math.sin(az) * c * R, Math.sin(el) * R, -Math.cos(az) * c * R];
}

/** Recompute sky positions for visible nodes only. @return {void} */
export function relayout() {
  POS.clear();
  if (!revealed(0)) return;
  POS.set(0, sphere(0, 0.05));
  spread(0);
}

/** Place children with branch anchors and wide fan. @param {number} p */
function spread(p) {
  const kids = [];
  for (let i = 0; i < DEF.length; i++) {
    if (i !== p && revealed(i) && par(i) === p) kids.push(i);
  }
  if (!kids.length) return;
  if (p === 0) {
    const slot = new Map();
    for (const kid of kids) {
      const br = ((DEF[kid][0] + DEF[kid][1]) / 2) | 0;
      if (!slot.has(br)) slot.set(br, []);
      slot.get(br).push(kid);
    }
    for (const [br, list] of slot) {
      list.sort((a, b) => a - b);
      const az0 = branchAz(br);
      const el0 = 0.04 + (br % 3) * 0.06;
      for (let k = 0; k < list.length; k++) {
        const az = az0 + (k - (list.length - 1) / 2) * 0.2;
        const el = el0 + k * 0.05;
        POS.set(list[k], sphere(az, el));
        spread(list[k]);
      }
    }
    return;
  }
  kids.sort((a, b) => a - b);
  const pp = POS.get(p);
  const az0 = Math.atan2(pp[0], -pp[2]);
  const el0 = Math.asin(Math.max(-1, Math.min(1, pp[1] / R)));
  const fan = kids.length === 1 ? 0 : STEP * (kids.length - 1);
  for (let k = 0; k < kids.length; k++) {
    const t = kids.length === 1 ? 0 : (k / (kids.length - 1) - 0.5) * fan;
    const az = az0 + t;
    const el = Math.min(0.48, el0 + 0.14 + (k - (kids.length - 1) / 2) * 0.07);
    POS.set(kids[k], sphere(az, el));
    spread(kids[k]);
  }
}

/** Clear per-run upgrade state. @return {void} */
export function reset() {
  G.lv = new Uint8Array(DEF.length);
  G.st = new Float32Array(NS);
  G.fl = 0;
}

/**
 * Gold cost of the next level of node i.
 * @param {number} i
 * @return {number}
 */
export function cost(i) {
  const d = DEF[i];
  const lv = G.lv[i];
  if (lv >= d[4]) return 0;
  return (d[5] * Math.pow(d[6] / 100, lv)) | 0;
}

/**
 * True if all parent level gates pass.
 * @param {number} i
 * @return {boolean}
 */
export function unlocked(i) {
  const d = DEF[i];
  for (let k = 13; k < d.length; k += 2) {
    if (G.lv[d[k]] < d[k + 1]) return false;
  }
  return true;
}

/**
 * Apply one purchased level of node i.
 * @param {number} i
 * @return {void}
 */
export function apply(i) {
  const d = DEF[i];
  if (d[7]) G.fl |= d[8];
  else G.st[d[8]] += d[9] / 1000;
}

/**
 * Branch or blended hybrid color for node i.
 * @param {number} i
 * @return {string}
 */
export function nodeCol(i) {
  const d = DEF[i];
  if (d[0] === d[1]) return BRCOL[d[0]];
  return mix(BRCOL[d[0]], BRCOL[d[1]], 0.5);
}

/**
 * Sky-sphere position: flat constellation wrapped around you.
 * @param {number} i
 * @return {number[]}
 */
export function localPos(i) {
  return POS.get(i) || [0, 0.04, -R];
}

/**
 * True if owned or the next adjacent buy (prereqs met).
 * @param {number} i
 * @return {boolean}
 */
export function revealed(i) {
  return G.lv[i] > 0 || unlocked(i);
}

/**
 * Parent → child edges (no hub). Hidden until both ends reveal.
 * @return {number[][]}
 */
export function edgeList() {
  const e = [];
  for (let i = 0; i < DEF.length; i++) {
    const d = DEF[i];
    for (let k = 13; k < d.length; k += 2) e.push([d[k], i]);
  }
  return e;
}

/**
 * First unmet prerequisite label.
 * @param {number} i
 * @return {string}
 */
export function lockWhy(i) {
  const d = DEF[i];
  for (let k = 13; k < d.length; k += 2) {
    if (G.lv[d[k]] < d[k + 1]) {
      return DEF[d[k]][11] + d[k + 1];
    }
  }
  return 'LOCK';
}

/**
 * Compact hover line for node i.
 * @param {number} i
 * @return {string}
 */
export function hoverText(i) {
  const d = DEF[i];
  if (!unlocked(i)) return d[11] + ' ' + lockWhy(i);
  const lv = G.lv[i];
  if (lv >= d[4]) return d[11] + ' MAX';
  return d[11] + ' ' + lv + '/' + d[4] + ' ' + d[12] + ' ' + cost(i) + 'g';
}
