import {G} from './state.js';
import {startRun} from './game.js';
import * as audio from './audio.js';
import * as xr from './xr.js';

let root;
let det;
let play;
let xrb;

/**
 * Wire the HTML start menu and detect XR.
 * @return {void}
 */
export function init() {
  root = document.getElementById('menu');
  det = document.getElementById('det');
  play = document.getElementById('play');
  xrb = document.getElementById('xrb');
  if (!root) return;
  det.textContent = 'Desktop';
  play.addEventListener('click', (e) => {
    e.stopPropagation();
    audio.unlock();
    hide();
    startRun();
  });
  xrb.addEventListener('click', (e) => {
    e.stopPropagation();
    audio.unlock();
    xr.enter();
  });
  xr.detect().then((ok) => {
    det.textContent = ok ? 'XR headset ready' : 'Desktop';
    if (ok) xrb.hidden = false;
  });
}

/** Show the start / replay menu. @return {void} */
export function show() {
  if (!root) return;
  root.hidden = false;
  play.textContent = G.state === 'OVER' ? 'PLAY AGAIN' : 'PLAY';
}

/** Hide the start menu. @return {void} */
export function hide() {
  if (root) root.hidden = true;
}

/**
 * Keep the menu visible on TITLE and OVER only.
 * @return {void}
 */
export function sync() {
  if (G.state === 'TITLE' || G.state === 'OVER') show();
  else hide();
}
