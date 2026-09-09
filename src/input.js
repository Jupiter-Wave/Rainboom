import {I} from './state.js';
import {hornPos} from './unicorn.js';

const ndc = {x: 0, y: 0};
const ray = {o: null, d: null};

/**
 * Bind desktop pointer to the unified input contract.
 * @return {void}
 */
export function bind() {
  addEventListener('mousemove', (e) => {
    ndc.x = (e.clientX / innerWidth) * 2 - 1;
    ndc.y = -(e.clientY / innerHeight) * 2 + 1;
  });
  addEventListener('mousedown', (e) => {
    if (!e.button) I.firing = true;
  });
  addEventListener('mouseup', (e) => {
    if (!e.button) I.firing = false;
  });
  addEventListener('mouseleave', () => {
    I.firing = false;
  });
}

/**
 * Sample mouse aim into I when not in XR.
 * @param {Element} camEl Camera entity.
 * @return {void}
 */
export function sampleDesktop(camEl) {
  if (I.xr) return;
  const cam = camEl.components.camera && camEl.components.camera.camera;
  if (!cam) return;
  if (!ray.o) {
    ray.o = new THREE.Vector3();
    ray.d = new THREE.Vector3();
    ray.hit = new THREE.Vector3();
    ray.sph = new THREE.Sphere(new THREE.Vector3(0, 1, 0), 10);
    ray.rc = new THREE.Raycaster();
  }
  ray.rc.setFromCamera(ndc, cam);
  const o = hornPos();
  I.aimOrigin[0] = o[0];
  I.aimOrigin[1] = o[1];
  I.aimOrigin[2] = o[2];
  const ok = ray.rc.ray.intersectSphere(ray.sph, ray.hit);
  if (ok) {
    const hx = ray.hit.x - o[0];
    const hy = ray.hit.y - o[1];
    const hz = ray.hit.z - o[2];
    const len = Math.hypot(hx, hy, hz) || 1;
    I.aimDirection[0] = hx / len;
    I.aimDirection[1] = hy / len;
    I.aimDirection[2] = hz / len;
    I.hitPoint[0] = ray.hit.x;
    I.hitPoint[1] = ray.hit.y;
    I.hitPoint[2] = ray.hit.z;
  } else {
    ray.rc.ray.direction.toArray(I.aimDirection);
    I.hitPoint[0] = o[0] + I.aimDirection[0] * 8;
    I.hitPoint[1] = o[1] + I.aimDirection[1] * 8;
    I.hitPoint[2] = o[2] + I.aimDirection[2] * 8;
  }
}
