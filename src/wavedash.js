/** Optional Wavedash adapter. Missing SDK is a no-op. */

let done = false;

/** @return {?Object} window.Wavedash if present. */
function W() {
  return window.Wavedash;
}

/**
 * Report load progress to the host bar.
 * @param {number} n 0–1
 * @return {void}
 */
function progress(n) {
  const w = W();
  if (w && w.updateLoadProgressZeroToOne) {
    try {
      w.updateLoadProgressZeroToOne(n);
    } catch (e) {}
  }
}

/** Report load start when the game script runs. @return {void} */
export function beginLoad() {
  progress(0.1);
}

/** Report scene boot has started. @return {void} */
export function booting() {
  progress(0.55);
}

/**
 * Finish loading and reveal the game to the player.
 * @return {void}
 */
export function ready() {
  if (done) return;
  done = true;
  progress(1);
  const w = W();
  if (w && w.init) {
    try {
      w.init();
    } catch (e) {}
  }
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
