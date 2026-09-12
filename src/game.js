import {clamp} from './lib.js';
import {G, I} from './state.js';
import * as rb from './rainbow.js';
import * as fx from './fx.js';
import * as audio from './audio.js';
import * as up from './upgrades.js';
import * as wd from './wavedash.js';
import {F, S, reset as resetUp} from './nodes.js';

let blastWait = 0;
let depth = 0;
let ghost = null;

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
  resetUp();
  ghost = null;
  depth = 0;
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
  G.time = 10 + G.st[S.TIM];
  G.timeMax = G.time;
  G.delay = I.xr ? 2 : 0;
  G.state = 'ROUND';
  blastWait = 0;
  G.blast = 0;
  ghost = null;
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
  place(Math.min(8, 5 + (G.round / 3 | 0)), 0.68);
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
 * Add fill; overflow and prismatic can leak to a neighbor.
 * @param {Object} r Rainbow.
 * @param {number} i Band index.
 * @param {number} amt
 * @param {boolean=} splashOk
 * @return {void}
 */
export function fill(r, i, amt, splashOk) {
  if (!r.alive || amt <= 0) return;
  const over = r.fill + amt - 1;
  r.fill = clamp(r.fill + amt, 0, 1);
  if (over > 0) r.over = (r.over || 0) + over;
  rb.paint(r);
  if (splashOk !== false && (G.fl & F.PRISM)) {
    const near = closest(r);
    if (near) fill(near, 0, amt * 0.22, false);
  }
  if (over > 0 && G.st[S.OVR] > 0) {
    const near = closest(r);
    if (near) fill(near, 0, over * G.st[S.OVR], false);
  }
  if (r.fill >= 1) rainboom(r);
}

/**
 * Complete a rainbow: score, gold, FX, shockwave, chain.
 * @param {Object} r
 * @return {void}
 */
function rainboom(r) {
  if (!r.alive) return;
  const chained = depth > 0;
  rb.hide(r);
  G.done++;
  const now = G.t;
  G.combo = now - G.lastBoom < 1.5 ? G.combo + 1 : 1;
  G.lastBoom = now;
  G.burst = now - G.burstT < 0.45 ? G.burst + 1 : 1;
  G.burstT = now;
  const tb = 1 + G.st[S.TIM] * 0.12;
  const pts = 100 * G.round * G.combo + (G.time * 10 * tb | 0) +
      (G.burst > 1 ? 50 * (G.burst - 1) * G.round : 0);
  G.score += pts;
  let coin = (8 + G.round * 2) * (1 + 0.35 * G.st[S.GLD]) *
      (1 + G.st[S.RBV]);
  if (G.combo > 1) coin *= 1 + G.st[S.CGD] * (G.combo - 1);
  if (G.fl & F.CASC) coin *= 1 + 0.18 * (depth + 1);
  if ((G.fl & F.POT) && G.done % 5 === 0) coin *= 2.8;
  if (r.valMul) coin *= r.valMul;
  coin = Math.max(4, coin | 0);
  G.flash = 'x' + G.combo + ' +' + pts + ' +' + coin + 'g';
  G.flashT = 1.1;
  fx.explode(r, coin);
  audio.boom();
  wd.onBoom(G);
  if ((G.fl & F.BORROW) || ((G.fl & F.ETERN) && chained)) {
    let add = (G.fl & F.BORROW) ? 0.4 : 0;
    if (G.fl & F.ETERN) add += 0.16 * (depth + 1);
    G.time = Math.min(G.timeMax + 1.6, G.time + add);
  }
  depth++;
  if ((G.fl & F.SHOCK) && (!chained || (G.fl & F.CHAIN)) && depth <= 8) {
    shock(r);
  }
  if ((G.fl & F.DBL) && Math.random() < 0.2) {
    const a = Math.random() * Math.PI * 2;
    rb.spawn(Math.sin(a) * 3.3, 1.15, -Math.cos(a) * 3.3, 0.35, 1.8);
  }
  seed();
  depth--;
}

/**
 * Radial fill from a completed rainbow.
 * @param {Object} r
 * @return {void}
 */
function shock(r) {
  let rad = 2 + G.st[S.SWR] * 2.2 + G.st[S.CHR] * 1.4;
  let e = 0.1 + G.st[S.SWF] + G.st[S.SWS] * 0.4;
  if (depth > 1) e += G.st[S.SEC];
  if (G.fl & F.CHROMA) e *= 1 + 0.22 * depth;
  if ((G.fl & F.NOVA) && r.over) {
    const u = Math.min(1.2, r.over * 2.5);
    e *= 1 + u;
    rad *= 1 + Math.min(0.8, r.over * 2);
  }
  fx.wave(r, rad);
  for (const o of rb.list) {
    if (!o.alive || o === r) continue;
    const d = Math.hypot(o.x - r.x, o.z - r.z);
    if (d < rad) fill(o, 0, e * (1 - d / rad * 0.35), false);
  }
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
  blastWait = 1.15 / (1 + 0.5 * G.st[S.PWR]);
  G.blast = 0.22;
  const hit = rb.pick(spr);
  if (hit) {
    I.hitPoint[0] = hit.p[0];
    I.hitPoint[1] = hit.p[1];
    I.hitPoint[2] = hit.p[2];
    if ((G.fl & F.AFTER) && hit.rb) ghost = {rb: hit.rb, t: 0.5};
    if (doFill) {
      let amt = 0.18 * (1 + G.st[S.PWR]);
      if (G.st[S.CRT] && Math.random() < G.st[S.CRT]) amt *= 1.7;
      fill(hit.rb, hit.i, amt);
      audio.shot(hit.rb.fill);
      return;
    }
  }
  audio.shot(hit ? hit.rb.fill : 0.15);
}

/**
 * Tick leftover beam and passive / aura fill.
 * @param {number} dt
 * @return {void}
 */
function autoFill(dt) {
  if (ghost) {
    ghost.t -= dt;
    if (ghost.t > 0 && ghost.rb.alive) {
      fill(ghost.rb, 0, 0.14 * dt * (1 + G.st[S.PWR]), false);
    } else {
      ghost = null;
    }
  }
  if (G.st[S.PFL]) {
    for (const r of rb.list) {
      if (r.alive) fill(r, 0, G.st[S.PFL] * dt, false);
    }
  }
  if (G.fl & F.AURA) {
    const rad = 1.6 + G.st[S.AUR] * 2.5;
    const amt = (0.04 + G.st[S.ATO]) * dt;
    for (const r of rb.list) {
      if (r.alive && Math.hypot(r.x, r.z) < rad) fill(r, 0, amt, false);
    }
  }
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
    up.tick(dt);
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
  G.time -= dt / (1 + G.st[S.TIM] * 0.14);
  rb.float();
  const spr = 0.14 + G.st[S.WID];
  fx.vacuum(spr);
  for (const r of rb.list) {
    if (r.alive && r.fill > 0.85 && r.fill < 1) rb.paint(r);
  }
  pulse(dt, spr, true);
  autoFill(dt);
  if (G.time < 3 && G.time > 0) audio.warn(G.time);
  if (G.time <= 0) {
    G.time = 0;
    G.blast = 0;
    endRound();
  }
}
