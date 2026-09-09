import {ent, scene} from './lib.js';
import {I} from './state.js';

let body;
let horn;
let xrHorn;
let beam;
const hornW = [0, 1.25, -0.55];

/**
 * Build the desktop unicorn and beam.
 * @return {void}
 */
export function create() {
  const s = scene();
  body = ent(s, {id: 'uni'});
  ent(body, {
    geometry: 'primitive:sphere;radius:0.42',
    material: 'color:#f4f0ea',
    position: '0 0.72 0',
  });
  ent(body, {
    geometry: 'primitive:sphere;radius:0.22',
    material: 'color:#f4f0ea',
    position: '0 1.05 -0.38',
  });
  for (const p of ['-0.16 0.28 0.16', '0.16 0.28 0.16',
    '-0.16 0.28 -0.16', '0.16 0.28 -0.16']) {
    ent(body, {
      geometry: 'primitive:box;width:0.1;height:0.36;depth:0.1',
      material: 'color:#eee8e0',
      position: p,
    });
  }
  horn = ent(body, {
    geometry: 'primitive:cone;radiusBottom:0.07;radiusTop:0.01;height:0.38',
    material: 'color:#ffe56a;emissive:#aa6',
    position: '0 1.28 -0.5',
    rotation: '-18 0 0',
  });
  ent(body, {
    geometry: 'primitive:sphere;radius:0.1',
    material: 'color:#e5a',
    position: '0 0.7 0.42',
  });
  ent(body, {
    geometry: 'primitive:sphere;radius:0.08',
    material: 'color:#6cf',
    position: '0.08 0.78 0.5',
  });
  xrHorn = ent(s, {
    geometry: 'primitive:cone;radiusBottom:0.05;radiusTop:0.01;height:0.28',
    material: 'color:#ffe56a',
    position: '0 -0.22 -0.35',
    rotation: '-70 0 0',
    visible: 'false',
  });
  beam = ent(s, {
    geometry: 'primitive:cylinder;radius:0.035;height:1',
    material: 'color:#fff;emissive:#faf;opacity:0.85;transparent:true',
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
  xrHorn.setAttribute('visible', on + '');
  if (on) camEl.appendChild(xrHorn);
  else scene().appendChild(xrHorn);
}

/**
 * World-space horn tip.
 * @return {number[]}
 */
export function hornPos() {
  if (!horn || !horn.object3D) return hornW;
  horn.object3D.getWorldPosition(horn.object3D.userData.w ||
      (horn.object3D.userData.w = new THREE.Vector3()));
  const w = horn.object3D.userData.w;
  hornW[0] = w.x;
  hornW[1] = w.y;
  hornW[2] = w.z;
  return hornW;
}

/**
 * Aim the body slightly and update the beam.
 * @param {boolean} show Beam visible.
 * @param {number[]} end Beam end point.
 * @return {void}
 */
export function update(show, end) {
  const o = I.aimOrigin;
  const d = I.aimDirection;
  if (body && body.object3D && !I.xr) {
    const y = Math.atan2(d[0], d[2]);
    body.object3D.rotation.y = y + Math.PI;
  }
  if (!beam || !beam.object3D) return;
  beam.object3D.visible = !!show;
  if (!show) return;
  const ex = end[0] - o[0];
  const ey = end[1] - o[1];
  const ez = end[2] - o[2];
  const len = Math.hypot(ex, ey, ez) || 0.2;
  const mid = beam.object3D.position;
  mid.set(o[0] + ex / 2, o[1] + ey / 2, o[2] + ez / 2);
  beam.object3D.scale.set(1, len, 1);
  const dir = beam.object3D.userData.dir ||
      (beam.object3D.userData.dir = new THREE.Vector3());
  dir.set(ex / len, ey / len, ez / len);
  beam.object3D.quaternion.setFromUnitVectors(
      beam.object3D.userData.y ||
          (beam.object3D.userData.y = new THREE.Vector3(0, 1, 0)),
      dir);
}
