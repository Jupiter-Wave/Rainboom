import {G} from './state.js';
import {startRun} from './game.js';
import * as audio from './audio.js';
import * as xr from './xr.js';
import * as wipe from './wipe.js';

let root;
let play;
let xrb;

/**
 * Wire the HTML start menu and detect XR.
 * @return {void}
 */
export function init() {
  root = document.getElementById('menu');
  play = document.getElementById('play');
  xrb = document.getElementById('xrb');
  if (!root) return;
  play.addEventListener('click', (e) => {
    e.stopPropagation();
    audio.unlock();
    beginPlay();
  });
  xrb.addEventListener('click', (e) => {
    e.stopPropagation();
    audio.unlock();
    xr.enter();
  });
  xr.detect().then((ok) => {
    if (ok && xrb) xrb.hidden = false;
  });
}

/** Show the start / replay menu. @return {void} */
export function show() {
  if (!root) return;
  root.hidden = false;
  play.textContent = G.state === 'OVER' ? 'PLAY AGAIN' : 'START';
}

/** Hide the start menu. @return {void} */
export function hide() {
  if (root) root.hidden = true;
}

/**
 * Mist-cover the title, then start a run.
 * @return {void}
 */
export function beginPlay() {
  if (wipe.busy()) return;
  const sc = document.getElementById('sc');
  if (sc) sc.style.visibility = 'visible';
  if (root) root.classList.add('cover');
  wipe.play(() => {
    hide();
    if (root) root.classList.remove('cover');
    startRun();
  });
}

/**
 * Keep the menu visible on TITLE and OVER only.
 * @return {void}
 */
export function sync() {
  if (wipe.busy()) return;
  const on = G.state === 'TITLE' || G.state === 'OVER';
  const sc = document.getElementById('sc');
  if (sc) sc.style.visibility = on ? 'hidden' : 'visible';
  if (on) show();
  else hide();
}
