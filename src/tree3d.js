import {DEF, localPos, nodeCol} from './nodes.js';

/** @param {string} c @param {number} o @return {THREE.MeshBasicMaterial} */
function mat(c, o) {
  return new THREE.MeshBasicMaterial({
    color: c, transparent: true, opacity: o,
  });
}

/** Family icon: cone / ring / bead / pair / star. */
function makeIcon(ic, col, cone, ring, pipG, oct) {
  const m = mat(col, 0.9);
  if (ic === 0) return new THREE.Mesh(cone, m);
  if (ic === 1 || ic === 3 || ic === 5) return new THREE.Mesh(ring, m);
  if (ic === 2) {
    const s = new THREE.Mesh(pipG, m);
    s.scale.setScalar(0.045);
    return s;
  }
  if (ic === 4) {
    const grp = new THREE.Group();
    const a = new THREE.Mesh(pipG, m);
    const b = new THREE.Mesh(pipG, m);
    a.scale.setScalar(0.028);
    b.scale.setScalar(0.028);
    a.position.x = -0.035;
    b.position.x = 0.035;
    grp.add(a, b);
    return grp;
  }
  return new THREE.Mesh(oct, m);
}

/** One node: core, outline, icon, level pips. */
function makeNode(i, sph, tor, pipG, cone, ring, oct) {
  const d = DEF[i];
  const p = localPos(i);
  const r = d[7] === 1 ? 0.13 : 0.085;
  const g = new THREE.Group();
  g.position.set(p[0], p[1], p[2]);
  g.lookAt(0, 0, 0);
  const col = nodeCol(i);
  const core = new THREE.Mesh(sph, mat('#111', 0.85));
  core.scale.setScalar(r);
  const outline = new THREE.Mesh(tor, mat(col, 0.35));
  outline.scale.setScalar(r * 1.05);
  const icon = makeIcon(d[10], col, cone, ring, pipG, oct);
  icon.position.z = 0.03;
  g.add(core, outline, icon);
  const pips = [];
  if (d[4] > 1) {
    for (let k = 0; k < d[4]; k++) {
      const a = (k / d[4]) * Math.PI * 2 - 0.5;
      const pip = new THREE.Mesh(pipG, mat(col, 0.2));
      pip.scale.setScalar(0.016);
      pip.position.set(
          Math.cos(a) * r * 1.55, Math.sin(a) * r * 1.55, 0.02);
      g.add(pip);
      pips.push(pip);
    }
  }
  return {g, core, outline, icon, pips, i};
}

/** GO orb with a canvas label facing the player. @return {THREE.Group} */
function makeGoOrb(sph) {
  const cont = new THREE.Group();
  const goM = new THREE.Mesh(sph, mat('#fff', 0.95));
  goM.scale.setScalar(0.13);
  cont.add(goM);
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#111';
  ctx.font = 'bold 72px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('Go', 64, 68);
  const tex = new THREE.CanvasTexture(canvas);
  const lbl = new THREE.Mesh(
      new THREE.PlaneGeometry(0.16, 0.16),
      new THREE.MeshBasicMaterial({
        map: tex, transparent: true, depthTest: false,
      }));
  lbl.position.z = 0.05;
  cont.add(lbl);
  return cont;
}

/**
 * Attach nodes, GO orb, and colored edges to the tree root.
 * @param {THREE.Object3D} root
 * @param {number[]} goP
 * @param {number[][]} edges
 * @return {Object}
 */
export function fillRoot(root, goP, edges) {
  const sph = new THREE.SphereGeometry(1, 10, 8);
  const tor = new THREE.TorusGeometry(1, 0.14, 6, 14);
  const pipG = new THREE.SphereGeometry(1, 6, 5);
  const cone = new THREE.ConeGeometry(0.05, 0.12, 6);
  const ring = new THREE.TorusGeometry(0.07, 0.016, 5, 12);
  const oct = new THREE.OctahedronGeometry(0.07, 0);
  const nodes = [];
  for (let i = 0; i < DEF.length; i++) {
    nodes.push(makeNode(i, sph, tor, pipG, cone, ring, oct));
    root.add(nodes[i].g);
  }
  const cont = makeGoOrb(sph);
  cont.position.set(goP[0], goP[1], goP[2]);
  root.add(cont);
  const pos = new Float32Array(edges.length * 6);
  const lineCol = new Float32Array(edges.length * 6);
  for (let i = 0; i < edges.length; i++) {
    const [a, b] = edges[i];
    pos.set(localPos(a), i * 6);
    pos.set(localPos(b), i * 6 + 3);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(lineCol, 3));
  const lines = new THREE.LineSegments(geo, new THREE.LineBasicMaterial({
    vertexColors: true, transparent: true, opacity: 0.92,
    depthTest: false,
  }));
  root.add(lines);
  root.visible = false;
  return {nodes, cont, lines, lineCol};
}
