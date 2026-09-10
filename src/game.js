import {BANDS, clamp} from './lib.js';
import {G, I} from './state.js';
import * as rb from './rainbow.js';
import * as fx from './fx.js';
import * as audio from './audio.js';
import * as up from './upgrades.js';
import * as wd from './wavedash.js';

let blastWait = 0;

/**
 * Reset run stats and enter the first round.
 * @return {void}
 */
export function startRun() {
  G.score = 0;
  G.gold = 0;
  G.combo = 1;
  G.lastBoom = 0;
  G.round = 0;
  G.up = {power: 0, spread: 0, splash: 0, chain: 0, gold: 0, time: 0};
  fx.clearCoins();
  nextRound();
}

/**
 * Begin the next timed round.
 * @return {void}
 */
export function nextRound() {
  G.round++;
  G.done = 0;
  G.time = 10 + 2 * G.up.time;
  G.timeMax = G.time;
  G.delay = I.xr ? 2 : 0;
  G.state = 'ROUND';
  blastWait = 0;
  G.blast = 0;
  audio.resetWarn();
  rb.clear();
  up.hide();
  seed();
}

/**
 * Place rainbows for the current round.
 * @return {void}
 */
function seed() {
  place(Math.min(8, 5 + (G.round / 3 | 0)), 0);
}

/**
 * Keep n rainbows around the player in a full circle.
 * @param {number} n
 * @param {number} pre
 * @return {void}
 */
function place(n, pre) {
  const live = rb.list.filter((r) => r.alive);
  const spin = live.length ? Math.random() * Math.PI * 2 : 0;
  for (let i = live.length; i < n; i++) {
    const a = spin + (i / n) * Math.PI * 2;
    rb.spawn(Math.sin(a) * 3.3, 1.15, -Math.cos(a) * 3.3, pre);
  }
}

/**
 * Add fill to one band; splash/overfill stay local.
 * @param {Object} r Rainbow.
 * @param {number} i Band index.
 * @param {number} amt
 * @param {boolean=} splashOk
 * @return {void}
 */
export function fill(r, i, amt, splashOk) {
  if (!r.alive || amt <= 0) return;
  const b = r.bands[i];
  const before = b.fill;
  b.fill = clamp(b.fill + amt, 0, 1);
  const extra = before + amt - b.fill;
  rb.paint(b, i);
  if (splashOk !== false) {
    const sp = 0.14 * G.up.splash;
    if (sp) {
      if (i > 0) fill(r, i - 1, amt * sp, false);
      if (i < BANDS - 1) fill(r, i + 1, amt * sp, false);
    }
    if (extra > 0 && G.up.splash) {
      if (i > 0) fill(r, i - 1, extra, false);
      if (i < BANDS - 1) fill(r, i + 1, extra, false);
    }
  }
  if (r.bands.every((x) => x.fill >= 1)) rainboom(r);
}

/**
 * Complete a rainbow: score, gold, FX, chain.
 * @param {Object} r
 * @return {void}
 */
function rainboom(r) {
  if (!r.alive) return;
  rb.hide(r);
  G.done++;
  const now = G.t;
  G.combo = now - G.lastBoom < 1.5 ? G.combo + 1 : 1;
  G.lastBoom = now;
  G.burst = now - G.burstT < 0.45 ? G.burst + 1 : 1;
  G.burstT = now;
  const pts = 100 * G.round * G.combo + (G.time * 10 | 0) +
      (G.burst > 1 ? 50 * (G.burst - 1) * G.round : 0);
  G.score += pts;
  const coin = Math.max(4, (8 + G.round * 2) * (1 + 0.35 * G.up.gold) | 0);
  G.flash = 'RAINBOOM x' + G.combo + ' +' + pts + '  +' + coin + 'g';
  G.flashT = 1.1;
  fx.explode(r, coin);
  audio.boom();
  wd.onBoom(G);
  if (G.up.chain) {
    const near = closest(r);
    const e = 0.16 * G.up.chain;
    if (near) {
      for (let i = 0; i < BANDS; i++) fill(near, i, e, false);
    }
    if (G.up.chain >= 3) {
      for (const o of rb.list) {
        if (!o.alive || o === r) continue;
        const d = Math.hypot(o.x - r.x, o.z - r.z);
        if (d < 5.5) {
          for (let i = 0; i < BANDS; i++) fill(o, i, e * 0.5, false);
        }
      }
    }
  }
  seed();
}

/**
 * Nearest living rainbow to r.
 * @param {Object} r
 * @return {?Object}
 */
function closest(r) {
  let best = null;
  let bestD = 1e9;
  for (const o of rb.list) {
    if (!o.alive || o === r) continue;
    const d = Math.hypot(o.x - r.x, o.z - r.z);
    if (d < bestD) {
      bestD = d;
      best = o;
    }
  }
  return best;
}

/**
 * End the timer: upgrade or game over.
 * @return {void}
 */
function endRound() {
  rb.clear();
  if (G.round > 1 && G.done === 0) {
    G.state = 'OVER';
    wd.submit(G.score);
    return;
  }
  G.state = 'UPGRADE';
  up.show();
}

/**
 * Fire a short blast toward aim; fill a rainbow if one is in cone.
 * @param {number} dt
 * @param {number} spr Aim cone radians.
 * @param {boolean} doFill Apply fill on hit.
 * @return {void}
 */
function pulse(dt, spr, doFill) {
  if (G.blast > 0) G.blast -= dt;
  blastWait -= dt;
  if (blastWait > 0) return;
  blastWait = 1.15 / (1 + 0.35 * G.up.power);
  G.blast = 0.22;
  const hit = rb.pick(spr);
  if (hit) {
    I.hitPoint[0] = hit.p[0];
    I.hitPoint[1] = hit.p[1];
    I.hitPoint[2] = hit.p[2];
    if (doFill) {
      fill(hit.rb, hit.i, 0.5 * (1 + 0.4 * G.up.power));
      audio.shot(hit.rb.bands[hit.i].fill);
      return;
    }
  }
  audio.shot(hit ? hit.rb.bands[hit.i].fill : 0.15);
}

/**
 * Advance simulation one frame.
 * @param {number} dt Seconds.
 * @return {void}
 */
export function tick(dt) {
  if (G.flashT > 0) G.flashT -= dt;
  if (G.state === 'TITLE' || G.state === 'OVER') return;
  if (G.state === 'UPGRADE') {
    fx.vacuum(0.22);
    up.tick();
    if (up.flags.goNext) {
      up.flags.goNext = false;
      nextRound();
    }
    return;
  }
  if (G.delay > 0) {
    G.delay -= dt;
    return;
  }
  G.time -= dt;
  rb.float();
  const spr = 0.14 + 0.1 * G.up.spread;
  fx.vacuum(spr);
  for (const r of rb.list) {
    if (!r.alive) continue;
    for (let i = 0; i < BANDS; i++) {
      const f = r.bands[i].fill;
      if (f > 0.85 && f < 1) rb.paint(r.bands[i], i);
    }
  }
  pulse(dt, spr, true);
  if (G.time < 3 && G.time > 0) audio.warn(G.time);
  if (G.time <= 0) {
    G.time = 0;
    G.blast = 0;
    endRound();
  }
}
