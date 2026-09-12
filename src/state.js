/** Shared mutable game/input state. */

export const I = {
  aimOrigin: [0, 1.2, 0],
  aimDirection: [0, 0, -1],
  hitPoint: [0, 1.2, -6],
  firing: false,
  xr: false,
};

export const G = {
  state: 'TITLE',
  t: 0,
  score: 0,
  gold: 0,
  combo: 1,
  lastBoom: 0,
  burst: 0,
  burstT: 0,
  round: 0,
  time: 10,
  timeMax: 10,
  delay: 0,
  done: 0,
  flash: '',
  flashT: 0,
  blast: 0,
  wasFire: false,
  lv: new Uint8Array(0),
  st: new Float32Array(16),
  fl: 0,
};

/** @return {boolean} Rising edge of fire this frame. */
export function tap() {
  return I.firing && !G.wasFire;
}
