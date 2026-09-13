import {canvas2d, vis} from './lib.js';
import {G} from './state.js';
import {bannerAlpha, roundBanner} from './game.js';
import {hover} from './upgrades.js';
import {ptr} from './input.js';
import * as rb from './rainbow.js';
import * as wipe from './wipe.js';

let g;
let tm;
let c;
let m;
let aim;
let indL;
let indR;
let plane;
let canvas;
let ctx;
let last = '';

/** Desktop / XR gold label. @return {string} */
function gold() {
  return 'GOLD ' + G.gold;
}

/** Cache DOM nodes and the XR canvas plane. @return {void} */
export function init() {
  g = document.getElementById('g');
  tm = document.getElementById('tm');
  c = document.getElementById('c');
  m = document.getElementById('m');
  aim = document.getElementById('aim');
  indL = document.getElementById('indL');
  indR = document.getElementById('indR');
  canvas = canvas2d(256, 64);
  ctx = canvas.getContext('2d');
}

/**
 * Attach the world-space HUD to the camera.
 * @param {Element} cam
 * @return {void}
 */
export function attach(cam) {
  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  plane = document.createElement('a-entity');
  plane.setAttribute('geometry', 'primitive:plane;width:0.7;height:0.18');
  plane.setAttribute('position', '0 0.22 -0.9');
  vis(plane, false);
  cam.appendChild(plane);
  plane._tex = tex;
}

/**
 * Refresh HTML and XR number strip.
 * @param {boolean} xr
 * @param {number} yaw Rig yaw radians (desktop scan).
 * @return {void}
 */
export function draw(xr, yaw) {
  const play = G.state === 'ROUND' || G.state === 'UPGRADE';
  g.textContent = play ? gold() : '';
  const hold = G.state === 'ROUND' &&
      (wipe.busy() || G.intro > 0);
  const banner = roundBanner();
  tm.textContent = G.state === 'ROUND' && !hold ?
      G.time.toFixed(1) : '';
  tm.style.color = !hold && G.time < 3 && G.state === 'ROUND' ?
      '#c33' : '#222';
  if (aim) {
    const show = play && !xr && !hold;
    aim.classList.toggle('on', show);
    if (show) {
      aim.style.left = ptr.cx + 'px';
      aim.style.top = ptr.cy + 'px';
    }
  }
  const sc = document.getElementById('sc');
  if (sc) sc.style.cursor = play && !xr ? 'none' : '';
  document.body.style.cursor = play && !xr ? 'none' : '';
  if (indL && indR && play && !xr && G.state === 'ROUND' && !hold) {
    const vfov = 72 * Math.PI / 180;
    const half = Math.atan(Math.tan(vfov / 2) * innerWidth / innerHeight);
    const side = rb.sense(yaw, half);
    indL.classList.toggle('on', side < 0);
    indR.classList.toggle('on', side > 0);
  } else if (indL && indR) {
    indL.classList.remove('on');
    indR.classList.remove('on');
  }
  if (G.state === 'TITLE') {
    c.textContent = '';
    m.textContent = '';
  } else if (G.state === 'OVER') {
    c.classList.remove('flash');
    c.textContent = 'OVER  ' + gold();
    m.textContent = 'FIRE';
  } else if (G.state === 'UPGRADE') {
    c.classList.remove('flash');
    c.textContent = '';
    m.textContent = hover || 'AIM';
  } else if (banner) {
    c.classList.add('flash');
    c.textContent = banner;
    c.style.opacity = bannerAlpha().toFixed(3);
    m.textContent = '';
  } else {
    c.style.opacity = '';
    const on = G.flashT > 0;
    c.classList.toggle('flash', on);
    c.textContent = on ? G.flash : '';
    m.textContent = G.round === 1 && G.done === 0 && !hold ?
        'BLAST · COINS' : '';
  }
  if (!plane || !ctx) return;
  vis(plane, xr);
  if (!xr) return;
  const clock = G.state === 'ROUND' && !hold ?
      (banner || G.time.toFixed(1)) : '';
  const upLine = G.state === 'UPGRADE' ? (hover || 'AIM') : '';
  const line = clock + '  ' + gold() + '  ' + upLine;
  if (line === last) return;
  last = line;
  ctx.clearRect(0, 0, 256, 64);
  ctx.fillStyle = G.time < 3 && G.state === 'ROUND' ? '#f66' : '#fff';
  ctx.font = '700 34px monospace';
  ctx.textAlign = 'left';
  if (G.state === 'UPGRADE') {
    ctx.font = '700 16px monospace';
    ctx.fillText(upLine, 12, 28);
    ctx.font = '700 18px monospace';
    ctx.fillText(gold(), 12, 54);
  } else {
    ctx.fillText(clock || gold(), 12, 30);
    ctx.fillStyle = '#fff';
    ctx.font = '700 18px monospace';
    ctx.fillText(gold(), 12, 56);
  }
  const tex = plane._tex;
  if (tex) {
    tex.needsUpdate = true;
    const mesh = plane.getObject3D('mesh');
    if (mesh && mesh.material) {
      mesh.material.map = tex;
      mesh.material.transparent = true;
      mesh.material.needsUpdate = true;
    }
  }
}
