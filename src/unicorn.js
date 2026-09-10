import {COLORS, ent, scene} from './lib.js';
import {G} from './state.js';

let body;
let horn;
let beam;
let sight;
const hornW = [0, 0.2, -0.4];
/** Local Y of the horn tip; keep in sync with stripe height. */
const TIP = 0.056;
const BLAST = 0.22;

/**
 * Stack seven skinny colored cones into a rainbow horn.
 * @param {Element} parent Parent entity.
 * @return {void}
 */
function stripeHorn(parent) {
  const h = 0.008;
  const rb = 0.007;
  for (let i = 0; i < 7; i++) {
    const t = i / 6;
    const r0 = rb * (1 - t * 0.85);
    const r1 = rb * (1 - (i + 1) / 7 * 0.85);
    ent(parent, {
      geometry: 'primitive:cone;radiusBottom:' + r0 +
          ';radiusTop:' + r1 + ';height:' + h,
      material: 'color:' + COLORS[i] + ';emissive:' + COLORS[i],
      position: '0 ' + ((i + 0.5) * h) + ' 0',
    });
  }
}

/**
 * Mount the first-person rainbow horn on the camera.
 * @param {Element} camEl Active camera.
 * @return {void}
 */
export function create(camEl) {
  const s = scene();
  body = null;
  horn = ent(camEl, {
    id: 'horn',
    position: '0 -0.42 -0.2',
    rotation: '-48 0 0',
    scale: '2.8 2.8 2.8',
  });
  stripeHorn(horn);
  beam = ent(s, {
    geometry: 'primitive:cylinder;radius:0.016;height:1',
    material: 'color:#fff;emissive:#faf;opacity:0.95;transparent:true',
    visible: 'false',
  });
  sight = ent(s, {
    geometry: 'primitive:ring;radiusInner:0.045;radiusOuter:0.07',
    material: 'color:#111;emissive:#fff;opacity:0.9;transparent:true;' +
        'side:double',
    visible: 'false',
  });
}

/**
 * Hide the world body in XR; horn stays on the camera.
 * @param {Element} _camEl Unused; horn is already parented.
 * @param {boolean} on XR active.
 * @return {void}
 */
export function setXr(_camEl, on) {
  if (body) body.setAttribute('visible', (!on) + '');
}

/**
 * World-space horn tip (beam origin).
 * @return {number[]}
 */
export function hornPos() {
  if (!horn || !horn.object3D) return hornW;
  const w = horn.object3D.userData.w ||
      (horn.object3D.userData.w = new THREE.Vector3());
  w.set(0, TIP, 0);
  horn.object3D.localToWorld(w);
  hornW[0] = w.x;
  hornW[1] = w.y;
  hornW[2] = w.z;
  return hornW;
}

/**
 * Draw a short blast from the horn tip to the aim point.
 * @param {boolean} show Beam visible.
 * @param {number[]} end Beam end point.
 * @return {void}
 */
export function update(show, end) {
  const o = hornPos();
  if (sight && sight.object3D) {
    const on = G.state === 'ROUND' || G.state === 'UPGRADE';
    sight.setAttribute('visible', on ? 'true' : 'false');
    if (on) {
      sight.object3D.position.set(end[0], end[1], end[2]);
      sight.object3D.lookAt(o[0], o[1], o[2]);
    }
  }
  if (!beam) return;
  beam.setAttribute('visible', show ? 'true' : 'false');
  if (!show || !beam.object3D) return;
  const ex = end[0] - o[0];
  const ey = end[1] - o[1];
  const ez = end[2] - o[2];
  const full = Math.hypot(ex, ey, ez) || 0.2;
  const grow = Math.min(1, (BLAST - G.blast) / 0.09);
  const len = full * Math.max(0.06, grow);
  const mid = len / full * 0.5;
  beam.object3D.position.set(
      o[0] + ex * mid, o[1] + ey * mid, o[2] + ez * mid);
  beam.object3D.scale.set(1, len, 1);
  const dir = beam.object3D.userData.dir ||
      (beam.object3D.userData.dir = new THREE.Vector3());
  dir.set(ex / full, ey / full, ez / full);
  beam.object3D.quaternion.setFromUnitVectors(
      beam.object3D.userData.y ||
          (beam.object3D.userData.y = new THREE.Vector3(0, 1, 0)),
      dir);
}
