import {COLORS, ent, scene} from './lib.js';

let body;
let horn;
let beam;
const hornW = [0, 0.2, -0.4];

/**
 * Stack seven colored cones into a rainbow horn.
 * @param {Element} parent Parent entity.
 * @param {number} scale Size multiplier.
 * @return {void}
 */
function stripeHorn(parent, scale) {
  for (let i = 0; i < 7; i++) {
    const t = i / 6;
    const h = 0.13 * scale;
    const r0 = (0.12 - t * 0.09) * scale;
    const r1 = (0.1 - t * 0.09) * scale;
    ent(parent, {
      geometry: 'primitive:cone;radiusBottom:' + r0 +
          ';radiusTop:' + r1 + ';height:' + h,
      material: 'color:' + COLORS[i] + ';emissive:' + COLORS[i],
      position: '0 ' + ((i + 0.5) * h) + ' 0',
    });
  }
}

/**
 * Build a grey unicorn and a camera-mounted rainbow horn.
 * @param {Element} camEl Active camera.
 * @return {void}
 */
export function create(camEl) {
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
  horn = ent(camEl, {
    id: 'horn',
    position: '0 -0.24 -0.38',
    rotation: '-52 0 0',
  });
  stripeHorn(horn, 0.88);
  scene().addEventListener('camera-set-active', (e) => {
    const next = e.detail && e.detail.cameraEl;
    if (horn && next && horn.parentNode !== next) next.appendChild(horn);
  });
  beam = ent(s, {
    geometry: 'primitive:cylinder;radius:0.035;height:1',
    material: 'color:#fff;emissive:#faf;opacity:0.9;transparent:true',
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
  w.set(0, 0.8, 0);
  horn.object3D.localToWorld(w);
  hornW[0] = w.x;
  hornW[1] = w.y;
  hornW[2] = w.z;
  return hornW;
}

/**
 * Draw a short blast from the horn to the aim point.
 * @param {boolean} show Beam visible.
 * @param {number[]} end Beam end point.
 * @return {void}
 */
export function update(show, end) {
  if (!beam || !beam.object3D) return;
  beam.object3D.visible = !!show;
  if (!show) return;
  const o = hornPos();
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
