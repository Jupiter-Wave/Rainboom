import {G, I, setHit} from './state.js';
import {hornPos} from './unicorn.js';
import * as menu from './menu.js';

let sceneEl;
let camEl;
let right;
let left;

export const cap = {xr: false};

/**
 * True only during an immersive WebXR session.
 * @return {boolean}
 */
export function isImmersive() {
  const r = sceneEl && sceneEl.renderer;
  return !!(r && r.xr && r.xr.isPresenting);
}

/**
 * Capability-detect immersive VR (not user-agent).
 * @return {!Promise<boolean>}
 */
export function detect() {
  const xr = navigator.xr;
  if (!xr || !xr.isSessionSupported) {
    return Promise.resolve(false);
  }
  return xr.isSessionSupported('immersive-vr').then((ok) => {
    cap.xr = !!ok;
    return cap.xr;
  }).catch(() => false);
}

/** Request an immersive VR session. @return {void} */
export function enter() {
  if (sceneEl && sceneEl.enterVR) sceneEl.enterVR();
}

/**
 * Bind XR session hooks. Controllers attach only when presenting.
 * @param {Element} scene
 * @param {Element} cam
 * @return {void}
 */
export function init(scene, cam) {
  sceneEl = scene;
  camEl = cam;
  scene.addEventListener('enter-vr', onEnter);
  scene.addEventListener('exit-vr', onExit);
}

/** @return {void} */
function onEnter() {
  if (!isImmersive()) return;
  I.xr = true;
  bindHands();
  menu.hide();
  if (G.state === 'TITLE' || G.state === 'OVER') menu.beginPlay();
}

/** @return {void} */
function onExit() {
  I.xr = false;
  I.firing = false;
  dropHands();
  if (G.state === 'TITLE' || G.state === 'OVER') menu.show();
}

/** Create controller rays once an immersive session starts. @return {void} */
function bindHands() {
  if (right) return;
  right = document.createElement('a-entity');
  right.setAttribute('laser-controls', 'hand: right');
  right.setAttribute('raycaster', 'far: 20; lineColor: #faf; lineOpacity: 0.5');
  left = document.createElement('a-entity');
  left.setAttribute('laser-controls', 'hand: left');
  left.setAttribute('raycaster', 'far: 20; lineColor: #faf; lineOpacity: 0.35');
  sceneEl.appendChild(right);
  sceneEl.appendChild(left);
  const down = () => {
    I.firing = true;
  };
  const up = () => {
    I.firing = false;
  };
  for (const h of [right, left]) {
    h.addEventListener('triggerdown', down);
    h.addEventListener('triggerup', up);
  }
}

/** Remove controller entities after leaving XR. @return {void} */
function dropHands() {
  for (const h of [right, left]) {
    if (h && h.parentNode) h.parentNode.removeChild(h);
  }
  right = null;
  left = null;
}

/**
 * Write controller ray into I when presenting.
 * @return {boolean} True if XR overrode input.
 */
export function sample() {
  if (!I.xr || !isImmersive()) return false;
  const src = live(right) || live(left);
  if (src && src.object3D) {
    const w = src.object3D.userData.wp ||
        (src.object3D.userData.wp = new THREE.Vector3());
    const d = src.object3D.userData.wd ||
        (src.object3D.userData.wd = new THREE.Vector3(0, 0, -1));
    src.object3D.getWorldPosition(w);
    d.set(0, 0, -1).transformDirection(src.object3D.matrixWorld);
    aimFromHorn(w.x + d.x * 3.4, w.y + d.y * 3.4, w.z + d.z * 3.4);
    return true;
  }
  const cam = camEl.object3D;
  const d = cam.userData.wd ||
      (cam.userData.wd = new THREE.Vector3());
  d.set(0, 0, -1).transformDirection(cam.matrixWorld);
  const o = hornPos();
  aimFromHorn(o[0] + d.x * 3.4, o[1] + d.y * 3.4, o[2] + d.z * 3.4);
  return true;
}

/**
 * Beam and pick share horn origin → pointed world target.
 * @param {number} x
 * @param {number} y
 * @param {number} z
 * @return {void}
 */
function aimFromHorn(x, y, z) {
  const o = hornPos();
  const vx = x - o[0];
  const vy = y - o[1];
  const vz = z - o[2];
  const len = Math.hypot(vx, vy, vz) || 1;
  I.aimOrigin[0] = o[0];
  I.aimOrigin[1] = o[1];
  I.aimOrigin[2] = o[2];
  I.aimDirection[0] = vx / len;
  I.aimDirection[1] = vy / len;
  I.aimDirection[2] = vz / len;
  setHit([x, y, z]);
}

/**
 * Controller that currently has a pose.
 * @param {Element} el
 * @return {?Element}
 */
function live(el) {
  if (!el || !el.object3D) return null;
  return el.object3D.visible ? el : null;
}
