import {clamp, ent, scene} from './lib.js';
import {G, I} from './state.js';
import * as input from './input.js';
import * as unicorn from './unicorn.js';
import * as game from './game.js';
import * as up from './upgrades.js';
import * as fx from './fx.js';
import * as audio from './audio.js';
import * as xr from './xr.js';
import * as wd from './wavedash.js';
import * as hud from './hud.js';
import * as menu from './menu.js';
import * as wipe from './wipe.js';

let rig;
let cam;
const LEVEL_PITCH = -0.16;
let yaw = 0;
let pitch = LEVEL_PITCH;

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
  wipe.create(cam);
  s.addEventListener('camera-set-active', (e) => {
    const next = e.detail && e.detail.cameraEl;
    if (next && next !== cam && !(I.xr && xr.isImmersive())) {
      cam.setAttribute('camera', 'active:true;fov:72');
    }
  });
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
  }
  const snap = up.peekSnap();
  if (snap) {
    yaw = snap.yaw;
    pitch = snap.pitch;
    up.clearSnap();
  }
  orbit(dt);
  input.sampleDesktop(cam);
  xr.sample();
  wipe.tick(dt);
  game.tick(dt);
  unicorn.update(G.blast > 0, I.hitPoint);
  fx.tick(dt);
  hud.draw(I.xr, yaw);
  menu.sync();
  G.wasFire = I.firing;
}

/**
 * Desktop 360 look; XR uses the headset pose.
 * Menu, wipe, and round intro stay leveled.
 * @param {number} dt
 * @return {void}
 */
function orbit(dt) {
  if (!rig) return;
  if (I.xr && xr.isImmersive()) {
    rig.setAttribute('position', '0 0 0');
    rig.setAttribute('rotation', '0 0 0');
    return;
  }
  const hold = G.state === 'TITLE' || G.state === 'OVER' ||
      (G.state === 'ROUND' && (wipe.busy() || G.intro > 0));
  if (hold) pitch = LEVEL_PITCH;
  const edge = 0.58;
  const turn = 2.6;
  const p = input.ptr;
  if (!hold) {
    if (p.x > edge) yaw -= (p.x - edge) * turn * dt;
    if (p.x < -edge) yaw += (-edge - p.x) * turn * dt;
    if (p.y > edge) pitch += (p.y - edge) * 1.8 * dt;
    if (p.y < -edge) pitch -= (-edge - p.y) * 1.8 * dt;
    if (p.l) yaw += 1.9 * dt;
    if (p.r) yaw -= 1.9 * dt;
  }
  pitch = clamp(pitch, -0.85, 0.55);
  const px = (pitch * 180 / Math.PI).toFixed(2);
  const py = (yaw * 180 / Math.PI).toFixed(2);
  rig.setAttribute('position', '0 1.4 0');
  rig.setAttribute('rotation', px + ' ' + py + ' 0');
}

const sc = document.getElementById('sc');
if (sc.hasLoaded) boot();
else sc.addEventListener('loaded', boot);
