import {I} from './state.js';
import {setXr} from './unicorn.js';
import {hornPos} from './unicorn.js';

let sceneEl;
let camEl;
let right;
let left;

/**
 * Enable VR UI when immersive-vr exists; bind controllers.
 * @param {Element} scene
 * @param {Element} cam
 * @return {void}
 */
export function init(scene, cam) {
  sceneEl = scene;
  camEl = cam;
  const xr = navigator.xr;
  if (xr && xr.isSessionSupported) {
    xr.isSessionSupported('immersive-vr').then((ok) => {
      if (ok) {
        scene.setAttribute('vr-mode-ui', 'enabled: true');
        scene.setAttribute('xr-mode-ui', 'enabled: true');
      }
    }).catch(() => {});
  }
  right = document.createElement('a-entity');
  right.setAttribute('laser-controls', 'hand: right');
  right.setAttribute('raycaster', 'far: 20; lineColor: #faf; lineOpacity: 0.5');
  left = document.createElement('a-entity');
  left.setAttribute('laser-controls', 'hand: left');
  left.setAttribute('raycaster', 'far: 20; lineColor: #faf; lineOpacity: 0.35');
  scene.appendChild(right);
  scene.appendChild(left);
  const down = () => {
    I.firing = true;
  };
  const up = () => {
    I.firing = false;
  };
  for (const h of [right, left]) {
    h.addEventListener('triggerdown', down);
    h.addEventListener('triggerup', up);
    h.addEventListener('buttondown', down);
    h.addEventListener('buttonup', up);
  }
  scene.addEventListener('enter-vr', () => {
    I.xr = true;
    setXr(camEl, true);
  });
  scene.addEventListener('exit-vr', () => {
    I.xr = false;
    I.firing = false;
    setXr(camEl, false);
  });
}

/**
 * Write controller ray into I when presenting.
 * @return {boolean} True if XR overrode input.
 */
export function sample() {
  if (!I.xr) return false;
  const src = live(right) || live(left);
  if (src && src.object3D) {
    const w = src.object3D.userData.wp ||
        (src.object3D.userData.wp = new THREE.Vector3());
    const d = src.object3D.userData.wd ||
        (src.object3D.userData.wd = new THREE.Vector3(0, 0, -1));
    src.object3D.getWorldPosition(w);
    d.set(0, 0, -1).transformDirection(src.object3D.matrixWorld);
    I.aimOrigin[0] = w.x;
    I.aimOrigin[1] = w.y;
    I.aimOrigin[2] = w.z;
    I.aimDirection[0] = d.x;
    I.aimDirection[1] = d.y;
    I.aimDirection[2] = d.z;
    I.hitPoint[0] = w.x + d.x * 8;
    I.hitPoint[1] = w.y + d.y * 8;
    I.hitPoint[2] = w.z + d.z * 8;
    return true;
  }
  const o = hornPos();
  const cam = camEl.object3D;
  const d = cam.userData.wd ||
      (cam.userData.wd = new THREE.Vector3());
  d.set(0, 0, -1).transformDirection(cam.matrixWorld);
  I.aimOrigin[0] = o[0];
  I.aimOrigin[1] = o[1];
  I.aimOrigin[2] = o[2];
  I.aimDirection[0] = d.x;
  I.aimDirection[1] = d.y;
  I.aimDirection[2] = d.z;
  return true;
}

/**
 * Controller that currently has a pose.
 * @param {Element} el
 * @return {?Element}
 */
function live(el) {
  if (!el || !el.object3D) return null;
  const vis = el.object3D.visible;
  return vis ? el : null;
}
