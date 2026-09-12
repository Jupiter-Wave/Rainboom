import {G} from './state.js';
import {hover} from './upgrades.js';
import {ptr} from './input.js';
import * as rb from './rainbow.js';

let s;
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

/** Cache DOM nodes and the XR canvas plane. @return {void} */
export function init() {
  s = document.getElementById('s');
  g = document.getElementById('g');
  tm = document.getElementById('tm');
  c = document.getElementById('c');
  m = document.getElementById('m');
  aim = document.getElementById('aim');
  indL = document.getElementById('indL');
  indR = document.getElementById('indR');
  canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 64;
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
  plane.setAttribute('visible', 'false');
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
  s.textContent = play ? 'S ' + G.score : '';
  g.textContent = play ? G.gold + 'g' : '';
  tm.textContent = G.state === 'ROUND' ?
      (G.delay > 0 ? 'READY' : G.time.toFixed(1)) : '';
  tm.style.color = G.time < 3 && G.state === 'ROUND' ? '#c33' : '#222';
  if (aim) {
    const show = play && !xr;
    aim.classList.toggle('on', show);
    if (show) {
      aim.style.left = ptr.cx + 'px';
      aim.style.top = ptr.cy + 'px';
    }
  }
  const sc = document.getElementById('sc');
  if (sc) sc.style.cursor = play && !xr ? 'none' : '';
  document.body.style.cursor = play && !xr ? 'none' : '';
  if (indL && indR && play && !xr && G.state === 'ROUND') {
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
    c.textContent = 'OVER  ' + G.score;
    m.textContent = 'FIRE TO REPLAY';
  } else if (G.state === 'UPGRADE') {
    c.textContent = '';
    m.textContent = hover || 'SHOOT A STAR';
  } else {
    c.textContent = G.flashT > 0 ? G.flash : '';
    m.textContent = G.round === 1 && G.done === 0 ?
        'POINT TO BLAST  ·  HOVER COINS' : '';
  }
  if (!plane || !ctx) return;
  plane.setAttribute('visible', xr ? 'true' : 'false');
  if (!xr) return;
  const clock = G.state === 'ROUND' ?
      (G.delay > 0 ? 'READY' : G.time.toFixed(1)) : '';
  const upLine = G.state === 'UPGRADE' ? (hover || 'AIM') : '';
  const line = clock + '  ' + G.score + '  ' + G.gold + 'g  ' + upLine;
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
    ctx.fillText(G.gold + 'g', 12, 54);
  } else {
    ctx.fillText(clock || String(G.score), 12, 30);
    ctx.fillStyle = '#fff';
    ctx.font = '700 18px monospace';
    ctx.fillText(G.score + '  ' + G.gold + 'g', 12, 56);
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
