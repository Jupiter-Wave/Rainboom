let ac;
let warnT = 0;
let boomsA = 0;

/** @return {AudioContext} Shared context, resumed on demand. */
function ctx() {
  if (!ac) ac = new AudioContext();
  if (ac.state === 'suspended') ac.resume();
  return ac;
}

/** Unlock audio after a gesture. @return {void} */
export function unlock() {
  ctx();
}

/**
 * Play a decaying oscillator beep.
 * @param {number} f Frequency.
 * @param {number} t Duration.
 * @param {string} type Oscillator type.
 * @param {number} v Gain.
 * @return {void}
 */
function beep(f, t, type, v) {
  const c = ctx();
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.value = f;
  g.gain.value = v;
  g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + t);
  o.connect(g).connect(c.destination);
  o.start();
  o.stop(c.currentTime + t);
}

/**
 * Short blast; pitch rises with fill.
 * @param {number} fill 0..1
 * @return {void}
 */
export function shot(fill) {
  beep(240 + fill * 480, 0.07, 'square', 0.05);
}

/** Coin pickup. @return {void} */
export function coin() {
  beep(880, 0.06, 'triangle', 0.05);
  beep(1180, 0.08, 'square', 0.03);
}

/** Rainboom blast, throttled during cascades. @return {void} */
export function boom() {
  if (++boomsA > 3) return;
  beep(90, 0.35, 'sawtooth', 0.12);
  beep(420, 0.18, 'square', 0.06);
  beep(880, 0.1, 'triangle', 0.04);
}

/** Reset the per-frame boom SFX budget. @return {void} */
export function resetBooms() {
  boomsA = 0;
}

/** Upgrade purchase. @return {void} */
export function buy() {
  beep(520, 0.08, 'square', 0.06);
  beep(780, 0.12, 'triangle', 0.05);
}

/**
 * Timer warning ticks under 3s.
 * @param {number} time
 * @return {void}
 */
export function warn(time) {
  if (time > 3) return;
  const slot = time | 0;
  if (slot === warnT) return;
  warnT = slot;
  beep(240, 0.07, 'square', 0.05);
}

/** Reset warning latch. @return {void} */
export function resetWarn() {
  warnT = -1;
}
