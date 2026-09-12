import {G} from './state.js';

const DUR = 0.78;
let el;
let mesh;
let mat;
let p = 1;
let mid = true;
let cb = null;

const VS = 'precision highp float;attribute vec3 position;attribute vec2 uv;' +
    'uniform mat4 projectionMatrix,modelViewMatrix;varying vec2 v;' +
    'void main(){v=uv;gl_Position=projectionMatrix*modelViewMatrix' +
    '*vec4(position,1.);}';

const FS = [
  'precision highp float;uniform float p,t;varying vec2 v;',
  'float h(vec2 q){return fract(sin(dot(q,vec2(127.1,311.7)))*43758.5);}',
  'float n(vec2 q){vec2 i=floor(q),f=fract(q);f=f*f*(3.-2.*f);',
  'return mix(mix(h(i),h(i+vec2(1.,0.)),f.x),mix(h(i+vec2(0.,1.)),',
  'h(i+vec2(1.)),f.x),f.y);}',
  'float blob(vec2 c,float s){vec2 d=v-c;return exp(-dot(d,d)*s);}',
  'void main(){float q=n(v*3.5+t*.12)+.3*n(v*9.-t*.18);',
  'vec3 col=vec3(.93,.95,.97);',
  'col=mix(col,vec3(.93,.27,.27),blob(vec2(.18,.28),3.1)*.22);',
  'col=mix(col,vec3(.13,.53,.93),blob(vec2(.82,.22),2.9)*.19);',
  'col=mix(col,vec3(.67,.13,.93),blob(vec2(.72,.78),3.)*.16);',
  'col=mix(col,vec3(.13,.80,.13),blob(vec2(.28,.72),3.2)*.19);',
  'col=mix(col,vec3(.93,.93,.13),blob(vec2(.5,.5),2.4)*.13);',
  'col+=(q-.5)*.03;float cov=1.-abs(p*2.-1.);',
  'gl_FragColor=vec4(col,pow(cov,.7)*.78);}',
].join('');

/**
 * Mount a camera-locked mist plane (A-Frame child, like the HUD).
 * @param {Element} cam
 * @return {void}
 */
export function create(cam) {
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
  mesh.scale.set(0.82, 0.5, 1);
  mesh.frustumCulled = false;
  mesh.renderOrder = 9e3;
  mesh.visible = false;
  el = document.createElement('a-entity');
  el.setAttribute('position', '0 0 -0.46');
  el.setAttribute('visible', 'false');
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

/**
 * Play rainbow mist. Callback fires at full cover (p = 0.5).
 * @param {Function=} done
 * @return {void}
 */
export function play(done) {
  p = 0;
  mid = false;
  cb = done || null;
  if (mesh) mesh.visible = true;
  if (el) el.setAttribute('visible', 'true');
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
  if (p >= 1) {
    if (mesh) mesh.visible = false;
    if (el) el.setAttribute('visible', 'false');
  }
}
