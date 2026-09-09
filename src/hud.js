import {G} from './state.js';
import {hover} from './upgrades.js';

let s;
let g;
let tm;
let c;
let m;
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
 * @return {void}
 */
export function draw(xr) {
  const play = G.state === 'ROUND' || G.state === 'UPGRADE';
  s.textContent = play ? 'S ' + G.score : '';
  g.textContent = play ? G.gold + 'g' : '';
  tm.textContent = G.state === 'ROUND' ?
      (G.delay > 0 ? 'READY' : G.time.toFixed(1)) : '';
  if (G.time < 3 && G.state === 'ROUND') tm.style.color = '#f66';
  else tm.style.color = '#fff';
  if (G.state === 'TITLE') {
    c.textContent = 'RAINBOOM';
    m.textContent = 'CLICK / HOLD TO FILL';
  } else if (G.state === 'OVER') {
    c.textContent = 'OVER  ' + G.score;
    m.textContent = 'FIRE TO REPLAY';
  } else if (G.state === 'UPGRADE') {
    c.textContent = '';
    m.textContent = hover || 'BLAST A NODE';
  } else {
    c.textContent = G.flashT > 0 ? G.flash : '';
    m.textContent = G.round === 1 && G.done === 0 ? 'HOLD TO FILL' : '';
  }
  if (!plane || !ctx) return;
  plane.setAttribute('visible', xr ? 'true' : 'false');
  if (!xr) return;
  const line = (G.state === 'ROUND' ? G.time.toFixed(1) + '  ' : '') +
      G.score + '  ' + G.gold + 'g';
  if (line === last) return;
  last = line;
  ctx.clearRect(0, 0, 256, 64);
  ctx.fillStyle = '#fff';
  ctx.font = '700 28px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(line, 128, 40);
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
