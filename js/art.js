/* =========================================================
   星陨战线 · ART
   Procedural anime characters, enemies, VFX, post processing
   ========================================================= */
(function () {
  'use strict';
  const T = THREE;
  const D = window.GAME_DATA;

  /* ---------------- shared helpers ---------------- */
  const RNG = (seed => () => {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  })(20261118);

  const gradientData = new Uint8Array([34, 92, 152, 208, 255]);
  const TOON_GRADIENT = new T.DataTexture(gradientData, gradientData.length, 1, T.RedFormat);
  TOON_GRADIENT.minFilter = T.NearestFilter;
  TOON_GRADIENT.magFilter = T.NearestFilter;
  TOON_GRADIENT.generateMipmaps = false;
  TOON_GRADIENT.needsUpdate = true;

  const OUTLINE = '#342231';
  const A_STAR_FALLBACK = () => STAR_TEX;
  const _v1 = new T.Vector3(), _v2 = new T.Vector3(), _v3 = new T.Vector3();

  function toon(color, opts) {
    return new T.MeshToonMaterial(Object.assign({
      color: color,
      gradientMap: TOON_GRADIENT,
      side: T.FrontSide
    }, opts || {}));
  }

  function pbr(color, opts) {
    return new T.MeshStandardMaterial(Object.assign({
      color: color, roughness: 0.72, metalness: 0.08
    }, opts || {}));
  }

  function basic(color, opts) {
    return new T.MeshBasicMaterial(Object.assign({ color: color }, opts || {}));
  }

  function glow(color, opacity, opts) {
    return new T.MeshBasicMaterial(Object.assign({
      color: color, transparent: true, opacity: opacity,
      blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide
    }, opts || {}));
  }

  function outline(mesh, scale, color) {
    if (!mesh || !mesh.geometry) return mesh;
    scale = scale || 1.024;
    const o = new T.Mesh(mesh.geometry, new T.MeshBasicMaterial({
      color: color || OUTLINE, side: T.BackSide
    }));
    o.scale.setScalar(scale);
    o.castShadow = false;
    o.receiveShadow = false;
    o.userData.noOutline = true;
    o.raycast = function () {};
    mesh.add(o);
    return mesh;
  }

  function add(parent, geo, mat, x, y, z) {
    const m = new T.Mesh(geo, mat);
    m.position.set(x || 0, y || 0, z || 0);
    m.castShadow = true;
    m.receiveShadow = true;
    parent.add(m);
    return m;
  }

  function sphere(parent, radius, mat, x, y, z, sx, sy, sz, outlineIt) {
    const m = add(parent, new T.SphereGeometry(radius, 20, 14), mat, x, y, z);
    m.scale.set(sx || 1, sy || 1, sz || 1);
    if (outlineIt !== false) outline(m, 1.035);
    return m;
  }

  function capsule(parent, radius, length, mat, x, y, z, outlineIt) {
    const m = add(parent, new T.CapsuleGeometry(radius, length, 5, 10), mat, x, y, z);
    if (outlineIt !== false) outline(m, 1.055);
    return m;
  }

  function taperedTube(points, r0, r1, material, tubular, radial) {
    const curve = new T.CatmullRomCurve3(points.map(p => p.isVector3 ? p : new T.Vector3(p[0], p[1], p[2])), false, 'catmullrom', 0.35);
    const segs = tubular || 12;
    const rad = radial || 6;
    const frames = curve.computeFrenetFrames(segs, false);
    const pos = [], nor = [], uv = [], idx = [];
    const pt = new T.Vector3(), n = new T.Vector3(), b = new T.Vector3(), v = new T.Vector3();
    for (let i = 0; i <= segs; i++) {
      const t = i / segs;
      curve.getPointAt(t, pt);
      n.copy(frames.normals[Math.min(i, segs - 1)]);
      b.copy(frames.binormals[Math.min(i, segs - 1)]);
      const r = r0 + (r1 - r0) * (t * t * (3 - 2 * t));
      for (let j = 0; j <= rad; j++) {
        const a = j / rad * Math.PI * 2;
        v.copy(pt).addScaledVector(n, Math.cos(a) * r).addScaledVector(b, Math.sin(a) * r);
        pos.push(v.x, v.y, v.z);
        nor.push(Math.cos(a) * n.x + Math.sin(a) * b.x, Math.cos(a) * n.y + Math.sin(a) * b.y, Math.cos(a) * n.z + Math.sin(a) * b.z);
        uv.push(j / rad, t);
      }
    }
    for (let i = 0; i < segs; i++) {
      for (let j = 0; j < rad; j++) {
        const a = i * (rad + 1) + j;
        const c = (i + 1) * (rad + 1) + j;
        idx.push(a, c, a + 1, c, c + 1, a + 1);
      }
    }
    const g = new T.BufferGeometry();
    g.setAttribute('position', new T.Float32BufferAttribute(pos, 3));
    g.setAttribute('normal', new T.Float32BufferAttribute(nor, 3));
    g.setAttribute('uv', new T.Float32BufferAttribute(uv, 2));
    g.setIndex(idx);
    return new T.Mesh(g, material);
  }

  function makePleatedSkirt(topR, hemR, topY, hemY, pleats, segments, material) {
    segments = Math.max(segments, 40);
    const rings = 6;
    const pos = [], idx = [], uv = [];
    const pt = new T.Vector3();
    for (let r = 0; r <= rings; r++) {
      const t = r / rings;
      const y = topY + (hemY - topY) * t;
      const baseR = topR + (hemR - topR) * Math.pow(t, 0.72);
      for (let s = 0; s <= segments; s++) {
        const a = s / segments * Math.PI * 2;
        const pleat = Math.cos(a * pleats) * 0.025 * t * (0.4 + 0.6 * t);
        const rr = baseR + pleat;
        pos.push(Math.cos(a) * rr, y, Math.sin(a) * rr);
        uv.push(s / segments, t);
      }
    }
    for (let r = 0; r < rings; r++) {
      for (let s = 0; s < segments; s++) {
        const a = r * (segments + 1) + s;
        const b = (r + 1) * (segments + 1) + s;
        idx.push(a, b, a + 1, b, b + 1, a + 1);
      }
    }
    const g = new T.BufferGeometry();
    g.setAttribute('position', new T.Float32BufferAttribute(pos, 3));
    g.setAttribute('uv', new T.Float32BufferAttribute(uv, 2));
    g.setIndex(idx);
    g.computeVertexNormals();
    const m = new T.Mesh(g, material);
    m.castShadow = true;
    m.receiveShadow = true;
    return m;
  }

  function makeAlineSkirt(topR, hemR, topY, hemY, material, segments) {
    const pts = [];
    const steps = 5;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const y = topY + (hemY - topY) * t;
      const r = topR + (hemR - topR) * Math.pow(t, 0.78);
      pts.push(new T.Vector2(r, y));
    }
    const geo = new T.LatheGeometry(pts, segments || 64);
    geo.scale(1, 1, 0.97);
    geo.computeVertexNormals();
    const m = new T.Mesh(geo, material);
    m.castShadow = true;
    m.receiveShadow = true;
    return m;
  }

  function eyeShape(parent, x, y, z, scaleX, scaleY, mat) {
    const m = add(parent, new T.CircleGeometry(1, 24), mat, x, y, z);
    m.scale.set(scaleX, scaleY, 1);
    return m;
  }

  function starGeo(outer, inner, points) {
    const shape = new T.Shape();
    for (let i = 0; i < points * 2; i++) {
      const r = i % 2 === 0 ? outer : inner;
      const a = i / (points * 2) * Math.PI * 2 - Math.PI / 2;
      const x = Math.cos(a) * r, y = Math.sin(a) * r;
      if (i === 0) shape.moveTo(x, y); else shape.lineTo(x, y);
    }
    shape.closePath();
    return new T.ExtrudeGeometry(shape, { depth: 0.02, bevelEnabled: false });
  }

  function curvedHair(parent, points, r0, r1, material, segs) {
    const m = taperedTube(points, r0, r1, material, segs || 14, 6);
    m.castShadow = true;
    parent.add(m);
    outline(m, 1.035);
    return m;
  }

  function makeBow() {
    const g = new T.Group();
    const gold = toon('#a97732', { emissive: '#3b2109', emissiveIntensity: 0.2 });
    const glowMat = glow('#f5b94d', 0.08);
    const pts = [
      new T.Vector3(0, 0.6, 0),
      new T.Vector3(-0.08, 0.38, 0.02),
      new T.Vector3(-0.18, 0.05, 0.04),
      new T.Vector3(-0.17, -0.27, 0.04),
      new T.Vector3(-0.02, -0.6, 0)
    ];
    const bow = taperedTube(pts, 0.043, 0.016, gold, 20, 6);
    bow.castShadow = true;
    g.add(bow);
    const innerPts = pts.map(p => new T.Vector3(p.x + 0.035, p.y * 0.94, p.z + 0.015));
    const innerBow = taperedTube(innerPts, 0.012, 0.005, toon('#f9e2a6'), 20, 4);
    g.add(innerBow);
    const glowBow = taperedTube(pts, 0.035, 0.012, glowMat, 20, 5);
    g.add(glowBow);
    const stringPts = [new T.Vector3(0, 0.6, 0), new T.Vector3(-0.015, 0, 0), new T.Vector3(0, -0.6, 0)];
    const stringTube = taperedTube(stringPts, 0.006, 0.006, new T.MeshBasicMaterial({ color: '#fff6d9' }), 8, 3);
    g.add(stringTube);
    // nocked arrow, hidden until the draw phase
    const nock = new T.Group();
    nock.position.set(-0.02, 0.02, 0.02);
    const nockShaft = add(nock, new T.CylinderGeometry(0.012, 0.014, 0.62, 5), toon('#f2e6d2'), 0, 0, 0.27);
    nockShaft.rotation.x = Math.PI / 2;
    const nockTip = add(nock, new T.ConeGeometry(0.04, 0.13, 5), basic('#fff0c0'), 0, 0, 0.61);
    nockTip.rotation.x = Math.PI / 2;
    const nockFletch = add(nock, new T.ConeGeometry(0.055, 0.12, 4), toon('#ffcf75'), 0, 0, 0.02);
    nockFletch.rotation.x = -Math.PI / 2;
    nockFletch.scale.z = 0.4;
    const nockGlow = new T.Sprite(new T.SpriteMaterial({ map: STAR_TEX, color: 0xffdc86, transparent: true, opacity: 0.9, blending: T.AdditiveBlending, depthWrite: false }));
    nockGlow.scale.set(0.34, 0.34, 1);
    nockGlow.position.set(0, 0, 0.22);
    nock.add(nockGlow);
    nock.visible = false;
    g.add(nock);
    // grip & crystal
    const grip = add(g, new T.CylinderGeometry(0.052, 0.052, 0.19, 8), toon('#49304d'), -0.18, 0.03, 0.04);
    const crystal = add(g, new T.OctahedronGeometry(0.075, 0), new T.MeshBasicMaterial({ color: '#ffe6a0' }), -0.2, 0.23, 0.05);
    const cGlow = add(g, new T.OctahedronGeometry(0.16, 0), glow('#ffcf75', 0.45), -0.2, 0.23, 0.05);
    // tip ornaments
    [[0, 0.6, 0], [0, -0.6, 0]].forEach(p => {
      const star = add(g, starGeo(0.065, 0.025, 4), basic('#ffd88a'), p[0], p[1], p[2] + 0.01);
      star.rotation.z = 0.3;
    });
    g.userData.crystal = crystal;
    g.userData.nock = nock;
    g.userData.string = stringTube;
    return g;
  }

  function makeStaff() {
    const g = new T.Group();
    const shaft = add(g, new T.CylinderGeometry(0.021, 0.036, 1.45, 7), toon('#d7edf7'), 0, 0.15, 0);
    shaft.castShadow = true;
    outline(shaft, 1.06);
    const goldBand = add(g, new T.TorusGeometry(0.05, 0.012, 5, 12), toon('#e1b969', { emissive: '#6a3c12', emissiveIntensity: 0.4 }), 0, 0.53, 0);
    goldBand.rotation.x = Math.PI / 2;
    const orb = add(g, new T.IcosahedronGeometry(0.12, 1), new T.MeshBasicMaterial({ color: '#5bd8ec' }), 0, 0.86, 0);
    const shell = add(g, new T.IcosahedronGeometry(0.23, 1), glow('#5bd8ec', 0.22), 0, 0.86, 0);
    const ring = add(g, new T.TorusGeometry(0.26, 0.009, 5, 32), glow('#a8f4ff', 0.55), 0, 0.86, 0);
    ring.rotation.x = 1.0;
    const ring2 = add(g, new T.TorusGeometry(0.32, 0.006, 5, 32), glow('#b9a8ff', 0.3), 0, 0.86, 0);
    ring2.rotation.y = 0.7;
    const top = add(g, starGeo(0.08, 0.03, 4), basic('#f4fdff'), 0, 1.03, 0);
    top.rotation.z = 0.2;
    const flake = makeSnowflake(0.24, '#d4f8ff');
    flake.position.set(0, 1.16, 0.0);
    flake.rotation.x = -0.12;
    g.add(flake);
    const tassel = new T.Group();
    tassel.position.set(0.12, 0.86, 0.02);
    g.add(tassel);
    const tasselRib = add(tassel, new T.ConeGeometry(0.025, 0.28, 4), toon('#ff5d67'), 0, -0.12, 0);
    tasselRib.scale.z = 0.3;
    g.userData.orb = orb; g.userData.shell = shell; g.userData.ring = ring; g.userData.ring2 = ring2; g.userData.top = top; g.userData.flake = flake;
    return g;
  }

  function makeKatana(mirror) {
    const g = new T.Group();
    const shape = new T.Shape();
    shape.moveTo(0, 0);
    shape.lineTo(0.034, 0.06);
    shape.lineTo(0.042, 0.8);
    shape.lineTo(0.0, 0.98);
    shape.lineTo(-0.022, 0.8);
    shape.lineTo(-0.02, 0.1);
    shape.closePath();
    const geo = new T.ExtrudeGeometry(shape, { depth: 0.018, bevelEnabled: true, bevelSize: 0.006, bevelThickness: 0.004, bevelSegments: 1 });
    const bladeMat = pbr('#ffd8a8', { roughness: 0.22, metalness: 0.55, emissive: '#a33a12', emissiveIntensity: 0.32 });
    const blade = new T.Mesh(geo, bladeMat);
    blade.castShadow = true;
    g.add(blade);
    const edge = add(g, new T.BoxGeometry(0.006, 0.74, 0.026), glow('#ffb447', 0.85), 0.038, 0.42, 0.012);
    edge.rotation.z = -0.01;
    const guard = add(g, new T.CylinderGeometry(0.085, 0.085, 0.022, 8), toon('#d3ae67'), 0, 0.045, 0.008);
    guard.rotation.x = Math.PI / 2;
    const hilt = add(g, new T.CylinderGeometry(0.028, 0.032, 0.24, 7), toon('#3b2148'), 0.01, -0.1, 0.008);
    hilt.rotation.z = 0.06;
    const tassel = add(g, new T.ConeGeometry(0.035, 0.22, 4), toon('#5fd7c7'), 0.02, -0.3, 0.01);
    tassel.rotation.x = Math.PI;
    tassel.scale.z = 0.35;
    if (mirror) {
      g.scale.x = -1;
    }
    return g;
  }


  function makeCrescent(radius, tube, color) {
    const g = new T.Group();
    const mat = toon(color, { emissive: color, emissiveIntensity: 0.38 });
    const arc = new T.Mesh(new T.TorusGeometry(radius, tube, 5, 24, Math.PI * 1.35), mat);
    arc.rotation.z = -0.24;
    g.add(arc);
    const tip = add(g, new T.OctahedronGeometry(tube * 2.1, 0), basic('#fff0b8'), Math.cos(0.32) * radius, -Math.sin(0.32) * radius, 0);
    tip.scale.y = 1.5;
    return g;
  }

  function makeFoxSpirit() {
    const g = new T.Group();
    const fur = toon('#f2f5ff', { emissive: '#8797b8', emissiveIntensity: 0.12 });
    const furShade = toon('#c8d1ed');
    const inner = toon('#ffc4d8');
    const gold = toon('#e7b85c', { emissive: '#6a3f10', emissiveIntensity: 0.35 });
    const green = new T.MeshBasicMaterial({ color: '#3dff9a', transparent: true, opacity: 0.72, depthWrite: false, side: T.DoubleSide });
    const body = sphere(g, 0.27, fur, 0, 0.37, 0, 1.0, 0.94, 1.16, true);
    const chest = sphere(g, 0.14, furShade, 0, 0.34, 0.17, 1, 0.8, 0.55, false);
    const head = new T.Group();
    head.position.set(0, 0.7, 0.02);
    g.add(head);
    sphere(head, 0.205, fur, 0, 0, 0, 1, 0.98, 1, true);
    const muzzle = sphere(head, 0.075, basic('#ffffff'), 0, -0.035, 0.145, 1, 0.72, 0.7, false);
    const nose = add(head, new T.OctahedronGeometry(0.022, 0), basic('#6e5270'), 0, -0.015, 0.215);
    nose.scale.set(1.2, 0.8, 0.8);
    const ears = [];
    [-1, 1].forEach(side => {
      const ear = new T.Group();
      ear.position.set(side * 0.13, 0.17, 0.015);
      ear.rotation.z = side * 0.2;
      head.add(ear);
      const outer = add(ear, new T.ConeGeometry(0.095, 0.3, 4), fur, 0, 0.12, 0);
      outer.scale.z = 0.55;
      const inn = add(ear, new T.ConeGeometry(0.055, 0.19, 4), inner, 0, 0.1, 0.045);
      inn.scale.z = 0.35;
      ears.push(ear);
    });
    const eyes = [];
    [-1, 1].forEach(side => {
      const eye = new T.Group();
      eye.position.set(side * 0.075, 0.02, 0.155);
      head.add(eye);
      eyeShape(eye, 0, 0, 0, 0.042, 0.05, basic('#2a1730'));
      eyeShape(eye, 0, -0.002, 0.003, 0.034, 0.042, basic('#ff8b55'));
      eyeShape(eye, 0, -0.005, 0.006, 0.012, 0.026, basic('#2a1020'));
      eyeShape(eye, -0.012, 0.014, 0.008, 0.011, 0.014, basic('#ffffff'));
      eyes.push(eye);
    });
    const crescent = makeCrescent(0.075, 0.012, '#ffd36a');
    crescent.position.set(0, 0.105, 0.18);
    crescent.rotation.x = -0.15;
    head.add(crescent);
    // large curled tail
    const tailPts = [[0, 0.32, -0.2], [0.14, 0.22, -0.48], [0.36, 0.32, -0.6], [0.46, 0.52, -0.44], [0.34, 0.65, -0.24]];
    const tail = taperedTube(tailPts, 0.19, 0.04, fur, 18, 7);
    tail.castShadow = true;
    g.add(tail);
    const tailTip = taperedTube([[0.3, 0.52, -0.32], [0.28, 0.62, -0.2], [0.2, 0.66, -0.08]], 0.055, 0.018, furShade, 10, 5);
    g.add(tailTip);
    // green spirit flames
    const flames = [];
    [[-0.32, 0.82, -0.08, 1.0], [0.03, 0.94, -0.06, 1.25], [0.32, 0.78, -0.1, 0.9]].forEach((f, i) => {
      const flame = new T.Group();
      flame.position.set(f[0], f[1], f[2]);
      g.add(flame);
      const core = add(flame, new T.ConeGeometry(0.075 * f[3], 0.3 * f[3], 6), green, 0, 0, 0);
      core.rotation.x = Math.PI;
      const inner = add(flame, new T.ConeGeometry(0.028 * f[3], 0.14 * f[3], 6), glow('#d9ffe9', 0.7), 0, 0.01, 0);
      inner.rotation.x = Math.PI;
      flames.push(flame);
    });
    [-1, 1].forEach(side => {
      const paw = sphere(g, 0.065, fur, side * 0.13, 0.12, 0.17, 0.9, 0.6, 1.05, false);
    });
    g.userData = { body, head, ears, eyes, tail, tailTip, flames, baseY: 0 };
    return g;
  }

  function makeSnowSpirit() {
    const g = new T.Group();
    const cloth = toon('#87cdf0', { emissive: '#2c6d92', emissiveIntensity: 0.15 });
    const cloth2 = toon('#b9e8ff');
    const faceMat = basic('#f8fdff');
    const red = toon('#ff6a6a', { emissive: '#7a1e28', emissiveIntensity: 0.4 });
    const body = add(g, new T.ConeGeometry(0.27, 0.55, 20, 1, true), cloth, 0, 0.25, 0);
    body.rotation.x = Math.PI;
    const hood = sphere(g, 0.22, cloth2, 0, 0.47, 0, 1, 1.02, 0.95, true);
    const face = sphere(g, 0.155, faceMat, 0, 0.47, 0.13, 1, 1.08, 0.45, false);
    const eyes = [];
    [-1, 1].forEach(side => {
      const eye = new T.Group();
      eye.position.set(side * 0.055, 0.49, 0.23);
      g.add(eye);
      eyeShape(eye, 0, 0, 0, 0.022, 0.05, basic('#d9475a'));
      eyeShape(eye, 0, -0.012, 0.003, 0.011, 0.026, basic('#ff9d86'));
      eyes.push(eye);
    });
    const mouth = add(g, new T.BoxGeometry(0.03, 0.008, 0.006), basic('#5b4460'), 0, 0.41, 0.238);
    // little blue bow
    const bow = new T.Group();
    bow.position.set(0, 0.29, 0.22);
    g.add(bow);
    add(bow, new T.OctahedronGeometry(0.045, 0), toon('#4d8ec9'), 0, 0, 0);
    [-1, 1].forEach(side => {
      const wing = add(bow, new T.ConeGeometry(0.07, 0.15, 4), toon('#4d8ec9'), side * 0.07, 0, 0);
      wing.rotation.z = side * 1.5; wing.scale.z = 0.5;
    });
    const hands = [];
    [-1, 1].forEach(side => {
      const hand = sphere(g, 0.045, faceMat, side * 0.18, 0.2, 0.13, 0.85, 0.85, 0.8, false);
      hands.push(hand);
    });
    const flakes = [];
    for (let i = 0; i < 3; i++) {
      const flake = makeSnowflake(0.05, '#d9f8ff');
      flake.position.set((i - 1) * 0.22, 0.7 + i * 0.06, -0.05);
      g.add(flake);
      flakes.push(flake);
    }
    g.userData = { body, hood, face, eyes, hands, flakes, baseY: 0 };
    return g;
  }

  function makePhoenixChick() {
    const g = new T.Group();
    const orange = toon('#ffb347', { emissive: '#8a3e10', emissiveIntensity: 0.28 });
    const orangeDark = toon('#ff7a38', { emissive: '#7a2208', emissiveIntensity: 0.25 });
    const cream = toon('#fff0d8');
    const gold = toon('#ffd76c', { emissive: '#7a4c12', emissiveIntensity: 0.35 });
    const shell = add(g, new T.SphereGeometry(0.27, 18, 10, 0, Math.PI * 2, Math.PI * 0.48, Math.PI * 0.52), cream, 0, 0.22, 0);
    shell.scale.set(1.0, 1.15, 0.95);
    const body = sphere(g, 0.19, orange, 0, 0.34, 0, 1, 0.95, 1, true);
    const head = new T.Group();
    head.position.set(0, 0.56, 0.02);
    g.add(head);
    sphere(head, 0.145, orange, 0, 0, 0, 1, 1, 1, true);
    const beak = add(head, new T.ConeGeometry(0.055, 0.12, 4), gold, 0, -0.025, 0.15);
    beak.rotation.x = Math.PI / 2;
    const eyes = [];
    [-1, 1].forEach(side => {
      const eye = new T.Group();
      eye.position.set(side * 0.065, 0.03, 0.12);
      head.add(eye);
      eyeShape(eye, 0, 0, 0, 0.038, 0.05, basic('#3a2030'));
      eyeShape(eye, 0, -0.002, 0.003, 0.03, 0.04, basic('#f7e060'));
      eyeShape(eye, 0, -0.006, 0.006, 0.013, 0.025, basic('#2b1220'));
      eyes.push(eye);
    });
    const crest = [];
    [[-0.04, 0.16, 0.02, -0.25], [0.04, 0.17, 0.01, 0.2], [0, 0.2, -0.03, 0]].forEach(c => {
      const f = add(head, new T.ConeGeometry(0.045, 0.2, 6), orangeDark, c[0], c[1], c[2]);
      f.rotation.z = c[3]; f.rotation.x = -0.2;
      crest.push(f);
    });
    const wings = [];
    [-1, 1].forEach(side => {
      const wing = new T.Group();
      wing.position.set(side * 0.17, 0.36, 0);
      g.add(wing);
      for (let i = 0; i < 3; i++) {
        const feather = add(wing, new T.ConeGeometry(0.06, 0.28 - i * 0.05, 5), i === 1 ? gold : orangeDark, side * (0.1 + i * 0.06), 0.06 + i * 0.04, -0.02);
        feather.rotation.z = side * (0.7 + i * 0.3);
        feather.scale.z = 0.55;
        feather.rotation.x = -0.3;
      }
      wings.push(wing);
    });
    const flames = [];
    for (let i = 0; i < 3; i++) {
      const flame = new T.Group();
      flame.position.set((i - 1) * 0.14, 0.16 + (i % 2) * 0.03, -0.15);
      g.add(flame);
      const f = add(flame, new T.ConeGeometry(0.06, 0.22, 6), new T.MeshBasicMaterial({ color: '#ff8a2a', transparent: true, opacity: 0.75, depthWrite: false, side: T.DoubleSide }), 0, 0.07, 0);
      f.rotation.x = Math.PI;
      flames.push(flame);
    }
    g.userData = { head, wings, flames, crest, baseY: 0 };
    return g;
  }

  function makeSnowflake(radius, color) {
    const g = new T.Group();
    const mat = glow(color, 0.78);
    for (let i = 0; i < 6; i++) {
      const a = i / 6 * Math.PI * 2;
      const arm = add(g, new T.BoxGeometry(radius * 2, 0.008, 0.008), mat, 0, 0, 0);
      arm.rotation.z = a;
      const branch = add(g, new T.BoxGeometry(radius * 0.55, 0.006, 0.006), mat,
        Math.cos(a + Math.PI / 2) * radius * 0.55, Math.sin(a + Math.PI / 2) * radius * 0.55, 0);
      branch.rotation.z = a + Math.PI / 3.2;
    }
    return g;
  }

  /* =========================================================
     CHARACTER FACTORY
     ========================================================= */
  /* =========================================================
     SPIRIT TOWER MODELS
     Two non-human familiars built from the same toon toolkit.
     ========================================================= */
  function buildSpiritTower(type, level, options) {
    const def = D.TOWERS[type];
    const root = new T.Group();
    const bob = new T.Group();
    root.add(bob);
    const body = new T.Group();
    bob.add(body);
    const color = def.color;
    const main = toon(color, { emissive: color, emissiveIntensity: 0.12 });
    const dark = toon(def.color2 || '#352038', { emissive: def.color2 || '#352038', emissiveIntensity: 0.08 });
    const pale = toon(def.hairLight || '#ffe6b0');
    const eyeMat = new T.MeshBasicMaterial({ color: def.eye || '#fff3c0' });
    const parts = { root, bob, body, head: null, type, level, phase: RNG() * Math.PI * 2, attack: 0, attackDur: 0 };

    if (type === 'kirin') {
      const torso = add(body, new T.SphereGeometry(0.55, 16, 12), main, 0, 1.05, 0);
      torso.scale.set(1.45, 0.9, 1.9);
      outline(torso, 1.025, '#24131a');
      const chest = add(body, new T.SphereGeometry(0.34, 12, 8), pale, 0, 1.02, 0.62);
      chest.scale.set(1.2, 1.05, 0.55);
      const legs = [];
      [[-0.55, 0.62], [0.55, 0.62], [-0.55, -0.72], [0.55, -0.72]].forEach(([x, z], i) => {
        const leg = taperedTube([[x, 1.0, z], [x * 1.05, 0.45, z + 0.05], [x * 1.08, 0.08, z]], 0.13, 0.075, dark, 7, 5);
        body.add(leg);
        const hoof = add(body, new T.CylinderGeometry(0.09, 0.12, 0.16, 6), toon('#3b2018'), x * 1.08, 0.1, z);
        leg.userData.phase = i * Math.PI;
        legs.push(leg);
      });
      const neck = taperedTube([[0, 1.35, 0.55], [0, 1.7, 0.9], [0, 1.85, 1.05]], 0.28, 0.18, main, 9, 6);
      body.add(neck);
      const head = new T.Group();
      head.position.set(0, 1.92, 1.1);
      body.add(head);
      const skull = sphere(head, 0.32, main, 0, 0, 0, 1.05, 0.9, 1.25, true);
      const muzzle = add(head, new T.SphereGeometry(0.18, 12, 8), pale, 0, -0.05, 0.38);
      muzzle.scale.set(1.0, 0.7, 1.3);
      const snout = add(head, new T.ConeGeometry(0.1, 0.25, 7), dark, 0, -0.03, 0.52);
      snout.rotation.x = Math.PI / 2;
      [-1, 1].forEach(s => {
        const eye = add(head, new T.SphereGeometry(0.045, 8, 6), eyeMat, s * 0.18, 0.1, 0.32);
        eye.scale.set(1.2, 1.5, 0.55);
        const horn = add(head, new T.ConeGeometry(0.055, 0.72, 5), toon('#e6b95b'), s * 0.2, 0.48, -0.05);
        horn.rotation.z = -s * 0.35;
        horn.rotation.x = -0.25;
        if (level >= 2) {
          const horn2 = add(head, new T.ConeGeometry(0.035, 0.45, 4), toon('#ffe09a'), s * 0.34, 0.38, -0.1);
          horn2.rotation.z = -s * 0.65;
        }
      });
      const mane = new T.Group();
      mane.position.set(0, 1.58, 0.72);
      body.add(mane);
      for (let i = 0; i < 5; i++) {
        const a = (i - 2) * 0.28;
        const tuft = add(mane, new T.ConeGeometry(0.1, 0.55 + (i % 2) * 0.2, 5), glow(i % 2 ? '#ffce72' : '#ff7c46', 0.55), Math.sin(a) * 0.35, 0.05, Math.cos(a) * 0.05);
        tuft.rotation.z = a * 0.7;
        tuft.rotation.x = 0.8;
      }
      const tail = new T.Group();
      body.add(tail);
      const tailCurve = taperedTube([[0, 1.25, -0.9], [0, 1.55, -1.45], [0.1, 1.25, -1.8], [0.5, 1.5, -2.1]], 0.16, 0.025, glow('#ff8c3a', 0.6), 16, 6);
      tail.add(tailCurve);
      const flame = add(tail, new T.ConeGeometry(0.28, 0.9, 6), glow('#ffd06a', 0.55), 0.45, 1.65, -2.15);
      flame.rotation.z = -0.55;
      parts.tail = tail;
      parts.legs = legs;
      parts.head = head;
      parts.mane = mane;
      if (level >= 3) {
        const wings = new T.Group();
        wings.position.set(0, 1.55, -0.35);
        body.add(wings);
        [-1, 1].forEach(s => {
          const shape = new T.Shape();
          shape.moveTo(0, 0);
          shape.quadraticCurveTo(s * 0.9, 0.9, s * 1.6, 0.15);
          shape.quadraticCurveTo(s * 0.8, -0.1, 0, -0.25);
          const wing = new T.Mesh(new T.ShapeGeometry(shape), new T.MeshBasicMaterial({ color: '#ff7b3d', transparent: true, opacity: 0.55, side: T.DoubleSide, blending: T.AdditiveBlending, depthWrite: false }));
          wing.rotation.x = -0.2;
          wings.add(wing);
        });
        parts.wings = wings;
      }
      if (level >= 4) {
        const halo = add(body, new T.TorusGeometry(0.5, 0.025, 5, 40), glow('#ffe6a0', 0.8), 0, 2.55, 0.2);
        halo.rotation.x = Math.PI / 2;
        parts.halo = halo;
      }
      root.scale.setScalar(0.72);
    } else {
      const rootBody = add(body, new T.SphereGeometry(0.54, 16, 12), main, 0, 0.98, 0);
      rootBody.scale.set(1.0, 1.3, 1.0);
      outline(rootBody, 1.03, '#1c2a1c');
      const face = add(body, new T.SphereGeometry(0.28, 12, 8), pale, 0, 1.15, 0.46);
      face.scale.set(0.9, 1.1, 0.5);
      [-1, 1].forEach(s => {
        const eye = add(body, new T.SphereGeometry(0.06, 8, 6), eyeMat, s * 0.12, 1.18, 0.7);
        eye.scale.set(1.2, 1.5, 0.5);
        const pupil = add(body, new T.SphereGeometry(0.025, 6, 5), basic('#1a2418'), s * 0.12, 1.18, 0.75);
      });
      const mouth = add(body, new T.BoxGeometry(0.16, 0.02, 0.01), basic('#5c3a2b'), 0, 1.03, 0.71);
      const crown = new T.Group();
      crown.position.set(0, 1.55, 0);
      body.add(crown);
      for (let i = 0; i < 5; i++) {
        const a = (i - 2) * 0.42;
        const leaf = add(crown, new T.ConeGeometry(0.12, 0.55 + (i % 2) * 0.12, 5), toon(i % 2 ? '#79d98a' : '#b8f0a0'), Math.sin(a) * 0.3, 0.18, Math.cos(a) * 0.05);
        leaf.rotation.z = a * 0.55;
        leaf.rotation.x = -0.2;
      }
      const arms = [];
      [-1, 1].forEach(s => {
        const arm = taperedTube([[s * 0.35, 1.2, 0.2], [s * 0.65, 0.85, 0.35], [s * 0.55, 0.55, 0.3]], 0.08, 0.03, dark, 9, 5);
        body.add(arm);
        arms.push(arm);
      });
      const roots = [];
      for (let i = 0; i < 4; i++) {
        const a = i / 4 * Math.PI * 2 + 0.4;
        const r = taperedTube([[0, 0.7, 0], [Math.cos(a) * 0.45, 0.25, Math.sin(a) * 0.45], [Math.cos(a) * 0.65, 0.05, Math.sin(a) * 0.65]], 0.06, 0.015, dark, 8, 4);
        body.add(r);
        roots.push(r);
      }
      const berryGroup = new T.Group();
      berryGroup.position.set(-0.45, 1.35, 0.2);
      body.add(berryGroup);
      for (let i = 0; i < 3; i++) {
        const berry = add(berryGroup, new T.SphereGeometry(0.075, 8, 6), toon('#d94c56'), (i - 1) * 0.12, (i % 2) * 0.1, 0);
      }
      parts.arms = arms;
      parts.roots = roots;
      parts.head = face;
      parts.crown = crown;
      if (level >= 2) {
        const ring = add(body, new T.TorusGeometry(0.7, 0.02, 5, 40), glow('#8be8b0', 0.55), 0, 0.2, 0);
        ring.rotation.x = Math.PI / 2;
        parts.ring = ring;
      }
      if (level >= 3) {
        const aura = add(body, new T.TorusGeometry(0.9, 0.015, 4, 48), glow('#a4ffd0', 0.35), 0, 1.5, 0);
        aura.rotation.x = Math.PI / 2;
        parts.aura = aura;
      }
      if (level >= 4) {
        const halo = add(body, new T.TorusGeometry(0.62, 0.03, 5, 44), glow('#fff0aa', 0.8), 0, 1.95, 0);
        halo.rotation.x = Math.PI / 2;
        parts.halo = halo;
        const crownGold = add(body, new T.TorusGeometry(0.38, 0.025, 4, 32), glow('#ffe9a0', 0.7), 0, 1.72, 0);
        crownGold.rotation.x = Math.PI / 2;
      }
      root.scale.setScalar(0.68);
    }
    root.userData = { parts, type, level, attack: 0, attackDur: 0, phase: parts.phase };
    return root;
  }

  const CharacterFactory = {
    create(typeKey, level, options) {
      const def = D.TOWERS[typeKey];
      level = level || 1;
      const opts = options || {};
      if (typeKey === 'kirin' || typeKey === 'ginseng') return buildSpiritTower(typeKey, level, opts);
      const root = new T.Group();
      const bob = new T.Group();
      root.add(bob);
      const body = new T.Group();
      bob.add(body);
      const phase = RNG() * Math.PI * 2;
      const parts = { root, bob, body, level, phase, type: typeKey };

      const skinMat = toon(def.skin, { emissive: '#3a1a20', emissiveIntensity: 0.04 });
      const hairMat = toon(def.hair, { emissive: def.hairDark, emissiveIntensity: 0.08 });
      const hairDarkMat = toon(def.hairDark, { emissive: def.hairDark, emissiveIntensity: 0.05 });
      const hairLightMat = toon(def.hairLight, { emissive: def.hairLight, emissiveIntensity: 0.12 });
      const outfitMat = toon(def.outfit);
      const outfit2Mat = toon(def.outfit2);
      const sleeveMat = toon(typeKey === 'blade' ? def.outfit2 : def.outfit, { side: T.DoubleSide });
      const accentMat = toon(def.accent, { emissive: def.accent, emissiveIntensity: 0.32 });
      const darkMat = toon('#24182e');

      /* --- legs --- */
      const legs = new T.Group();
      body.add(legs);
      [-1, 1].forEach(side => {
        const hip = new T.Group();
        hip.position.set(side * 0.105, 0.86, 0);
        legs.add(hip);
        const thigh = capsule(hip, 0.065, 0.3, skinMat, 0, -0.22, 0);
        const bootTop = capsule(hip, 0.073, 0.18, darkMat, 0, -0.52, 0.01);
        const boot = add(hip, new T.CylinderGeometry(0.093, 0.075, 0.16, 8), darkMat, 0, -0.7, 0.02);
        outline(boot, 1.07);
        const trim = add(hip, new T.TorusGeometry(0.082, 0.012, 5, 12), accentMat, 0, -0.6, 0.01);
        trim.rotation.x = Math.PI / 2;
        const foot = add(hip, new T.SphereGeometry(0.09, 10, 8), darkMat, 0, -0.79, 0.055);
        foot.scale.set(0.92, 0.5, 1.45);
        hip.userData.side = side;
      });

      /* --- skirt --- */
      const skirtMat = toon(def.outfit, { side: T.DoubleSide });
      const skirt = makeAlineSkirt(0.165, typeKey === 'mage' ? 0.41 : typeKey === 'blade' ? 0.34 : 0.37, 0.92, typeKey === 'mage' ? 0.48 : 0.62, skirtMat, 72);
      body.add(skirt);
      const hemY = typeKey === 'mage' ? 0.48 : 0.62;
      const hemR = typeKey === 'mage' ? 0.41 : typeKey === 'blade' ? 0.34 : 0.37;
      const hem = add(body, new T.TorusGeometry(hemR, 0.014, 5, 40), accentMat, 0, hemY, 0);
      hem.rotation.x = Math.PI / 2;
      hem.scale.z = 0.98;
      const underColor = typeKey === 'archer' ? '#3f3560' : typeKey === 'mage' ? '#ff6f6f' : '#d79a46';
      const hemBand = add(body, new T.TorusGeometry(hemR * 1.005, 0.018, 5, 44), toon(underColor, { emissive: underColor, emissiveIntensity: 0.18 }), 0, hemY - 0.012, 0);
      hemBand.rotation.x = Math.PI / 2;
      hemBand.scale.z = 0.98;
      if (typeKey !== 'mage') {
        const inner = makeAlineSkirt(0.15, 0.27, 0.9, 0.58, toon('#f1e5dd', { side: T.DoubleSide }), 48);
        body.add(inner);
      }

      /* --- torso --- */
      const torso = new T.Group();
      body.add(torso);
      const prof = [];
      const torsoProfile = [
        [0.115, 0.86], [0.15, 0.91], [0.175, 1.02], [0.155, 1.15],
        [0.145, 1.24], [0.195, 1.32], [0.16, 1.39], [0.09, 1.42]
      ];
      torsoProfile.forEach(p => prof.push(new T.Vector2(p[0], p[1])));
      const torsoMesh = add(torso, new T.LatheGeometry(prof, 20), outfitMat, 0, 0, 0);
      outline(torsoMesh, 1.03);
      // chest stays tasteful; a small bodice panel
      const panel = add(torso, new T.CylinderGeometry(0.11, 0.13, 0.22, 12), outfit2Mat, 0, 1.16, 0.09);
      panel.scale.z = 0.62;
      const corsetColor = typeKey === 'archer' ? '#3f3560' : typeKey === 'mage' ? '#5f9fc4' : '#b8792e';
      const corsetMat = toon(corsetColor, { side: T.DoubleSide, emissive: corsetColor, emissiveIntensity: 0.08 });
      const corset = add(torso, new T.CylinderGeometry(0.17, 0.142, 0.3, 18, 1, true), corsetMat, 0, 1.03, 0.005);
      corset.scale.z = 0.82;
      outline(corset, 1.012);
      const busk = add(torso, new T.BoxGeometry(0.024, 0.27, 0.012), toon('#e2bc77', { emissive: '#5d3a12', emissiveIntensity: 0.45 }), 0, 1.04, 0.155);
      const cTrimTop = add(torso, new T.TorusGeometry(0.168, 0.012, 4, 22), accentMat, 0, 1.18, 0);
      cTrimTop.rotation.x = Math.PI / 2;
      const cTrimBot = add(torso, new T.TorusGeometry(0.146, 0.012, 4, 22), accentMat, 0, 0.88, 0);
      cTrimBot.rotation.x = Math.PI / 2;
      // collar & bow
      const collar = add(torso, new T.TorusGeometry(0.1, 0.018, 5, 18), darkMat, 0, 1.4, 0);
      collar.rotation.x = Math.PI / 2;
      const bow = new T.Group();
      bow.position.set(0, 1.3, 0.16);
      const knot = add(bow, new T.OctahedronGeometry(0.045, 0), accentMat, 0, 0, 0);
      [-1, 1].forEach(s => {
        const wing = add(bow, new T.ConeGeometry(0.075, 0.14, 4), accentMat, s * 0.075, 0.015, 0);
        wing.rotation.z = s * 1.7;
        wing.scale.z = 0.45;
      });
      body.add(bow);
      const belt = add(torso, new T.TorusGeometry(0.152, 0.014, 5, 24), accentMat, 0, 0.96, 0);
      belt.rotation.x = Math.PI / 2;
      const gem = add(torso, new T.OctahedronGeometry(0.045, 0), new T.MeshBasicMaterial({ color: def.accent }), 0, 1.145, 0.145);
      gem.scale.y = 1.4;
      if (typeKey === 'archer') {
        const chestCrescent = makeCrescent(0.085, 0.012, '#ffd36a');
        chestCrescent.position.set(0, 1.07, 0.165);
        chestCrescent.rotation.x = -0.12;
        torso.add(chestCrescent);
        parts.chestCrescent = chestCrescent;
      }
      const laceMat = toon(def.outfit2);
      for (let i = 0; i < 3; i++) {
        const lace = add(torso, new T.BoxGeometry(0.09, 0.012, 0.012), laceMat, 0, 1.05 + i * 0.045, 0.142);
        lace.rotation.z = i % 2 ? 0.35 : -0.35;
      }
      const collarGem = add(torso, new T.OctahedronGeometry(0.035, 0), new T.MeshBasicMaterial({ color: def.accent }), 0, 1.3, 0.17);
      collarGem.scale.y = 1.3;
      const ribbon = taperedTube([[0.02, 1.27, 0.1], [0.12, 1.08, 0.03], [0.1, 0.83, -0.05]], 0.035, 0.008, accentMat, 10, 5);
      body.add(ribbon);
      const ribbon2 = taperedTube([[-0.02, 1.27, 0.1], [-0.12, 1.06, 0.02], [-0.08, 0.8, -0.06]], 0.03, 0.006, accentMat, 10, 5);
      body.add(ribbon2);
      const sash = taperedTube([[0.14, 0.95, 0.02], [0.28, 0.75, -0.05], [0.22, 0.5, -0.10]], 0.05, 0.012, toon(corsetColor), 12, 5);
      body.add(sash);

      /* --- neck & head --- */
      const neck = add(body, new T.CylinderGeometry(0.065, 0.075, 0.12, 8), skinMat, 0, 1.44, 0);
      outline(neck, 1.06);
      const head = new T.Group();
      head.position.set(0, 1.72, 0);
      body.add(head);
      parts.head = head;
      head.position.y = 1.76;
      head.scale.setScalar(0.85);
      const skull = sphere(head, 0.35, skinMat, 0, 0, 0, 1, 0.99, 0.95, true);
      parts.skull = skull;
      // ears hidden by hair; tiny
      /* --- face --- */
      const face = new T.Group();
      head.add(face);
      const eyeWhite = basic('#fffaf4');
      const irisMat = basic(def.eye);
      const irisDark = basic(def.eye === '#f9a84b' ? '#a84d19' : def.eye === '#63d9ff' ? '#267eae' : '#a92d6c');
      const pupilMat = basic('#1b1222');
      const lashMat = basic('#2a1525');
      [-1, 1].forEach(side => {
        const eye = new T.Group();
        eye.position.set(side * 0.12, -0.026, 0.329);
        eye.rotation.z = side * 0.055;
        face.add(eye);
        eyeShape(eye, 0, 0, 0, 0.081, 0.105, lashMat);
        eyeShape(eye, 0, 0.003, 0.002, 0.071, 0.093, eyeWhite);
        eyeShape(eye, 0, -0.009, 0.004, 0.06, 0.081, irisMat);
        eyeShape(eye, 0, -0.015, 0.006, 0.031, 0.052, irisDark);
        eyeShape(eye, 0, -0.009, 0.008, 0.017, 0.03, pupilMat);
        const hi = eyeShape(eye, -0.021, 0.027, 0.011, 0.02, 0.026, basic('#ffffff'));
        const hi2 = eyeShape(eye, 0.022, -0.037, 0.011, 0.011, 0.016, basic('#f5fbff'));
        hi.material.transparent = true; hi.material.opacity = 0.95;
        hi2.material.transparent = true; hi2.material.opacity = 0.8;
        const lid = eyeShape(eye, 0, 0.057, 0.014, 0.076, 0.023, lashMat);
        lid.rotation.z = side * 0.02;
        const lash = new T.Mesh(new T.TorusGeometry(0.08, 0.008, 4, 18, Math.PI * 0.82), lashMat);
        lash.position.set(0, 0.041, 0.016);
        lash.rotation.z = side === -1 ? 0.1 : Math.PI - 0.1;
        lash.scale.y = 0.64;
        eye.add(lash);
        const flick = taperedTube([
          new T.Vector3(side * 0.068, 0.054, 0.018),
          new T.Vector3(side * 0.094, 0.071, 0.02),
          new T.Vector3(side * 0.11, 0.064, 0.018)
        ], 0.008, 0.002, lashMat, 5, 3);
        eye.add(flick);
        const browPts = [
          new T.Vector3(side * 0.06, 0.15, 0.318),
          new T.Vector3(side * 0.126, 0.16, 0.298),
          new T.Vector3(side * 0.185, 0.143, 0.262)
        ];
        const brow = taperedTube(browPts, 0.0065, 0.0025, hairDarkMat, 6, 4);
        face.add(brow);
      });
      // blush
      [-1, 1].forEach(side => {
        const blush = eyeShape(face, side * 0.215, -0.088, 0.268, 0.05, 0.019, new T.MeshBasicMaterial({ color: '#ff9bb5', transparent: true, opacity: 0.28 }));
        blush.rotation.y = side * 0.52;
      });
      // nose & mouth
      const nose = add(face, new T.SphereGeometry(0.016, 6, 5), basic('#e8b4a4'), 0, -0.078, 0.334);
      nose.scale.set(0.8, 0.6, 0.5);
      const mouthPts = [new T.Vector3(-0.032, -0.162, 0.324), new T.Vector3(0, -0.172, 0.328), new T.Vector3(0.032, -0.162, 0.324)];
      const mouth = taperedTube(mouthPts, 0.007, 0.004, basic('#9e3f58'), 6, 4);
      face.add(mouth);

      /* --- hair --- */
      const hair = new T.Group();
      head.add(hair);
      // back volume
      const backHair = sphere(hair, 0.375, hairMat, 0, -0.02, -0.13, 1.05, 1.02, 0.84, true);
      backHair.castShadow = true;
      // top cap
      const cap = add(hair, new T.SphereGeometry(0.388, 28, 16, 0, Math.PI * 2, 0, Math.PI * 0.38), hairMat, 0, 0.012, 0);
      // bangs
      const bangSets = [
        { pts: [[0.0, 0.31, 0.14], [0.015, 0.23, 0.31], [0.02, 0.125, 0.365]], r: 0.09 },
        { pts: [[-0.055, 0.315, 0.12], [-0.13, 0.235, 0.3], [-0.19, 0.135, 0.338]], r: 0.085 },
        { pts: [[0.055, 0.315, 0.12], [0.135, 0.235, 0.3], [0.195, 0.14, 0.333]], r: 0.085 },
        { pts: [[-0.17, 0.3, 0.085], [-0.255, 0.215, 0.25], [-0.305, 0.11, 0.28]], r: 0.075 },
        { pts: [[0.17, 0.3, 0.085], [0.26, 0.215, 0.25], [0.31, 0.115, 0.275]], r: 0.075 },
        { pts: [[-0.095, 0.315, 0.11], [-0.055, 0.245, 0.325], [-0.015, 0.175, 0.36]], r: 0.06 }
      ];
      bangSets.forEach((b, i) => {
        const strand = taperedTube(b.pts, b.r, 0.018, i === 0 ? hairLightMat : hairMat, 14, 6);
        strand.castShadow = true;
        hair.add(strand);
      });
      // side locks
      [-1, 1].forEach(side => {
        const lock = new T.Group();
        lock.position.set(side * 0.3, 0.15, 0.06);
        hair.add(lock);
        const strand = taperedTube([[0, 0, 0], [side * 0.05, -0.2, 0.075], [side * 0.02, -0.38, 0.055], [side * 0.06, -0.49, 0.02]], 0.075, 0.018, hairMat, 12, 6);
        strand.castShadow = true;
        lock.add(strand);
        lock.userData.side = side;
        if (!parts.sideLocks) parts.sideLocks = [];
        parts.sideLocks.push(lock);
      });

      // type-specific hair tails
      parts.tails = [];
      if (typeKey === 'archer') {
        [-1, 1].forEach(side => {
          const pivot = new T.Group();
          pivot.position.set(side * 0.31, 0.1, -0.04);
          hair.add(pivot);
          const pts = [
            [0, 0, 0], [side * 0.1, -0.18, -0.04], [side * 0.2, -0.45, -0.03],
            [side * 0.15, -0.66, 0.02], [side * 0.23, -0.82, 0.03], [side * 0.18, -0.94, 0.02]
          ];
          const tail = taperedTube(pts, 0.145, 0.03, hairMat, 18, 7);
          tail.castShadow = true;
          pivot.add(tail);
          const hl = taperedTube([[side * 0.03, -0.02, 0.04], [side * 0.15, -0.3, 0.02], [side * 0.16, -0.58, 0.05], [side * 0.2, -0.78, 0.06]], 0.026, 0.004, hairLightMat, 12, 5);
          pivot.add(hl);
          // ribbons
          const rib = add(pivot, new T.ConeGeometry(0.075, 0.26, 4), accentMat, side * 0.045, -0.05, -0.02);
          rib.rotation.z = side * 0.4; rib.scale.z = 0.4;
          const rib2 = add(pivot, new T.ConeGeometry(0.06, 0.2, 4), toon(def.color2), side * 0.09, -0.11, -0.03);
          rib2.rotation.z = -side * 0.5; rib2.scale.z = 0.4;
          parts.tails.push(pivot);
        });
      } else if (typeKey === 'mage') {
        for (let i = 0; i < 5; i++) {
          const side = i < 2 ? -1 : i > 2 ? 1 : 0;
          const pivot = new T.Group();
          pivot.position.set(side * 0.2 + (i - 2) * 0.03, 0.05, -0.22);
          hair.add(pivot);
          const len = 0.72 + (i % 3) * 0.1;
          const pts = [
            [0, 0, 0], [side * 0.02, -len * 0.3, -0.1], [side * 0.07, -len * 0.7, -0.12], [side * 0.03, -len, -0.05]
          ];
          const strand = taperedTube(pts, 0.115, 0.024, hairMat, 16, 6);
          strand.castShadow = true;
          pivot.add(strand);
          const hl = taperedTube([[0.02, -0.02, 0.03], [0.04, -len * 0.45, 0.02], [0.02, -len * 0.8, 0.05]], 0.022, 0.003, hairLightMat, 10, 4);
          pivot.add(hl);
          parts.tails.push(pivot);
        }
        // mage side buns with red ties
        [-1, 1].forEach(side => {
          const bun = sphere(hair, 0.105, hairMat, side * 0.29, 0.2, -0.03, 1, 1.05, 1, true);
          const tie = add(hair, new T.TorusGeometry(0.075, 0.014, 4, 14), accentMat, side * 0.29, 0.16, -0.02);
          tie.rotation.x = Math.PI / 2;
          tie.rotation.z = side * 0.1;
        });
      } else {
        // high ponytail
        const pivot = new T.Group();
        pivot.position.set(0, 0.33, -0.22);
        hair.add(pivot);
        const pts = [
          [0, 0, 0], [0, 0.08, -0.18], [0.03, -0.02, -0.36], [-0.02, -0.3, -0.3], [0.04, -0.62, -0.2], [0.03, -0.9, -0.12]
        ];
        const tail = taperedTube(pts, 0.125, 0.022, hairMat, 20, 7);
        tail.castShadow = true;
        pivot.add(tail);
        const hl = taperedTube([[0.02, 0.03, -0.03], [0.03, 0.0, -0.24], [0.0, -0.34, -0.27], [0.03, -0.66, -0.17]], 0.026, 0.004, hairLightMat, 14, 5);
        pivot.add(hl);
        const tie = add(pivot, new T.TorusGeometry(0.075, 0.022, 5, 12), accentMat, 0, 0.02, -0.02);
        tie.rotation.x = Math.PI / 2.4;
        parts.tails.push(pivot);
      }

      // hair ornament
      const orn = new T.Group();
      orn.position.set(-0.28, 0.22, 0.08);
      hair.add(orn);
      if (typeKey === 'archer') {
        const crescent = makeCrescent(0.07, 0.011, '#ffd36a');
        crescent.position.set(0, 0, 0);
        orn.add(crescent);
        const ring = add(orn, new T.TorusGeometry(0.1, 0.007, 4, 16), glow('#ffd57c', 0.5), 0, 0, -0.02);
        parts.hairCrescent = crescent;
      } else if (typeKey === 'mage') {
        const crystal = add(orn, new T.OctahedronGeometry(0.07, 0), new T.MeshBasicMaterial({ color: '#f5fdff' }), 0, 0, 0);
        crystal.scale.y = 1.5;
        const ring = add(orn, new T.TorusGeometry(0.1, 0.006, 4, 18), glow('#ff8c8c', 0.5), 0, 0, -0.01);
        const snow = makeSnowflake(0.11, '#d8f8ff');
        snow.position.set(0, 0.02, 0.03);
        orn.add(snow);
        parts.hairSnow = snow;
      } else {
        const feathers = new T.Group();
        orn.add(feathers);
        for (let i = 0; i < 3; i++) {
          const f = add(feathers, new T.ConeGeometry(0.045, 0.28 - i * 0.045, 5), i === 1 ? toon('#ffd36a', { emissive: '#7a4a10', emissiveIntensity: 0.35 }) : toon('#ff7a4a', { emissive: '#7a240c', emissiveIntensity: 0.25 }), 0.06 + i * 0.03, 0.06 + i * 0.04, -0.02);
          f.rotation.z = -0.55 - i * 0.18;
          f.rotation.x = -0.2;
          f.scale.z = 0.5;
        }
        const ring = add(orn, new T.TorusGeometry(0.085, 0.008, 4, 18, Math.PI * 1.5), glow('#6fe6d4', 0.5), 0, 0, 0);
        ring.rotation.z = 0.6;
        parts.hairFlames = feathers;
      }

      /* --- type-specific spirit features --- */
      if (typeKey === 'archer') {
        const ears = [];
        [-1, 1].forEach(side => {
          const ear = new T.Group();
          ear.position.set(side * 0.205, 0.255, 0.005);
          ear.rotation.z = side * -0.22;
          ear.userData.side = side;
          head.add(ear);
          const outer = add(ear, new T.ConeGeometry(0.085, 0.27, 4), hairMat, 0, 0.13, 0);
          outer.scale.z = 0.55;
          outline(outer, 1.035);
          const inner = add(ear, new T.ConeGeometry(0.046, 0.17, 4), toon('#ffb8ce'), 0, 0.115, 0.035);
          inner.scale.z = 0.35;
          ears.push(ear);
        });
        parts.ears = ears;
        if (level >= 2) {
          const mask = new T.Group();
          mask.position.set(-0.34, 0.03, 0.12);
          mask.rotation.set(0.05, 0.55, -0.08);
          head.add(mask);
          const face = sphere(mask, 0.145, toon('#f8f5ff'), 0, 0, 0, 1, 0.9, 0.4, false);
          [-1, 1].forEach(side => {
            const me = add(mask, new T.ConeGeometry(0.045, 0.13, 4), toon('#f8f5ff'), side * 0.09, 0.11, 0);
            me.rotation.z = side * -0.35;
            me.scale.z = 0.5;
            const eye = add(mask, new T.BoxGeometry(0.045, 0.016, 0.01), glow('#ff8b55', 0.8), side * 0.055, 0.015, 0.055);
            eye.rotation.z = side * 0.18;
          });
          const mark = makeCrescent(0.045, 0.007, '#ffd36a');
          mark.position.set(0, -0.04, 0.06);
          mask.add(mark);
          parts.foxMask = mask;
        }
      } else if (typeKey === 'mage') {
        parts.ribbons = [];
        parts.ribbonBows = [];
        [-1, 1].forEach(side => {
          const rib = taperedTube([[side * 0.26, 0.12, 0.02], [side * 0.42, -0.18, 0.05], [side * 0.34, -0.5, 0.08], [side * 0.42, -0.8, 0.04]], 0.07, 0.016, accentMat, 16, 5);
          rib.scale.z = 0.34;
          rib.castShadow = true;
          hair.add(rib);
          parts.ribbons.push(rib);
          const bow = new T.Group();
          bow.position.set(side * 0.22, 0.18, 0.16);
          head.add(bow);
          add(bow, new T.OctahedronGeometry(0.035, 0), accentMat, 0, 0, 0);
          [-1, 1].forEach(s => {
            const w = add(bow, new T.ConeGeometry(0.06, 0.12, 4), accentMat, s * 0.06, 0, 0);
            w.rotation.z = s * 1.35; w.scale.z = 0.4;
          });
          parts.ribbonBows.push(bow);
        });
      } else {
        const horns = [];
        [-1, 1].forEach(side => {
          const horn = add(head, new T.ConeGeometry(0.035, 0.16, 5), toon('#fff6e8'), side * 0.19, 0.29, -0.01);
          horn.rotation.z = side * -0.3;
          horn.rotation.x = -0.15;
          horns.push(horn);
        });
        parts.horns = horns;
      }

      /* --- arms --- */
      const arms = {};
      [-1, 1].forEach(side => {
        const shoulder = new T.Group();
        shoulder.position.set(side * 0.205, 1.345, 0.01);
        body.add(shoulder);
        // fitted shoulder and sleeve
        const sleeve = sphere(shoulder, 0.067, outfitMat, 0, 0.0, 0, 1, 0.78, 0.92, true);
        const armCloth = outfit2Mat;
        const upper = capsule(shoulder, 0.047, 0.2, armCloth, 0, -0.13, 0);
        const elbow = new T.Group();
        elbow.position.set(0, -0.255, 0);
        shoulder.add(elbow);
        const fore = capsule(elbow, 0.04, 0.165, skinMat, 0, -0.1, 0);
        const bracerMat = typeKey === 'archer' ? outfit2Mat : typeKey === 'mage' ? accentMat : toon('#5fd7c7');
        const bracer = add(elbow, new T.CylinderGeometry(0.055, 0.047, 0.11, 7), bracerMat, 0, -0.15, 0);
        const cuff = add(elbow, new T.TorusGeometry(0.047, 0.011, 4, 12), accentMat, 0, -0.195, 0);
        cuff.rotation.x = Math.PI / 2;
        const hand = new T.Group();
        hand.position.set(0, -0.225, 0.01);
        elbow.add(hand);
        const palm = sphere(hand, 0.05, skinMat, 0, 0, 0, 0.8, 1, 0.8, false);
        shoulder.rotation.z = side * 0.18;
        shoulder.rotation.x = -0.02;
        elbow.rotation.x = -0.12;
        arms[side === -1 ? 'left' : 'right'] = { shoulder, elbow, hand };
      });
      parts.arms = arms;

      /* --- weapon --- */
      let weaponGroup = null;
      if (typeKey === 'archer') {
        weaponGroup = makeBow();
        weaponGroup.position.set(-0.47, 1.02, 0.29);
        weaponGroup.rotation.set(0.04, 0.26, 0.12);
        weaponGroup.scale.setScalar(1.18);
        body.add(weaponGroup);
        arms.left.shoulder.rotation.x = -0.22;
        arms.left.shoulder.rotation.z = -0.18;
        arms.left.elbow.rotation.x = -0.2;
        arms.right.shoulder.rotation.x = -0.1;
        arms.right.shoulder.rotation.z = 0.08;
        arms.right.elbow.rotation.x = -0.32;
      } else if (typeKey === 'mage') {
        weaponGroup = makeStaff();
        weaponGroup.position.set(0.5, 0.94, 0.27);
        weaponGroup.rotation.z = -0.05;
        weaponGroup.scale.setScalar(1.04);
        body.add(weaponGroup);
        arms.right.shoulder.rotation.x = -0.12;
        arms.right.shoulder.rotation.z = 0.13;
        arms.right.elbow.rotation.x = -0.3;
        arms.left.shoulder.rotation.x = -0.08;
        arms.left.elbow.rotation.x = -0.2;
      } else {
        const bladeL = makeKatana(false);
        bladeL.position.set(-0.47, 1.0, 0.18);
        bladeL.rotation.set(0.04, -0.28, 0.52);
        body.add(bladeL);
        const bladeR = makeKatana(true);
        bladeR.position.set(0.47, 1.0, 0.18);
        bladeR.rotation.set(0.04, 0.28, -0.52);
        body.add(bladeR);
        weaponGroup = new T.Group();
        weaponGroup.add(bladeL, bladeR);
        body.add(weaponGroup);
        weaponGroup.userData.left = bladeL;
        weaponGroup.userData.right = bladeR;
        parts.bladeBase = {
          left: { pos: bladeL.position.clone(), rot: bladeL.rotation.clone() },
          right: { pos: bladeR.position.clone(), rot: bladeR.rotation.clone() }
        };
        arms.left.shoulder.rotation.x = -0.1;
        arms.left.shoulder.rotation.z = -0.2;
        arms.left.elbow.rotation.x = -0.24;
        arms.right.shoulder.rotation.x = -0.1;
        arms.right.shoulder.rotation.z = 0.2;
        arms.right.elbow.rotation.x = -0.24;
      }
      parts.weapon = weaponGroup;
      if (weaponGroup && weaponGroup.userData.nock) { parts.nock = weaponGroup.userData.nock; parts.bowString = weaponGroup.userData.string; }
      if (weaponGroup && weaponGroup.userData.flake) parts.staffFlake = weaponGroup.userData.flake;
      if (weaponGroup) {
        parts.weaponBase = {
          pos: weaponGroup.position.clone(),
          rot: weaponGroup.rotation.clone(),
          scale: weaponGroup.scale.clone()
        };
      }
      if (weaponGroup && weaponGroup.userData.crystal) parts.weaponCrystal = weaponGroup.userData.crystal;
      if (weaponGroup && weaponGroup.userData.orb) {
        parts.orb = weaponGroup.userData.orb;
        parts.orbShell = weaponGroup.userData.shell;
        parts.orbRing = weaponGroup.userData.ring;
        parts.orbRing2 = weaponGroup.userData.ring2;
        parts.orbTop = weaponGroup.userData.top;
      }

      /* --- accessories / cape --- */
      if (typeKey === 'mage') {
        const capeMat = new T.MeshToonMaterial({ color: '#b9e9ff', transparent: true, opacity: 0.55, side: T.DoubleSide, gradientMap: TOON_GRADIENT });
        const cape = new T.Mesh(new T.PlaneGeometry(0.65, 1.15, 8, 10), capeMat);
        cape.position.set(0, 1.0, -0.22);
        cape.rotation.x = -0.2;
        const cp = cape.geometry.attributes.position;
        for (let i = 0; i < cp.count; i++) {
          const x = cp.getX(i), y = cp.getY(i);
          cp.setZ(i, Math.sin(x * 8) * 0.03 + Math.cos(y * 4) * 0.02);
        }
        cp.needsUpdate = true;
        cape.geometry.computeVertexNormals();
        body.add(cape);
        parts.cape = cape;
        // shoulder crystals awaken at stage II
        if (level >= 2) {
          [-1, 1].forEach(s => {
            const pauldron = add(body, new T.OctahedronGeometry(0.1, 0), new T.MeshBasicMaterial({ color: '#bdf7ff' }), s * 0.28, 1.38, 0);
            pauldron.scale.y = 1.5;
            const ring = add(body, new T.TorusGeometry(0.11, 0.007, 4, 14), glow('#84eaff', 0.55), s * 0.28, 1.38, 0);
            ring.rotation.y = 0.5;
          });
        }
      } else if (typeKey === 'archer') {
        if (level >= 2) {
          [-1, 1].forEach(side => {
            const pauldron = add(body, new T.ConeGeometry(0.13, 0.18, 5), toon(def.outfit2, { side: T.DoubleSide }), side * 0.25, 1.37, 0);
            pauldron.rotation.z = side * -0.32;
            pauldron.scale.z = 0.58;
            const crest = add(body, new T.TorusGeometry(0.085, 0.008, 4, 16, Math.PI * 1.2), glow('#ffd36a', 0.5), side * 0.25, 1.37, 0.02);
            crest.rotation.z = side * 0.4;
          });
        }
        // hip quiver with arrows
        const quiver = new T.Group();
        quiver.position.set(0.3, 0.95, -0.2);
        quiver.rotation.z = -0.25;
        body.add(quiver);
        const tube = add(quiver, new T.CylinderGeometry(0.075, 0.06, 0.5, 8), toon('#6b3d2f'), 0, 0, 0);
        outline(tube, 1.07);
        for (let i = 0; i < 3; i++) {
          const shaft = add(quiver, new T.CylinderGeometry(0.009, 0.009, 0.65, 5), toon('#e8cf9f'), (i - 1) * 0.04, 0.2, 0);
          const fletch = add(quiver, new T.ConeGeometry(0.038, 0.12, 4), accentMat, (i - 1) * 0.04, 0.52, 0);
          fletch.scale.z = 0.4;
        }
      } else {
        // waist sash tails
        for (let i = -1; i <= 1; i += 2) {
          const sash = taperedTube([[i * 0.12, 0.9, -0.1], [i * 0.22, 0.7, -0.16], [i * 0.18, 0.46, -0.14]], 0.035, 0.008, accentMat, 10, 5);
          body.add(sash);
        }
        // shoulder pauldrons awaken at stage II
        if (level >= 2) {
          [-1, 1].forEach(side => {
            const pauldron = add(body, new T.ConeGeometry(0.15, 0.2, 6), toon('#d79a46', { emissive: '#6a3c10', emissiveIntensity: 0.25 }), side * 0.25, 1.36, 0);
            pauldron.rotation.z = side * -0.3;
            pauldron.scale.z = 0.6;
            outline(pauldron, 1.05);
            const ring = add(body, new T.TorusGeometry(0.1, 0.008, 4, 14), glow('#5fd7c7', 0.45), side * 0.25, 1.3, 0);
            ring.rotation.y = 0.5;
          });
        }
      }

      /* --- stage mantle / divine drape --- */
      if (level >= 2) {
        const mantle = new T.Group();
        body.add(mantle);
        mantle.position.set(0, 1.3, -0.15);
        parts.mantle = mantle;
        if (typeKey === 'archer') {
          const mat = toon(def.outfit, { side: T.DoubleSide, transparent: true, opacity: 0.9 });
          [-1, 1].forEach(side => {
            const panel = new T.Mesh(new T.PlaneGeometry(0.26, 0.45, 2, 4), mat);
            panel.position.set(side * 0.3, -0.1, -0.3);
            panel.rotation.z = side * -0.16;
            panel.rotation.y = side * 0.32;
            panel.castShadow = false;
            mantle.add(panel);
          });
        } else if (typeKey === 'blade') {
          const mat = toon(def.outfit2, { side: T.DoubleSide, transparent: true, opacity: 0.8 });
          [-1, 1].forEach(side => {
            const panel = new T.Mesh(new T.PlaneGeometry(0.3, 0.58, 2, 4), mat);
            panel.position.set(side * 0.2, -0.12, -0.09);
            panel.rotation.z = side * 0.16;
            panel.rotation.y = side * 0.25;
            panel.castShadow = false;
            mantle.add(panel);
          });
        } else if (parts.cape) {
          parts.cape.scale.setScalar(1 + (level - 1) * 0.06);
        }
      }
      if (level >= 4) {
        const divine = new T.Group();
        body.add(divine);
        divine.position.set(0, 1.16, -0.22);
        const dmat = glow('#ffd36a', 0.22);
        [-1, 1].forEach(side => {
          const panel = new T.Mesh(new T.PlaneGeometry(0.4, 0.9, 2, 4), dmat);
          panel.position.set(side * 0.24, -0.22, -0.12);
          panel.rotation.z = side * -0.18;
          panel.rotation.y = side * 0.3;
          divine.add(panel);
        });
        parts.divineMantle = divine;
      }

      if (level >= 2) {
        const streamers = new T.Group();
        body.add(streamers);
        streamers.position.set(0, 1.16, -0.18);
        const streamerMat = typeKey === 'archer' ? toon(def.outfit2, { side: T.DoubleSide }) : typeKey === 'mage' ? accentMat : toon(def.accent, { side: T.DoubleSide });
        parts.streamers = [];
        [-1, 1].forEach(side => {
          const pts = [
            [side * 0.11, 0.02, -0.04],
            [side * 0.32, -0.34, -0.12],
            [side * 0.42, -0.78, -0.16],
            [side * 0.52, -1.15, -0.08]
          ];
          const ribbon = taperedTube(pts, 0.11, 0.02, streamerMat, 18, 5);
          ribbon.scale.z = 0.24;
          ribbon.castShadow = false;
          streamers.add(ribbon);
          parts.streamers.push(ribbon);
        });
      }

      /* --- spirit familiar + stage silhouette --- */
      let familiar = null;
      if (typeKey === 'archer') familiar = makeFoxSpirit();
      else if (typeKey === 'mage') familiar = makeSnowSpirit();
      else familiar = makePhoenixChick();
      if (familiar) {
        const fBase = typeKey === 'archer' ? 1.02 : typeKey === 'mage' ? 0.9 : 0.94;
        const fScale = Math.max(0.56, fBase - (level - 1) * 0.1);
        familiar.scale.setScalar(fScale);
        familiar.position.set(typeKey === 'archer' ? -0.84 : 0.84, typeKey === 'mage' ? 0.2 : 0.02, 0.1);
        familiar.rotation.y = typeKey === 'archer' ? 0.24 : -0.26;
        root.add(familiar);
        parts.familiar = familiar;
        parts.familiarBase = { x: familiar.position.x, y: familiar.position.y, z: familiar.position.z, scale: fScale };
        if (level >= 3) {
          const fRing = add(familiar, new T.TorusGeometry(0.3, 0.008, 4, 32), glow(typeKey === 'mage' ? '#a8f4ff' : typeKey === 'archer' ? '#ffd36a' : '#ffb15e', 0.4), 0, 0.03, 0);
          fRing.rotation.x = Math.PI / 2;
          parts.familiarRing = fRing;
        }
      }

      /* --- stage 3/4 back silhouette --- */
      const stageWings = new T.Group();
      body.add(stageWings);
      stageWings.position.set(0, 1.18, -0.16);
      parts.stageWings = stageWings;
      if (level >= 3) {
        if (typeKey === 'archer') {
          parts.spiritTails = [];
          for (let i = -1; i <= 1; i++) {
            const pts = [
              [i * 0.1, 0.12, -0.1],
              [i * 0.34, 0.02, -0.42],
              [i * 0.54, -0.32, -0.52],
              [i * 0.46, -0.72, -0.4],
              [i * 0.55, -0.95, -0.25]
            ];
            const tail = taperedTube(pts, 0.115, 0.018, i === 0 ? toon('#fff3cf', { emissive: '#7a5518', emissiveIntensity: 0.22 }) : toon('#f7f5ff', { emissive: '#9a8bd0', emissiveIntensity: 0.12 }), 18, 6);
            tail.castShadow = false;
            stageWings.add(tail);
            const glowTail = taperedTube(pts, 0.08, 0.01, glow('#ffd36a', 0.4), 14, 5);
            stageWings.add(glowTail);
            parts.spiritTails.push(tail);
          }
        } else if (typeKey === 'mage') {
          parts.iceWings = [];
          [-1, 1].forEach(side => {
            for (let i = 0; i < 3; i++) {
              const shard = add(stageWings, new T.ConeGeometry(0.11, 0.78 - i * 0.08, 4), new T.MeshBasicMaterial({ color: i === 1 ? '#e8fdff' : '#7fdcff', transparent: true, opacity: i === 1 ? 0.62 : 0.48, depthWrite: false, side: T.DoubleSide }), side * (0.2 + i * 0.1), 0.03 + i * 0.09, -0.1 - i * 0.04);
              shard.rotation.z = side * (0.64 + i * 0.22);
              shard.rotation.x = -0.22;
              parts.iceWings.push(shard);
            }
          });
        } else {
          parts.flameWings = [];
          [-1, 1].forEach(side => {
            for (let i = 0; i < 3; i++) {
              const feather = add(stageWings, new T.ConeGeometry(0.125, 0.72 - i * 0.08, 5), new T.MeshBasicMaterial({ color: i === 1 ? '#ffd36a' : '#ff6f9e', transparent: true, opacity: i === 1 ? 0.7 : 0.55, depthWrite: false, side: T.DoubleSide }), side * (0.21 + i * 0.12), 0.04 + i * 0.07, -0.1 - i * 0.03);
              feather.rotation.z = side * (0.58 + i * 0.22);
              feather.rotation.x = -0.25;
              feather.scale.z = 0.6;
              parts.flameWings.push(feather);
            }
          });
        }
        stageWings.scale.setScalar(level >= 4 ? 1.3 : 1.0);
      } else {
        stageWings.visible = false;
      }

      /* --- level aura --- */
      const fx = new T.Group();
      root.add(fx);
      parts.fx = fx;
      if (typeKey === 'mage') {
        const castRing = new T.Mesh(new T.RingGeometry(0.28, 0.58, 48), glow('#bff6ff', 0.42));
        castRing.rotation.x = -Math.PI / 2;
        castRing.position.y = 0.055;
        castRing.visible = false;
        root.add(castRing);
        parts.castRing = castRing;
      }
      const col = def.color;
      const auraMat = glow(col, 0.24);
      const aura = add(fx, new T.RingGeometry(0.42, 0.62, 56), auraMat, 0, 0.035, 0);
      aura.rotation.x = -Math.PI / 2;
      parts.aura = aura;
      const rune = makeRunePlane(1.15, col, 0.35);
      rune.rotation.x = -Math.PI / 2;
      rune.position.y = 0.045;
      fx.add(rune);
      parts.rune = rune;
      // motes
      parts.motes = [];
      for (let i = 0; i < 4; i++) {
        const mote = add(fx, new T.OctahedronGeometry(0.03 + i * 0.004, 0), new T.MeshBasicMaterial({ color: col }), 0.5, 0.35 + i * 0.2, 0);
        parts.motes.push(mote);
      }
      if (level >= 2) {
        const ring2 = add(fx, new T.TorusGeometry(0.82, 0.006, 4, 64), glow(col, 0.34), 0, 0.12, 0);
        ring2.rotation.x = Math.PI / 2;
        parts.aura2 = ring2;
      }
      if (level >= 3) {
        const halo = add(fx, new T.TorusGeometry(0.24, 0.012, 5, 40), glow('#ffe7a8', 0.8), 0, 2.19, -0.02);
        halo.rotation.x = Math.PI / 2;
        parts.halo = halo;
        // elegant back halo instead of over-bright wings
        parts.backHalos = [];
        const bh1 = add(fx, new T.TorusGeometry(0.62, 0.007, 4, 56), glow(col, 0.22), 0, 1.38, -0.38);
        bh1.rotation.z = 0.08;
        fx.add(bh1);
        parts.backHalos.push(bh1);
        const bh2 = add(fx, new T.TorusGeometry(0.8, 0.005, 4, 64), glow('#ffe7a8', 0.15), 0, 1.38, -0.4);
        bh2.rotation.z = -0.04;
        fx.add(bh2);
        parts.backHalos.push(bh2);
      }
      if (level >= 4) {
        const crown = new T.Group();
        crown.position.set(0, 2.2, 0);
        fx.add(crown);
        for (let i = 0; i < 5; i++) {
          const a = i / 5 * Math.PI * 2;
          const sp = add(crown, new T.ConeGeometry(0.028, 0.16, 4), new T.MeshBasicMaterial({ color: '#ffe5a0' }), Math.cos(a) * 0.17, 0, Math.sin(a) * 0.17);
          sp.rotation.z = Math.cos(a) * 0.5;
          sp.rotation.x = Math.sin(a) * 0.5;
        }
        parts.crown = crown;
        const divineRing = add(fx, new T.TorusGeometry(1.02, 0.01, 4, 72), glow('#ffd36a', 0.34), 0, 0.075, 0);
        divineRing.rotation.x = Math.PI / 2;
        parts.divineRing = divineRing;
        const crownRing = add(fx, new T.TorusGeometry(0.3, 0.009, 4, 36), glow('#fff1c2', 0.5), 0, 2.16, 0);
        crownRing.rotation.x = Math.PI / 2;
        parts.crownRing = crownRing;
      }

      root.traverse(o => { if (o.isMesh) o.castShadow = false; });
      root.userData = { parts, type: typeKey, level, attack: 0, hitFlash: 0, baseY: 0 };
      // scale gently with level
      const s = 1 + (level - 1) * 0.025;
      root.scale.setScalar(s);
      return root;
    },

    playAttack(char) {
      if (!char) return;
      const u = char.userData;
      const dur = u.type === 'mage' ? 0.64 : u.type === 'archer' ? 0.52 : 0.4;
      u.attack = dur;
      u.attackDur = dur;
      u.attackSide = -(u.attackSide || 1);
      u.familiarAttack = dur;
    },

    update(char, t, dt) {
      if (!char) return;
      const u = char.userData;
      const p = u.parts;
      const type = u.type;
      const level = u.level;
      const phase = p.phase;
      const bob = Math.sin(t * 2.05 + phase);

      if (type === 'kirin' || type === 'ginseng') {
        p.bob.position.y = Math.sin(t * 2.0 + phase) * (type === 'kirin' ? 0.06 : 0.08);
        if (type === 'kirin') {
          if (p.head) p.head.rotation.z = Math.sin(t * 1.2 + phase) * 0.05;
          if (p.tail) p.tail.rotation.y = Math.sin(t * 1.4 + phase) * 0.18;
          if (p.legs) p.legs.forEach((leg, i) => { leg.rotation.x = Math.sin(t * 3.0 + i * Math.PI / 2 + phase) * 0.08; });
          if (p.wings) p.wings.rotation.z = Math.sin(t * 1.1 + phase) * 0.06;
        } else {
          if (p.head) p.head.rotation.y = Math.sin(t * 0.8 + phase) * 0.12;
          if (p.crown) p.crown.rotation.z = Math.sin(t * 0.9 + phase) * 0.04;
          if (p.arms) p.arms.forEach((arm, i) => { arm.rotation.z = Math.sin(t * 1.1 + i + phase) * 0.06; });
          if (p.ring) p.ring.rotation.z += dt * 0.5;
        }
        if (p.halo) p.halo.rotation.z += dt * 0.35;
        return;
      }
      p.bob.position.set(0, bob * 0.018, 0);
      p.body.position.set(0, 0, 0);
      p.body.rotation.set(Math.sin(t * 0.9 + phase) * 0.008, Math.sin(t * 0.55 + phase) * 0.018, Math.sin(t * 1.1 + phase) * 0.012);
      p.head.rotation.set(Math.sin(t * 0.7 + phase) * 0.02, Math.sin(t * 0.62 + phase) * 0.09, Math.sin(t * 0.83 + phase) * 0.025);

      // reset weapon transforms before idle / attack posing
      if (p.weapon && p.weaponBase) {
        p.weapon.position.copy(p.weaponBase.pos);
        p.weapon.rotation.copy(p.weaponBase.rot);
        p.weapon.scale.copy(p.weaponBase.scale);
      }
      if (p.bladeBase) {
        p.weapon.userData.left.position.copy(p.bladeBase.left.pos);
        p.weapon.userData.left.rotation.copy(p.bladeBase.left.rot);
        p.weapon.userData.right.position.copy(p.bladeBase.right.pos);
        p.weapon.userData.right.rotation.copy(p.bladeBase.right.rot);
      }
      if (p.nock) p.nock.visible = false;
      if (p.orb) p.orb.scale.setScalar(1);
      if (p.aura) p.aura.scale.setScalar(1);
      if (p.hairCrescent) p.hairCrescent.scale.setScalar(1);
      if (p.staffFlake) p.staffFlake.scale.setScalar(1);
      if (p.stageWings) p.stageWings.scale.setScalar(level >= 4 ? 1.3 : 1.0);
      if (p.castRing) p.castRing.visible = false;

      if (p.tails) {
        p.tails.forEach((tail, i) => {
          tail.rotation.z = Math.sin(t * 1.4 + phase + i * 1.7) * 0.055 + (i % 2 ? 0.02 : -0.01);
          tail.rotation.x = Math.sin(t * 1.1 + phase + i) * 0.035;
        });
      }
      if (p.sideLocks) {
        p.sideLocks.forEach((lock, i) => {
          lock.rotation.z = lock.userData.side * (0.03 + Math.sin(t * 1.6 + phase + i) * 0.025);
        });
      }
      if (p.ears) {
        p.ears.forEach((ear, i) => {
          ear.rotation.z = ear.userData.side * -0.22 + Math.sin(t * 2.4 + i * 1.3 + phase) * 0.045;
        });
      }
      if (p.ribbons) {
        p.ribbons.forEach((rib, i) => {
          rib.rotation.z = Math.sin(t * 1.65 + phase + i * 1.1) * 0.035;
          rib.rotation.x = Math.sin(t * 1.2 + phase + i) * 0.02;
        });
      }
      if (p.ribbonBows) {
        p.ribbonBows.forEach((b, i) => {
          b.rotation.z = Math.sin(t * 1.1 + phase + i) * 0.03;
        });
      }
      if (p.foxMask) {
        p.foxMask.rotation.z = -0.08 + Math.sin(t * 1.2 + phase) * 0.02;
      }
      if (p.hairCrescent) p.hairCrescent.rotation.z = Math.sin(t * 1.4 + phase) * 0.04;
      if (p.hairSnow) p.hairSnow.rotation.z += dt * 0.35;
      if (p.hairFlames) {
        p.hairFlames.rotation.z = Math.sin(t * 1.8 + phase) * 0.04;
        p.hairFlames.rotation.x = Math.sin(t * 1.1 + phase) * 0.03;
      }
      if (p.aura) {
        p.aura.rotation.z += dt * 0.3;
        p.aura.material.opacity = 0.18 + Math.sin(t * 2.2 + phase) * 0.06;
      }
      if (p.aura2) p.aura2.rotation.z -= dt * 0.4;
      if (p.rune) {
        p.rune.rotation.z += dt * 0.18;
        p.rune.material.opacity = 0.2 + Math.sin(t * 1.8 + phase) * 0.08;
      }
      if (p.motes) {
        p.motes.forEach((m, i) => {
          const a = t * 0.7 + i / p.motes.length * Math.PI * 2 + phase;
          const r = 0.45 + i * 0.08;
          m.position.set(Math.cos(a) * r, 0.25 + i * 0.18 + Math.sin(t * 1.7 + i) * 0.1, Math.sin(a) * r);
          m.rotation.y += dt * 1.5;
        });
      }
      if (p.halo) {
        p.halo.rotation.z += dt * 0.5;
        p.halo.position.y = 2.19 + Math.sin(t * 1.8) * 0.02;
      }
      if (p.backHalos) {
        p.backHalos.forEach((w, i) => {
          w.material.opacity = (i ? 0.12 : 0.2) + Math.sin(t * 1.2 + i * 0.7) * 0.04;
          w.rotation.z += dt * (i ? -0.08 : 0.06);
        });
      }
      if (p.divineRing) {
        p.divineRing.rotation.z += dt * 0.3;
        p.divineRing.material.opacity = 0.26 + Math.sin(t * 1.6) * 0.08;
      }
      if (p.crownRing) p.crownRing.rotation.z -= dt * 0.4;
      if (p.cape) {
        p.cape.rotation.x = -0.2 + Math.sin(t * 1.7 + phase) * 0.03;
        p.cape.rotation.z = Math.sin(t * 1.2 + phase) * 0.02;
      }
      if (p.orb) {
        p.orb.rotation.y += dt * 0.7;
        p.orbShell.rotation.y -= dt * 0.4;
        p.orbRing.rotation.z += dt * 0.8;
        p.orbRing2.rotation.y += dt * 0.5;
        p.orbTop.rotation.y += dt * 0.4;
        const pulse = 1 + Math.sin(t * 2.3) * 0.08;
        p.orbShell.scale.setScalar(pulse);
      }
      if (p.weaponCrystal) p.weaponCrystal.rotation.y += dt * 1.2;
      if (p.staffFlake) {
        p.staffFlake.rotation.z += dt * 0.35;
        p.staffFlake.rotation.y += dt * 0.2;
      }

      // companion idle + attack reaction
      if (p.familiar) {
        const fd = p.familiar.userData;
        const b = p.familiarBase;
        const faRaw = u.familiarAttack > 0 ? 1 - u.familiarAttack / (u.attackDur || 0.45) : 0;
        const fa = Math.max(0, Math.sin(Math.min(1, faRaw) * Math.PI));
        p.familiar.position.x = b.x + Math.sin(t * 1.1 + phase) * 0.03;
        p.familiar.position.y = b.y + Math.sin(t * 2.4 + phase) * 0.03 + (type === 'mage' ? 0.035 : 0) + fa * 0.12;
        p.familiar.position.z = b.z + Math.cos(t * 1.3 + phase) * 0.02;
        p.familiar.rotation.y = (type === 'archer' ? 0.24 : -0.26) + Math.sin(t * 1.2 + phase) * 0.12 + fa * 0.38;
        p.familiar.rotation.z = Math.sin(t * 1.8 + phase) * 0.025;
        p.familiar.scale.setScalar(b.scale * (1 + fa * 0.12));
        if (fd.head) fd.head.rotation.y = Math.sin(t * 1.4 + phase) * 0.12;
        if (fd.tail) fd.tail.rotation.z = Math.sin(t * 1.7 + phase) * 0.07;
        if (fd.flames) fd.flames.forEach((f, i) => {
          f.scale.setScalar(0.85 + Math.sin(t * 3.1 + i) * 0.12 + fa * 0.25);
          f.rotation.y += dt * (0.7 + i * 0.2);
        });
        if (fd.flakes) fd.flakes.forEach((f, i) => {
          f.rotation.z += dt * (0.5 + i * 0.15);
          f.position.y = 0.7 + i * 0.06 + Math.sin(t * 1.6 + i) * 0.04;
        });
        if (fd.wings) fd.wings.forEach((w, i) => {
          w.rotation.z = (i ? -1 : 1) * (0.12 + Math.sin(t * 2.2 + i) * 0.08 + fa * 0.35);
        });
        if (p.familiarRing) p.familiarRing.rotation.z += dt * 0.5;
      }
      if (p.stageWings && level >= 3) {
        p.stageWings.rotation.y = Math.sin(t * 0.7 + phase) * 0.05;
        p.stageWings.rotation.z = Math.sin(t * 1.3 + phase) * 0.02;
      }
      if (p.streamers) {
        p.streamers.forEach((rib, i) => {
          rib.rotation.z = Math.sin(t * 1.1 + phase + i * 1.4) * 0.035;
          rib.rotation.x = Math.sin(t * 0.8 + phase + i) * 0.02;
        });
      }
      if (p.spiritTails) {
        p.spiritTails.forEach((tail, i) => {
          tail.rotation.z = Math.sin(t * 1.2 + phase + i * 1.6) * 0.05;
          tail.rotation.x = Math.sin(t * 0.9 + phase + i) * 0.03;
        });
      }
      if (p.iceWings) p.iceWings.forEach((w, i) => { w.material.opacity = 0.28 + Math.sin(t * 1.8 + i) * 0.08; });
      if (p.flameWings) p.flameWings.forEach((w, i) => { w.material.opacity = 0.32 + Math.sin(t * 2.3 + i) * 0.1; });

      // fixed idle arms
      const A = p.arms;
      if (type === 'archer') {
        A.left.shoulder.rotation.set(-0.22 + Math.sin(t * 1.2 + phase) * 0.02, 0, -0.18);
        A.left.elbow.rotation.x = -0.2;
        A.right.shoulder.rotation.set(-0.1 + Math.sin(t * 1.4 + phase) * 0.025, 0, 0.08);
        A.right.elbow.rotation.x = -0.32;
      } else if (type === 'mage') {
        A.left.shoulder.rotation.set(-0.08 + Math.sin(t * 1.05 + phase) * 0.02, 0, -0.18);
        A.left.elbow.rotation.x = -0.2;
        A.right.shoulder.rotation.set(-0.12 + Math.sin(t * 1.1 + phase) * 0.02, 0, 0.13);
        A.right.elbow.rotation.x = -0.3;
      } else {
        A.left.shoulder.rotation.set(-0.1 + Math.sin(t * 1.5 + phase) * 0.05, 0, -0.2);
        A.left.elbow.rotation.x = -0.24;
        A.right.shoulder.rotation.set(-0.1 + Math.sin(t * 1.5 + phase + 1.4) * 0.05, 0, 0.2);
        A.right.elbow.rotation.x = -0.24;
      }

      if (u.familiarAttack > 0) u.familiarAttack = Math.max(0, u.familiarAttack - dt);

      // attack animation timeline
      if (u.attack > 0) {
        u.attack = Math.max(0, u.attack - dt);
        const dur = u.attackDur || 0.48;
        const k = Math.min(1, Math.max(0, 1 - u.attack / dur));
        if (type === 'archer') {
          const drawK = Math.min(1, k / 0.52);
          const draw = drawK * drawK * (3 - 2 * drawK);
          const release = k > 0.52 ? Math.sin(Math.min(1, (k - 0.52) / 0.24) * Math.PI) : 0;
          A.left.shoulder.rotation.set(-0.22 - draw * 0.5, 0, -0.18 - draw * 0.08);
          A.left.elbow.rotation.x = -0.2 - draw * 0.4;
          A.right.shoulder.rotation.set(-0.1 - draw * 0.92 + release * 0.18, 0, 0.08 + draw * 0.12);
          A.right.elbow.rotation.x = -0.32 - draw * 0.85 + release * 0.4;
          p.body.rotation.y = -draw * 0.18 + release * 0.22;
          p.body.rotation.z = -draw * 0.03;
          p.head.rotation.y = -draw * 0.2 + release * 0.1;
          p.head.rotation.x = -draw * 0.04;
          if (p.aura) p.aura.scale.setScalar(1 + release * 0.18);
          p.weapon.position.x = p.weaponBase.pos.x - draw * 0.12;
          p.weapon.position.y = p.weaponBase.pos.y + draw * 0.08;
          p.weapon.position.z = p.weaponBase.pos.z + draw * 0.12 + release * 0.08;
          p.weapon.rotation.x = p.weaponBase.rot.x - draw * 0.08;
          p.weapon.rotation.z = p.weaponBase.rot.z + draw * 0.08;
          p.weapon.scale.copy(p.weaponBase.scale).multiplyScalar(1 + release * 0.045);
          if (p.nock) {
            p.nock.visible = k < 0.58;
            p.nock.position.z = 0.02 - draw * 0.3;
          }
          p.bob.position.y += release * 0.035;
          if (p.hairCrescent) p.hairCrescent.scale.setScalar(1 + release * 0.15);
          if (p.stageWings && level >= 3) p.stageWings.scale.setScalar((level >= 4 ? 1.3 : 1) * (1 + release * 0.1));
        } else if (type === 'mage') {
          const chargeK = Math.min(1, k / 0.62);
          const charge = chargeK * chargeK * (3 - 2 * chargeK);
          const release = k > 0.62 ? Math.sin(Math.min(1, (k - 0.62) / 0.22) * Math.PI) : 0;
          A.right.shoulder.rotation.set(-0.12 - charge * 1.15 + release * 0.4, 0, 0.13 + charge * 0.35);
          A.right.elbow.rotation.x = -0.3 - charge * 0.55;
          A.left.shoulder.rotation.set(-0.08 - charge * 0.75, 0, -0.18 - charge * 0.28);
          A.left.elbow.rotation.x = -0.2 - charge * 0.4;
          p.body.rotation.x = -0.06 * charge + 0.05 * release;
          p.body.rotation.z = Math.sin(k * Math.PI) * 0.03;
          p.head.rotation.x = -charge * 0.07;
          p.head.rotation.z = Math.sin(k * Math.PI) * 0.03;
          if (p.aura) p.aura.scale.setScalar(1 + charge * 0.14);
          p.weapon.rotation.z = p.weaponBase.rot.z - charge * 0.22 + release * 0.12;
          p.weapon.position.x = p.weaponBase.pos.x - charge * 0.06;
          p.weapon.position.y = p.weaponBase.pos.y + charge * 0.12;
          p.weapon.position.z = p.weaponBase.pos.z + charge * 0.1 + release * 0.12;
          if (p.orb) p.orb.scale.setScalar(1 + charge * 0.75 + release * 0.35);
          p.bob.position.y += charge * 0.025;
          if (p.castRing) {
            p.castRing.visible = true;
            p.castRing.scale.setScalar(1 + charge * 0.9);
            p.castRing.material.opacity = 0.28 + charge * 0.42;
            p.castRing.rotation.z += dt * 2.4;
          }
          if (p.orbRing) p.orbRing.rotation.z += dt * (1 + charge * 4);
          if (p.staffFlake) p.staffFlake.scale.setScalar(1 + charge * 0.35);
          if (p.stageWings && level >= 3) p.stageWings.scale.setScalar((level >= 4 ? 1.3 : 1) * (1 + charge * 0.12));
        } else {
          const slash = Math.sin(k * Math.PI);
          const side = u.attackSide || 1;
          A.left.shoulder.rotation.set(-0.1 - slash * 0.25, 0, -0.2 - side * slash * 1.0);
          A.left.elbow.rotation.x = -0.24 - slash * 0.35;
          A.right.shoulder.rotation.set(-0.1 - slash * 0.25, 0, 0.2 + side * slash * 1.0);
          A.right.elbow.rotation.x = -0.24 - slash * 0.35;
          p.body.rotation.y = side * slash * 0.95;
          p.body.rotation.z = side * slash * 0.08;
          p.body.rotation.x = -slash * 0.08;
          p.body.position.z = slash * 0.09;
          p.bob.position.y += slash * 0.045;
          p.head.rotation.z = side * slash * 0.06;
          p.head.rotation.y = -side * slash * 0.1;
          if (p.bladeBase) {
            p.weapon.userData.left.rotation.y = p.bladeBase.left.rot.y - side * slash * 0.85;
            p.weapon.userData.right.rotation.y = p.bladeBase.right.rot.y + side * slash * 0.85;
            p.weapon.userData.left.rotation.z = p.bladeBase.left.rot.z + side * slash * 0.25;
            p.weapon.userData.right.rotation.z = p.bladeBase.right.rot.z + side * slash * 0.25;
          }
          if (p.stageWings && level >= 3) p.stageWings.scale.setScalar((level >= 4 ? 1.3 : 1) * (1 + slash * 0.16));
        }
      }
    },

    dispose(group) {
      if (!group) return;
      group.traverse(o => {
        if (o.geometry) o.geometry.dispose();
        if (o.material) {
          if (Array.isArray(o.material)) o.material.forEach(m => m.dispose());
          else o.material.dispose();
        }
      });
    }
  };

  /* =========================================================
     ENEMY FACTORY
     ========================================================= */
  const EnemyFactory = {
    create(typeKey) {
      const def = D.ENEMIES[typeKey];
      const root = new T.Group();
      const bob = new T.Group();
      root.add(bob);
      const model = def.model || typeKey;
      const parts = { root, bob, type: model, phase: RNG() * Math.PI * 2 };
      const main = toon(def.color, { emissive: def.color, emissiveIntensity: 0.1 });
      const dark = toon('#1c1428', { emissive: '#2a0d33', emissiveIntensity: 0.1 });
      const pale = basic('#ffe9f6');
      const eyeMat = new T.MeshBasicMaterial({ color: def.eye });
      const glowEye = glow(def.eye, 0.55);

      if (model === 'shade') {
        const cloak = add(bob, new T.ConeGeometry(0.52, 1.4, 8, 4, true), main, 0, 0.82, 0);
        cloak.castShadow = true;
        outline(cloak, 1.03);
        const hood = sphere(bob, 0.3, dark, 0, 1.46, -0.02, 1.06, 1.1, 1.0, true);
        const face = add(bob, new T.SphereGeometry(0.22, 16, 12), pale, 0, 1.45, 0.17);
        face.scale.set(1.0, 1.2, 0.35);
        [-1, 1].forEach(s => {
          const eye = add(bob, new T.SphereGeometry(0.035, 8, 6), glowEye, s * 0.075, 1.48, 0.31);
          eye.scale.set(1.2, 1.7, 0.5);
        });
        const mouth = add(bob, new T.BoxGeometry(0.09, 0.012, 0.01), basic('#7d294f'), 0, 1.37, 0.315);
        // tendrils
        parts.tendrils = [];
        for (let i = 0; i < 5; i++) {
          const a = i / 5 * Math.PI * 2;
          const pts = [
            [Math.cos(a) * 0.32, 0.38, Math.sin(a) * 0.32],
            [Math.cos(a) * 0.5, 0.05, Math.sin(a) * 0.5],
            [Math.cos(a + 0.5) * 0.3, -0.42, Math.sin(a + 0.5) * 0.3],
            [Math.cos(a + 0.9) * 0.42, -0.7, Math.sin(a + 0.9) * 0.42]
          ];
          const tnd = taperedTube(pts, 0.075, 0.006, dark, 10, 5);
          bob.add(tnd);
          parts.tendrils.push(tnd);
        }
        // arms
        parts.arms = [];
        [-1, 1].forEach(s => {
          const arm = taperedTube([[s * 0.28, 1.28, 0], [s * 0.52, 1.15, 0.1], [s * 0.62, 0.9, 0.2], [s * 0.55, 0.75, 0.22]], 0.055, 0.018, main, 10, 5);
          bob.add(arm);
          parts.arms.push(arm);
          for (let c = 0; c < 3; c++) {
            const claw = add(bob, new T.ConeGeometry(0.022, 0.2, 4), pale, s * (0.55 + c * 0.025), 0.68, 0.23 + c * 0.04);
            claw.rotation.x = 2.6; claw.rotation.z = s * 0.2;
          }
        });
        const shardRing = add(bob, new T.TorusGeometry(0.42, 0.008, 4, 32), glow(def.eye, 0.28), 0, 0.15, 0);
        shardRing.rotation.x = Math.PI / 2;
        parts.ring = shardRing;
        parts.eyes = [glowEye];
      } else if (model === 'runner') {
        const body = new T.Group();
        body.position.y = 0.7;
        bob.add(body);
        const torso = add(body, new T.CapsuleGeometry(0.25, 0.64, 6, 10), main, 0, 0, 0);
        torso.rotation.x = Math.PI / 2;
        torso.scale.set(1, 1, 0.85);
        outline(torso, 1.05);
        const neck = add(body, new T.CylinderGeometry(0.14, 0.2, 0.32, 8), main, 0, 0.16, 0.45);
        neck.rotation.x = 0.7;
        const head = new T.Group();
        head.position.set(0, 0.35, 0.62);
        body.add(head);
        const skull = sphere(head, 0.22, main, 0, 0, 0, 1.0, 0.95, 1.2, true);
        const snout = add(head, new T.ConeGeometry(0.11, 0.34, 7), dark, 0, -0.04, 0.28);
        snout.rotation.x = Math.PI / 2;
        const nose = add(head, new T.SphereGeometry(0.035, 6, 5), basic('#0d0a12'), 0, 0.0, 0.47);
        [-1, 1].forEach(s => {
          const ear = add(head, new T.ConeGeometry(0.07, 0.25, 4), dark, s * 0.13, 0.2, -0.03);
          ear.rotation.z = s * 0.25;
          const eye = add(head, new T.SphereGeometry(0.035, 8, 6), glowEye, s * 0.1, 0.06, 0.18);
          eye.scale.set(1.2, 1.0, 0.5);
          const stripe = add(body, new T.BoxGeometry(0.02, 0.02, 0.22), new T.MeshBasicMaterial({ color: def.eye }), s * 0.19, 0.14, -0.15);
          stripe.rotation.x = 0.3;
        });
        parts.legs = [];
        [[-0.17, 0.34], [0.17, 0.34], [-0.17, -0.32], [0.17, -0.32]].forEach(p => {
          const leg = new T.Group();
          leg.position.set(p[0], -0.15, p[1]);
          body.add(leg);
          const thigh = capsule(leg, 0.055, 0.28, main, 0, -0.16, 0, true);
          const paw = add(leg, new T.SphereGeometry(0.075, 8, 6), dark, 0, -0.36, 0.03);
          paw.scale.set(1, 0.7, 1.35);
          parts.legs.push(leg);
        });
        const tail = taperedTube([[0, 0.12, -0.42], [0.05, 0.3, -0.62], [0.18, 0.48, -0.72], [0.3, 0.55, -0.68]], 0.07, 0.009, main, 12, 5);
        body.add(tail);
        parts.tail = tail;
      } else if (model === 'brute') {
        const body = new T.Group();
        body.position.y = 0.15;
        bob.add(body);
        const torso = add(body, new T.CylinderGeometry(0.5, 0.62, 0.95, 9), dark, 0, 1.05, 0);
        outline(torso, 1.04);
        const belly = add(body, new T.SphereGeometry(0.48, 12, 10), main, 0, 1.0, 0.15);
        belly.scale.set(1, 0.9, 0.65);
        const core = add(body, new T.IcosahedronGeometry(0.15, 1), new T.MeshBasicMaterial({ color: def.eye }), 0, 1.12, 0.48);
        const coreGlow = add(body, new T.IcosahedronGeometry(0.24, 1), glow(def.eye, 0.35), 0, 1.12, 0.48);
        parts.core = core; parts.coreGlow = coreGlow;
        const head = new T.Group();
        head.position.set(0, 1.65, 0.08);
        body.add(head);
        const helm = add(head, new T.SphereGeometry(0.27, 12, 10), dark, 0, 0, 0);
        helm.scale.set(1.05, 0.9, 1.0);
        outline(helm, 1.04);
        const visor = add(head, new T.BoxGeometry(0.34, 0.08, 0.12), new T.MeshBasicMaterial({ color: def.eye }), 0, 0.02, 0.23);
        [-1, 1].forEach(s => {
          const horn = add(head, new T.ConeGeometry(0.06, 0.4, 5), toon('#c9b6a3'), s * 0.23, 0.25, 0);
          horn.rotation.z = -s * 0.55;
        });
        [-1, 1].forEach(s => {
          const pauldron = add(body, new T.SphereGeometry(0.25, 10, 8), dark, s * 0.56, 1.4, 0);
          pauldron.scale.set(1, 0.7, 0.9);
          const spike = add(body, new T.ConeGeometry(0.07, 0.3, 5), toon('#897388'), s * 0.66, 1.58, 0);
          spike.rotation.z = -s * 0.7;
        });
        parts.legs = [];
        [-1, 1].forEach(s => {
          const leg = new T.Group();
          leg.position.set(s * 0.24, 0.72, 0);
          body.add(leg);
          const thigh = capsule(leg, 0.11, 0.3, dark, 0, -0.2, 0, true);
          const foot = add(leg, new T.BoxGeometry(0.22, 0.13, 0.32), toon('#2d2035'), 0, -0.43, 0.06);
          parts.legs.push(leg);
        });
        // shield
        const shield = new T.Group();
        shield.position.set(-0.62, 1.15, 0.25);
        body.add(shield);
        const disc = add(shield, new T.CylinderGeometry(0.46, 0.46, 0.09, 8), dark, 0, 0, 0);
        disc.rotation.x = Math.PI / 2;
        const rim = add(shield, new T.TorusGeometry(0.45, 0.04, 5, 24), toon('#927450'), 0, 0, 0.05);
        const boss = add(shield, new T.SphereGeometry(0.11, 8, 6), new T.MeshBasicMaterial({ color: def.eye }), 0, 0, 0.09);
        parts.shield = shield;
        // hammer
        const hammer = new T.Group();
        hammer.position.set(0.62, 1.05, 0.15);
        hammer.rotation.z = -0.3;
        body.add(hammer);
        const haft = add(hammer, new T.CylinderGeometry(0.04, 0.05, 1.1, 6), toon('#6f4d35'), 0, 0.1, 0);
        const headH = add(hammer, new T.BoxGeometry(0.42, 0.3, 0.3), dark, 0, 0.68, 0);
        outline(headH, 1.05);
        const rune = add(hammer, new T.BoxGeometry(0.3, 0.04, 0.31), new T.MeshBasicMaterial({ color: def.eye }), 0, 0.7, 0);
        parts.hammer = hammer;
      } else if (model === 'wisp') {
        const core = add(bob, new T.IcosahedronGeometry(0.26, 1), new T.MeshBasicMaterial({ color: def.eye }), 0, 0, 0);
        const shell = add(bob, new T.IcosahedronGeometry(0.4, 1), glow(def.color, 0.22), 0, 0, 0);
        const ring = add(bob, new T.TorusGeometry(0.52, 0.015, 4, 40), glow(def.eye, 0.5), 0, 0, 0);
        ring.rotation.x = Math.PI / 2.4;
        const ring2 = add(bob, new T.TorusGeometry(0.62, 0.01, 4, 40), glow(def.color, 0.3), 0, 0, 0);
        ring2.rotation.y = 1.2;
        parts.core = core; parts.shell = shell; parts.rings = [ring, ring2];
        parts.shards = [];
        for (let i = 0; i < 4; i++) {
          const shard = add(bob, new T.OctahedronGeometry(0.07, 0), new T.MeshBasicMaterial({ color: def.eye }), 0.5, 0, 0);
          parts.shards.push(shard);
        }
        // wings
        parts.wings = [];
        [-1, 1].forEach(s => {
          const wing = new T.Mesh(new T.PlaneGeometry(0.7, 0.3, 4, 2), new T.MeshBasicMaterial({ color: def.eye, transparent: true, opacity: 0.2, side: T.DoubleSide, blending: T.AdditiveBlending, depthWrite: false }));
          wing.position.set(s * 0.42, 0.05, -0.05);
          wing.rotation.y = s * 0.3;
          bob.add(wing);
          parts.wings.push(wing);
        });
        const eye = add(bob, new T.SphereGeometry(0.07, 8, 6), basic('#ffffff'), 0, 0.05, 0.26);
        eye.scale.set(0.8, 1.2, 0.4);
        const pupil = add(bob, new T.SphereGeometry(0.035, 6, 5), basic('#20182c'), 0, 0.05, 0.3);
      } else if (model === 'boss') {
        const body = new T.Group();
        bob.add(body);
        const dress = add(body, new T.ConeGeometry(1.15, 2.9, 14, 5, true), toon('#3a164e', { side: T.DoubleSide, emissive: '#a01570', emissiveIntensity: 0.24 }), 0, 1.3, 0);
        outline(dress, 1.02, '#13081a');
        const bossGold = toon('#bd8a4a', { emissive: '#6a2a12', emissiveIntensity: 0.35 });
        const bossTrim1 = add(body, new T.TorusGeometry(0.91, 0.018, 5, 36), bossGold, 0, 0.52, 0);
        bossTrim1.rotation.x = Math.PI / 2;
        const bossTrim2 = add(body, new T.TorusGeometry(0.62, 0.014, 5, 32), bossGold, 0, 1.7, 0);
        bossTrim2.rotation.x = Math.PI / 2;
        for (let i = 0; i < 3; i++) {
          const strip = taperedTube([[0.0, 0.25, 0.62], [0.0, 1.1, 0.78], [0.0, 2.1, 0.56]], 0.022, 0.01, glow('#ff78b8', 0.34), 12, 4);
          strip.position.x = (i - 1) * 0.22;
          strip.position.z = 0.05;
          body.add(strip);
        }
        for (let i = 0; i < 9; i++) {
          const a = i / 9 * Math.PI * 2;
          const tnd = taperedTube([[Math.cos(a) * 0.6, 0.1, Math.sin(a) * 0.6], [Math.cos(a) * 1.1, -0.5, Math.sin(a) * 1.1], [Math.cos(a + 0.4) * 0.9, -1.2, Math.sin(a + 0.4) * 0.9]], 0.15, 0.01, toon('#150b20'), 10, 5);
          body.add(tnd);
        }
        const torso = add(body, new T.CylinderGeometry(0.34, 0.48, 0.9, 12), dark, 0, 2.65, 0);
        outline(torso, 1.03);
        const armor = add(body, new T.OctahedronGeometry(0.3, 0), toon('#5e2a6e', { emissive: '#a5196d', emissiveIntensity: 0.4 }), 0, 2.72, 0.34);
        armor.scale.set(1.2, 1.4, 0.5);
        const chestGem = add(body, new T.OctahedronGeometry(0.13, 0), new T.MeshBasicMaterial({ color: '#ff8fc4' }), 0, 2.64, 0.58);
        chestGem.scale.y = 1.8;
        const chestGlow = new T.Sprite(new T.SpriteMaterial({ map: A_STAR_FALLBACK(), color: 0xff5f9e, transparent: true, opacity: 0.55, blending: T.AdditiveBlending, depthWrite: false }));
        chestGlow.position.set(0, 2.65, 0.6);
        chestGlow.scale.set(1.6, 1.6, 1);
        body.add(chestGlow);
        const bossLight = new T.PointLight(0xff3f8c, 8, 14, 2);
        bossLight.position.set(0, 3.3, 1.0);
        body.add(bossLight);
        const bossAura = new T.Sprite(new T.SpriteMaterial({ map: A_STAR_FALLBACK(), color: 0xff3f8c, transparent: true, opacity: 0.14, blending: T.AdditiveBlending, depthWrite: false }));
        bossAura.position.set(0, 2.9, -0.3);
        bossAura.scale.set(7, 9, 1);
        body.add(bossAura);
        parts.bossAura = bossAura;
        parts.bossRunes = [];
        for (let i = 0; i < 6; i++) {
          const a = i / 6 * Math.PI * 2;
          const rune = add(body, new T.OctahedronGeometry(0.09, 0), new T.MeshBasicMaterial({ color: '#ff86bd' }), Math.cos(a) * 1.45, 3.4, Math.sin(a) * 1.45);
          rune.scale.y = 1.7;
          rune.userData.phase = a;
          parts.bossRunes.push(rune);
        }
        const head = new T.Group();
        head.position.set(0, 3.35, 0.02);
        body.add(head);
        const helm = sphere(head, 0.35, dark, 0, 0, 0, 1, 1.05, 1.0, true);
        const mask = add(head, new T.SphereGeometry(0.27, 16, 12), basic('#ffeaf5'), 0, 0, 0.13);
        mask.scale.set(0.9, 1.05, 0.4);
        [-1, 1].forEach(s => {
          const eye = add(head, new T.SphereGeometry(0.038, 8, 6), new T.MeshBasicMaterial({ color: def.eye }), s * 0.095, 0.04, 0.28);
          eye.scale.set(1.1, 1.6, 0.5);
          const tear = add(head, new T.BoxGeometry(0.022, 0.22, 0.01), basic('#4a1f4e'), s * 0.09, -0.12, 0.31);
          const horn = add(head, new T.ConeGeometry(0.07, 0.65, 5), toon('#5e3d64'), s * 0.27, 0.35, -0.02);
          horn.rotation.z = -s * 0.5;
          horn.rotation.x = -0.2;
        });
        const circlet = add(head, new T.TorusGeometry(0.3, 0.018, 4, 28), new T.MeshBasicMaterial({ color: '#ffd58a' }), 0, 0.23, 0);
        circlet.rotation.x = Math.PI / 2;
        for (let i = 0; i < 5; i++) {
          const a = i / 5 * Math.PI * 2;
          const spike = add(head, new T.ConeGeometry(0.035, 0.22, 4), new T.MeshBasicMaterial({ color: '#ffcf82' }), Math.cos(a) * 0.3, 0.34, Math.sin(a) * 0.3);
          spike.rotation.z = Math.cos(a) * 0.4;
        }
        // halo
        const halo = add(body, new T.TorusGeometry(0.75, 0.016, 5, 60), new T.MeshBasicMaterial({ color: '#ff9ccd' }), 0, 4.2, 0);
        halo.rotation.x = Math.PI / 2;
        parts.halo = halo;
        // wings
        parts.wings = [];
        [-1, 1].forEach(s => {
          for (let i = 0; i < 3; i++) {
            const shape = new T.Shape();
            shape.moveTo(0, 0); shape.quadraticCurveTo(1.4, 0.7 + i * 0.2, 2.3, 0.1 + i * 0.4); shape.quadraticCurveTo(1.3, -0.1 - i * 0.2, 0, -0.35); shape.closePath();
            const geo = new T.ShapeGeometry(shape);
            const wing = new T.Mesh(geo, new T.MeshBasicMaterial({ color: i % 2 ? '#4a163f' : '#260d30', transparent: true, opacity: 0.9, side: T.DoubleSide }));
            wing.position.set(s * 0.2, 3.0 - i * 0.3, -0.25 - i * 0.05);
            wing.rotation.y = s * (0.4 + i * 0.2);
            wing.rotation.z = s * (0.3 + i * 0.18);
            wing.scale.x = s;
            body.add(wing);
            const edge = new T.Mesh(new T.EdgesGeometry(geo), new T.LineBasicMaterial({ color: '#ff75b8', transparent: true, opacity: 0.45 }));
            wing.add(edge);
            parts.wings.push(wing);
          }
        });
        // arms and scythe
        parts.arms = {};
        [-1, 1].forEach(s => {
          const arm = taperedTube([[s * 0.3, 2.95, 0], [s * 0.62, 2.6, 0.15], [s * 0.72, 2.25, 0.3]], 0.075, 0.035, dark, 8, 5);
          body.add(arm);
          parts.arms[s === -1 ? 'left' : 'right'] = arm;
        });
        const scythe = new T.Group();
        scythe.position.set(0.92, 2.25, 0.62);
        body.add(scythe);
        const shaft = add(scythe, new T.CylinderGeometry(0.035, 0.045, 3.4, 6), toon('#54304f'), 0, 0, 0);
        const curve = new T.Mesh(new T.TorusGeometry(0.95, 0.045, 5, 28, Math.PI * 0.85), pbr('#e0d7e8', { metalness: 0.8, roughness: 0.3, emissive: '#4a0e2e', emissiveIntensity: 0.4 }), 0, 1.55, 0);
        curve.rotation.z = -0.5;
        curve.scale.y = 1.4;
        const sGlow = add(scythe, new T.TorusGeometry(0.95, 0.08, 5, 28, Math.PI * 0.85), glow('#ff5d9f', 0.5), 0, 1.55, 0);
        sGlow.rotation.z = -0.5; sGlow.scale.y = 1.4;
        parts.scythe = scythe;
        // corruption ring
        const ring = add(body, new T.RingGeometry(0.8, 1.6, 64), glow('#ff2f7e', 0.2), 0, 0.1, 0);
        ring.rotation.x = -Math.PI / 2;
        parts.ring = ring;
      }

      const shadowMat = new T.MeshBasicMaterial({ map: BLOB_TEX, transparent: true, opacity: 0.32, depthWrite: false, color: 0x000000 });
      const shadow = new T.Mesh(new T.PlaneGeometry(1.5, 1.0), shadowMat);
      shadow.rotation.x = -Math.PI / 2;
      shadow.position.y = def.flying ? (-(def.flyHeight || 1.5) - 0.02) : 0.025;
      shadow.renderOrder = 1;
      shadow.scale.setScalar(def.boss ? 2.4 : 1);
      root.add(shadow);
      parts.shadow = shadow;
      root.traverse(o => { if (o.isMesh) o.castShadow = false; });
      root.userData = { parts, type: model, typeKey, def };
      root.scale.setScalar((def.scale || 1) * 1.38);
      return root;
    },

    update(enemy, t, dt) {
      const u = enemy.userData;
      const p = u.parts;
      const phase = p.phase || 0;
      const bob = Math.sin(t * 3.1 + phase);
      if (u.type === 'shade') {
        p.bob.position.y = 0.14 + bob * 0.09;
        p.bob.rotation.z = Math.sin(t * 1.3 + phase) * 0.05;
        p.tendrils.forEach((tn, i) => { tn.rotation.y = Math.sin(t * 1.4 + i) * 0.07; });
        if (p.ring) p.ring.rotation.z += dt * 0.4;
      } else if (u.type === 'runner') {
        p.bob.position.y = 0.02 + Math.abs(Math.sin(t * 9 + phase)) * 0.08;
        p.legs.forEach((leg, i) => {
          leg.rotation.x = Math.sin(t * 10 + phase + (i % 2 ? Math.PI : 0)) * 0.7;
        });
        p.tail.rotation.y = Math.sin(t * 4 + phase) * 0.3;
      } else if (u.type === 'brute') {
        p.bob.position.y = Math.abs(Math.sin(t * 2.5 + phase)) * 0.04;
        p.legs.forEach((leg, i) => {
          leg.rotation.x = Math.sin(t * 2.7 + phase + (i ? Math.PI : 0)) * 0.35;
        });
        p.core.rotation.y += dt * 1.3;
        p.coreGlow.scale.setScalar(1 + Math.sin(t * 3) * 0.12);
        p.shield.rotation.z = Math.sin(t * 2.2 + phase) * 0.05;
      } else if (u.type === 'wisp') {
        p.bob.position.y = Math.sin(t * 2.2 + phase) * 0.14;
        p.core.rotation.y += dt * 1.2;
        p.shell.rotation.y -= dt * 0.6;
        p.rings.forEach((r, i) => {
          r.rotation.z += dt * (i ? -0.8 : 1.1);
          r.rotation.x += dt * 0.15;
        });
        p.shards.forEach((s, i) => {
          const a = t * 1.8 + i / p.shards.length * Math.PI * 2;
          s.position.set(Math.cos(a) * 0.62, Math.sin(a * 1.3) * 0.25, Math.sin(a) * 0.62);
          s.rotation.y += dt * 2;
        });
        p.wings.forEach((w, i) => {
          w.rotation.y = (i ? 1 : -1) * (0.4 + Math.sin(t * 12 + i) * 0.35);
          w.material.opacity = 0.16 + Math.sin(t * 10 + i) * 0.06;
        });
      } else if (u.type === 'boss') {
        p.bob.position.y = Math.sin(t * 1.4 + phase) * 0.08;
        if (p.bossAura) p.bossAura.material.opacity = 0.1 + Math.sin(t * 1.7) * 0.04;
        p.halo.rotation.z += dt * 0.4;
        p.ring.rotation.z += dt * 0.25;
        if (p.bossRunes) p.bossRunes.forEach((r, i) => {
          const a = t * 0.8 + r.userData.phase;
          r.position.set(Math.cos(a) * 1.45, 3.4 + Math.sin(t * 1.3 + i) * 0.18, Math.sin(a) * 1.45);
          r.rotation.y += dt * 1.5;
        });
        p.wings.forEach((w, i) => {
          w.rotation.z = (w.scale.x > 0 ? 1 : -1) * (0.25 + i * 0.12 + Math.sin(t * 1.2 + i) * 0.06);
        });
        p.scythe.rotation.z = Math.sin(t * 1.1) * 0.04;
        p.scythe.rotation.x = Math.sin(t * 0.8) * 0.03;
        if (p.arms) {
          p.arms.left.rotation.z = Math.sin(t * 1.2) * 0.04;
          p.arms.right.rotation.z = Math.sin(t * 1.2 + 1) * 0.04;
        }
      }
    },

    dispose(group) {
      if (!group) return;
      group.traverse(o => {
        if (o.geometry) o.geometry.dispose();
        if (o.material) {
          if (Array.isArray(o.material)) o.material.forEach(m => m.dispose());
          else o.material.dispose();
        }
      });
    }
  };

  /* =========================================================
     CANVAS TEXTURES
     ========================================================= */
  function makeRuneTexture(col) {
    const c = document.createElement('canvas');
    c.width = c.height = 512;
    const x = c.getContext('2d');
    x.clearRect(0, 0, 512, 512);
    x.translate(256, 256);
    const color = col || '#9cefff';
    x.strokeStyle = color;
    x.lineWidth = 2;
    x.shadowColor = color;
    x.shadowBlur = 12;
    [236, 222, 150, 138, 70].forEach((r, i) => {
      x.globalAlpha = i === 0 ? 0.25 : 0.75;
      x.beginPath(); x.arc(0, 0, r, 0, Math.PI * 2); x.stroke();
    });
    x.globalAlpha = 0.8;
    for (let i = 0; i < 24; i++) {
      const a = i / 24 * Math.PI * 2;
      x.beginPath();
      x.moveTo(Math.cos(a) * 150, Math.sin(a) * 150);
      x.lineTo(Math.cos(a) * 170, Math.sin(a) * 170);
      x.stroke();
    }
    // glyphs
    x.lineWidth = 3;
    x.globalAlpha = 0.9;
    for (let i = 0; i < 10; i++) {
      const a = i / 10 * Math.PI * 2;
      x.save();
      x.rotate(a);
      x.translate(0, -190);
      x.beginPath();
      x.moveTo(-10, -12); x.lineTo(10, -4); x.lineTo(-5, 4); x.lineTo(8, 14);
      x.stroke();
      x.restore();
    }
    // star
    x.globalAlpha = 0.7;
    x.beginPath();
    for (let i = 0; i < 8; i++) {
      const a = i / 8 * Math.PI * 2 - Math.PI / 2;
      const r = i % 2 ? 28 : 95;
      if (i === 0) x.moveTo(Math.cos(a) * r, Math.sin(a) * r); else x.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    x.closePath(); x.stroke();
    const tex = new T.CanvasTexture(c);
    tex.colorSpace = T.SRGBColorSpace;
    tex.anisotropy = 4;
    return tex;
  }

  function makeRunePlane(size, color, opacity) {
    const map = makeRuneTexture(color);
    const m = new T.Mesh(new T.PlaneGeometry(size, size), new T.MeshBasicMaterial({
      map: map, transparent: true, opacity: opacity || 0.5, blending: T.AdditiveBlending,
      depthWrite: false, side: T.DoubleSide
    }));
    return m;
  }

  function makeStarTexture() {
    const c = document.createElement('canvas');
    c.width = c.height = 64;
    const x = c.getContext('2d');
    const g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.2, 'rgba(255,246,214,.9)');
    g.addColorStop(0.45, 'rgba(255,210,120,.35)');
    g.addColorStop(1, 'rgba(255,180,80,0)');
    x.fillStyle = g;
    x.fillRect(0, 0, 64, 64);
    const tex = new T.CanvasTexture(c);
    tex.colorSpace = T.SRGBColorSpace;
    return tex;
  }

  const STAR_TEX = makeStarTexture();

  function makeBlobTexture() {
    const c = document.createElement('canvas');
    c.width = c.height = 128;
    const x = c.getContext('2d');
    const g = x.createRadialGradient(64, 64, 3, 64, 64, 62);
    g.addColorStop(0, 'rgba(0,0,0,.72)');
    g.addColorStop(.45, 'rgba(0,0,0,.36)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    x.fillStyle = g;
    x.fillRect(0, 0, 128, 128);
    return new T.CanvasTexture(c);
  }
  const BLOB_TEX = makeBlobTexture();

  function makeMoonTexture() {
    const c = document.createElement('canvas');
    c.width = c.height = 256;
    const x = c.getContext('2d');
    x.clearRect(0, 0, 256, 256);
    const halo = x.createRadialGradient(128, 128, 40, 128, 128, 128);
    halo.addColorStop(0, 'rgba(255,236,205,.65)');
    halo.addColorStop(.55, 'rgba(255,210,170,.12)');
    halo.addColorStop(1, 'rgba(255,190,150,0)');
    x.fillStyle = halo;
    x.fillRect(0, 0, 256, 256);
    x.save();
    x.beginPath();
    x.arc(128, 128, 52, 0, Math.PI * 2);
    x.clip();
    const body = x.createRadialGradient(112, 110, 8, 128, 128, 58);
    body.addColorStop(0, '#fffdf2');
    body.addColorStop(.55, '#f4dfc2');
    body.addColorStop(.85, '#d8b79a');
    body.addColorStop(1, '#b9927a');
    x.fillStyle = body;
    x.fillRect(70, 70, 116, 116);
    const craters = [[104, 112, 9], [145, 142, 13], [118, 158, 6], [154, 108, 5], [96, 146, 5]];
    craters.forEach(cr => {
      const g = x.createRadialGradient(cr[0] - 2, cr[1] - 2, 1, cr[0], cr[1], cr[2]);
      g.addColorStop(0, 'rgba(150,118,100,.30)');
      g.addColorStop(1, 'rgba(150,118,100,0)');
      x.fillStyle = g;
      x.beginPath(); x.arc(cr[0], cr[1], cr[2], 0, Math.PI * 2); x.fill();
    });
    x.restore();
    const rim = x.createRadialGradient(128, 128, 48, 128, 128, 58);
    rim.addColorStop(0, 'rgba(255,250,235,0)');
    rim.addColorStop(.8, 'rgba(255,240,215,.55)');
    rim.addColorStop(1, 'rgba(255,230,200,0)');
    x.fillStyle = rim;
    x.beginPath(); x.arc(128, 128, 58, 0, Math.PI * 2); x.fill();
    const tex = new T.CanvasTexture(c);
    tex.colorSpace = T.SRGBColorSpace;
    return tex;
  }

  /* =========================================================
     VFX
     ========================================================= */
  class VFX {
    constructor(scene) {
      this.scene = scene;
      this.count = 1600;
      const g = new T.BufferGeometry();
      this.pos = new Float32Array(this.count * 3);
      this.col = new Float32Array(this.count * 3);
      this.size = new Float32Array(this.count);
      this.alpha = new Float32Array(this.count);
      this.vel = new Float32Array(this.count * 3);
      this.life = new Float32Array(this.count);
      this.maxLife = new Float32Array(this.count);
      this.grav = new Float32Array(this.count);
      this.drag = new Float32Array(this.count);
      this.cursor = 0;
      for (let i = 0; i < this.count; i++) this.pos[i * 3 + 1] = -999;
      g.setAttribute('position', new T.BufferAttribute(this.pos, 3));
      g.setAttribute('aColor', new T.BufferAttribute(this.col, 3));
      g.setAttribute('aSize', new T.BufferAttribute(this.size, 1));
      g.setAttribute('aAlpha', new T.BufferAttribute(this.alpha, 1));
      const m = new T.ShaderMaterial({
        uniforms: { uPixelRatio: { value: Math.min(devicePixelRatio, 2) } },
        vertexShader: `
          attribute vec3 aColor; attribute float aSize; attribute float aAlpha;
          varying vec3 vColor; varying float vAlpha;
          uniform float uPixelRatio;
          void main(){
            vColor=aColor; vAlpha=aAlpha;
            vec4 mv=modelViewMatrix*vec4(position,1.0);
            gl_PointSize=aSize*uPixelRatio*(180.0/max(1.0,-mv.z));
            gl_Position=projectionMatrix*mv;
          }`,
        fragmentShader: `
          varying vec3 vColor; varying float vAlpha;
          void main(){
            vec2 p=gl_PointCoord-0.5;
            float d=length(p);
            float a=smoothstep(0.5,0.0,d);
            a=pow(a,1.7)*vAlpha;
            if(a<0.01) discard;
            gl_FragColor=vec4(vColor*1.4,a);
          }`,
        transparent: true, blending: T.AdditiveBlending, depthWrite: false
      });
      this.points = new T.Points(g, m);
      this.points.frustumCulled = false;
      scene.add(this.points);
      this.geo = g;

      // rings
      this.rings = [];
      for (let i = 0; i < 18; i++) {
        const mesh = new T.Mesh(new T.RingGeometry(0.86, 1, 64), glow('#ffffff', 0.6));
        mesh.rotation.x = -Math.PI / 2;
        mesh.visible = false;
        mesh.userData = { active: false, t: 0, dur: 0.7, max: 1, color: new T.Color() };
        scene.add(mesh);
        this.rings.push(mesh);
      }
      // beams
      this.beams = [];
      for (let i = 0; i < 12; i++) {
        const mesh = new T.Mesh(new T.CylinderGeometry(0.03, 0.03, 1, 5, 1, true), glow('#fff2c0', 0.6));
        mesh.visible = false;
        mesh.userData = { active: false, t: 0, dur: 0.25 };
        scene.add(mesh);
        this.beams.push(mesh);
      }
      // slashes
      this.slashes = [];
      for (let i = 0; i < 14; i++) {
        const mesh = new T.Mesh(new T.RingGeometry(0.55, 1.0, 28, 1, 0, Math.PI * 1.15), glow('#ff9fce', 0.75));
        mesh.visible = false;
        mesh.userData = { active: false, t: 0, dur: 0.3, max: 1.5 };
        scene.add(mesh);
        this.slashes.push(mesh);
      }
      this._c = new T.Color();
    }

    spawn(pos, color, count, opts) {
      opts = opts || {};
      const speed = opts.speed == null ? 3 : opts.speed;
      const life = opts.life == null ? 0.7 : opts.life;
      const size = opts.size == null ? 0.22 : opts.size;
      const spread = opts.spread == null ? 0.25 : opts.spread;
      const gravity = opts.gravity == null ? -3 : opts.gravity;
      const drag = opts.drag == null ? 0.96 : opts.drag;
      const col = this._c.set(color);
      for (let n = 0; n < count; n++) {
        const i = this.cursor;
        this.cursor = (this.cursor + 1) % this.count;
        const i3 = i * 3;
        this.pos[i3] = pos.x + (Math.random() - 0.5) * spread;
        this.pos[i3 + 1] = pos.y + (Math.random() - 0.5) * spread;
        this.pos[i3 + 2] = pos.z + (Math.random() - 0.5) * spread;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        const sp = speed * (0.35 + Math.random() * 0.85);
        this.vel[i3] = Math.sin(phi) * Math.cos(theta) * sp;
        this.vel[i3 + 1] = Math.cos(phi) * sp + (opts.up || 0);
        this.vel[i3 + 2] = Math.sin(phi) * Math.sin(theta) * sp;
        this.col[i3] = col.r; this.col[i3 + 1] = col.g; this.col[i3 + 2] = col.b;
        this.size[i] = size * (0.5 + Math.random());
        this.alpha[i] = 1;
        this.life[i] = life * (0.6 + Math.random() * 0.7);
        this.maxLife[i] = this.life[i];
        this.grav[i] = gravity;
        this.drag[i] = drag;
      }
      this.geo.attributes.aColor.needsUpdate = true;
      this.geo.attributes.aSize.needsUpdate = true;
    }

    ring(pos, color, radius, opts) {
      opts = opts || {};
      const r = this.rings.find(x => !x.userData.active);
      if (!r) return;
      r.visible = true;
      r.position.copy(pos);
      r.position.y = opts.y == null ? 0.12 : opts.y;
      r.scale.setScalar(0.12);
      r.material.color.set(color);
      r.material.opacity = 0.8;
      r.userData.active = true;
      r.userData.t = 0;
      r.userData.dur = opts.dur || 0.65;
      r.userData.max = radius || 2;
      r.userData.width = opts.width || 0.12;
    }

    beam(a, b, color, opts) {
      opts = opts || {};
      const m = this.beams.find(x => !x.userData.active);
      if (!m) return;
      m.visible = true;
      const dir = new T.Vector3().subVectors(b, a);
      const len = dir.length();
      m.position.copy(a).addScaledVector(dir, 0.5);
      m.scale.set(opts.width || 1, len, opts.width || 1);
      m.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), dir.normalize());
      m.material.color.set(color);
      m.material.opacity = 0.9;
      m.userData.active = true;
      m.userData.t = 0;
      m.userData.dur = opts.dur || 0.22;
    }

    slash(pos, color, opts) {
      opts = opts || {};
      const m = this.slashes.find(x => !x.userData.active);
      if (!m) return;
      m.visible = true;
      m.position.copy(pos);
      m.position.y = opts.y == null ? 0.9 : opts.y;
      m.material.color.set(color);
      m.material.opacity = 0.85;
      m.scale.setScalar(0.35);
      m.rotation.set(-Math.PI / 2 + (opts.tilt || 0), 0, opts.angle || 0);
      m.userData.active = true;
      m.userData.t = 0;
      m.userData.dur = opts.dur || 0.28;
      m.userData.max = opts.radius || 1.2;
    }

    burst(pos, color, count, opts) {
      this.spawn(pos, color, count, opts);
    }

    update(dt) {
      for (let i = 0; i < this.count; i++) {
        if (this.life[i] <= 0) continue;
        const i3 = i * 3;
        this.life[i] -= dt;
        if (this.life[i] <= 0) {
          this.alpha[i] = 0;
          this.pos[i3 + 1] = -999;
          continue;
        }
        this.vel[i3 + 1] += this.grav[i] * dt;
        const dr = Math.pow(this.drag[i], dt * 60);
        this.vel[i3] *= dr; this.vel[i3 + 1] *= dr; this.vel[i3 + 2] *= dr;
        this.pos[i3] += this.vel[i3] * dt;
        this.pos[i3 + 1] += this.vel[i3 + 1] * dt;
        this.pos[i3 + 2] += this.vel[i3 + 2] * dt;
        this.alpha[i] = Math.min(1, this.life[i] / this.maxLife[i] * 1.7);
      }
      this.geo.attributes.position.needsUpdate = true;
      this.geo.attributes.aAlpha.needsUpdate = true;

      this.rings.forEach(r => {
        if (!r.userData.active) return;
        r.userData.t += dt;
        const k = r.userData.t / r.userData.dur;
        if (k >= 1) { r.userData.active = false; r.visible = false; return; }
        const e = 1 - Math.pow(1 - k, 3);
        r.scale.setScalar(0.1 + e * r.userData.max);
        r.material.opacity = (1 - k) * 0.7;
      });
      this.beams.forEach(m => {
        if (!m.userData.active) return;
        m.userData.t += dt;
        const k = m.userData.t / m.userData.dur;
        if (k >= 1) { m.userData.active = false; m.visible = false; return; }
        m.material.opacity = (1 - k) * 0.9;
        m.scale.x = m.scale.z = (1 - k * 0.8);
      });
      this.slashes.forEach(m => {
        if (!m.userData.active) return;
        m.userData.t += dt;
        const k = m.userData.t / m.userData.dur;
        if (k >= 1) { m.userData.active = false; m.visible = false; return; }
        const e = 1 - Math.pow(1 - k, 2);
        m.scale.setScalar(0.2 + e * m.userData.max);
        m.material.opacity = (1 - k) * 0.9;
      });
    }
  }

  /* =========================================================
     POST PROCESSING
     ========================================================= */
  class PostFX {
    constructor(renderer, scene, camera) {
      this.renderer = renderer;
      this.scene = scene;
      this.camera = camera;
      this.enabled = true;
      this.strength = 0.38;
      this.exposure = 0.86;
      this.time = 0;
      this.rtScene = new T.WebGLRenderTarget(1024, 1024, {
        type: T.HalfFloatType, samples: 4, depthBuffer: true, stencilBuffer: false
      });
      this.rtBright = new T.WebGLRenderTarget(512, 512, { type: T.HalfFloatType, depthBuffer: false, stencilBuffer: false });
      this.rtBlurA = new T.WebGLRenderTarget(512, 512, { type: T.HalfFloatType, depthBuffer: false, stencilBuffer: false });
      this.rtBlurB = new T.WebGLRenderTarget(512, 512, { type: T.HalfFloatType, depthBuffer: false, stencilBuffer: false });
      this.cam = new T.OrthographicCamera(-1, 1, 1, -1, 0, 1);
      this.quad = new T.Mesh(new T.PlaneGeometry(2, 2), null);
      this.quadScene = new T.Scene();
      this.quadScene.add(this.quad);
      this.brightMat = new T.ShaderMaterial({
        uniforms: { tDiffuse: { value: null }, uThreshold: { value: 0.72 }, uKnee: { value: 0.18 } },
        vertexShader: 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position,1.0); }',
        fragmentShader: `varying vec2 vUv; uniform sampler2D tDiffuse; uniform float uThreshold; uniform float uKnee;
          void main(){ vec3 c=texture2D(tDiffuse,vUv).rgb; float l=max(c.r,max(c.g,c.b));
          float soft=clamp((l-uThreshold+uKnee)/(2.0*uKnee),0.0,1.0); soft=soft*soft*(l>uThreshold?1.0:0.0);
          gl_FragColor=vec4(c*soft,1.0); }`,
        depthTest: false, depthWrite: false
      });
      this.blurMat = new T.ShaderMaterial({
        uniforms: { tDiffuse: { value: null }, uDir: { value: new T.Vector2(1, 0) }, uTexel: { value: new T.Vector2(1 / 512, 1 / 512) } },
        vertexShader: 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position,1.0); }',
        fragmentShader: `varying vec2 vUv; uniform sampler2D tDiffuse; uniform vec2 uDir; uniform vec2 uTexel;
          void main(){ vec3 sum=vec3(0.0); float w[5]; w[0]=0.227; w[1]=0.194; w[2]=0.121; w[3]=0.054; w[4]=0.016;
          sum+=texture2D(tDiffuse,vUv).rgb*w[0];
          for(int i=1;i<5;i++){ vec2 o=uDir*uTexel*float(i)*1.4; sum+=texture2D(tDiffuse,vUv+o).rgb*w[i]; sum+=texture2D(tDiffuse,vUv-o).rgb*w[i]; }
          gl_FragColor=vec4(sum,1.0); }`,
        depthTest: false, depthWrite: false
      });
      this.compMat = new T.ShaderMaterial({
        uniforms: {
          tScene: { value: null }, tBloom: { value: null },
          uRes: { value: new T.Vector2(1024, 768) },
          uTime: { value: 0 }, uStrength: { value: 0.38 }, uExposure: { value: 0.86 },
          uSat: { value: 1.22 }, uAberration: { value: 0.0012 }, uWarm: { value: 0.72 }
        },
        vertexShader: 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position,1.0); }',
        fragmentShader: `
          varying vec2 vUv; uniform sampler2D tScene; uniform sampler2D tBloom;
          uniform vec2 uRes; uniform float uTime; uniform float uStrength; uniform float uExposure; uniform float uSat; uniform float uAberration; uniform float uWarm;
          vec3 aces(vec3 x){ return clamp((x*(2.51*x+0.03))/(x*(2.43*x+0.59)+0.14),0.0,1.0); }
          float hash(vec2 p){ p=fract(p*vec2(123.34,456.21)); p+=dot(p,p+45.32); return fract(p.x*p.y); }
          void main(){
            vec2 uv=vUv; vec2 dir=uv-0.5; float r2=dot(dir,dir);
            vec2 off=dir*uAberration*(0.35+r2*2.0);
            vec3 col;
            col.r=texture2D(tScene,uv+off).r;
            col.g=texture2D(tScene,uv).g;
            col.b=texture2D(tScene,uv-off).b;
            vec3 bloom=texture2D(tBloom,uv).rgb;
            col+=bloom*uStrength;
            col*=uExposure;
            // color grade: warm highlights, cool shadows
            float lum=dot(col,vec3(0.2126,0.7152,0.0722));
            col=mix(vec3(lum),col,uSat);
            col=mix(col,col*vec3(1.055,1.01,0.93),smoothstep(0.25,1.4,lum)*uWarm);
            col=mix(col,col*vec3(0.9,0.96,1.12),(1.0-smoothstep(0.0,0.45,lum))*0.45);
            // vignette
            float vig=smoothstep(0.95,0.22,length(dir*vec2(1.0,0.9)));
            col*=mix(0.55,1.0,vig);
            // film grain
            float g=hash(uv*uRes+uTime*60.0)-0.5;
            col+=g*0.012;
            col=aces(col);
            col=pow(max(col,0.0),vec3(1.0/2.2));
            col=clamp((col-0.5)*1.07+0.5,0.0,1.0);
            gl_FragColor=vec4(col,1.0);
          }`,
        depthTest: false, depthWrite: false
      });
    }

    setSize(w, h, pr) {
      this.rtScene.setSize(w, h);
      const bw = Math.max(1, Math.floor(w / 2)), bh = Math.max(1, Math.floor(h / 2));
      this.rtBright.setSize(bw, bh);
      this.rtBlurA.setSize(bw, bh);
      this.rtBlurB.setSize(bw, bh);
      this.compMat.uniforms.uRes.value.set(w, h);
      this.blurMat.uniforms.uTexel.value.set(1 / bw, 1 / bh);
      this.brightMat.uniforms.uThreshold.value = 0.72;
    }

    render(dt) {
      this.time += dt;
      const r = this.renderer;
      r.setRenderTarget(this.rtScene);
      r.clear();
      r.render(this.scene, this.camera);

      this.quad.material = this.brightMat;
      this.brightMat.uniforms.tDiffuse.value = this.rtScene.texture;
      r.setRenderTarget(this.rtBright);
      r.clear();
      r.render(this.quadScene, this.cam);

      this.quad.material = this.blurMat;
      this.blurMat.uniforms.tDiffuse.value = this.rtBright.texture;
      this.blurMat.uniforms.uDir.value.set(1, 0);
      r.setRenderTarget(this.rtBlurA);
      r.clear();
      r.render(this.quadScene, this.cam);

      this.blurMat.uniforms.tDiffuse.value = this.rtBlurA.texture;
      this.blurMat.uniforms.uDir.value.set(0, 1);
      r.setRenderTarget(this.rtBlurB);
      r.clear();
      r.render(this.quadScene, this.cam);

      // second wider pass
      this.blurMat.uniforms.tDiffuse.value = this.rtBlurB.texture;
      this.blurMat.uniforms.uDir.value.set(1.8, 0);
      r.setRenderTarget(this.rtBlurA);
      r.clear();
      r.render(this.quadScene, this.cam);
      this.blurMat.uniforms.tDiffuse.value = this.rtBlurA.texture;
      this.blurMat.uniforms.uDir.value.set(0, 1.8);
      r.setRenderTarget(this.rtBlurB);
      r.clear();
      r.render(this.quadScene, this.cam);

      this.compMat.uniforms.tScene.value = this.rtScene.texture;
      this.compMat.uniforms.tBloom.value = this.rtBlurB.texture;
      this.compMat.uniforms.uTime.value = this.time;
      this.compMat.uniforms.uStrength.value = this.strength;
      this.compMat.uniforms.uExposure.value = this.exposure;
      this.quad.material = this.compMat;
      r.setRenderTarget(null);
      r.render(this.quadScene, this.cam);
    }
  }

  /* =========================================================
     PORTRAIT STUDIO
     ========================================================= */
  class PortraitStudio {
    constructor() {
      this.renderer = new T.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
      this.renderer.setSize(480, 600, false);
      this.renderer.outputColorSpace = T.SRGBColorSpace;
      this.renderer.toneMapping = T.ACESFilmicToneMapping;
      this.renderer.toneMappingExposure = 1.1;
      this.renderer.setClearColor(0x000000, 0);
      this.scene = new T.Scene();
      this.camera = new T.PerspectiveCamera(31, 480 / 600, 0.1, 30);
      this.camera.position.set(1.45, 1.58, 5.85);
      this.camera.lookAt(0, 1.02, 0);
      const hemi = new T.HemisphereLight(0xc8e0ff, 0x2a1930, 0.7);
      this.scene.add(hemi);
      const key = new T.DirectionalLight(0xffe4c0, 2.0);
      key.position.set(-2.5, 4, 4);
      this.scene.add(key);
      const rim = new T.DirectionalLight(0x8de8ff, 1.25);
      rim.position.set(3, 2.5, -3);
      this.scene.add(rim);
      const fill = new T.DirectionalLight(0xff9fd0, 0.55);
      fill.position.set(2, 1, 3);
      this.scene.add(fill);
      const glowPlane = new T.Mesh(new T.PlaneGeometry(3.2, 3.2), new T.MeshBasicMaterial({
        map: makeRuneTexture('#f3d99b'), transparent: true, opacity: 0.2, blending: T.AdditiveBlending, depthWrite: false
      }));
      glowPlane.position.set(0, 0.1, -0.6);
      this.scene.add(glowPlane);
      this.glowPlane = glowPlane;
      this.holder = new T.Group();
      this.scene.add(this.holder);
    }

    capture(type, level, mode) {
      while (this.holder.children.length) {
        const c = this.holder.children.pop();
        CharacterFactory.dispose(c);
      }
      const char = CharacterFactory.create(type, level || 2);
      char.rotation.y = 0.18;
      char.position.y = 0.03;
      this.holder.add(char);
      if (mode === 'bust') {
        this.camera.fov = 34;
        this.camera.position.set(1.0, 1.92, 3.65);
        this.camera.lookAt(0, 1.58, 0);
      } else {
        this.camera.fov = 31;
        this.camera.position.set(1.45, 1.58, 5.85);
        this.camera.lookAt(0, 1.02, 0);
      }
      this.camera.updateProjectionMatrix();
      this.glowPlane.material.map = makeRuneTexture(D.TOWERS[type].color);
      this.glowPlane.material.needsUpdate = true;
      this.renderer.render(this.scene, this.camera);
      return this.renderer.domElement.toDataURL('image/png');
    }

    dispose() {
      this.renderer.dispose();
    }
  }

  window.AstralArt = {
    THREE: T,
    toon, pbr, basic, glow, outline, add, sphere, capsule, taperedTube,
    makePleatedSkirt, makeAlineSkirt, makeBow, makeStaff, makeKatana, starGeo, makeRuneTexture, makeRunePlane, makeStarTexture, makeMoonTexture, makeBlobTexture, BLOB_TEX,
    STAR_TEX, TOON_GRADIENT, RNG,
    CharacterFactory, EnemyFactory, VFX, PostFX, PortraitStudio
  };
})();


