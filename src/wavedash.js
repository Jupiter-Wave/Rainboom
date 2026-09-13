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
