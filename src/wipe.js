import {vis} from './lib.js';
import {G} from './state.js';

const DUR = 1.05;
let el;
let mesh;
let mat;
let fog;
let p = 1;
let mid = true;
let cb = null;

const VS = 'precision highp float;attribute vec3 position;attribute vec2 uv;' +
    'varying vec2 v;void main(){v=uv;gl_Position=vec4(position.xy,0.,1.);}';

const FS = [
  'precision highp float;uniform float p,t;varying vec2 v;',
  'float h(vec2 q){return fract(sin(dot(q,vec2(127.1,311.7)))*43758.5);}',
  'float n(vec2 q){vec2 i=floor(q),f=fract(q);f=f*f*(3.-2.*f);',
  'return mix(mix(h(i),h(i+vec2(1.,0.)),f.x),mix(h(i+vec2(0.,1.)),',
  'h(i+vec2(1.)),f.x),f.y);}',
  'float blob(vec2 c,float s){vec2 d=v-c;return exp(-dot(d,d)*s);}',
  'void main(){',
  'float q=n(v*3.2+t*.1)+.35*n(v*8.5-t*.16);',
  'vec3 col=mix(vec3(.93,.95,.97),vec3(.85,.87,.91),v.y);',
  'col=mix(col,vec3(.93,.13,.13),blob(vec2(.18,.28),2.2)*.44);',
  'col=mix(col,vec3(.13,.53,.93),blob(vec2(.82,.22),2.)*.4);',
  'col=mix(col,vec3(.67,.13,.93),blob(vec2(.72,.78),2.1)*.36);',
  'col=mix(col,vec3(.13,.80,.13),blob(vec2(.28,.72),2.2)*.4);',
  'col+=(q-.5)*.045;',
  'float cov=smoothstep(0.,.3,p)*(1.-smoothstep(.7,1.,p));',
  'float a=smoothstep(1.-cov-.18,1.-cov+.12,q);',
  'a=max(a,smoothstep(.82,.94,cov));',
  'gl_FragColor=vec4(col,a);}',
].join('');

/**
 * Smooth in, hold opaque, then smooth out.
 * @param {number} x Wipe progress 0..1.
 * @return {number} Cover amount 0..1.
 */
function cover(x) {
  return x < 0.5 ? x * 2 : 2 - x * 2;
}

/**
 * Mount a clip-space mist quad and the HTML cover sheet.
 * @param {Element} cam
 * @return {void}
 */
export function create(cam) {
  fog = document.getElementById('fog');
  mat = new THREE.RawShaderMaterial({
    transparent: true,
    depthTest: false,
    depthWrite: false,
    side: THREE.DoubleSide,
    uniforms: {p: {value: 1}, t: {value: 0}},
    vertexShader: VS,
    fragmentShader: FS,
  });
  mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat);
  mesh.frustumCulled = false;
  mesh.renderOrder = 9e3;
  mesh.visible = false;
  el = document.createElement('a-entity');
  vis(el, false);
  cam.appendChild(el);
  const add = () => {
    if (el.object3D && !mesh.parent) el.object3D.add(mesh);
  };
  if (el.hasLoaded) add();
  else el.addEventListener('loaded', add);
}

/** @return {boolean} True while a wipe is running. */
export function busy() {
  return p < 1;
}

/** @return {number} Seconds until the wipe finishes. */
export function remain() {
  return p < 1 ? (1 - p) * DUR : 0;
}

/**
 * Play rainbow mist. Callback fires while fully covered.
 * @param {Function=} done
 * @return {void}
 */
export function play(done) {
  p = 0;
  mid = false;
  cb = done || null;
  if (mesh) mesh.visible = true;
  vis(el, true);
  sheet(0);
}

/**
 * Advance wipe progress and uniforms.
 * @param {number} dt
 * @return {void}
 */
export function tick(dt) {
  if (!mat || p >= 1) return;
  p = Math.min(1, p + dt / DUR);
  if (!mid && p >= 0.5) {
    mid = true;
    if (cb) cb();
  }
  mat.uniforms.p.value = p;
  mat.uniforms.t.value = G.t;
  sheet(cover(p));
  if (p >= 1) {
    if (mesh) mesh.visible = false;
    vis(el, false);
    sheet(0);
  }
}

/**
 * Sync the HTML mist sheet and hide HUD chrome.
 * @param {number} a Opacity 0..1.
 * @return {void}
 */
function sheet(a) {
  if (fog) fog.style.opacity = String(Math.max(0, (a - 0.72) / 0.28));
  const h = document.getElementById('h');
  if (h) h.style.visibility = a > 0.08 ? 'hidden' : '';
}
