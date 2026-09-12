import {G} from './state.js';

const DUR = [0.56, 0.8];
let mesh;
let mat;
let p = 1;
let mode = 0;
let mid = true;
let cb = null;

const VS = 'precision highp float;attribute vec3 position;attribute vec2 uv;' +
    'uniform mat4 projectionMatrix,modelViewMatrix;varying vec2 v;' +
    'void main(){v=uv;gl_Position=projectionMatrix*modelViewMatrix' +
    '*vec4(position,1.);}';

const FS = [
  'precision highp float;uniform float p,m,t;varying vec2 v;',
  'float h(vec2 q){return fract(sin(dot(q,vec2(127.1,311.7)))*43758.5);}',
  'float n(vec2 q){vec2 i=floor(q),f=fract(q);f=f*f*(3.-2.*f);',
  'return mix(mix(h(i),h(i+vec2(1.,0.)),f.x),mix(h(i+vec2(0.,1.)),',
  'h(i+vec2(1.)),f.x),f.y);}',
  'vec3 rb(float x){return .55+.45*cos(6.283*(x+vec3(0,.33,.67)));}',
  'void main(){float e=p<.5?p*2.:(p-.5)*2.;',
  'if(m<.5){float k=p<.5?1.-e:e;float c=step(k,v.x);',
  'float f=1.-smoothstep(0.,.07,abs(v.x-k));',
  'gl_FragColor=vec4(rb(v.y+t*.25+e),max(c*.97,f));}',
  'else{float q=n(v*7.+t*.7)+.45*n(v*18.-t)+.25*n(v*3.2);',
  'float cov=1.-abs(p*2.-1.);',
  'float a=smoothstep(.1+(1.-cov)*.62,.78,q)*cov;',
  'gl_FragColor=vec4(rb(q+v.x*.3+t*.12),a*.94);}}',
].join('');

/**
 * Mount a fullscreen shader plane on the camera.
 * @param {Element} cam
 * @return {void}
 */
export function create(cam) {
  mat = new THREE.RawShaderMaterial({
    transparent: true,
    depthTest: false,
    depthWrite: false,
    uniforms: {
      p: {value: 1},
      m: {value: 0},
      t: {value: 0},
    },
    vertexShader: VS,
    fragmentShader: FS,
  });
  mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat);
  mesh.position.z = -0.42;
  mesh.scale.set(0.88, 0.52, 1);
  mesh.frustumCulled = false;
  mesh.renderOrder = 9e3;
  mesh.visible = false;
  const add = () => {
    if (cam.object3D) cam.object3D.add(mesh);
  };
  if (cam.object3D) add();
  else cam.addEventListener('loaded', add);
}

/** @return {boolean} True while a wipe is running. */
export function busy() {
  return p < 1;
}

/**
 * Play a wipe. mode 0 = side swipe, 1 = rainbow mist.
 * Callback fires at full cover (p = 0.5).
 * @param {number} md
 * @param {Function=} done
 * @return {void}
 */
export function play(md, done) {
  mode = md;
  p = 0;
  mid = false;
  cb = done || null;
  if (mesh) mesh.visible = true;
  if (mat) mat.uniforms.m.value = md;
}

/**
 * Advance wipe progress and uniforms.
 * @param {number} dt
 * @return {void}
 */
export function tick(dt) {
  if (!mat || p >= 1) return;
  p = Math.min(1, p + dt / DUR[mode | 0]);
  if (!mid && p >= 0.5) {
    mid = true;
    if (cb) cb();
  }
  mat.uniforms.p.value = p;
  mat.uniforms.t.value = G.t;
  if (p >= 1 && mesh) mesh.visible = false;
}
