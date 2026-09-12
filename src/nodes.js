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
  TIM: 12, TEF: 13, TBN: 14, PFL: 15, AUR: 16, ATO: 17,
};
const NS = 18;

/** Major ability bitflags. */
export const F = {
  PRISM: 1, SHOCK: 2, CHAIN: 4, POT: 8, CASC: 16, BORROW: 32,
  AURA: 64, NOVA: 128, DBL: 256, AFTER: 512, CHROMA: 1024, ETERN: 2048,
};

/**
 * Packed defs.
 * [brA, brB, t, y, max, base, sc, kind, id, amt, ic, name, hint, pId, pLv...]
 * kind 0 = stat, 1 = flag. ic: 0 beam 1 shock 2 gold 3 time 4 chain 5 aura 6 major.
 */
export const DEF = [
  [0, 0, 0.30, 0.18, 5, 5, 1.6, 0, S.PWR, 0.22, 0, 'POWER', '+FILL'],
  [0, 0, 0.55, 0.38, 3, 8, 1.7, 0, S.WID, 0.08, 0, 'WIDTH', '+AIM', 0, 1],
  [0, 0, 0.78, 0.12, 5, 12, 1.6, 0, S.CRT, 0.07, 0, 'CRIT', '+CRIT', 0, 2],
  [0, 0, 1.02, 0.32, 1, 40, 1, 1, F.PRISM, 0, 6, 'PRISM', 'NEAR', 0, 3],
  [1, 1, 0.30, 0.42, 1, 15, 1, 1, F.SHOCK, 0, 6, 'SHOCK', 'WAVE', 0, 1],
  [1, 1, 0.55, 0.16, 5, 8, 1.55, 0, S.SWF, 0.05, 1, 'FILL', '+WAVE', 4, 1],
  [1, 1, 0.78, 0.40, 5, 8, 1.55, 0, S.SWR, 0.2, 1, 'RAD', '+SIZE', 4, 1],
  [1, 1, 1.02, 0.14, 3, 12, 1.7, 0, S.SWS, 0.15, 1, 'BLAST', '+DMG', 4, 1],
  [2, 2, 0.30, 0.10, 5, 8, 1.55, 0, S.GLD, 0.12, 2, 'GOLD', '+$'],
  [2, 2, 0.55, 0.36, 3, 12, 1.7, 0, S.CGD, 0.18, 2, 'COMBO', '+COMBO', 8, 1],
  [2, 2, 0.78, 0.08, 5, 10, 1.55, 0, S.RBV, 0.1, 2, 'VALUE', '+RB', 8, 2],
  [2, 2, 1.02, 0.34, 1, 40, 1, 1, F.POT, 0, 6, 'POT', 'x5', 8, 3, 10, 2],
  [3, 3, 0.30, 0.40, 5, 10, 1.55, 0, S.PFL, 0.004, 5, 'TICK', '+TICK'],
  [3, 3, 0.58, 0.18, 1, 40, 1, 1, F.AURA, 0, 6, 'AURA', 'NEAR', 12, 2],
  [3, 3, 0.80, 0.44, 3, 12, 1.7, 0, S.AUR, 0.25, 5, 'REACH', '+R', 13, 1],
  [3, 3, 1.04, 0.16, 5, 12, 1.55, 0, S.ATO, 0.012, 5, 'AUTO', '+AUTO', 13, 1],
  [4, 4, 0.30, 0.14, 5, 8, 1.5, 0, S.TIM, 0.5, 3, 'TIME', '+SEC'],
  [4, 4, 0.55, 0.38, 3, 12, 1.7, 0, S.TEF, 0.12, 3, 'SLOW', 'SLOW', 16, 1],
  [4, 4, 0.78, 0.10, 5, 10, 1.55, 0, S.TBN, 0.15, 3, 'BONUS', '+PTS', 16, 2],
  [4, 4, 1.02, 0.36, 1, 40, 1, 1, F.BORROW, 0, 6, 'BORROW', '+SEC', 16, 3],
  [5, 5, 0.32, 0.36, 3, 10, 1.7, 0, S.CHR, 0.25, 4, 'RANGE', '+RNG', 4, 1],
  [5, 5, 0.56, 0.12, 5, 12, 1.55, 0, S.OVR, 0.1, 4, 'OVER', 'SPILL', 20, 1],
  [5, 5, 0.80, 0.40, 1, 45, 1, 1, F.CHAIN, 0, 6, 'CHAIN', 'CHAIN', 4, 1, 5, 2],
  [5, 5, 1.04, 0.18, 3, 15, 1.7, 0, S.SEC, 0.12, 4, 'ECHO', '+ECHO', 22, 1],
  [2, 5, 1.22, 0.50, 1, 55, 1, 1, F.CASC, 0, 6, 'CASC', '+$', 22, 1, 9, 2],
  [0, 1, 1.20, 0.48, 1, 60, 1, 1, F.NOVA, 0, 6, 'NOVA', 'OVER', 0, 3, 5, 3],
  [2, 5, 1.42, 0.22, 1, 60, 1, 1, F.DBL, 0, 6, 'DBL', 'SPAWN', 10, 3, 22, 1],
  [0, 3, 1.28, 0.08, 1, 55, 1, 1, F.AFTER, 0, 6, 'GHOST', 'GHOST', 0, 3, 13, 1],
  [1, 5, 1.32, 0.52, 1, 60, 1, 1, F.CHROMA, 0, 6, 'CHROMA', 'RAMP', 4, 1, 22, 1],
  [4, 5, 1.22, 0.06, 1, 60, 1, 1, F.ETERN, 0, 6, 'ETERN', '+SEC', 19, 1, 22, 1],
];

const FAN0 = -1.12;
const FAN = 0.45;

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
  return (d[5] * Math.pow(d[6], lv)) | 0;
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
  else G.st[d[8]] += d[9];
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
 * Local constellation position for node i.
 * @param {number} i
 * @return {number[]}
 */
export function localPos(i) {
  const d = DEF[i];
  const t = d[2];
  const a = FAN0 + (d[0] + d[1]) * 0.5 * FAN + t * 0.14;
  const R = 0.88 + t * 1.65;
  return [Math.sin(a) * R, d[3], -Math.cos(a) * R];
}

/**
 * Parent edges plus core links to root nodes. -1 is the core.
 * @return {number[][]}
 */
export function edgeList() {
  const e = [];
  for (let i = 0; i < DEF.length; i++) {
    const d = DEF[i];
    if (d.length <= 13) e.push([-1, i]);
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

