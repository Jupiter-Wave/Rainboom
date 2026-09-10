import {ent, scene} from './lib.js';
import {G, I} from './state.js';
import * as input from './input.js';
import * as unicorn from './unicorn.js';
import * as rb from './rainbow.js';
import * as game from './game.js';
import * as up from './upgrades.js';
import * as fx from './fx.js';
import * as audio from './audio.js';
import * as xr from './xr.js';
import * as wd from './wavedash.js';
import * as hud from './hud.js';
import * as menu from './menu.js';

let rig;
let cam;
let yaw = 0;

/**
 * Build the arena and start the loop.
 * @return {void}
 */
function boot() {
  const s = scene();
  rig = document.getElementById('rig');
  cam = document.getElementById('cam');
  ent(s, {
    light: 'type:directional;color:#fff;intensity:0.45',
    position: '3 7 2',
  });
  ent(s, {
    geometry: 'primitive:cylinder;radius:14;height:0.08',
    material: 'color:#e8e8e8',
    position: '0 0 0',
  });
  unicorn.create(cam);
  fx.create();
  up.create();
  hud.init();
  input.bind();
  addEventListener('mousedown', audio.unlock);
  xr.init(s, cam);
  menu.init();
  wd.init();
  hud.attach(cam);
  rb.spawn(0, 1.35, -5.6, 0.35);
  AFRAME.registerComponent('loop', {
    tick: (_, ms) => step((ms || 16) / 1000),
  });
  s.setAttribute('loop', '');
}

/**
 * One frame: input, sim, camera, HUD.
 * @param {number} dt
 * @return {void}
 */
function step(dt) {
  if (dt > 0.05) dt = 0.05;
  G.t += dt;
  if (I.xr && !xr.isImmersive()) {
    I.xr = false;
    unicorn.setXr(cam, false);
  }
  input.sampleDesktop(cam);
  xr.sample();
  game.tick(dt);
  unicorn.update(G.blast > 0, I.hitPoint);
  fx.tick(dt);
  orbit(dt);
  hud.draw(I.xr);
  menu.sync();
  G.wasFire = I.firing;
}

/**
 * Desktop orbit camera that eases toward aim.
 * @param {number} dt
 * @return {void}
 */
function orbit(dt) {
  if (!rig.object3D || !cam.object3D) return;
  if (I.xr && xr.isImmersive()) {
    rig.object3D.position.set(0, 0, 0);
    rig.object3D.rotation.set(0, 0, 0);
    return;
  }
  const d = I.aimDirection;
  const want = G.state === 'UPGRADE' || G.state === 'TITLE' ||
      G.state === 'OVER' ? 0 : Math.atan2(-d[0], -d[2]);
  let diff = want - yaw;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  yaw += diff * Math.min(1, dt * 3.2);
  const dist = 7.1;
  rig.object3D.position.set(
      Math.sin(yaw) * dist, 3.15, Math.cos(yaw) * dist);
  rig.object3D.lookAt(0, 1.25, 0);
  fx.applyPunch(rig);
}

const sc = document.getElementById('sc');
if (sc.hasLoaded) boot();
else sc.addEventListener('loaded', boot);
