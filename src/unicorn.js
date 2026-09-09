import {COLORS, ent, scene} from './lib.js';
import {I} from './state.js';

let body;
let horn;
let xrHorn;
let beam;
const hornW = [0, 1.55, 0];

/**
 * Stack six colored cones into a rainbow horn.
 * @param {Element} parent Parent entity.
 * @param {number} scale Size multiplier.
 * @return {Element} Tip entity used as the beam origin.
 */
function stripeHorn(parent, scale) {
  let tip = parent;
  for (let i = 0; i < 6; i++) {
    const t = i / 5;
    const h = 0.14 * scale;
    const r0 = (0.13 - t * 0.1) * scale;
    const r1 = (0.11 - t * 0.1) * scale;
    tip = ent(parent, {
      geometry: 'primitive:cone;radiusBottom:' + r0 +
          ';radiusTop:' + r1 + ';height:' + h,
      material: 'color:' + COLORS[i] + ';emissive:' + COLORS[i],
      position: '0 ' + ((i + 0.5) * h) + ' 0',
    });
  }
  return tip;
}

/**
 * Build the grey unicorn, center rainbow horn, and beam.
 * @return {void}
 */
export function create() {
  const s = scene();
  body = ent(s, {id: 'uni'});
  ent(body, {
    geometry: 'primitive:sphere;radius:0.42',
    material: 'color:#b4b4b4',
    position: '0 0.68 0',
  });
  ent(body, {
    geometry: 'primitive:sphere;radius:0.2',
    material: 'color:#a8a8a8',
    position: '0 1.02 0',
  });
  for (const p of ['-0.16 0.26 0.16', '0.16 0.26 0.16',
    '-0.16 0.26 -0.16', '0.16 0.26 -0.16']) {
    ent(body, {
      geometry: 'primitive:box;width:0.1;height:0.34;depth:0.1',
      material: 'color:#9c9c9c',
      position: p,
    });
  }
  ent(body, {
    geometry: 'primitive:sphere;radius:0.09',
    material: 'color:#6e6e6e',
    position: '0 0.66 0.4',
  });
  horn = ent(s, {id: 'horn', position: '0 1.12 0'});
  stripeHorn(horn, 1.15);
  xrHorn = ent(s, {
    position: '0 -0.2 -0.32',
    rotation: '-70 0 0',
    visible: 'false',
  });
  stripeHorn(xrHorn, 0.45);
  beam = ent(s, {
    geometry: 'primitive:cylinder;radius:0.04;height:1',
    material: 'color:#fff;emissive:#faf;opacity:0.9;transparent:true',
    visible: 'false',
  });
}

/**
 * Parent the XR horn to the camera and hide the body.
 * @param {Element} camEl Camera entity.
 * @param {boolean} on XR active.
 * @return {void}
 */
export function setXr(camEl, on) {
  body.setAttribute('visible', (!on) + '');
  horn.setAttribute('visible', (!on) + '');
  xrHorn.setAttribute('visible', on + '');
  if (on) camEl.appendChild(xrHorn);
  else scene().appendChild(xrHorn);
}

/**
 * World-space horn tip (beam origin).
 * @return {number[]}
 */
export function hornPos() {
  if (!horn || !horn.object3D) return hornW;
  const w = horn.object3D.userData.w ||
      (horn.object3D.userData.w = new THREE.Vector3());
  w.set(0, 0.96, 0);
  horn.object3D.localToWorld(w);
  hornW[0] = w.x;
  hornW[1] = w.y;
  hornW[2] = w.z;
  return hornW;
}

/**
 * Aim the rainbow horn along the beam and draw the beam.
 * @param {boolean} show Beam visible.
 * @param {number[]} end Beam end point.
 * @return {void}
 */
export function update(show, end) {
  const o = I.aimOrigin;
  const d = I.aimDirection;
  if (horn && horn.object3D && !I.xr) {
    const q = horn.object3D.userData.dir ||
        (horn.object3D.userData.dir = new THREE.Vector3());
    q.set(d[0], d[1], d[2]);
    if (q.lengthSq() > 0.0001) {
      horn.object3D.quaternion.setFromUnitVectors(
          horn.object3D.userData.y ||
              (horn.object3D.userData.y = new THREE.Vector3(0, 1, 0)),
          q.normalize());
    }
  }
  if (body && body.object3D && !I.xr) {
    body.object3D.rotation.y = Math.atan2(d[0], d[2]) + Math.PI;
  }
  if (!beam || !beam.object3D) return;
  beam.object3D.visible = !!show;
  if (!show) return;
  const ex = end[0] - o[0];
  const ey = end[1] - o[1];
  const ez = end[2] - o[2];
  const len = Math.hypot(ex, ey, ez) || 0.2;
  beam.object3D.position.set(
      o[0] + ex / 2, o[1] + ey / 2, o[2] + ez / 2);
  beam.object3D.scale.set(1, len, 1);
  const dir = beam.object3D.userData.dir ||
      (beam.object3D.userData.dir = new THREE.Vector3());
  dir.set(ex / len, ey / len, ez / len);
  beam.object3D.quaternion.setFromUnitVectors(
      beam.object3D.userData.y ||
          (beam.object3D.userData.y = new THREE.Vector3(0, 1, 0)),
      dir);
}
