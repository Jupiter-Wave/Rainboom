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
  'vec3 rb(float x){return .55+.45*cos(6.283*(x+vec3(0,.33,.67)));}',
  'float blob(vec2 c,float s){vec2 d=v-c;return exp(-dot(d,d)*s);}',
  'void main(){float q=n(v*6.+t*.35)+.45*n(v*16.-t*.5);',
  'float b=blob(vec2(.22+.1*sin(t*.7),.4+.08*cos(t*.5)),6.5)',
  '+blob(vec2(.78+.08*cos(t*.6),.3+.1*sin(t*.8)),5.5)',
  '+blob(vec2(.5+.12*sin(t*.4),.72+.07*cos(t*.9)),5.)',
  '+blob(vec2(.42+.09*cos(t*.55),.18),7.2);',
  'float m=b*.7+q*.45;float cov=1.-abs(p*2.-1.);',
  'float a=smoothstep(.06+(1.-cov)*.72,.52,m)*cov;',
  'gl_FragColor=vec4(rb(m*.7+v.y*.22+t*.08),a*.93);}',
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
