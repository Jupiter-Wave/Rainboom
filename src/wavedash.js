/** Optional Wavedash adapter. Missing SDK is a no-op. */

/** @return {?Object} window.Wavedash if present. */
function W() {
  return window.Wavedash;
}

/** Initialize the host SDK when available. @return {void} */
export function init() {
  const w = W();
  if (w && w.init) {
    try {
      w.init();
    } catch (e) {}
  }
}

/**
 * Add to a numeric stat and persist.
 * @param {string} id
 * @param {number} n
 * @return {number}
 */
function add(id, n) {
  const w = W();
  if (!w || !w.setStat) return 0;
  const v = (w.getStat(id) || 0) + n;
  w.setStat(id, v, true);
  return v;
}

/**
 * Unlock an achievement if the SDK exists.
 * @param {string} id
 * @return {void}
 */
function ach(id) {
  const w = W();
  if (w && w.setAchievement) {
    try {
      w.setAchievement(id, true);
    } catch (e) {}
  }
}

/** Add collected gold to persistent stats. @param {number} n */
export function onGold(n) {
  add('gold', n);
}

/** Record a Rainboom for stats/achievements. @param {Object} G */
export function onBoom(G) {
  const n = add('rainbooms', 1);
  const w = W();
  if (w && w.setStat) {
    if ((w.getStat('bestRound') || 0) < G.round) {
      w.setStat('bestRound', G.round, true);
    }
    if ((w.getStat('bestCombo') || 0) < G.combo) {
      w.setStat('bestCombo', G.combo, true);
    }
  }
  if (n >= 1) ach('RAINBOOM');
  if (G.combo >= 2 || G.burst >= 2) ach('DOUBLE_RAINBOW');
  if (G.done >= 8) ach('CHROMATIC_CHAOS');
  if (G.round >= 8) ach('OVER_THE_RAINBOW');
}

/** Record an upgrade purchase. @param {Object} G */
export function onBuy(G) {
  let n = 0;
  if (G.lv) {
    for (const x of G.lv) n += x;
  }
  if (n >= 8) ach('OVERPOWERED');
}

/** Submit run gold to the leaderboard. @param {number} gold */
export function submit(gold) {
  const w = W();
  if (!w || !w.getOrCreateLeaderboard) return;
  w.getOrCreateLeaderboard('rainboom', 'desc', 'numeric')
      .then((r) => {
        if (r && r.success && r.data) {
          return w.uploadLeaderboardScore(r.data.id, gold, true);
        }
      })
      .catch(() => {});
}
